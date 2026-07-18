import type { PrismaClient } from '@informatizou/database';
import { createLogger } from '@informatizou/logging';

const log = createLogger({ name: 'audit' });

export interface AuditInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

/**
 * Registra uma entrada de auditoria (spec §41). Falhas de auditoria são logadas
 * mas nunca derrubam a operação principal.
 */
export async function writeAudit(prisma: PrismaClient, input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: (input.before ?? undefined) as object | undefined,
        after: (input.after ?? undefined) as object | undefined,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        correlationId: input.correlationId ?? null,
      },
    });
  } catch (err) {
    log.error({ err, action: input.action }, 'falha ao gravar auditoria');
  }
}
