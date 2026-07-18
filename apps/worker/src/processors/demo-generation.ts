import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import { buildDemoContent, selectTemplate, designTokensFor } from '@informatizou/demo-templates';
import { slugify } from '@informatizou/shared';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import { loadEnv } from '@informatizou/config';
import { LeadStatus, DemoSiteStatus } from '@informatizou/shared';
import { createLogger, withCorrelation } from '@informatizou/logging';

const baseLog = createLogger({ name: 'demo-generation' });

/** Gera um slug único para a demo (spec §18), com sufixo de cidade/afixo em conflito. */
async function uniqueSlug(name: string, city?: string | null): Promise<string> {
  const base = slugify(name);
  if (!(await prisma.demoSite.findUnique({ where: { slug: base } }))) return base;
  if (city) {
    const withCity = slugify(name, { citySuffix: city });
    if (!(await prisma.demoSite.findUnique({ where: { slug: withCity } }))) return withCity;
  }
  for (let i = 2; i < 50; i++) {
    const candidate = `${base}-${i}`;
    if (!(await prisma.demoSite.findUnique({ where: { slug: candidate } }))) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Gera a demonstração de um lead aprovado (spec §15/§16/§18): constrói o
 * conteúdo (sem inventar dados), seleciona o template por categoria e cria o
 * DemoSite. No modo autônomo, encadeia a publicação.
 */
export async function demoGenerationHandler(job: Job): Promise<unknown> {
  const leadId = String(job.data?.leadId ?? '');
  const env = loadEnv();
  const log = withCorrelation(baseLog, leadId);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      business: { include: { contacts: true, socialProfiles: true } },
      demoSite: true,
    },
  });
  if (!lead || lead.deletedAt) return { skipped: true, reason: 'lead inexistente' };
  if (lead.demoSite) return { skipped: true, reason: 'demo já existe', demoSiteId: lead.demoSite.id };

  const b = lead.business;
  const emailContact = b.contacts.find((c) => c.type === 'EMAIL');
  const whatsappContact = b.contacts.find((c) => c.type === 'PHONE' && c.kind === 'MOBILE');
  const instagram = b.socialProfiles.find((s) => s.network === 'INSTAGRAM');

  const content = buildDemoContent({
    name: b.name,
    category: b.category,
    city: b.city,
    neighborhood: b.neighborhood,
    address: b.address,
    phone: b.phone,
    whatsapp: whatsappContact?.valueNormalized ?? undefined,
    email: emailContact?.value ?? undefined,
    instagram: instagram?.url ?? undefined,
    rating: b.rating,
    reviewCount: b.reviewCount,
    photoUrls: [],
  });

  const template = selectTemplate(b.category);
  const tokens = designTokensFor(template);
  const slug = await uniqueSlug(b.name, b.city);

  const demo = await prisma.demoSite.create({
    data: {
      leadId: lead.id,
      slug,
      template,
      status: DemoSiteStatus.REVIEW_REQUIRED,
      content: content as unknown as object,
      designTokens: tokens as unknown as object,
      createdBy: 'demo-generation',
    },
  });

  await prisma.lead.update({ where: { id: lead.id }, data: { status: LeadStatus.DEMO_REVIEW } });
  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: 'demo_generated',
      description: `demo criada (${template}) slug=${slug}`,
      isAutomated: true,
    },
  });

  if (env.AUTONOMOUS_MODE) {
    await enqueue(
      QUEUE_NAMES.DEMO_PUBLICATION,
      'publish',
      { demoSiteId: demo.id, leadId: lead.id, correlationId: leadId },
      { jobId: `publish-${demo.id}` },
    );
  }

  log.info({ demoSiteId: demo.id, slug, template, autonomous: env.AUTONOMOUS_MODE }, 'demo gerada');
  return { demoSiteId: demo.id, slug, template };
}
