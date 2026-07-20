import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadEnv } from '@informatizou/config';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import {
  verifyWhatsappSignature,
  parseInboundMessages,
  getWhatsAppProvider,
} from '@informatizou/providers';

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: string;
  }
}

/**
 * Webhook público do WhatsApp Cloud API (Meta):
 * - GET: verificação de assinatura do webhook (hub.challenge).
 * - POST: recebe mensagens, valida a assinatura (X-Hub-Signature-256),
 *   persiste e enfileira o processamento por IA (§15).
 */
export const whatsappWebhookRoutes: FastifyPluginAsync = async (app) => {
  const env = loadEnv();
  const p = app.prisma;

  // Corpo cru é necessário para validar a assinatura HMAC da Meta.
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    req.rawBody = typeof body === 'string' ? body : body.toString('utf8');
    try {
      done(null, req.rawBody.length ? JSON.parse(req.rawBody) : {});
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  // Verificação do webhook (Meta chama uma vez ao configurar).
  app.get('/', async (req, reply) => {
    const q = req.query as Record<string, string | undefined>;
    if (
      q['hub.mode'] === 'subscribe' &&
      q['hub.verify_token'] &&
      q['hub.verify_token'] === env.WHATSAPP_VERIFY_TOKEN
    ) {
      return reply.code(200).type('text/plain').send(q['hub.challenge'] ?? '');
    }
    return reply.code(403).send('forbidden');
  });

  // Recebimento de mensagens.
  app.post('/', async (req, reply) => {
    const sig = req.headers['x-hub-signature-256'] as string | undefined;
    if (!verifyWhatsappSignature(env.WHATSAPP_APP_SECRET, req.rawBody ?? '', sig)) {
      req.log.warn('webhook whatsapp com assinatura inválida');
      return reply.code(401).send({ error: 'assinatura inválida' });
    }

    const batch = parseInboundMessages(req.body);
    let queued = 0;
    for (const m of batch.messages) {
      if (!m.from) continue;
      const conv = await p.whatsappConversation.upsert({
        where: {
          phoneNumberId_contactPhone: {
            phoneNumberId: batch.phoneNumberId ?? '',
            contactPhone: m.from,
          },
        },
        create: {
          phoneNumberId: batch.phoneNumberId ?? '',
          contactPhone: m.from,
          contactName: m.contactName ?? null,
          lastInboundAt: new Date(),
        },
        update: { lastInboundAt: new Date(), contactName: m.contactName ?? undefined },
      });

      await p.whatsappMessage.create({
        data: {
          conversationId: conv.id,
          direction: 'INBOUND',
          waMessageId: m.waMessageId ?? null,
          kind: m.type,
          text: m.text ?? null,
          raw: m as unknown as object,
        },
      });

      // Só respondemos texto no MVP; outros tipos ficam registrados.
      if (m.text && (conv.mode === 'BOT')) {
        await enqueue(
          QUEUE_NAMES.WHATSAPP_INBOUND,
          'inbound',
          {
            conversationId: conv.id,
            messageText: m.text,
            waMessageId: m.waMessageId,
            correlationId: conv.id,
          },
          m.waMessageId ? { jobId: `wa-${m.waMessageId}` } : {},
        );
        queued += 1;
      }
    }

    return reply.code(200).send({ ok: true, queued });
  });
};

const menuOptionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  keywords: z.array(z.string()).optional(),
  response: z.string().min(1),
  handoff: z.boolean().optional(),
});

const businessHoursSchema = z.object({
  enabled: z.boolean(),
  tz: z.string().optional(),
  // "0"(dom)…"6"(sáb) => faixas [["09:00","18:00"], ...]
  days: z.record(z.string(), z.array(z.tuple([z.string(), z.string()]))),
});

