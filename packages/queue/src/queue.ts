import { Queue, type JobsOptions } from 'bullmq';
import { parseRedisConnection, buildDefaultJobOptions } from './connection.js';
import type { QueueName } from './names.js';

const queues = new Map<QueueName, Queue>();
let redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

/** Define a URL do Redis usada pelos produtores (chame no bootstrap). */
export function configureQueues(url: string): void {
  redisUrl = url;
}

/** Retorna (criando/caching) a Queue para o nome dado. */
export function getQueue(name: QueueName): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, {
      connection: parseRedisConnection(redisUrl),
      defaultJobOptions: buildDefaultJobOptions(),
    });
    queues.set(name, q);
  }
  return q;
}

export interface EnqueueData {
  correlationId?: string;
  campaignId?: string;
  leadId?: string;
  [key: string]: unknown;
}

/**
 * Enfileira um job. `jobId` opcional garante idempotência (o mesmo id não é
 * enfileirado duas vezes enquanto ativo/aguardando).
 */
export async function enqueue(
  name: QueueName,
  jobName: string,
  data: EnqueueData,
  opts: JobsOptions = {},
): Promise<string | undefined> {
  const job = await getQueue(name).add(jobName, data, opts);
  return job.id;
}

/** Fecha todas as Queues abertas (shutdown). */
export async function closeQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((q) => q.close()));
  queues.clear();
}
