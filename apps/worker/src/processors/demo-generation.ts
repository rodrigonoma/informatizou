import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import type { DemoContent } from '@informatizou/demo-templates';
import { buildDemoContent, selectTemplate, designTokensFor } from '@informatizou/demo-templates';
import { slugify } from '@informatizou/shared';
import { enqueue, QUEUE_NAMES } from '@informatizou/queue';
import { loadEnv } from '@informatizou/config';
import {
  getAiProvider,
  getStitchProvider,
  buildStitchPrompt,
  type BusinessContext,
} from '@informatizou/providers';
import { LeadStatus, DemoSiteStatus } from '@informatizou/shared';
import { createLogger, withCorrelation, type Logger } from '@informatizou/logging';

const baseLog = createLogger({ name: 'demo-generation' });

/** Nota mínima da revisão de IA para aceitar o conteúdo gerado (spec §15). */
const AI_MIN_QUALITY = 60;

/**
 * Enriquece o conteúdo determinístico com IA quando configurada (spec §15).
 * Só substitui os campos textuais; contato/localização/galeria continuam sendo
 * os dados verificados. Passa por uma revisão anti-invenção: se houver suspeita
 * de fabricação ou nota baixa, descarta a IA e mantém o determinístico.
 * Nunca lança — qualquer falha cai no fallback determinístico.
 */
async function enrichContentWithAi(
  base: DemoContent,
  business: BusinessContext,
  template: string,
  env: ReturnType<typeof loadEnv>,
  log: Logger,
): Promise<{ content: DemoContent; aiUsed: boolean; note?: string }> {
  if (env.AI_PROVIDER !== 'anthropic' || !env.ANTHROPIC_API_KEY) {
    return { content: base, aiUsed: false };
  }
  try {
    const ai = getAiProvider({
      AI_PROVIDER: env.AI_PROVIDER,
      ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
      ANTHROPIC_MODEL: env.ANTHROPIC_MODEL,
    });
    const generated = await ai.generateWebsiteContent({ business, template });
    const review = await ai.reviewGeneratedContent({ content: generated, business });

    if (review.fabricationSuspected || review.qualityScore < AI_MIN_QUALITY) {
      log.warn(
        { qualityScore: review.qualityScore, fabricationSuspected: review.fabricationSuspected },
        'conteúdo de IA reprovado na revisão §15 — usando fallback determinístico',
      );
      return {
        content: base,
        aiUsed: false,
        note: `IA reprovada (nota ${review.qualityScore}, fabricação=${review.fabricationSuspected})`,
      };
    }

    const merged: DemoContent = {
      ...base,
      title: generated.title || base.title,
      subtitle: generated.subtitle || base.subtitle,
      intro: generated.intro || base.intro,
      about: generated.about || base.about,
      sections: generated.sections.length ? generated.sections : base.sections,
      productsOrServices: generated.productsOrServices,
      differentials: generated.differentials.length ? generated.differentials : base.differentials,
      callToAction: generated.callToAction || base.callToAction,
      seoTitle: generated.seoTitle || base.seoTitle,
      seoDescription: generated.seoDescription || base.seoDescription,
    };
    log.info({ qualityScore: review.qualityScore }, 'conteúdo enriquecido por IA (aprovado §15)');
    return { content: merged, aiUsed: true, note: `IA aprovada (nota ${review.qualityScore})` };
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'falha na geração por IA — usando fallback determinístico');
    return { content: base, aiUsed: false, note: 'IA indisponível (fallback determinístico)' };
  }
}

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

  const whatsapp = whatsappContact?.valueNormalized ?? undefined;
  const email = emailContact?.value ?? undefined;
  const instagramUrl = instagram?.url ?? undefined;

  const baseContent = buildDemoContent({
    name: b.name,
    category: b.category,
    city: b.city,
    neighborhood: b.neighborhood,
    address: b.address,
    phone: b.phone,
    whatsapp,
    email,
    instagram: instagramUrl,
    rating: b.rating,
    reviewCount: b.reviewCount,
    photoUrls: [],
  });

  const template = selectTemplate(b.category);

  // Enriquecimento por IA (spec §15), com fallback determinístico e revisão anti-invenção.
  const aiContext: BusinessContext = {
    businessId: b.id,
    name: b.name,
    category: b.category ?? undefined,
    city: b.city ?? undefined,
    state: b.state ?? undefined,
    neighborhood: b.neighborhood ?? undefined,
    address: b.address ?? undefined,
    phone: b.phone ?? undefined,
    whatsapp,
    email,
    instagram: instagramUrl,
    rating: b.rating ?? undefined,
    reviewCount: b.reviewCount ?? undefined,
    language: 'pt-BR',
  };
  // Motor da demo: Stitch (layout premium) para leads de alto potencial; senão template.
  const highPotential =
    (b.reviewCount ?? 0) >= env.STITCH_MIN_REVIEWS && (b.rating ?? 0) >= env.STITCH_MIN_RATING;
  const stitch = getStitchProvider({
    ENABLE_STITCH: env.ENABLE_STITCH,
    GOOGLE_STITCH_SA_B64: env.GOOGLE_STITCH_SA_B64,
    STITCH_MODEL: env.STITCH_MODEL,
  });

  let engine = 'template';
  let stitchHtml: string | null = null;
  let content: DemoContent = baseContent;
  let creator = 'demo-generation';

  if (highPotential && stitch.canGenerate()) {
    try {
      const prompt = buildStitchPrompt({
        name: b.name,
        category: b.category ?? undefined,
        city: b.city ?? undefined,
        state: b.state ?? undefined,
        neighborhood: b.neighborhood ?? undefined,
        phone: b.phone ?? undefined,
        whatsapp,
      });
      const r = await stitch.generate({ prompt, projectTitle: b.name });
      stitchHtml = r.html;
      engine = 'stitch';
      creator = 'demo-generation+stitch';
      log.info({ screenId: r.screenId, bytes: r.html.length }, 'demo gerada pelo Stitch (alto potencial)');
    } catch (err) {
      log.warn({ err: (err as Error).message }, 'Stitch falhou — usando template determinístico');
    }
  }

  if (engine === 'template') {
    const enriched = await enrichContentWithAi(baseContent, aiContext, template, env, log);
    content = enriched.content;
    if (enriched.aiUsed) creator = 'demo-generation+ai';
  }

  const tokens = designTokensFor(template);
  const slug = await uniqueSlug(b.name, b.city);

  const demo = await prisma.demoSite.create({
    data: {
      leadId: lead.id,
      slug,
      template,
      engine,
      status: DemoSiteStatus.REVIEW_REQUIRED,
      content: content as unknown as object,
      designTokens: tokens as unknown as object,
      ...(stitchHtml ? { html: stitchHtml } : {}),
      createdBy: creator,
    },
  });

  await prisma.lead.update({ where: { id: lead.id }, data: { status: LeadStatus.DEMO_REVIEW } });
  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: 'demo_generated',
      description: `demo criada (motor=${engine}, ${template}) slug=${slug}`,
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

  log.info(
    { demoSiteId: demo.id, slug, template, engine, autonomous: env.AUTONOMOUS_MODE },
    'demo gerada',
  );
  return { demoSiteId: demo.id, slug, template, engine };
}
