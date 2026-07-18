import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import { getSearchProvider } from '@informatizou/search-providers';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import { createLogger, withCorrelation } from '@informatizou/logging';
import { persistNormalizedBusiness } from './ingest.js';

const baseLog = createLogger({ name: 'business-search' });

/**
 * Processa a busca de empresas de uma campanha (spec §7/§8): executa o provider,
 * persiste as empresas com proveniência, contabiliza progresso e custo, e
 * encadeia a deduplicação. Idempotente por campanha/execução.
 */
export async function businessSearchHandler(job: Job): Promise<unknown> {
  const campaignId = String(job.data?.campaignId ?? '');
  const executionId = job.data?.executionId ? String(job.data.executionId) : undefined;
  const log = withCorrelation(baseLog, campaignId);

  const campaign = await prisma.searchCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error(`campanha não encontrada: ${campaignId}`);

  // Execução (reusa a existente ou cria).
  const execution = executionId
    ? await prisma.campaignExecution.update({
        where: { id: executionId },
        data: { status: 'RUNNING', startedAt: new Date() },
      })
    : await prisma.campaignExecution.create({
        data: { campaignId, status: 'RUNNING', startedAt: new Date() },
      });

  await prisma.searchCampaign.update({ where: { id: campaignId }, data: { status: 'RUNNING' } });
  log.info({ provider: campaign.provider }, 'iniciando busca de empresas');

  const provider = getSearchProvider({
    provider: campaign.provider,
    csvContent: job.data?.csvContent as string | undefined,
  });

  const searchResult = await provider.search({
    segment: campaign.segment,
    location: campaign.location,
    city: campaign.city ?? undefined,
    state: campaign.state ?? undefined,
    country: campaign.country,
    radiusKm: campaign.radiusKm ?? undefined,
    limit: campaign.resultLimit,
    minimumRating: campaign.minimumRating ?? undefined,
    minimumReviewCount: campaign.minimumReviewCount ?? undefined,
    language: 'pt-BR',
  });

  let withWebsite = 0;
  let withoutWebsite = 0;
  for (const b of searchResult.results) {
    const { hadWebsite } = await persistNormalizedBusiness(b, {
      campaignId,
      createdBy: 'campaign-run',
    });
    if (hadWebsite) withWebsite += 1;
    else withoutWebsite += 1;
  }

  await prisma.campaignExecution.update({
    where: { id: execution.id },
    data: {
      businessesFound: searchResult.totalFound,
      businessesProcessed: searchResult.results.length,
      withWebsite,
      withoutWebsite,
    },
  });

  // Custo/uso do provider (fake/csv = 0 centavos).
  await prisma.campaignCost.create({
    data: {
      campaignId,
      provider: provider.name,
      operation: 'search',
      quantity: searchResult.results.length,
      estimatedCostCents: 0,
    },
  });
  await prisma.providerUsage.create({
    data: {
      campaignId,
      provider: provider.name,
      operation: 'search',
      requestCount: 1,
      estimatedCostCents: 0,
    },
  });

  // Encadeia a deduplicação (idempotente por execução).
  await enqueue(
    QUEUE_NAMES.BUSINESS_DEDUPLICATION,
    'dedup',
    { campaignId, executionId: execution.id, correlationId: campaignId },
    { jobId: `dedup-${execution.id}` },
  );

  log.info(
    { found: searchResult.totalFound, processed: searchResult.results.length, withWebsite, withoutWebsite },
    'busca concluída, deduplicação enfileirada',
  );
  return { found: searchResult.totalFound, processed: searchResult.results.length };
}
