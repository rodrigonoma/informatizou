import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { LeadStatus, ReviewStatus, SuppressionReason } from '@informatizou/shared';
import { writeAudit } from '../../hooks/audit.js';

/** Rotas de leads / CRM (spec §24/§35). */
export async function leadRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // GET /leads
  r.get(
    '/leads',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: {
        tags: ['leads'],
        summary: 'Lista leads',
        querystring: z.object({
          campaignId: z.string().optional(),
          status: z.string().optional(),
          minScore: z.coerce.number().int().optional(),
          take: z.coerce.number().int().min(1).max(100).default(50),
          skip: z.coerce.number().int().min(0).default(0),
        }),
      },
    },
    async (request) => {
      const { campaignId, status, minScore, take, skip } = request.query;
      const where = {
        deletedAt: null,
        ...(campaignId ? { campaignId } : {}),
        ...(status ? { status: status as never } : {}),
        ...(minScore != null ? { scoreTotal: { gte: minScore } } : {}),
      };
      const [items, total] = await Promise.all([
        app.prisma.lead.findMany({
          where,
          orderBy: [{ scoreTotal: 'desc' }, { createdAt: 'desc' }],
          take,
          skip,
          include: { business: { select: { name: true, city: true, website: true } } },
        }),
        app.prisma.lead.count({ where }),
      ]);
      return { items, total };
    },
  );

  // GET /leads/:id
  r.get(
    '/leads/:id',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: { tags: ['leads'], summary: 'Detalha lead', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const lead = await app.prisma.lead.findUnique({
        where: { id: request.params.id },
        include: {
          business: { include: { contacts: true, socialProfiles: true } },
          score: true,
          reviews: { orderBy: { createdAt: 'desc' } },
          activities: { orderBy: { createdAt: 'desc' }, take: 20 },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });
      if (!lead || lead.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      return lead;
    },
  );

  // PATCH /leads/:id
  r.patch(
    '/leads/:id',
    {
      preHandler: [app.authenticate, app.authorize('leads.movePipeline')],
      schema: {
        tags: ['leads'],
        summary: 'Atualiza lead',
        params: z.object({ id: z.string() }),
        body: z
          .object({
            notes: z.string().optional(),
            priority: z.number().int().optional(),
            status: z.nativeEnum(LeadStatus).optional(),
          })
          .strict(),
      },
    },
    async (request, reply) => {
      const lead = await app.prisma.lead.findUnique({ where: { id: request.params.id } });
      if (!lead || lead.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const updated = await app.prisma.lead.update({
        where: { id: request.params.id },
        data: { ...request.body, updatedBy: request.authUser?.sub ?? null },
      });
      return updated;
    },
  );

  // POST /leads/:id/assign
  r.post(
    '/leads/:id/assign',
    {
      preHandler: [app.authenticate, app.authorize('leads.assign')],
      schema: {
        tags: ['leads'],
        summary: 'Atribui lead a um vendedor',
        params: z.object({ id: z.string() }),
        body: z.object({ userId: z.string() }),
      },
    },
    async (request, reply) => {
      const lead = await app.prisma.lead.findUnique({ where: { id: request.params.id } });
      if (!lead || lead.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      await app.prisma.lead.update({
        where: { id: lead.id },
        data: { assignedToId: request.body.userId },
      });
      await app.prisma.leadAssignment.create({
        data: {
          leadId: lead.id,
          userId: request.body.userId,
          assignedById: request.authUser?.sub ?? null,
        },
      });
      return { ok: true };
    },
  );

  // POST /leads/:id/review  (aprovação/rejeição manual da fila de revisão §14)
  r.post(
    '/leads/:id/review',
    {
      preHandler: [app.authenticate, app.authorize('demos.approveReject')],
      schema: {
        tags: ['leads'],
        summary: 'Decide a revisão do lead (aprova/rejeita)',
        params: z.object({ id: z.string() }),
        body: z.object({
          decision: z.enum(['APPROVED', 'REJECTED']),
          notes: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const lead = await app.prisma.lead.findUnique({ where: { id: request.params.id } });
      if (!lead || lead.deletedAt) return reply.code(404).send({ error: 'Not Found' });

      const approved = request.body.decision === 'APPROVED';
      const latestReview = await app.prisma.leadReview.findFirst({
        where: { leadId: lead.id },
        orderBy: { createdAt: 'desc' },
      });
      if (latestReview) {
        await app.prisma.leadReview.update({
          where: { id: latestReview.id },
          data: {
            status: approved ? ReviewStatus.APPROVED : ReviewStatus.REJECTED,
            reviewerId: request.authUser?.sub ?? null,
            notes: request.body.notes ?? null,
            decidedAt: new Date(),
          },
        });
      }
      const updated = await app.prisma.lead.update({
        where: { id: lead.id },
        data: { status: approved ? LeadStatus.DEMO_READY : LeadStatus.REJECTED },
      });
      await app.prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          userId: request.authUser?.sub ?? null,
          type: 'review_decision',
          description: `revisão ${request.body.decision}`,
        },
      });
      await writeAudit(app.prisma, {
        userId: request.authUser?.sub,
        action: 'lead.review',
        entityType: 'Lead',
        entityId: lead.id,
        after: { decision: request.body.decision },
      });
      return { id: updated.id, status: updated.status };
    },
  );

  // POST /leads/:id/qualify
  r.post(
    '/leads/:id/qualify',
    {
      preHandler: [app.authenticate, app.authorize('leads.approve')],
      schema: { tags: ['leads'], summary: 'Qualifica o lead', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const lead = await app.prisma.lead.findUnique({ where: { id: request.params.id } });
      if (!lead || lead.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const updated = await app.prisma.lead.update({
        where: { id: lead.id },
        data: { status: LeadStatus.QUALIFIED },
      });
      return { id: updated.id, status: updated.status };
    },
  );

  // POST /leads/:id/reject
  r.post(
    '/leads/:id/reject',
    {
      preHandler: [app.authenticate, app.authorize('leads.reject')],
      schema: {
        tags: ['leads'],
        summary: 'Rejeita o lead',
        params: z.object({ id: z.string() }),
        body: z.object({ reason: z.string().optional() }).optional(),
      },
    },
    async (request, reply) => {
      const lead = await app.prisma.lead.findUnique({ where: { id: request.params.id } });
      if (!lead || lead.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const updated = await app.prisma.lead.update({
        where: { id: lead.id },
        data: { status: LeadStatus.REJECTED },
      });
      await app.prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          userId: request.authUser?.sub ?? null,
          type: 'rejected',
          description: request.body?.reason ?? 'rejeitado manualmente',
        },
      });
      return { id: updated.id, status: updated.status };
    },
  );

  // POST /leads/:id/do-not-contact  (opt-out §29)
  r.post(
    '/leads/:id/do-not-contact',
    {
      preHandler: [app.authenticate, app.authorize('leads.movePipeline')],
      schema: {
        tags: ['leads'],
        summary: 'Marca não contatar e adiciona à supressão',
        params: z.object({ id: z.string() }),
        body: z.object({ reason: z.string().optional() }).optional(),
      },
    },
    async (request, reply) => {
      const lead = await app.prisma.lead.findUnique({
        where: { id: request.params.id },
        include: { business: { include: { contacts: true } } },
      });
      if (!lead || lead.deletedAt) return reply.code(404).send({ error: 'Not Found' });

      const phone = lead.business.phoneE164;
      const email = lead.business.contacts.find((c) => c.type === 'EMAIL')?.value ?? null;
      await app.prisma.suppressionEntry.create({
        data: {
          businessId: lead.businessId,
          phone,
          email: email ? email.toLowerCase() : null,
          reason: SuppressionReason.REQUESTED,
          notes: request.body?.reason ?? 'marcado como não contatar no CRM',
          createdBy: request.authUser?.sub ?? null,
        },
      });
      const updated = await app.prisma.lead.update({
        where: { id: lead.id },
        data: { status: LeadStatus.DO_NOT_CONTACT },
      });
      await writeAudit(app.prisma, {
        userId: request.authUser?.sub,
        action: 'lead.do_not_contact',
        entityType: 'Lead',
        entityId: lead.id,
      });
      return { id: updated.id, status: updated.status };
    },
  );
}
