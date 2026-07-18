import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { UserRole } from '@informatizou/shared';
import { hashPassword } from '@informatizou/auth';
import { writeAudit } from '../../hooks/audit.js';

/** Rotas administrativas: dashboard (§37), monitoramento (§45), usuários, auditoria, settings. */
export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const p = app.prisma;

  // GET /stats/dashboard  (§37)
  r.get(
    '/stats/dashboard',
    { preHandler: [app.authenticate, app.authorize('view')], schema: { tags: ['stats'], summary: 'Métricas do dashboard' } },
    async () => {
      const soon = new Date(Date.now() + 3 * 86_400_000);
      const [
        businesses,
        withoutWebsite,
        leadsQualified,
        demosGenerating,
        demosPublished,
        demosExpiring,
        contactsPending,
        contactsSent,
        demosViewed,
        replies,
        interested,
        proposals,
        won,
      ] = await Promise.all([
        p.business.count({ where: { deletedAt: null } }),
        p.business.count({ where: { deletedAt: null, website: null } }),
        p.lead.count({ where: { deletedAt: null, status: { in: ['QUALIFIED', 'DEMO_READY', 'READY_TO_CONTACT'] } } }),
        p.demoSite.count({ where: { status: { in: ['GENERATING', 'REVIEW_REQUIRED'] } } }),
        p.demoSite.count({ where: { status: 'PUBLISHED' } }),
        p.demoSite.count({ where: { status: 'PUBLISHED', expiresAt: { lt: soon, gt: new Date() } } }),
        p.outreachMessage.count({ where: { status: 'PENDING_APPROVAL' } }),
        p.outreachMessage.count({ where: { status: { in: ['SENT', 'DELIVERED'] } } }),
        p.lead.count({ where: { status: 'DEMO_VIEWED' } }),
        p.lead.count({ where: { status: 'REPLIED' } }),
        p.lead.count({ where: { status: 'INTERESTED' } }),
        p.proposal.count({ where: { deletedAt: null } }),
        p.lead.count({ where: { status: 'WON' } }),
      ]);

      const costAgg = await p.providerUsage.aggregate({ _sum: { estimatedCostCents: true } });
      const providerCostCents = costAgg._sum.estimatedCostCents ?? 0;

      const acceptedProposals = await p.proposal.findMany({
        where: { status: 'ACCEPTED' },
        select: { implementationCents: true, monthlyCents: true },
      });
      const implementationRevenueCents = acceptedProposals.reduce((s, x) => s + (x.implementationCents ?? 0), 0);
      const monthlyRevenueCents = acceptedProposals.reduce((s, x) => s + (x.monthlyCents ?? 0), 0);

      return {
        businessesFound: businesses,
        withoutWebsite,
        leadsQualified,
        demosGenerating,
        demosPublished,
        demosExpiring,
        contactsPending,
        contactsSent,
        demosViewed,
        replies,
        interested,
        proposals,
        sales: won,
        implementationRevenueCents,
        monthlyRevenueCents,
        providerCostCents,
        costPerDemoCents: demosPublished > 0 ? Math.round(providerCostCents / demosPublished) : 0,
      };
    },
  );

  // GET /admin/metrics  (§45)
  r.get(
    '/admin/metrics',
    { preHandler: [app.authenticate, app.authorize('logs.view')], schema: { tags: ['admin'], summary: 'Métricas de operação' } },
    async () => {
      const jobs = await p.jobExecution.groupBy({ by: ['status'], _count: { _all: true } });
      const failedByQueue = await p.jobExecution.groupBy({
        by: ['queue'],
        where: { status: 'FAILED' },
        _count: { _all: true },
      });
      const demosExpiringSoon = await p.demoSite.count({
        where: { status: 'PUBLISHED', expiresAt: { lt: new Date(Date.now() + 86_400_000), gt: new Date() } },
      });
      const suppression = await p.suppressionEntry.count();
      return {
        jobsByStatus: jobs.map((j) => ({ status: j.status, count: j._count._all })),
        failuresByQueue: failedByQueue.map((j) => ({ queue: j.queue, count: j._count._all })),
        demosExpiringSoon,
        suppressionEntries: suppression,
      };
    },
  );

  // GET /admin/audit  (trilha de auditoria §41)
  r.get(
    '/admin/audit',
    {
      preHandler: [app.authenticate, app.authorize('audit.view')],
      schema: {
        tags: ['admin'],
        summary: 'Lista de auditoria',
        querystring: z.object({ take: z.coerce.number().int().min(1).max(200).default(100) }),
      },
    },
    async (request) => ({
      items: await p.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: request.query.take,
        include: { user: { select: { name: true, email: true } } },
      }),
    }),
  );

  // ===== Usuários (ADMIN) =====
  r.get(
    '/admin/users',
    { preHandler: [app.authenticate, app.authorize('users.manage')], schema: { tags: ['admin'], summary: 'Lista usuários' } },
    async () => ({
      items: await p.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true },
      }),
    }),
  );

  r.post(
    '/admin/users',
    {
      preHandler: [app.authenticate, app.authorize('users.manage')],
      schema: {
        tags: ['admin'],
        summary: 'Cria usuário',
        body: z.object({
          email: z.string().email(),
          name: z.string(),
          role: z.nativeEnum(UserRole),
          password: z.string().min(8),
        }),
      },
    },
    async (request, reply) => {
      const exists = await p.user.findUnique({ where: { email: request.body.email } });
      if (exists) return reply.code(409).send({ error: 'Conflict', message: 'e-mail já cadastrado' });
      const user = await p.user.create({
        data: {
          email: request.body.email,
          name: request.body.name,
          role: request.body.role,
          passwordHash: await hashPassword(request.body.password),
        },
      });
      await writeAudit(app.prisma, { userId: request.authUser?.sub, action: 'user.create', entityType: 'User', entityId: user.id });
      return reply.code(201).send({ id: user.id, email: user.email, role: user.role });
    },
  );

  r.patch(
    '/admin/users/:id',
    {
      preHandler: [app.authenticate, app.authorize('users.manage')],
      schema: {
        tags: ['admin'],
        summary: 'Atualiza usuário',
        params: z.object({ id: z.string() }),
        body: z.object({ role: z.nativeEnum(UserRole).optional(), isActive: z.boolean().optional(), name: z.string().optional() }),
      },
    },
    async (request, reply) => {
      const user = await p.user.findUnique({ where: { id: request.params.id } });
      if (!user || user.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const updated = await p.user.update({ where: { id: user.id }, data: request.body });
      return { id: updated.id, role: updated.role, isActive: updated.isActive };
    },
  );

  // ===== Settings (SystemSetting) — regras configuráveis (§13) =====
  r.get(
    '/admin/settings/:key',
    {
      preHandler: [app.authenticate, app.authorize('rules.change')],
      schema: { tags: ['admin'], summary: 'Lê uma configuração', params: z.object({ key: z.string() }) },
    },
    async (request) => {
      const setting = await p.systemSetting.findUnique({ where: { key: request.params.key } });
      return { key: request.params.key, value: setting?.value ?? null };
    },
  );

  r.put(
    '/admin/settings/:key',
    {
      preHandler: [app.authenticate, app.authorize('rules.change')],
      schema: {
        tags: ['admin'],
        summary: 'Grava uma configuração',
        params: z.object({ key: z.string() }),
        body: z.object({ value: z.unknown() }),
      },
    },
    async (request) => {
      const setting = await p.systemSetting.upsert({
        where: { key: request.params.key },
        update: { value: request.body.value as object, updatedBy: request.authUser?.sub ?? null },
        create: { key: request.params.key, value: request.body.value as object, updatedBy: request.authUser?.sub ?? null },
      });
      await writeAudit(app.prisma, { userId: request.authUser?.sub, action: 'setting.update', entityType: 'SystemSetting', entityId: setting.id });
      return { key: setting.key, value: setting.value };
    },
  );
}
