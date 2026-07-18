import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import { computeScore, type ScoreInput } from '@informatizou/scoring';
import { verifyWebsite, scenarioToStatus } from '@informatizou/website-verification';
import { WebsiteStatus, ScoreCategory, LeadStatus, ReviewStatus } from '@informatizou/shared';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import { loadEnv } from '@informatizou/config';
import { createLogger, withCorrelation } from '@informatizou/logging';

const baseLog = createLogger({ name: 'lead-scoring' });

interface ScenarioMeta {
  scenario?: string;
  case?: string;
  closed?: boolean;
  optOut?: boolean;
  conflictingData?: boolean;
}

/**
 * Qualifica uma empresa em lead (spec §10–§14): determina o status do site,
 * valida contatos, calcula o score e cria/atualiza o Lead + LeadScore +
 * WebsiteVerification, aplicando a fila de revisão (auto-aprovação no modo
 * autônomo; manual por padrão).
 */
export async function leadScoringHandler(job: Job): Promise<unknown> {
  const businessId = String(job.data?.businessId ?? '');
  const campaignId = job.data?.campaignId ? String(job.data.campaignId) : null;
  const log = withCorrelation(baseLog, campaignId ?? businessId);
  const env = loadEnv();

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { contacts: true, socialProfiles: true },
  });
  if (!business || business.deletedAt) {
    return { skipped: true, reason: 'empresa inexistente/removida' };
  }

  const meta = (business.rawData ?? {}) as ScenarioMeta;

  // 1) Status do site (§10). Fake: usa cenário; real: verifica com guarda SSRF.
  let websiteStatus: WebsiteStatus;
  if (business.source === 'fake') {
    websiteStatus = scenarioToStatus(meta.scenario);
  } else {
    const verification = await verifyWebsite({
      website: business.website,
      businessName: business.name,
    });
    websiteStatus = verification.status;
    await prisma.websiteVerification.create({
      data: {
        businessId: business.id,
        url: verification.url ?? null,
        status: verification.status,
        checkedAt: new Date(),
        signals: { reason: verification.reason, safe: verification.safe },
      },
    });
  }
  if (business.source === 'fake') {
    await prisma.websiteVerification.create({
      data: {
        businessId: business.id,
        url: business.website,
        status: websiteStatus,
        checkedAt: new Date(),
        signals: { scenario: meta.scenario, source: 'fake' },
      },
    });
  }

  // 2) Contatos válidos (§12).
  const emailContacts = business.contacts.filter((c) => c.type === 'EMAIL');
  const hasBusinessEmail = emailContacts.some((c) => c.kind === 'BUSINESS');
  const hasPhone = Boolean(business.phoneE164);
  const hasInstagram = business.socialProfiles.some((s) => s.network === 'INSTAGRAM');

  // 3) Supressão/opt-out (§29).
  const suppressed = await prisma.suppressionEntry.findFirst({
    where: {
      OR: [
        { businessId: business.id },
        ...(business.phoneE164 ? [{ phone: business.phoneE164 }] : []),
        ...(emailContacts[0]?.value ? [{ email: emailContacts[0].value.toLowerCase() }] : []),
      ],
    },
  });

  // 4) Score (§13).
  const scoreInput: ScoreInput = {
    websiteStatus,
    reviewCount: business.reviewCount ?? 0,
    rating: business.rating ?? 0,
    hasBusinessPhone: hasPhone,
    hasBusinessEmail,
    hasInstagram,
    instagramActive: hasInstagram,
    hasPhotos: meta.case !== 'imagens ausentes',
    addressConfirmed: Boolean(business.address),
    activeBusiness: !meta.closed,
    hasValidContact: hasPhone || hasBusinessEmail,
    inconsistentData: Boolean(meta.conflictingData),
    littlePublicInfo: (business.reviewCount ?? 0) < 10 && !hasBusinessEmail && !hasInstagram,
    closed: Boolean(meta.closed),
    optOut: Boolean(suppressed),
  };
  const score = computeScore(scoreInput);

  // 5) Cria/atualiza o Lead + LeadScore.
  const existing = await prisma.lead.findFirst({
    where: { businessId: business.id, campaignId: campaignId ?? undefined },
  });
  const rejected = score.category === ScoreCategory.REJECTED;
  const leadStatus: LeadStatus = rejected ? LeadStatus.REJECTED : LeadStatus.QUALIFIED;

  const lead = existing
    ? await prisma.lead.update({
        where: { id: existing.id },
        data: {
          status: leadStatus,
          scoreTotal: score.total,
          scoreCategory: score.category,
          websiteStatus,
        },
      })
    : await prisma.lead.create({
        data: {
          businessId: business.id,
          campaignId,
          status: leadStatus,
          scoreTotal: score.total,
          scoreCategory: score.category,
          websiteStatus,
          createdBy: 'qualification',
        },
      });

  const scoreItems = score.items as unknown as object;
  await prisma.leadScore.upsert({
    where: { leadId: lead.id },
    update: { total: score.total, category: score.category, items: scoreItems, computedAt: new Date() },
    create: { leadId: lead.id, total: score.total, category: score.category, items: scoreItems },
  });

  // 6) Fila de revisão (§14). Auto-aprova no modo autônomo quando elegível.
  if (!rejected) {
    const campaign = campaignId
      ? await prisma.searchCampaign.findUnique({ where: { id: campaignId } })
      : null;
    const minScore = campaign?.minimumScoreForDemo ?? env.DEFAULT_MINIMUM_DEMO_SCORE;
    const eligible =
      score.total >= minScore &&
      !scoreInput.inconsistentData &&
      !suppressed &&
      scoreInput.hasValidContact === true;

    const reviewStatus: ReviewStatus =
      env.AUTONOMOUS_MODE && eligible
        ? ReviewStatus.AUTOMATICALLY_APPROVED
        : ReviewStatus.MANUAL_REVIEW_REQUIRED;

    await prisma.leadReview.create({
      data: {
        leadId: lead.id,
        status: reviewStatus,
        checklist: {
          score: score.total,
          minScore,
          eligible,
          hasValidContact: scoreInput.hasValidContact,
          suppressed: Boolean(suppressed),
        },
        decidedAt: reviewStatus === ReviewStatus.AUTOMATICALLY_APPROVED ? new Date() : null,
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status:
          reviewStatus === ReviewStatus.AUTOMATICALLY_APPROVED
            ? LeadStatus.DEMO_READY
            : LeadStatus.REVIEW_REQUIRED,
      },
    });

    // Modo autônomo: aprovado automaticamente → gera a demo (§18).
    if (reviewStatus === ReviewStatus.AUTOMATICALLY_APPROVED) {
      await enqueue(
        QUEUE_NAMES.DEMO_GENERATION,
        'generate',
        { leadId: lead.id, correlationId: campaignId ?? businessId },
        { jobId: `generate-${lead.id}` },
      );
    }
  }

  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: 'qualification',
      description: `score ${score.total} (${score.category}), site ${websiteStatus}`,
      isAutomated: true,
      correlationId: campaignId ?? businessId,
    },
  });

  log.info(
    { businessId, leadId: lead.id, score: score.total, category: score.category, websiteStatus },
    'lead qualificado',
  );
  return { leadId: lead.id, score: score.total, category: score.category };
}
