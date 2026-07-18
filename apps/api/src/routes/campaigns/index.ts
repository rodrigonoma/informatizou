import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { campaignCreateSchema } from '@informatizou/shared';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import { writeAudit } from '../../hooks/audit.js';

/** Rotas de campanhas (spec §35). */
export async function campaignRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // POST /campaigns
  r.post(
    '/campaigns',
    {
      preHandler: [app.authenticate, app.authorize('campaigns.create')],
      schema: { tags: ['campaigns'], summary: 'Cria campanha', body: campaignCreateSchema },
    },
    async (request, reply) => {
      const data = request.body;
      const campaign = await app.prisma.searchCampaign.create({
        data: {
          name: data.name,
          segment: data.segment,
          location: data.location,
          radiusKm: data.radiusKm ?? null,
          resultLimit: data.resultLimit,
          minimumRating: data.minimumRating ?? null,
          minimumReviewCount: data.minimumReviewCount ?? null,
          websiteFilter: data.websiteFilter,
          minimumScoreForDemo: data.minimumScoreForDemo,
          maximumDemos: data.maximumDemos,
          provider: data.provider,
          automaticDemoGeneration: data.automaticDemoGeneration,
          createdBy: request.authUser?.sub ?? null,
        },
      });
      await writeAudit(app.prisma, {
        userId: request.authUser?.sub,
        action: 'campaign.create',
        entityType: 'SearchCampaign',
        entityId: campaign.id,
        after: { name: campaign.name },
      });
      return reply.code(201).send(campaign);
    },
  );

  // GET /campaigns
  r.get(
    '/campaigns',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: {
        tags: ['campaigns'],
        summary: 'Lista campanhas',
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
        app.prisma.searchCampaign.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
        app.prisma.searchCampaign.count({ where }),
      ]);
      return { items, total };
    },
  );

  // GET /campaigns/:id
  r.get(
    '/campaigns/:id',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: {
        tags: ['campaigns'],
        summary: 'Detalha campanha',
        params: z.object({ id: z.string() }),
      },
    },
    async (request, reply) => {
      const campaign = await app.prisma.searchCampaign.findUnique({
        where: { id: request.params.id },
        include: { executions: { orderBy: { createdAt: 'desc' }, take: 5 } },
      });
      if (!campaign || campaign.deletedAt) {
        return reply.code(404).send({ error: 'Not Found' });
      }
      return campaign;
    },
  );

  // PATCH /campaigns/:id
  r.patch(
    '/campaigns/:id',
    {
      preHandler: [app.authenticate, app.authorize('campaigns.create')],
      schema: {
        tags: ['campaigns'],
        summary: 'Atualiza campanha',
        params: z.object({ id: z.string() }),
        body: campaignCreateSchema.partial(),
      },
    },
    async (request, reply) => {
      const existing = await app.prisma.searchCampaign.findUnique({
        where: { id: request.params.id },
      });
      if (!existing || existing.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const updated = await app.prisma.searchCampaign.update({
        where: { id: request.params.id },
        data: { ...request.body, updatedBy: request.authUser?.sub ?? null },
      });
      return updated;
    },
  );

  // POST /campaigns/:id/run
  r.post(
    '/campaigns/:id/run',
    {
      preHandler: [app.authenticate, app.authorize('campaigns.run')],
      schema: {
        tags: ['campaigns'],
        summary: 'Executa a campanha (enfileira a busca)',
        params: z.object({ id: z.string() }),
      },
    },
    async (request, reply) => {
      const campaign = await app.prisma.searchCampaign.findUnique({
        where: { id: request.params.id },
      });
      if (!campaign || campaign.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      if (campaign.status === 'RUNNING' || campaign.status === 'QUEUED') {
        return reply.code(409).send({ error: 'Conflict', message: 'campanha já em execução' });
      }

      const execution = await app.prisma.campaignExecution.create({
        data: { campaignId: campaign.id, status: 'QUEUED' },
      });
      await app.prisma.searchCampaign.update({
        where: { id: campaign.id },
        data: { status: 'QUEUED' },
      });
      await enqueue(
        QUEUE_NAMES.BUSINESS_SEARCH,
        'search',
        { campaignId: campaign.id, executionId: execution.id, correlationId: campaign.id },
        { jobId: `search-${execution.id}` },
      );
      await writeAudit(app.prisma, {
        userId: request.authUser?.sub,
        action: 'campaign.run',
        entityType: 'SearchCampaign',
        entityId: campaign.id,
      });
      return reply.code(202).send({ executionId: execution.id, status: 'QUEUED' });
    },
  );

  // Ações de ciclo de vida (pause/resume/cancel)
  const lifecycle = [
    { path: 'pause', status: 'PAUSED' as const, from: ['RUNNING', 'QUEUED'] },
    { path: 'resume', status: 'RUNNING' as const, from: ['PAUSED'] },
    { path: 'cancel', status: 'CANCELLED' as const, from: ['RUNNING', 'QUEUED', 'PAUSED', 'DRAFT'] },
  ];
  for (const action of lifecycle) {
    r.post(
      `/campaigns/:id/${action.path}`,
      {
        preHandler: [app.authenticate, app.authorize('campaigns.run')],
        schema: {
          tags: ['campaigns'],
          summary: `Campanha: ${action.path}`,
          params: z.object({ id: z.string() }),
        },
      },
      async (request, reply) => {
        const campaign = await app.prisma.searchCampaign.findUnique({
          where: { id: request.params.id },
        });
        if (!campaign || campaign.deletedAt) return reply.code(404).send({ error: 'Not Found' });
        if (!action.from.includes(campaign.status)) {
          return reply
            .code(409)
            .send({ error: 'Conflict', message: `transição inválida de ${campaign.status}` });
        }
        const updated = await app.prisma.searchCampaign.update({
          where: { id: campaign.id },
          data: { status: action.status },
        });
        return { id: updated.id, status: updated.status };
      },
    );
  }

  // GET /campaigns/:id/progress
  r.get(
    '/campaigns/:id/progress',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: {
        tags: ['campaigns'],
        summary: 'Progresso da campanha',
        params: z.object({ id: z.string() }),
      },
    },
    async (request) => {
      const execution = await app.prisma.campaignExecution.findFirst({
        where: { campaignId: request.params.id },
        orderBy: { createdAt: 'desc' },
      });
      return { execution };
    },
  );

  // GET /campaigns/:id/costs
  r.get(
    '/campaigns/:id/costs',
    {
      preHandler: [app.authenticate, app.authorize('costs.view')],
      schema: {
        tags: ['campaigns'],
        summary: 'Custos da campanha',
        params: z.object({ id: z.string() }),
      },
    },
    async (request) => {
      const costs = await app.prisma.campaignCost.findMany({
        where: { campaignId: request.params.id },
        orderBy: { createdAt: 'desc' },
      });
      const totalCents = costs.reduce((sum, c) => sum + c.estimatedCostCents, 0);
      return { costs, totalCents };
    },
  );
}
