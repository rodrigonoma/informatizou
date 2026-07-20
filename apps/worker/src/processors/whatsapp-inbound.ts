import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import { loadEnv } from '@informatizou/config';
import {
  getAiProvider,
  getWhatsAppProvider,
  type BusinessContext,
  type ChatTurn,
} from '@informatizou/providers';
import { createLogger, withCorrelation } from '@informatizou/logging';

const baseLog = createLogger({ name: 'whatsapp-inbound' });

const OPT_OUT = /^\s*(parar|pare|sair|cancelar|descadastrar|stop)\s*$/i;

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
function num(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

/**
 * Atendente por IA do WhatsApp (Cloud API). Carrega a conversa e a config do
 * negócio, gera a resposta com a IA (respeitando §15 — sem inventar dados) e
 * envia pela API oficial. Entrega é travada por `ENABLE_WHATSAPP_DELIVERY`.
 */
export async function whatsappInboundHandler(job: Job): Promise<unknown> {
  const env = loadEnv();
  const conversationId = String(job.data?.conversationId ?? '');
  const log = withCorrelation(baseLog, conversationId);

  const conv = await prisma.whatsappConversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 14 } },
  });
  if (!conv) return { skipped: 'conversa inexistente' };
  if (conv.mode !== 'BOT') return { skipped: `modo ${conv.mode}` };

  const config = await prisma.whatsappBotConfig.findUnique({
    where: { phoneNumberId: conv.phoneNumberId },
  });
  if (!config || !config.enabled) return { skipped: 'sem config ou bot desabilitado' };

  const userMessage = String(job.data?.messageText ?? '');
  const currentWaId = job.data?.waMessageId as string | undefined;

  // Opt-out: encerra a conversa (compliance).
  if (OPT_OUT.test(userMessage)) {
    await prisma.whatsappConversation.update({ where: { id: conv.id }, data: { mode: 'CLOSED' } });
    log.info('opt-out — conversa encerrada');
    return { optOut: true };
  }

  // Perfil verificado do negócio (nunca inventar — §15).
  const profile = (config.businessProfile ?? {}) as Record<string, unknown>;
  const business: BusinessContext = {
    businessId: config.id,
    name: config.businessName,
    category: str(profile.category),
    city: str(profile.city),
    state: str(profile.state),
    neighborhood: str(profile.neighborhood),
    address: str(profile.address),
    phone: str(profile.phone),
    whatsapp: str(profile.whatsapp),
    email: str(profile.email),
    instagram: str(profile.instagram),
    rating: num(profile.rating),
    reviewCount: num(profile.reviewCount),
    language: 'pt-BR',
  };

  // Histórico (cronológico), excluindo a mensagem atual para não duplicar.
  const history: ChatTurn[] = [...conv.messages]
    .reverse()
    .filter((m) => m.text && m.waMessageId !== currentWaId)
    .map((m) => ({ role: m.direction === 'INBOUND' ? 'user' : 'assistant', text: m.text as string }));

  // Gera a resposta por IA; qualquer falha cai no fallback + handoff.
  let reply: string;
  let handoff: boolean;
  const aiConfigured = env.AI_PROVIDER === 'anthropic' && Boolean(env.ANTHROPIC_API_KEY);
  if (aiConfigured) {
    try {
      const ai = getAiProvider({
        AI_PROVIDER: env.AI_PROVIDER,
        ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
        ANTHROPIC_MODEL: env.ANTHROPIC_MODEL,
      });
      const res = await ai.generateChatReply({
        business,
        knowledge: config.knowledge ?? undefined,
        tone: config.tone ?? undefined,
        history,
        userMessage,
      });
      reply = res.reply;
      handoff = res.handoff;
    } catch (err) {
      log.error({ err: (err as Error).message }, 'falha na IA — usando fallback');
      reply = config.fallbackMessage ?? 'Recebi sua mensagem! Já vou chamar um atendente para te ajudar.';
      handoff = true;
    }
  } else {
    reply = config.fallbackMessage ?? 'Recebemos sua mensagem! Em breve um atendente responde por aqui.';
    handoff = true;
  }

  if (handoff) {
    await prisma.whatsappConversation.update({ where: { id: conv.id }, data: { mode: 'HUMAN' } });
    log.info('conversa transferida para atendente humano');
  }

  // Envia pela API oficial (travado por ENABLE_WHATSAPP_DELIVERY — padrão seguro).
  const provider = getWhatsAppProvider({
    WHATSAPP_PROVIDER: env.WHATSAPP_PROVIDER,
    ENABLE_WHATSAPP_DELIVERY: env.ENABLE_WHATSAPP_DELIVERY,
    WHATSAPP_ACCESS_TOKEN: env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_API_VERSION: env.WHATSAPP_API_VERSION,
  });

  let providerMessageId: string | undefined;
  const canSend = provider.canSend();
  if (canSend) {
    const sent = await provider.send({ to: conv.contactPhone, body: reply });
    providerMessageId = sent.providerMessageId;
  } else {
    log.warn('ENABLE_WHATSAPP_DELIVERY desligado — resposta gerada, não enviada');
  }

  await prisma.whatsappMessage.create({
    data: {
      conversationId: conv.id,
      direction: 'OUTBOUND',
      waMessageId: providerMessageId ?? null,
      kind: 'text',
      text: reply,
    },
  });
  await prisma.whatsappConversation.update({
    where: { id: conv.id },
    data: { lastOutboundAt: new Date() },
  });

  log.info({ handoff, delivered: canSend }, 'resposta do chatbot processada');
  return { replied: true, handoff, delivered: canSend };
}
