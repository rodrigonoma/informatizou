import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import { getEmailProvider, ProviderDisabledError } from '@informatizou/providers';
import { loadEnv } from '@informatizou/config';
import { OutreachChannel, OutreachMessageStatus, LeadStatus } from '@informatizou/shared';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import { createLogger, withCorrelation } from '@informatizou/logging';

const baseLog = createLogger({ name: 'outreach-delivery' });

/** Converte texto simples em HTML seguro (escape + quebras de linha). */
function toHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;white-space:pre-wrap">${escaped}</div>`;
}

/**
 * Entrega uma mensagem aprovada (spec §27). Reconsulta a supressão ANTES do
 * envio (§29). Se o canal não puder enviar (desabilitado/não oficial), NÃO
 * dispara — deixa para cópia manual. Agenda follow-up após envio bem-sucedido.
 */
export async function outreachDeliveryHandler(job: Job): Promise<unknown> {
  const messageId = String(job.data?.messageId ?? '');
  const env = loadEnv();
  const log = withCorrelation(baseLog, messageId);

  const message = await prisma.outreachMessage.findUnique({
    where: { id: messageId },
    include: { lead: { include: { business: { include: { contacts: true } } } } },
  });
  if (!message || message.deletedAt) return { skipped: true, reason: 'mensagem inexistente' };
  if (message.status !== OutreachMessageStatus.APPROVED) {
    return { skipped: true, reason: `status ${message.status} não é APPROVED` };
  }

  const business = message.lead.business;
  const emailContact = business.contacts.find((c) => c.type === 'EMAIL');

  // Reconsulta supressão antes do envio (§29).
  const suppressed = await prisma.suppressionEntry.findFirst({
    where: {
      OR: [
        { businessId: business.id },
        ...(business.phoneE164 ? [{ phone: business.phoneE164 }] : []),
        ...(emailContact?.value ? [{ email: emailContact.value.toLowerCase() }] : []),
      ],
    },
  });
  if (suppressed) {
    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: { status: OutreachMessageStatus.CANCELLED },
    });
    log.info('envio cancelado: contato na supressão (§29)');
    return { skipped: true, reason: 'suprimido' };
  }

  if (message.channel !== OutreachChannel.EMAIL) {
    // WhatsApp/telefone/manual: não dispara automaticamente (§27) — cópia manual.
    return { skipped: true, reason: 'canal não automático — envio manual' };
  }

  const to = emailContact?.value;
  if (!to) {
    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: { status: OutreachMessageStatus.FAILED },
    });
    return { skipped: true, reason: 'sem e-mail de destino' };
  }

  const provider = getEmailProvider(env);
  await prisma.outreachMessage.update({
    where: { id: message.id },
    data: { status: OutreachMessageStatus.SENDING },
  });

  try {
    const result = await provider.send({
      to,
      subject: message.subject ?? 'Demonstração de site',
      html: toHtml(message.body),
      text: message.body,
      listUnsubscribe: `<mailto:${env.SMTP_FROM_EMAIL || 'contato@informatizou.com.br'}?subject=remover>`,
    });
    await prisma.outreachAttempt.create({
      data: {
        messageId: message.id,
        channel: OutreachChannel.EMAIL,
        status: 'SENT',
        providerMessageId: result.providerMessageId ?? null,
        attemptedAt: new Date(),
      },
    });
    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: { status: OutreachMessageStatus.SENT },
    });
    await prisma.lead.update({ where: { id: message.leadId }, data: { status: LeadStatus.CONTACTED } });
    await prisma.leadActivity.create({
      data: { leadId: message.leadId, type: 'outreach_sent', channel: 'EMAIL', description: `e-mail enviado para ${to}`, isAutomated: true },
    });

    // Agenda follow-up (§30) se ainda for permitido.
    if (message.variant !== 'FOLLOW_UP' && env.MAX_FOLLOW_UPS > 0) {
      await enqueue(
        QUEUE_NAMES.OUTREACH_MESSAGE_GENERATION,
        'follow-up',
        { leadId: message.leadId, followUp: true, correlationId: message.leadId },
        { jobId: `followup-${message.leadId}`, delay: env.FOLLOW_UP_DELAY_DAYS * 86_400_000 },
      );
    }

    log.info({ to, providerMessageId: result.providerMessageId }, 'e-mail enviado');
    return { sent: true, to };
  } catch (err) {
    if (err instanceof ProviderDisabledError) {
      // Entrega desabilitada: mantém aprovada para cópia manual (§27), não falha.
      await prisma.outreachMessage.update({
        where: { id: message.id },
        data: { status: OutreachMessageStatus.APPROVED },
      });
      await prisma.outreachAttempt.create({
        data: { messageId: message.id, channel: OutreachChannel.EMAIL, status: 'SKIPPED_DISABLED', attemptedAt: new Date() },
      });
      log.info('entrega de e-mail desabilitada — mensagem pronta para cópia manual (§27)');
      return { skipped: true, reason: 'email-desabilitado' };
    }
    await prisma.outreachAttempt.create({
      data: { messageId: message.id, channel: OutreachChannel.EMAIL, status: 'FAILED', error: (err as Error).message, attemptedAt: new Date() },
    });
    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: { status: OutreachMessageStatus.FAILED },
    });
    log.error({ err }, 'falha no envio de e-mail');
    throw err;
  }
}
