import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadEnv } from '@informatizou/config';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import { verifyWhatsappSignature, parseInboundMessages } from '@informatizou/providers';

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

const configSchema = z.object({
  phoneNumberId: z.string().min(1),
  label: z.string().optional(),
  businessName: z.string().min(1),
  businessProfile: z.record(z.string(), z.unknown()).optional(),
  tone: z.string().optional(),
  greeting: z.string().optional(),
  fallbackMessage: z.string().optional(),
  handoffKeyword: z.string().optional(),
  knowledge: z.string().optional(),
  enabled: z.boolean().optional(),
});

/** Rotas administrativas do chatbot (autenticadas): configurar o bot e ver conversas. */
export const whatsappAdminRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const p = app.prisma;
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
      const data = {
        label: b.label ?? null,
        businessName: b.businessName,
        tone: b.tone ?? null,
        greeting: b.greeting ?? null,
        fallbackMessage: b.fallbackMessage ?? null,
        handoffKeyword: b.handoffKeyword ?? 'atendente',
        knowledge: b.knowledge ?? null,
        enabled: b.enabled ?? true,
        ...profile,
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
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 20 } },
      }),
  );
};
