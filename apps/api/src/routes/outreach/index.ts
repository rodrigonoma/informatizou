import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { OutreachMessageStatus, SuppressionReason } from '@informatizou/shared';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import { writeAudit } from '../../hooks/audit.js';

/** Rotas de prospecção/mensagens e supressão (spec §35/§29). */
export async function outreachRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // POST /leads/:id/generate-message
  r.post(
    '/leads/:id/generate-message',
    {
      preHandler: [app.authenticate, app.authorize('messages.edit')],
      schema: { tags: ['outreach'], summary: 'Gera mensagem do lead', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const lead = await app.prisma.lead.findUnique({ where: { id: request.params.id } });
      if (!lead || lead.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      await enqueue(
        QUEUE_NAMES.OUTREACH_MESSAGE_GENERATION,
        'generate',
        { leadId: lead.id, correlationId: lead.id },
        { jobId: `outreach-${lead.id}-${Date.now()}` },
      );
      return reply.code(202).send({ status: 'queued' });
    },
  );

  // GET /outreach/messages
  r.get(
    '/outreach/messages',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: {
        tags: ['outreach'],
        summary: 'Lista mensagens',
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
        app.prisma.outreachMessage.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
          include: { lead: { include: { business: { select: { name: true } } } } },
        }),
        app.prisma.outreachMessage.count({ where }),
      ]);
      return { items, total };
    },
  );

  // GET /outreach/messages/:id
  r.get(
    '/outreach/messages/:id',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: { tags: ['outreach'], summary: 'Detalha mensagem', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const msg = await app.prisma.outreachMessage.findUnique({
        where: { id: request.params.id },
        include: { attempts: true, approvals: true, lead: { include: { business: true } } },
      });
      if (!msg || msg.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      return msg;
    },
  );

  // PATCH /outreach/messages/:id  (editar texto — §26)
  r.patch(
    '/outreach/messages/:id',
    {
      preHandler: [app.authenticate, app.authorize('messages.edit')],
      schema: {
        tags: ['outreach'],
        summary: 'Edita a mensagem',
        params: z.object({ id: z.string() }),
        body: z.object({ subject: z.string().optional(), body: z.string().optional() }),
      },
    },
    async (request, reply) => {
      const msg = await app.prisma.outreachMessage.findUnique({ where: { id: request.params.id } });
      if (!msg || msg.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const updated = await app.prisma.outreachMessage.update({
        where: { id: msg.id },
        data: { ...request.body, updatedBy: request.authUser?.sub ?? null },
      });
      return updated;
    },
  );

  // POST /outreach/messages/:id/approve  → aprova e enfileira entrega (§27)
  r.post(
    '/outreach/messages/:id/approve',
    {
      preHandler: [app.authenticate, app.authorize('messages.approve')],
      schema: { tags: ['outreach'], summary: 'Aprova a mensagem', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const msg = await app.prisma.outreachMessage.findUnique({ where: { id: request.params.id } });
      if (!msg || msg.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      await app.prisma.outreachMessage.update({
        where: { id: msg.id },
        data: { status: OutreachMessageStatus.APPROVED, approvedById: request.authUser?.sub ?? null },
      });
      await app.prisma.outreachApproval.create({
        data: { messageId: msg.id, approverId: request.authUser?.sub ?? null, decision: 'APPROVED' },
      });
      await enqueue(
        QUEUE_NAMES.OUTREACH_DELIVERY,
        'deliver',
        { messageId: msg.id, leadId: msg.leadId, correlationId: msg.leadId },
        { jobId: `deliver-${msg.id}-${Date.now()}` },
      );
      await writeAudit(app.prisma, {
        userId: request.authUser?.sub,
        action: 'outreach.approve',
        entityType: 'OutreachMessage',
        entityId: msg.id,
      });
      return { id: msg.id, status: 'APPROVED' };
    },
  );

  // POST /outreach/messages/:id/reject
  r.post(
    '/outreach/messages/:id/reject',
    {
      preHandler: [app.authenticate, app.authorize('messages.approve')],
      schema: { tags: ['outreach'], summary: 'Rejeita a mensagem', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const msg = await app.prisma.outreachMessage.findUnique({ where: { id: request.params.id } });
      if (!msg || msg.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      await app.prisma.outreachMessage.update({
        where: { id: msg.id },
        data: { status: OutreachMessageStatus.REJECTED },
      });
      return { id: msg.id, status: 'REJECTED' };
    },
  );

  // POST /outreach/messages/:id/send  (reenfileira entrega de mensagem aprovada)
  r.post(
    '/outreach/messages/:id/send',
    {
      preHandler: [app.authenticate, app.authorize('contacts.perform')],
      schema: { tags: ['outreach'], summary: 'Envia a mensagem aprovada', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const msg = await app.prisma.outreachMessage.findUnique({ where: { id: request.params.id } });
      if (!msg || msg.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      if (msg.status !== OutreachMessageStatus.APPROVED) {
        return reply.code(409).send({ error: 'Conflict', message: 'mensagem não está aprovada' });
      }
      await enqueue(
        QUEUE_NAMES.OUTREACH_DELIVERY,
        'deliver',
        { messageId: msg.id, leadId: msg.leadId, correlationId: msg.leadId },
        { jobId: `deliver-${msg.id}-${Date.now()}` },
      );
      return reply.code(202).send({ status: 'queued' });
    },
  );

  // POST /outreach/messages/:id/cancel
  r.post(
    '/outreach/messages/:id/cancel',
    {
      preHandler: [app.authenticate, app.authorize('messages.edit')],
      schema: { tags: ['outreach'], summary: 'Cancela a mensagem', params: z.object({ id: z.string() }) },
    },
    async (request, reply) => {
      const msg = await app.prisma.outreachMessage.findUnique({ where: { id: request.params.id } });
      if (!msg || msg.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      await app.prisma.outreachMessage.update({
        where: { id: msg.id },
        data: { status: OutreachMessageStatus.CANCELLED },
      });
      return { id: msg.id, status: 'CANCELLED' };
    },
  );

  // POST /outreach/reply  (registra resposta recebida → processamento §29)
  r.post(
    '/outreach/reply',
    {
      preHandler: [app.authenticate, app.authorize('activities.register')],
      schema: {
        tags: ['outreach'],
        summary: 'Registra uma resposta recebida (dispara classificação/opt-out)',
        body: z.object({
          leadId: z.string(),
          text: z.string().min(1),
          channel: z.string().default('EMAIL'),
        }),
      },
    },
    async (request, reply) => {
      const lead = await app.prisma.lead.findUnique({ where: { id: request.body.leadId } });
      if (!lead || lead.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      await enqueue(
        QUEUE_NAMES.OUTREACH_RESPONSE_PROCESSING,
        'reply',
        { leadId: lead.id, text: request.body.text, channel: request.body.channel, correlationId: lead.id },
        { jobId: `reply-${lead.id}-${Date.now()}` },
      );
      return reply.code(202).send({ status: 'queued' });
    },
  );

  // ===== Supressão (§29) =====
  r.get(
    '/suppression',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: {
        tags: ['suppression'],
        summary: 'Lista supressões',
        querystring: z.object({ take: z.coerce.number().int().min(1).max(200).default(100) }),
      },
    },
    async (request) => {
      const items = await app.prisma.suppressionEntry.findMany({
        orderBy: { createdAt: 'desc' },
        take: request.query.take,
      });
      return { items };
    },
  );

  r.post(
    '/suppression',
    {
      preHandler: [app.authenticate, app.authorize('leads.movePipeline')],
      schema: {
        tags: ['suppression'],
        summary: 'Adiciona à lista de supressão',
        body: z.object({
          businessId: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          domain: z.string().optional(),
          reason: z.nativeEnum(SuppressionReason).default(SuppressionReason.REQUESTED),
          notes: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const entry = await app.prisma.suppressionEntry.create({
        data: {
          ...request.body,
          email: request.body.email ? request.body.email.toLowerCase() : null,
          createdBy: request.authUser?.sub ?? null,
        },
      });
      await writeAudit(app.prisma, {
        userId: request.authUser?.sub,
        action: 'suppression.add',
        entityType: 'SuppressionEntry',
        entityId: entry.id,
      });
      return reply.code(201).send(entry);
    },
  );
}
