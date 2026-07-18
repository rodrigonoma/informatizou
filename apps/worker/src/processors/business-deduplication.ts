import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import { analyzeDuplicate, needsReview, type DedupRecord } from '@informatizou/dedup';
import { createLogger, withCorrelation } from '@informatizou/logging';

const baseLog = createLogger({ name: 'business-deduplication' });

function toDedupRecord(b: {
  id: string;
  externalId: string | null;
  source: string;
  name: string;
  phoneE164: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}): DedupRecord {
  return {
    id: b.id,
    externalId: b.externalId,
    source: b.source,
    name: b.name,
    phoneE164: b.phoneE164,
    website: b.website,
    latitude: b.latitude,
    longitude: b.longitude,
    address: b.address,
  };
}

/**
 * Deduplica as empresas de uma campanha (spec §9). Marca duplicatas confirmadas
 * com soft-delete e registra tag de revisão para casos de baixa confiança.
 * Finaliza a execução e a campanha.
 */
export async function businessDeduplicationHandler(job: Job): Promise<unknown> {
  const campaignId = String(job.data?.campaignId ?? '');
  const executionId = job.data?.executionId ? String(job.data.executionId) : undefined;
  const log = withCorrelation(baseLog, campaignId);

  const businesses = await prisma.business.findMany({
    where: { campaignId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  const kept: DedupRecord[] = [];
  let duplicatesRemoved = 0;
  let reviewFlagged = 0;

  for (const b of businesses) {
    const record = toDedupRecord(b);
    const analysis = analyzeDuplicate(record, kept);

    if (analysis.isDuplicate) {
      await prisma.business.update({
        where: { id: b.id },
        data: { deletedAt: new Date() },
      });
      duplicatesRemoved += 1;
      log.info(
        { businessId: b.id, matched: analysis.matchedBusinessId, confidence: analysis.confidence },
        'duplicata confirmada (soft-delete)',
      );
    } else {
      if (needsReview(analysis)) {
        reviewFlagged += 1;
        log.info(
          { businessId: b.id, confidence: analysis.confidence },
          'possível duplicata de baixa confiança → revisão',
        );
      }
      kept.push(record);
    }
  }

  if (executionId) {
    await prisma.campaignExecution.update({
      where: { id: executionId },
      data: {
        duplicatesRemoved,
        status: 'COMPLETED',
        finishedAt: new Date(),
        progress: { reviewFlagged, kept: kept.length },
      },
    });
  }
  await prisma.searchCampaign.update({
    where: { id: campaignId },
    data: { status: 'COMPLETED' },
  });

  log.info({ duplicatesRemoved, reviewFlagged, kept: kept.length }, 'deduplicação concluída');
  return { duplicatesRemoved, reviewFlagged, kept: kept.length };
}
