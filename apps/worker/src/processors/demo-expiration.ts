import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import { DemoSiteStatus } from '@informatizou/shared';
import { createLogger } from '@informatizou/logging';

const log = createLogger({ name: 'demo-expiration' });

/**
 * Worker recorrente de expiração (spec §21): a cada hora, expira demonstrações
 * publicadas cujo `expiresAt` já passou. Remove o conteúdo comercial da
 * visualização pública (status EXPIRED) mas mantém o registro interno.
 */
export async function demoExpirationHandler(_job: Job): Promise<unknown> {
  const now = new Date();
  const due = await prisma.demoSite.findMany({
    where: { status: DemoSiteStatus.PUBLISHED, expiresAt: { lt: now } },
    select: { id: true, leadId: true, slug: true },
  });

  for (const demo of due) {
    await prisma.demoSite.update({
      where: { id: demo.id },
      data: { status: DemoSiteStatus.EXPIRED, expiredAt: now },
    });
    await prisma.leadActivity.create({
      data: {
        leadId: demo.leadId,
        type: 'demo_expired',
        description: `demo ${demo.slug} expirada`,
        isAutomated: true,
      },
    });
  }

  if (due.length > 0) log.info({ expired: due.length }, 'demonstrações expiradas');
  return { expired: due.length };
}
