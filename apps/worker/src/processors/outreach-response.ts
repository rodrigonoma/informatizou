import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import { classifyReply } from '@informatizou/outreach';
import { LeadStatus, SuppressionReason, OutreachChannel } from '@informatizou/shared';
import { createLogger, withCorrelation } from '@informatizou/logging';

const baseLog = createLogger({ name: 'outreach-response' });

/**
 * Processa uma resposta recebida (spec §29): classifica, registra e aplica
 * opt-out (supressão + DO_NOT_CONTACT + cancelamento de follow-ups agendados).
 */
export async function outreachResponseHandler(job: Job): Promise<unknown> {
  const leadId = String(job.data?.leadId ?? '');
  const text = String(job.data?.text ?? '');
  const channel = (job.data?.channel as OutreachChannel) ?? OutreachChannel.EMAIL;
  const log = withCorrelation(baseLog, leadId);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { business: { include: { contacts: true } } },
  });
  if (!lead || lead.deletedAt) return { skipped: true, reason: 'lead inexistente' };

  const classification = classifyReply(text);

  await prisma.outreachResponse.create({
    data: {
      leadId: lead.id,
      channel,
      direction: 'INBOUND',
      content: text.slice(0, 4000),
      classification,
      receivedAt: new Date(),
    },
  });

  let newStatus: LeadStatus = LeadStatus.REPLIED;

  if (classification === 'OPT_OUT') {
    const email = lead.business.contacts.find((c) => c.type === 'EMAIL')?.value ?? null;
    await prisma.suppressionEntry.create({
      data: {
        businessId: lead.businessId,
        phone: lead.business.phoneE164,
        email: email ? email.toLowerCase() : null,
        reason: SuppressionReason.REQUESTED,
        notes: 'opt-out detectado em resposta (§29)',
        createdBy: 'outreach-response',
      },
    });
    // Cancela mensagens agendadas/pendentes (§29).
    await prisma.outreachMessage.updateMany({
      where: { leadId: lead.id, status: { in: ['PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'DRAFT'] } },
      data: { status: 'CANCELLED' },
    });
    newStatus = LeadStatus.DO_NOT_CONTACT;
  } else if (classification === 'INTEREST') {
    newStatus = LeadStatus.INTERESTED;
  } else if (classification === 'REJECTION') {
    newStatus = LeadStatus.LOST;
  }

  await prisma.lead.update({ where: { id: lead.id }, data: { status: newStatus } });
  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: 'reply_received',
      channel,
      description: `resposta classificada como ${classification}`,
      isAutomated: true,
    },
  });

  log.info({ classification, newStatus }, 'resposta processada');
  return { classification, status: newStatus };
}
