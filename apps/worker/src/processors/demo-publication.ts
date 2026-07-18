import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import { loadEnv } from '@informatizou/config';
import { DemoSiteStatus, LeadStatus } from '@informatizou/shared';
import { createLogger, withCorrelation } from '@informatizou/logging';

const baseLog = createLogger({ name: 'demo-publication' });

/**
 * Publica uma demonstração (spec §18/§21): define PUBLISHED, publicUrl e
 * expiração em 10 dias, registra a publicação e encadeia os screenshots.
 */
export async function demoPublicationHandler(job: Job): Promise<unknown> {
  const demoSiteId = String(job.data?.demoSiteId ?? '');
  const env = loadEnv();
  const log = withCorrelation(baseLog, demoSiteId);

  const demo = await prisma.demoSite.findUnique({ where: { id: demoSiteId } });
  if (!demo || demo.deletedAt) return { skipped: true, reason: 'demo inexistente' };
  if (demo.status === DemoSiteStatus.PUBLISHED) {
    return { skipped: true, reason: 'já publicada' };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.DEMO_EXPIRATION_DAYS * 86_400_000);
  const base = env.DEMO_BASE_URL.replace(/\/$/, '');
  const publicUrl = `${base}/${demo.slug}`;

  await prisma.demoSite.update({
    where: { id: demo.id },
    data: {
      status: DemoSiteStatus.PUBLISHED,
      publishedAt: now,
      expiresAt,
      expiredAt: null,
      publicUrl,
    },
  });
  await prisma.demoSitePublication.create({
    data: { demoSiteId: demo.id, publicUrl, publishedAt: now, expiresAt },
  });
  await prisma.lead.update({
    where: { id: demo.leadId },
    data: { status: LeadStatus.READY_TO_CONTACT },
  });
  await prisma.leadActivity.create({
    data: {
      leadId: demo.leadId,
      type: 'demo_published',
      description: `demo publicada em ${publicUrl} (expira ${expiresAt.toISOString()})`,
      isAutomated: true,
    },
  });

  await enqueue(
    QUEUE_NAMES.SCREENSHOT_GENERATION,
    'screenshot',
    { demoSiteId: demo.id, correlationId: demoSiteId },
    { jobId: `screenshot-${demo.id}` },
  );

  log.info({ demoSiteId: demo.id, publicUrl, expiresAt }, 'demo publicada');
  return { published: true, publicUrl, expiresAt };
}
