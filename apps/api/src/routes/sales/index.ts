import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ProductPlanType, ProposalStatus, LeadStatus, DemoSiteStatus } from '@informatizou/shared';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import { writeAudit } from '../../hooks/audit.js';

const ONBOARDING_TASKS = [
  'Confirmar dados do estabelecimento',
  'Solicitar imagens oficiais',
  'Solicitar logo',
  'Definir domínio',
  'Revisar textos',
  'Configurar hospedagem',
  'Remover aviso de demonstração',
  'Configurar analytics',
  'Configurar backups',
  'Liberar indexação após aprovação',
];

/** Rotas de vendas: planos, propostas e clientes + conversão da demo (spec §31/§32/§33). */
export async function salesRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // ===== Planos (§31) =====
  r.get(
    '/plans',
    { preHandler: [app.authenticate, app.authorize('view')], schema: { tags: ['plans'], summary: 'Lista planos' } },
    async () => ({ items: await app.prisma.productPlan.findMany({ orderBy: { createdAt: 'asc' } }) }),
  );

  r.post(
    '/plans',
    {
      preHandler: [app.authenticate, app.authorize('platform.configure')],
      schema: {
        tags: ['plans'],
        summary: 'Cria plano',
        body: z.object({
          name: z.string(),
          type: z.nativeEnum(ProductPlanType),
          description: z.string(),
          features: z.array(z.string()).default([]),
          priceCents: z.number().int().min(0),
          active: z.boolean().default(true),
        }),
      },
    },
    async (request, reply) => reply.code(201).send(await app.prisma.productPlan.create({ data: request.body })),
  );

  r.patch(
    '/plans/:id',
    {
      preHandler: [app.authenticate, app.authorize('platform.configure')],
      schema: {
        tags: ['plans'],
        summary: 'Atualiza plano',
        params: z.object({ id: z.string() }),
        body: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          features: z.array(z.string()).optional(),
          priceCents: z.number().int().min(0).optional(),
          active: z.boolean().optional(),
        }),
      },
    },
    async (request, reply) => {
      const plan = await app.prisma.productPlan.findUnique({ where: { id: request.params.id } });
      if (!plan) return reply.code(404).send({ error: 'Not Found' });
      return app.prisma.productPlan.update({ where: { id: plan.id }, data: request.body });
    },
  );

  // ===== Propostas (§32) =====
  r.post(
    '/proposals',
    {
      preHandler: [app.authenticate, app.authorize('sales.track')],
      schema: {
        tags: ['proposals'],
        summary: 'Cria proposta',
        body: z.object({
          leadId: z.string().optional(),
          customerId: z.string().optional(),
          description: z.string().optional(),
          scope: z.string().optional(),
          implementationCents: z.number().int().min(0).optional(),
          monthlyCents: z.number().int().min(0).optional(),
          deadline: z.string().optional(),
          conditions: z.string().optional(),
          validUntil: z.string().datetime().optional(),
          includedItems: z.array(z.string()).default([]),
          excludedItems: z.array(z.string()).default([]),
          items: z
            .array(
              z.object({
                name: z.string(),
                description: z.string().optional(),
                type: z.nativeEnum(ProductPlanType),
                priceCents: z.number().int().min(0),
                quantity: z.number().int().min(1).default(1),
                productPlanId: z.string().optional(),
              }),
            )
            .default([]),
        }),
      },
    },
    async (request, reply) => {
      const { items, validUntil, ...data } = request.body;
      const proposal = await app.prisma.proposal.create({
        data: {
          ...data,
          validUntil: validUntil ? new Date(validUntil) : null,
          ownerId: request.authUser?.sub ?? null,
          createdBy: request.authUser?.sub ?? null,
          items: { create: items },
        },
        include: { items: true },
      });
      await writeAudit(app.prisma, {
        userId: request.authUser?.sub,
        action: 'proposal.create',
        entityType: 'Proposal',
        entityId: proposal.id,
      });
      return reply.code(201).send(proposal);
    },
  );

  r.get(
    '/proposals',
    { preHandler: [app.authenticate, app.authorize('view')], schema: { tags: ['proposals'], summary: 'Lista propostas' } },
    async () => ({
      items: await app.prisma.proposal.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { lead: { include: { business: { select: { name: true } } } }, customer: { select: { name: true } } },
      }),
    }),
  );

  r.get(
    '/proposals/:id',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: { tags: ['proposals'], summary: 'Detalha proposta', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const p = await app.prisma.proposal.findUnique({
        where: { id: request.params.id },
        include: { items: true, lead: { include: { business: true } }, customer: true },
      });
      if (!p || p.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      return p;
    },
  );

  r.post(
    '/proposals/:id/generate-pdf',
    {
      preHandler: [app.authenticate, app.authorize('sales.track')],
      schema: { tags: ['proposals'], summary: 'Gera HTML+PDF', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const p = await app.prisma.proposal.findUnique({ where: { id: request.params.id } });
      if (!p || p.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      await enqueue(QUEUE_NAMES.PROPOSAL_GENERATION, 'generate', { proposalId: p.id, correlationId: p.id }, { jobId: `proposal-${p.id}-${Date.now()}` });
      return reply.code(202).send({ status: 'queued' });
    },
  );

  r.post(
    '/proposals/:id/send',
    {
      preHandler: [app.authenticate, app.authorize('sales.track')],
      schema: { tags: ['proposals'], summary: 'Marca proposta como enviada', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const p = await app.prisma.proposal.findUnique({ where: { id: request.params.id } });
      if (!p || p.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const updated = await app.prisma.proposal.update({
        where: { id: p.id },
        data: { status: ProposalStatus.SENT, sentAt: new Date() },
      });
      if (p.leadId) {
        await app.prisma.lead.update({ where: { id: p.leadId }, data: { status: LeadStatus.PROPOSAL_SENT } });
      }
      return { id: updated.id, status: updated.status };
    },
  );

  r.post(
    '/proposals/:id/reject',
    {
      preHandler: [app.authenticate, app.authorize('sales.track')],
      schema: { tags: ['proposals'], summary: 'Rejeita proposta', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const p = await app.prisma.proposal.findUnique({ where: { id: request.params.id } });
      if (!p || p.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const updated = await app.prisma.proposal.update({ where: { id: p.id }, data: { status: ProposalStatus.REJECTED, rejectedAt: new Date() } });
      if (p.leadId) await app.prisma.lead.update({ where: { id: p.leadId }, data: { status: LeadStatus.LOST } });
      return { id: updated.id, status: updated.status };
    },
  );

  // POST /proposals/:id/accept  → conversão da demo em cliente (§33)
  r.post(
    '/proposals/:id/accept',
    {
      preHandler: [app.authenticate, app.authorize('sales.track')],
      schema: { tags: ['proposals'], summary: 'Aceita proposta e converte em cliente (§33)', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const proposal = await app.prisma.proposal.findUnique({
        where: { id: request.params.id },
        include: { lead: { include: { business: { include: { contacts: true } }, demoSite: true } } },
      });
      if (!proposal || proposal.deletedAt) return reply.code(404).send({ error: 'Not Found' });

      await app.prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: ProposalStatus.ACCEPTED, acceptedAt: new Date() },
      });

      let customerId = proposal.customerId ?? null;

      if (proposal.lead) {
        const lead = proposal.lead;
        const business = lead.business;
        const email = business.contacts.find((c) => c.type === 'EMAIL')?.value ?? null;

        await app.prisma.lead.update({ where: { id: lead.id }, data: { status: LeadStatus.WON } });
        if (lead.demoSite) {
          await app.prisma.demoSite.update({ where: { id: lead.demoSite.id }, data: { status: DemoSiteStatus.SOLD } });
        }

        // Cliente (idempotente por leadId).
        const customer = await app.prisma.customer.upsert({
          where: { leadId: lead.id },
          update: {},
          create: {
            leadId: lead.id,
            name: business.name,
            email,
            phone: business.phoneE164,
            createdBy: request.authUser?.sub ?? null,
          },
        });
        customerId = customer.id;

        // Site do cliente (copia a demo, sem indexação até aprovação §33).
        await app.prisma.customerSite.create({
          data: {
            customerId: customer.id,
            demoSiteId: lead.demoSite?.id ?? null,
            status: 'ONBOARDING',
            indexingAllowed: false,
          },
        });

        // Checklist de onboarding (§33).
        await app.prisma.customerOnboardingTask.createMany({
          data: ONBOARDING_TASKS.map((title, i) => ({ customerId: customer.id, title, order: i })),
        });

        // Assinatura mensal (§31) quando houver mensalidade.
        if (proposal.monthlyCents && proposal.monthlyCents > 0) {
          const plan = await app.prisma.productPlan.findFirst({ where: { type: 'MONTHLY', active: true } });
          if (plan) {
            await app.prisma.customerSubscription.create({
              data: {
                customerId: customer.id,
                productPlanId: plan.id,
                status: 'ACTIVE',
                priceCents: proposal.monthlyCents,
                startedAt: new Date(),
              },
            });
          }
        }

        await app.prisma.proposal.update({ where: { id: proposal.id }, data: { customerId: customer.id } });
      }

      await writeAudit(app.prisma, {
        userId: request.authUser?.sub,
        action: 'proposal.accept',
        entityType: 'Proposal',
        entityId: proposal.id,
        after: { customerId },
      });
      return { id: proposal.id, status: 'ACCEPTED', customerId };
    },
  );

  // ===== Clientes =====
  r.get(
    '/customers',
    { preHandler: [app.authenticate, app.authorize('view')], schema: { tags: ['customers'], summary: 'Lista clientes' } },
    async () => ({
      items: await app.prisma.customer.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { subscriptions: true, sites: true },
      }),
    }),
  );

  r.get(
    '/customers/:id',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: { tags: ['customers'], summary: 'Detalha cliente', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const c = await app.prisma.customer.findUnique({
        where: { id: request.params.id },
        include: { subscriptions: { include: { productPlan: true } }, sites: true, onboardingTasks: { orderBy: { order: 'asc' } }, proposals: true },
      });
      if (!c || c.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      return c;
    },
  );
}