const configSchema = z.object({
  phoneNumberId: z.string().min(1),
  label: z.string().optional(),
  businessName: z.string().min(1),
  businessProfile: z.record(z.string(), z.unknown()).optional(),
  tone: z.string().optional(),
  greeting: z.string().optional(),
  awayMessage: z.string().optional(),
  fallbackMessage: z.string().optional(),
  handoffMessage: z.string().optional(),
  handoffKeyword: z.string().optional(),
  knowledge: z.string().optional(),
  businessHours: businessHoursSchema.nullable().optional(),
  menuEnabled: z.boolean().optional(),
  menuHeader: z.string().optional(),
  options: z.array(menuOptionSchema).optional(),
  aiEnabled: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

/** Rotas administrativas do chatbot (autenticadas): configurar o bot e ver conversas. */
export const whatsappAdminRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const p = app.prisma;
  const env = loadEnv();
  const guard = { preHandler: [app.authenticate, app.authorize('integrations.configure')] };

  r.get('/config', { ...guard, schema: { tags: ['whatsapp'], summary: 'Lista configs do chatbot' } }, () =>
    p.whatsappBotConfig.findMany({ orderBy: { createdAt: 'desc' } }),
  );

  r.put(
    '/config',
    { ...guard, schema: { tags: ['whatsapp'], summary: 'Cria/atualiza a config do chatbot', body: configSchema } },
    async (req) => {
      const b = req.body;
      // businessProfile só é incluído quando enviado (JSON nulo não é aceito pelo Prisma).
      const profile =
        b.businessProfile === undefined
          ? {}
          : { businessProfile: b.businessProfile as unknown as object };
      // JSON nulos não são aceitos pelo Prisma — só incluímos quando enviados.
      const hours =
        b.businessHours === undefined
          ? {}
          : { businessHours: (b.businessHours ?? undefined) as unknown as object | undefined };
      const opts =
        b.options === undefined ? {} : { options: b.options as unknown as object };
      const data = {
        label: b.label ?? null,
        businessName: b.businessName,
        tone: b.tone ?? null,
        greeting: b.greeting ?? null,
        awayMessage: b.awayMessage ?? null,
        fallbackMessage: b.fallbackMessage ?? null,
        handoffMessage: b.handoffMessage ?? null,
        handoffKeyword: b.handoffKeyword ?? 'atendente',
        knowledge: b.knowledge ?? null,
        menuEnabled: b.menuEnabled ?? false,
        menuHeader: b.menuHeader ?? null,
        aiEnabled: b.aiEnabled ?? true,
        enabled: b.enabled ?? true,
        ...profile,
        ...hours,
        ...opts,
      };
      return p.whatsappBotConfig.upsert({
        where: { phoneNumberId: b.phoneNumberId },
        create: { phoneNumberId: b.phoneNumberId, ...data },
        update: data,
      });
    },
  );

  r.get(
    '/conversations',
    { ...guard, schema: { tags: ['whatsapp'], summary: 'Últimas conversas' } },
    () =>
      p.whatsappConversation.findMany({
        orderBy: { lastInboundAt: 'desc' },
        take: 50,
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
  );

  const idParam = z.object({ id: z.string().min(1) });

  r.get(
    '/conversations/:id',
    { ...guard, schema: { tags: ['whatsapp'], summary: 'Conversa + histórico', params: idParam } },
    async (req, reply) => {
      const conv = await p.whatsappConversation.findUnique({
        where: { id: req.params.id },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 200 } },
      });
      if (!conv) return reply.code(404).send({ error: 'conversa não encontrada' });
      return conv;
    },
  );

  // Assumir (humano), devolver ao bot ou encerrar a conversa.
  const setMode = (mode: 'HUMAN' | 'BOT' | 'CLOSED') => async (req: { params: { id: string } }) =>
    p.whatsappConversation.update({ where: { id: req.params.id }, data: { mode } });

  r.post(
    '/conversations/:id/takeover',
    { ...guard, schema: { tags: ['whatsapp'], summary: 'Assumir conversa (humano)', params: idParam } },
    setMode('HUMAN'),
  );
  r.post(
    '/conversations/:id/return',
    { ...guard, schema: { tags: ['whatsapp'], summary: 'Devolver ao bot', params: idParam } },
    setMode('BOT'),
  );
  r.post(
    '/conversations/:id/close',
    { ...guard, schema: { tags: ['whatsapp'], summary: 'Encerrar conversa', params: idParam } },
    setMode('CLOSED'),
  );

  // Resposta manual do atendente (envio pela API oficial, se habilitada).
  r.post(
    '/conversations/:id/reply',
    {
      ...guard,
      schema: {
        tags: ['whatsapp'],
        summary: 'Enviar resposta manual',
        params: idParam,
        body: z.object({ text: z.string().min(1).max(4096) }),
      },
    },
    async (req, reply) => {
      const conv = await p.whatsappConversation.findUnique({ where: { id: req.params.id } });
      if (!conv) return reply.code(404).send({ error: 'conversa não encontrada' });

      const provider = getWhatsAppProvider({
        WHATSAPP_PROVIDER: env.WHATSAPP_PROVIDER,
        ENABLE_WHATSAPP_DELIVERY: env.ENABLE_WHATSAPP_DELIVERY,
        WHATSAPP_ACCESS_TOKEN: env.WHATSAPP_ACCESS_TOKEN,
        WHATSAPP_PHONE_NUMBER_ID: env.WHATSAPP_PHONE_NUMBER_ID,
        WHATSAPP_API_VERSION: env.WHATSAPP_API_VERSION,
      });

      let providerMessageId: string | undefined;
      let delivered = false;
      if (provider.canSend()) {
        const sent = await provider.send({ to: conv.contactPhone, body: req.body.text });
        providerMessageId = sent.providerMessageId;
        delivered = true;
      }

      const msg = await p.whatsappMessage.create({
        data: {
          conversationId: conv.id,
          direction: 'OUTBOUND',
          waMessageId: providerMessageId ?? null,
          kind: 'text',
          text: req.body.text,
        },
      });
      await p.whatsappConversation.update({
        where: { id: conv.id },
        // Uma resposta manual assume a conversa (sai do modo BOT).
        data: { lastOutboundAt: new Date(), mode: conv.mode === 'BOT' ? 'HUMAN' : conv.mode },
      });
      return { delivered, message: msg };
    },
  );
};
