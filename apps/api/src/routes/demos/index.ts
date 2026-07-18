import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { DemoSiteStatus } from '@informatizou/shared';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import { writeAudit } from '../../hooks/audit.js';

/** Rotas de demonstrações (spec §35) + endpoints públicos para o renderer. */
export async function demoRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // POST /leads/:id/generate-demo
  r.post(
    '/leads/:id/generate-demo',
    {
      preHandler: [app.authenticate, app.authorize('demos.generate')],
      schema: { tags: ['demos'], summary: 'Gera a demo do lead', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const lead = await app.prisma.lead.findUnique({
        where: { id: request.params.id },
        include: { demoSite: true },
      });
      if (!lead || lead.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      if (lead.demoSite) {
        return reply.code(409).send({ error: 'Conflict', message: 'demo já existe' });
      }
      await enqueue(
        QUEUE_NAMES.DEMO_GENERATION,
        'generate',
        { leadId: lead.id, correlationId: lead.id },
        { jobId: `generate-${lead.id}` },
      );
      await writeAudit(app.prisma, {
        userId: request.authUser?.sub,
        action: 'demo.generate',
        entityType: 'Lead',
        entityId: lead.id,
      });
      return reply.code(202).send({ status: 'queued' });
    },
  );

  // GET /demo-sites
  r.get(
    '/demo-sites',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: {
        tags: ['demos'],
        summary: 'Lista demos',
        querystring: z.object({
          status: z.string().optional(),
          take: z.coerce.number().int().min(1).max(100).default(50),
          skip: z.coerce.number().int().min(0).default(0),
        }),
      },
    },
    async (request) => {
      const { status, take, skip } = request.query;
      const where = { deletedAt: null, ...(status ? { status: status as never } : {}) };
      const [items, total] = await Promise.all([
        app.prisma.demoSite.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
          include: { lead: { include: { business: { select: { name: true, city: true } } } } },
        }),
        app.prisma.demoSite.count({ where }),
      ]);
      return { items, total };
    },
  );

  // GET /demo-sites/:id
  r.get(
    '/demo-sites/:id',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: { tags: ['demos'], summary: 'Detalha demo', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const demo = await app.prisma.demoSite.findUnique({
        where: { id: request.params.id },
        include: {
          screenshots: true,
          publications: { orderBy: { createdAt: 'desc' }, take: 5 },
          lead: { include: { business: { select: { name: true, city: true } } } },
        },
      });
      if (!demo || demo.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      return demo;
    },
  );

  // PATCH /demo-sites/:id  (editor de conteúdo §36)
  r.patch(
    '/demo-sites/:id',
    {
      preHandler: [app.authenticate, app.authorize('demos.generate')],
      schema: {
        tags: ['demos'],
        summary: 'Edita conteúdo/template da demo',
        params: z.object({ id: z.string() }),
        body: z.object({ content: z.unknown().optional(), template: z.string().optional() }),
      },
    },
    async (request, reply) => {
      const demo = await app.prisma.demoSite.findUnique({ where: { id: request.params.id } });
      if (!demo || demo.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const updated = await app.prisma.demoSite.update({
        where: { id: demo.id },
        data: {
          ...(request.body.content !== undefined ? { content: request.body.content as object } : {}),
          ...(request.body.template ? { template: request.body.template } : {}),
          updatedBy: request.authUser?.sub ?? null,
        },
      });
      // Versiona o conteúdo (§18).
      await app.prisma.demoSiteVersion.create({
        data: {
          demoSiteId: demo.id,
          version: demo.version + 1,
          content: (updated.content ?? {}) as object,
          template: updated.template,
          createdBy: request.authUser?.sub ?? null,
        },
      });
      return updated;
    },
  );

  // POST /demo-sites/:id/publish
  r.post(
    '/demo-sites/:id/publish',
    {
      preHandler: [app.authenticate, app.authorize('demos.publish')],
      schema: { tags: ['demos'], summary: 'Publica a demo', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const demo = await app.prisma.demoSite.findUnique({ where: { id: request.params.id } });
      if (!demo || demo.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      await enqueue(
        QUEUE_NAMES.DEMO_PUBLICATION,
        'publish',
        { demoSiteId: demo.id, leadId: demo.leadId, correlationId: demo.id },
        { jobId: `publish-${demo.id}-${Date.now()}` },
      );
      await writeAudit(app.prisma, {
        userId: request.authUser?.sub,
        action: 'demo.publish',
        entityType: 'DemoSite',
        entityId: demo.id,
      });
      return reply.code(202).send({ status: 'queued' });
    },
  );

  // POST /demo-sites/:id/unpublish
  r.post(
    '/demo-sites/:id/unpublish',
    {
      preHandler: [app.authenticate, app.authorize('demos.publish')],
      schema: { tags: ['demos'], summary: 'Despublica a demo', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const demo = await app.prisma.demoSite.findUnique({ where: { id: request.params.id } });
      if (!demo || demo.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const updated = await app.prisma.demoSite.update({
        where: { id: demo.id },
        data: { status: DemoSiteStatus.DISABLED },
      });
      return { id: updated.id, status: updated.status };
    },
  );

  // POST /demo-sites/:id/extend  (renovação §21)
  r.post(
    '/demo-sites/:id/extend',
    {
      preHandler: [app.authenticate, app.authorize('demos.publish')],
      schema: {
        tags: ['demos'],
        summary: 'Estende a expiração da demo',
        params: z.object({ id: z.string() }),
        body: z.object({ days: z.number().int().min(1).max(60) }),
      },
    },
    async (request, reply) => {
      const demo = await app.prisma.demoSite.findUnique({ where: { id: request.params.id } });
      if (!demo || demo.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const from = demo.expiresAt && demo.expiresAt > new Date() ? demo.expiresAt : new Date();
      const expiresAt = new Date(from.getTime() + request.body.days * 86_400_000);
      const updated = await app.prisma.demoSite.update({
        where: { id: demo.id },
        data: {
          expiresAt,
          status: demo.status === DemoSiteStatus.EXPIRED ? DemoSiteStatus.PUBLISHED : demo.status,
          expiredAt: null,
        },
      });
      await writeAudit(app.prisma, {
        userId: request.authUser?.sub,
        action: 'demo.extend',
        entityType: 'DemoSite',
        entityId: demo.id,
        after: { days: request.body.days, expiresAt },
      });
      return { id: updated.id, expiresAt: updated.expiresAt };
    },
  );

  // POST /demo-sites/:id/expire
  r.post(
    '/demo-sites/:id/expire',
    {
      preHandler: [app.authenticate, app.authorize('demos.publish')],
      schema: { tags: ['demos'], summary: 'Expira a demo agora', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const demo = await app.prisma.demoSite.findUnique({ where: { id: request.params.id } });
      if (!demo || demo.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const updated = await app.prisma.demoSite.update({
        where: { id: demo.id },
        data: { status: DemoSiteStatus.EXPIRED, expiredAt: new Date() },
      });
      return { id: updated.id, status: updated.status };
    },
  );

  // POST /demo-sites/:id/screenshot
  r.post(
    '/demo-sites/:id/screenshot',
    {
      preHandler: [app.authenticate, app.authorize('demos.generate')],
      schema: { tags: ['demos'], summary: 'Gera screenshots', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const demo = await app.prisma.demoSite.findUnique({ where: { id: request.params.id } });
      if (!demo || demo.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      await enqueue(
        QUEUE_NAMES.SCREENSHOT_GENERATION,
        'screenshot',
        { demoSiteId: demo.id, correlationId: demo.id },
        { jobId: `screenshot-${demo.id}-${Date.now()}` },
      );
      return reply.code(202).send({ status: 'queued' });
    },
  );

  // GET /demo-sites/:id/analytics
  r.get(
    '/demo-sites/:id/analytics',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: { tags: ['demos'], summary: 'Analytics da demo', params: z.object({ id: z.string() }) },
    },
    async (request) => {
      const demoSiteId = request.params.id;
      const events = await app.prisma.demoAnalyticsEvent.groupBy({
        by: ['type'],
        where: { demoSiteId },
        _count: { _all: true },
      });
      const demo = await app.prisma.demoSite.findUnique({
        where: { id: demoSiteId },
        select: { accessCount: true, uniqueVisitorCount: true },
      });
      return {
        accessCount: demo?.accessCount ?? 0,
        uniqueVisitorCount: demo?.uniqueVisitorCount ?? 0,
        byType: events.map((e) => ({ type: e.type, count: e._count._all })),
      };
    },
  );

  // ===== Públicos (sem auth) — consumidos pelo demo-renderer (§18/§23) =====

  // GET /public/demos/:slug — conteúdo da demo publicada e não expirada.
  r.get(
    '/public/demos/:slug',
    {
      schema: {
        tags: ['public'],
        summary: 'Conteúdo público de uma demo por slug',
        params: z.object({ slug: z.string() }),
      },
    },
    async (request, reply) => {
      const demo = await app.prisma.demoSite.findUnique({
        where: { slug: request.params.slug },
      });
      const available =
        demo &&
        !demo.deletedAt &&
        demo.status === DemoSiteStatus.PUBLISHED &&
        (!demo.expiresAt || demo.expiresAt > new Date());
      if (!available) {
        return reply.code(404).send({ error: 'Not Found', available: false });
      }
      return {
        available: true,
        slug: demo.slug,
        template: demo.template,
        content: demo.content,
        designTokens: demo.designTokens,
        expiresAt: demo.expiresAt,
      };
    },
  );

  // POST /public/demos/:slug/event — registra evento de analytics (§23).
  r.post(
    '/public/demos/:slug/event',
    {
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
      schema: {
        tags: ['public'],
        summary: 'Registra evento de analytics da demo',
        params: z.object({ slug: z.string() }),
        body: z.object({
          type: z.string(),
          visitorHash: z.string().optional(),
          device: z.string().optional(),
          referrer: z.string().optional(),
          campaignToken: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const demo = await app.prisma.demoSite.findUnique({
        where: { slug: request.params.slug },
        select: { id: true, deletedAt: true },
      });
      if (!demo || demo.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      await app.prisma.demoAnalyticsEvent.create({
        data: {
          demoSiteId: demo.id,
          type: request.body.type,
          visitorHash: request.body.visitorHash ?? null,
          device: request.body.device ?? null,
          referrer: request.body.referrer ?? null,
          campaignToken: request.body.campaignToken ?? null,
        },
      });
      if (request.body.type === 'view') {
        await app.prisma.demoSite.update({
          where: { id: demo.id },
          data: { accessCount: { increment: 1 } },
        });
      }
      return reply.code(204).send();
    },
  );
}
