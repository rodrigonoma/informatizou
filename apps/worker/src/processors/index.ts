import type { Job, Processor } from 'bullmq';
import { prisma } from '@informatizou/database';
import { createLogger, withCorrelation } from '@informatizou/logging';
import { QUEUE_NAMES, type QueueName } from '@informatizou/queue';
import { businessSearchHandler } from './business-search.js';
import { businessDeduplicationHandler } from './business-deduplication.js';
import { leadScoringHandler } from './lead-scoring.js';
import { demoGenerationHandler } from './demo-generation.js';
import { demoPublicationHandler } from './demo-publication.js';
import { demoExpirationHandler } from './demo-expiration.js';
import { screenshotGenerationHandler } from './screenshot-generation.js';

const baseLogger = createLogger({ name: 'worker' });

export type JobHandler = (job: Job) => Promise<unknown>;

/** Handler stub (fases ainda não implementadas): apenas registra a execução. */
function stubHandler(queue: QueueName): JobHandler {
  return async () => ({ queue, handled: false, note: 'stub — implementação por fase' });
}

/** Registro de handlers reais por fila. Demais filas usam stub idempotente. */
const HANDLERS: Partial<Record<QueueName, JobHandler>> = {
  [QUEUE_NAMES.BUSINESS_SEARCH]: businessSearchHandler,
  [QUEUE_NAMES.BUSINESS_DEDUPLICATION]: businessDeduplicationHandler,
  [QUEUE_NAMES.LEAD_SCORING]: leadScoringHandler,
  [QUEUE_NAMES.DEMO_GENERATION]: demoGenerationHandler,
  [QUEUE_NAMES.DEMO_PUBLICATION]: demoPublicationHandler,
  [QUEUE_NAMES.DEMO_EXPIRATION]: demoExpirationHandler,
  [QUEUE_NAMES.SCREENSHOT_GENERATION]: screenshotGenerationHandler,
};

/**
 * Cria o processador de uma fila: envelopa o handler com registro de
 * `JobExecution` (início/fim/erro), logs correlacionados e idempotência.
 */
export function makeProcessor(queue: QueueName): Processor {
  const handler = HANDLERS[queue] ?? stubHandler(queue);

  return async (job: Job) => {
    const correlationId =
      (job.data?.correlationId as string | undefined) ?? `${queue}:${job.id ?? 'no-id'}`;
    const log = withCorrelation(baseLogger, correlationId);
    log.info({ queue, jobId: job.id, name: job.name }, 'job iniciado');

    let execution: { id: string } | null = null;
    try {
      execution = await prisma.jobExecution.create({
        data: {
          queue,
          jobId: job.id ?? null,
          status: 'RUNNING',
          attempts: job.attemptsMade + 1,
          correlationId,
          campaignId: (job.data?.campaignId as string | undefined) ?? null,
          leadId: (job.data?.leadId as string | undefined) ?? null,
          payload: (job.data ?? {}) as object,
          startedAt: new Date(),
        },
      });
    } catch (err) {
      log.error({ err, queue }, 'falha ao registrar JobExecution');
    }

    try {
      const result = await handler(job);
      if (execution) {
        await prisma.jobExecution
          .update({
            where: { id: execution.id },
            data: { status: 'COMPLETED', result: result as object, finishedAt: new Date() },
          })
          .catch((err) => log.error({ err }, 'falha ao finalizar JobExecution'));
      }
      log.info({ queue, jobId: job.id }, 'job concluído');
      return result;
    } catch (err) {
      if (execution) {
        await prisma.jobExecution
          .update({
            where: { id: execution.id },
            data: {
              status: 'FAILED',
              error: (err as Error).message,
              finishedAt: new Date(),
            },
          })
          .catch(() => {});
      }
      log.error({ err, queue, jobId: job.id }, 'job falhou');
      throw err;
    }
  };
}

// Compat: mantém o nome anterior usado pelo worker.ts.
export const makeStubProcessor = makeProcessor;
