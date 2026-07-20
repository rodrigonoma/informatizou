import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import { loadEnv } from '@informatizou/config';
import {
  getAiProvider,
  getWhatsAppProvider,
  decideFlow,
  type BotFlowConfig,
  type BotMenuOption,
  type BusinessHours,
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
 * Atendente do WhatsApp (Cloud API) — híbrido: fluxo de menu/regras configurado
 * pelo cliente (`decideFlow`) + IA (§15 — sem inventar dados). A IA só é chamada
 * quando o fluxo devolve `kind: 'ai'`. Entrega travada por `ENABLE_WHATSAPP_DELIVERY`.
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

  // Primeiro contato = ainda não respondemos nada nesta conversa.
  const firstContact = !conv.lastOutboundAt && !conv.messages.some((m) => m.direction === 'OUTBOUND');

  // Fluxo configurado pelo cliente (menu/regras/horário).
  const flowConfig: BotFlowConfig = {
    aiEnabled: config.aiEnabled,
    greeting: config.greeting,
    awayMessage: config.awayMessage,
    handoffMessage: config.handoffMessage,
    handoffKeyword: config.handoffKeyword,
    fallbackMessage: config.fallbackMessage,
    menuEnabled: config.menuEnabled,
    menuHeader: config.menuHeader,
    options: ((config.options as unknown as BotMenuOption[]) ?? []).filter(
      (o) => o && typeof o.label === 'string',
    ),
    businessHours: (config.businessHours as unknown as BusinessHours) ?? null,
  };

  const decision = decideFlow(flowConfig, userMessage, { firstContact, now: new Date() });

  // Resolve a resposta e se transfere para humano.
  let reply: string;
  let handoff = false;

  if (decision.kind === 'ai') {
    const aiConfigured = env.AI_PROVIDER === 'anthropic' && Boolean(env.ANTHROPIC_API_KEY);
    if (aiConfigured) {
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
      const history: ChatTurn[] = [...conv.messages]
        .reverse()
        .filter((m) => m.text && m.waMessageId !== currentWaId)
        .map((m) => ({
          role: m.direction === 'INBOUND' ? 'user' : 'assistant',
          text: m.text as string,
        }));
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
  } else {
    // away | greeting | option | handoff | fallback — resposta determinística.
    reply = decision.text;
    handoff = decision.kind === 'handoff' || (decision.kind === 'option' && decision.handoff);
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

  log.info({ kind: decision.kind, handoff, delivered: canSend }, 'resposta do chatbot processada');
  return { replied: true, kind: decision.kind, handoff, delivered: canSend };
}
