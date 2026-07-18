import type { JobsOptions, ConnectionOptions } from 'bullmq';

/**
 * As 24 filas da plataforma (spec §39). Nomes estáveis (kebab-case) usados como
 * identificadores no BullMQ e correlação em `JobExecution`.
 */
export const QUEUE_NAMES = {
  BUSINESS_SEARCH: 'business-search',
  BUSINESS_DETAILS: 'business-details',
  BUSINESS_DEDUPLICATION: 'business-deduplication',
  WEBSITE_DISCOVERY: 'website-discovery',
  WEBSITE_VERIFICATION: 'website-verification',
  BUSINESS_ENRICHMENT: 'business-enrichment',
  CONTACT_VALIDATION: 'contact-validation',
  LEAD_SCORING: 'lead-scoring',
  LEAD_REVIEW: 'lead-review',
  WEBSITE_CONTENT_GENERATION: 'website-content-generation',
  WEBSITE_CONTENT_REVIEW: 'website-content-review',
  DEMO_GENERATION: 'demo-generation',
  DEMO_PUBLICATION: 'demo-publication',
  SCREENSHOT_GENERATION: 'screenshot-generation',
  DEMO_EXPIRATION: 'demo-expiration',
  OUTREACH_MESSAGE_GENERATION: 'outreach-message-generation',
  OUTREACH_APPROVAL: 'outreach-approval',
  OUTREACH_DELIVERY: 'outreach-delivery',
  OUTREACH_RESPONSE_PROCESSING: 'outreach-response-processing',
  ANALYTICS_PROCESSING: 'analytics-processing',
  PROPOSAL_GENERATION: 'proposal-generation',
  EXPORT_GENERATION: 'export-generation',
  CLEANUP: 'cleanup',
  BACKUP: 'backup',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const ALL_QUEUE_NAMES: QueueName[] = Object.values(QUEUE_NAMES);

/**
 * Opções padrão dos jobs (spec §39): idempotência (via jobId no enqueue),
 * timeout, tentativas, backoff exponencial e retenção controlada (dead-letter).
 */
export function buildDefaultJobOptions(): JobsOptions {
  return {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 1000, age: 24 * 3600 },
    removeOnFail: { count: 5000 },
  };
}

/** Converte a REDIS_URL em opções de conexão do BullMQ. */
export function parseRedisConnection(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username || undefined,
    password: url.password || undefined,
    // Exigido pelo BullMQ para Workers.
    maxRetriesPerRequest: null,
  };
}
