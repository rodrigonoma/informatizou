import { Queue, Worker } from 'bullmq';
import { loadEnv } from '@informatizou/config';
import { createLogger } from '@informatizou/logging';
import {
  ALL_QUEUE_NAMES,
  QUEUE_NAMES,
  buildDefaultJobOptions,
  parseRedisConnection,
  type QueueName,
} from './queues.js';
import { makeStubProcessor } from './processors/index.js';

const log = createLogger({ name: 'worker' });

/** Cria uma instância de Queue por nome (para enfileirar jobs). */
export function createQueues(redisUrl: string): Map<QueueName, Queue> {
  const connection = parseRedisConnection(redisUrl);
  const queues = new Map<QueueName, Queue>();
  for (const name of ALL_QUEUE_NAMES) {
    queues.set(name, new Queue(name, { connection, defaultJobOptions: buildDefaultJobOptions() }));
  }
  return queues;
}

/** Registra um Worker por fila, cada um com o processador stub idempotente. */
export function startWorkers(redisUrl: string): Worker[] {
  const connection = parseRedisConnection(redisUrl);
  const workers = ALL_QUEUE_NAMES.map((name) => {
    const worker = new Worker(name, makeStubProcessor(name), {
      connection,
      concurrency: 5,
    });
    worker.on('failed', (job, err) => {
      log.error({ queue: name, jobId: job?.id, err }, 'job falhou');
    });
    worker.on('error', (err) => {
      log.error({ queue: name, err }, 'erro no worker');
    });
    return worker;
  });
  return workers;
}

async function main(): Promise<void> {
  const env = loadEnv();
  log.info({ queues: ALL_QUEUE_NAMES.length }, 'iniciando workers BullMQ');

  const workers = startWorkers(env.REDIS_URL);
  log.info(
    { count: workers.length, demoExpiration: QUEUE_NAMES.DEMO_EXPIRATION },
    'workers registrados',
  );

  const shutdown = async (signal: string): Promise<void> => {
    log.info({ signal }, 'encerrando workers...');
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

// Executa apenas quando rodado diretamente (não em import de teste).
const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  void main();
}
