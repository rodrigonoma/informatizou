import type { ConnectionOptions, JobsOptions } from 'bullmq';

/** Converte a REDIS_URL em opções de conexão do BullMQ. */
export function parseRedisConnection(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username || undefined,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

/** Opções padrão dos jobs (spec §39): idempotência, tentativas, backoff, retenção. */
export function buildDefaultJobOptions(): JobsOptions {
  return {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 1000, age: 24 * 3600 },
    removeOnFail: { count: 5000 },
  };
}
