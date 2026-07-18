import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import { buildOutreachMessage, decideOutreach } from '@informatizou/outreach';
import { loadEnv } from '@informatizou/config';
import {
  OutreachChannel,
  OutreachMessageStatus,
  OutreachMode,
  LeadStatus,
} from '@informatizou/shared';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import { createLogger, withCorrelation } from '@informatizou/logging';

const baseLog = createLogger({ name: 'outreach-generation' });

async function isSuppressed(businessId: string, phone: string | null, email: string | null): Promise<boolean> {
  const found = await prisma.suppressionEntry.findFirst({
    where: {
      OR: [
        { businessId },
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
    },
  });
  return Boolean(found);
}

/**
 * Gera a mensagem comercial de um lead com demo publicada (spec §26/§27/§28).
 * Respeita supressão, modo de contato e aprovação. Follow-up quando marcado.
 */
export async function outreachGenerationHandler(job: Job): Promise<unknown> {
  const leadId = String(job.data?.leadId ?? '');
  const isFollowUp = Boolean(job.data?.followUp);
  const env = loadEnv();
  const log = withCorrelation(baseLog, leadId);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      business: { include: { contacts: true } },
      demoSite: true,
      outreachMessages: true,
    },
  });
  if (!lead || lead.deletedAt) return { skipped: true, reason: 'lead inexistente' };
  if (!lead.demoSite || lead.demoSite.status !== 'PUBLISHED') {
    return { skipped: true, reason: 'demo não publicada' };
  }

  // Regras de não-envio de follow-up (§30).
  if (isFollowUp) {
    const blocked =
      lead.status === LeadStatus.REPLIED ||
      lead.status === LeadStatus.INTERESTED ||
      lead.status === LeadStatus.DO_NOT_CONTACT ||
      lead.status === LeadStatus.WON ||
      lead.status === LeadStatus.LOST ||
      lead.demoSite.status !== 'PUBLISHED';
    const followUpsSent = lead.outreachMessages.filter((m) => m.variant === 'FOLLOW_UP').length;
    if (blocked || followUpsSent >= env.MAX_FOLLOW_UPS) {
      return { skipped: true, reason: 'follow-up não permitido' };
    }
  }

  const emailContact = lead.business.contacts.find((c) => c.type === 'EMAIL' && c.kind === 'BUSINESS')
    ?? lead.business.contacts.find((c) => c.type === 'EMAIL');
  const suppressed = await isSuppressed(
    lead.businessId,
    lead.business.phoneE164,
    emailContact?.value ?? null,
  );

  const decision = decideOutreach({
    hasBusinessEmail: Boolean(emailContact),
    hasPhone: Boolean(lead.business.phoneE164),
    whatsappOptIn: false,
    whatsappEnabled: env.ENABLE_WHATSAPP_DELIVERY,
    emailEnabled: env.ENABLE_EMAIL_DELIVERY,
    suppressed,
    recentlyContacted: false,
    demoPublished: true,
    outreachMode: env.OUTREACH_MODE as OutreachMode,
  });

  if (!decision.eligible) {
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'outreach_blocked',
        description: `contato bloqueado: ${decision.blockingReasons.join('; ')}`,
        isAutomated: true,
      },
    });
    return { skipped: true, reason: 'não elegível', blockingReasons: decision.blockingReasons };
  }

  const channel =
    decision.recommendedChannel === 'EMAIL'
      ? OutreachChannel.EMAIL
      : decision.recommendedChannel === 'WHATSAPP'
        ? OutreachChannel.WHATSAPP
        : decision.recommendedChannel === 'PHONE'
          ? OutreachChannel.PHONE
          : OutreachChannel.MANUAL;

  const message = buildOutreachMessage({
    businessName: lead.business.name,
    demoUrl: lead.demoSite.publicUrl ?? `${env.DEMO_BASE_URL}/${lead.demoSite.slug}`,
    channel,
    variant: isFollowUp ? 'FOLLOW_UP' : 'BASE',
    expirationDays: env.DEMO_EXPIRATION_DAYS,
  });

  const autoSend = !decision.requiresApproval && channel === OutreachChannel.EMAIL;
  const status = autoSend ? OutreachMessageStatus.APPROVED : OutreachMessageStatus.PENDING_APPROVAL;

  const created = await prisma.outreachMessage.create({
    data: {
      leadId: lead.id,
      channel,
      status,
      subject: message.subject ?? null,
      body: message.body,
      variant: isFollowUp ? 'FOLLOW_UP' : 'BASE',
      demoUrl: lead.demoSite.publicUrl,
      generatedByAi: false,
      createdBy: 'outreach-generation',
    },
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: autoSend ? LeadStatus.CONTACTED : LeadStatus.CONTACT_APPROVAL_REQUIRED,
    },
  });
  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: 'outreach_generated',
      channel,
      description: `mensagem ${isFollowUp ? 'follow-up ' : ''}gerada (${channel}, ${status})`,
      isAutomated: true,
    },
  });

  if (autoSend) {
    await enqueue(
      QUEUE_NAMES.OUTREACH_DELIVERY,
      'deliver',
      { messageId: created.id, leadId: lead.id, correlationId: leadId },
      { jobId: `deliver-${created.id}` },
    );
  }

  log.info({ messageId: created.id, channel, status, autoSend }, 'mensagem de prospecção gerada');
  return { messageId: created.id, channel, status };
}
