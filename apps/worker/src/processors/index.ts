import type { Job, Processor } from 'bullmq';
import { prisma } from '@informatizou/database';
import { createLogger, withCorrelation } from '@informatizou/logging';
import type { QueueName } from '../queues.js';

const baseLogger = createLogger({ name: 'worker' });

/**
 * Processador stub idempotente (Fase 1). Registra início/fim de cada job em
 * `JobExecution` e loga com correlação. A lógica real de cada fila é preenchida
 * nas fases correspondentes — este esqueleto garante idempotência, logs,
 * progresso e rastreabilidade desde já.
 */
export function makeStubProcessor(queue: QueueName): Processor {
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
      // Não falha o job por causa da auditoria de execução.
      log.error({ err, queue }, 'falha ao registrar JobExecution');
    }

    // Fase 1: nenhum processamento real ainda. Marca como concluído.
    const result = { queue, handled: false, note: 'stub — implementação por fase' };

    if (execution) {
      await prisma.jobExecution
        .update({
          where: { id: execution.id },
          data: { status: 'COMPLETED', result, finishedAt: new Date() },
        })
        .catch((err) => log.error({ err }, 'falha ao finalizar JobExecution'));
    }

    log.info({ queue, jobId: job.id }, 'job concluído (stub)');
    return result;
  };
}
