import { Worker } from 'bullmq';
import { loadEnv } from '@informatizou/config';
import { createLogger } from '@informatizou/logging';
import {
  ALL_QUEUE_NAMES,
  QUEUE_NAMES,
  parseRedisConnection,
  configureQueues,
  closeQueues,
  getQueue,
} from '@informatizou/queue';
import { makeProcessor } from './processors/index.js';

const log = createLogger({ name: 'worker' });

/** Registra um Worker por fila (§39), cada um com seu processador. */
export function startWorkers(redisUrl: string): Worker[] {
  // Producers dentro dos processadores usam a mesma conexão.
  configureQueues(redisUrl);
  const connection = parseRedisConnection(redisUrl);

  return ALL_QUEUE_NAMES.map((name) => {
    const worker = new Worker(name, makeProcessor(name), { connection, concurrency: 5 });
    worker.on('failed', (job, err) => {
      log.error({ queue: name, jobId: job?.id, err }, 'job falhou');
    });
    worker.on('error', (err) => {
      log.error({ queue: name, err }, 'erro no worker');
    });
    return worker;
  });
}

async function main(): Promise<void> {
  const env = loadEnv();
  log.info({ queues: ALL_QUEUE_NAMES.length }, 'iniciando workers BullMQ');

  const workers = startWorkers(env.REDIS_URL);

  // Worker recorrente de expiração de demos (§21): a cada hora.
  await getQueue(QUEUE_NAMES.DEMO_EXPIRATION).add(
    'expire',
    {},
    { repeat: { every: 60 * 60 * 1000 }, jobId: 'demo-expiration-cron' },
  );

  log.info(
    { count: workers.length, demoExpiration: QUEUE_NAMES.DEMO_EXPIRATION },
    'workers registrados (expiração recorrente a cada hora)',
  );

  const shutdown = async (signal: string): Promise<void> => {
    log.info({ signal }, 'encerrando workers...');
    await Promise.all(workers.map((w) => w.close()));
    await closeQueues();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  void main();
}
