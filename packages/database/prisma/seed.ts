import { prisma } from '../src/client.js';
import { UserRole, SuppressionReason } from '../src/generated/client/index.js';
import { hashPassword } from '@informatizou/auth';
import { createLogger } from '@informatizou/logging';
import { normalizeName, toE164, classifyEmail, EmailKind } from '@informatizou/shared';
import { FAKE_BUSINESSES, type FakeScenarioMeta } from '@informatizou/search-providers';
import { seedOwnerAdmin } from './owner-admin.js';

const log = createLogger({ name: 'seed' });

/**
 * ⚠️ CREDENCIAIS DE DESENVOLVIMENTO — INSEGURAS.
 * Nunca usar em produção. Servem apenas para desenvolvimento local (spec §50).
 */
const DEV_PASSWORD = 'informatizou-dev-2026';

const DEV_USERS = [
  { email: 'admin@informatizou.com.br', name: 'Administrador (DEV)', role: UserRole.ADMIN },
  { email: 'manager@informatizou.com.br', name: 'Gerente (DEV)', role: UserRole.MANAGER },
  { email: 'sales@informatizou.com.br', name: 'Vendedor (DEV)', role: UserRole.SALES },
  { email: 'reviewer@informatizou.com.br', name: 'Revisor (DEV)', role: UserRole.REVIEWER },
] as const;

async function seedUsers(): Promise<void> {
  const passwordHash = await hashPassword(DEV_PASSWORD);
  for (const u of DEV_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, isActive: true },
      create: { email: u.email, name: u.name, role: u.role, passwordHash },
    });
  }
  log.info({ count: DEV_USERS.length }, 'usuários de desenvolvimento criados/atualizados');
}

async function seedPlans(): Promise<void> {
  const plans = [
    {
      key: 'Implantação de Site',
      type: 'ONE_TIME' as const,
      description: 'Criação do site, domínio, formulário, WhatsApp, mapa, SEO básico e configuração inicial.',
      features: ['Criação do site', 'Domínio', 'Formulário', 'WhatsApp', 'Mapa', 'SEO básico', 'Analytics'],
      priceCents: 150000,
    },
    {
      key: 'Manutenção Essencial',
      type: 'MONTHLY' as const,
      description: 'Hospedagem, SSL, backups, pequenas alterações, monitoramento e suporte.',
      features: ['Hospedagem', 'SSL', 'Backups', 'Pequenas alterações', 'Monitoramento', 'Suporte'],
      priceCents: 9900,
    },
    {
      key: 'Manutenção Plus',
      type: 'MONTHLY' as const,
      description: 'Tudo do Essencial, com atualizações prioritárias, relatórios e segurança reforçada.',
      features: ['Tudo do Essencial', 'Atualizações prioritárias', 'Relatórios mensais', 'Segurança reforçada'],
      priceCents: 19900,
    },
  ];
  for (const p of plans) {
    const existing = await prisma.productPlan.findFirst({ where: { name: p.key } });
    if (!existing) {
      await prisma.productPlan.create({
        data: {
          name: p.key,
          type: p.type,
          description: p.description,
          features: p.features,
          priceCents: p.priceCents,
        },
      });
    }
  }
  log.info({ count: plans.length }, 'planos de exemplo criados/verificados');
}

async function seedCampaign(): Promise<string> {
  const existing = await prisma.searchCampaign.findFirst({
    where: { name: 'Padarias sem site em Ribeirão Preto (DEV)' },
  });
  if (existing) return existing.id;

  const campaign = await prisma.searchCampaign.create({
    data: {
      name: 'Padarias sem site em Ribeirão Preto (DEV)',
      segment: 'padarias',
      location: 'Ribeirão Preto, SP',
      city: 'Ribeirão Preto',
      state: 'SP',
      country: 'BR',
      radiusKm: 30,
      resultLimit: 300,
      minimumRating: 4.2,
      minimumReviewCount: 30,
      minimumScoreForDemo: 80,
      maximumDemos: 25,
      provider: 'fake',
      createdBy: 'seed',
    },
  });
  log.info({ campaignId: campaign.id }, 'campanha de exemplo criada');
  return campaign.id;
}

async function seedBusinesses(campaignId: string): Promise<void> {
  let created = 0;
  for (const b of FAKE_BUSINESSES) {
    const meta = b.rawData as FakeScenarioMeta;
    const phoneParsed = b.phone ? toE164(b.phone) : null;

    const business = await prisma.business.upsert({
      where: { source_externalId: { source: b.source, externalId: b.externalId } },
      update: {
        name: b.name,
        normalizedName: normalizeName(b.name),
        rating: b.rating ?? null,
        reviewCount: b.reviewCount ?? null,
        website: b.website ?? null,
        campaignId,
      },
      create: {
        externalId: b.externalId,
        source: b.source,
        name: b.name,
        normalizedName: normalizeName(b.name),
        category: b.category ?? null,
        categories: b.categories,
        address: b.address ?? null,
        neighborhood: b.neighborhood ?? null,
        city: b.city ?? null,
        state: b.state ?? null,
        postalCode: b.postalCode ?? null,
        country: b.country ?? 'BR',
        latitude: b.latitude ?? null,
        longitude: b.longitude ?? null,
        phone: b.phone ?? null,
        phoneE164: phoneParsed?.e164 ?? null,
        website: b.website ?? null,
        rating: b.rating ?? null,
        reviewCount: b.reviewCount ?? null,
        rawData: b.rawData as object,
        campaignId,
        createdBy: 'seed',
      },
    });
    created += 1;

    // Contatos (idempotente: recria a partir dos dados fake).
    await prisma.businessContact.deleteMany({ where: { businessId: business.id } });
    const contacts: Array<{
      type: string;
      value: string;
      valueNormalized: string | null;
      kind: string | null;
      isPrimary: boolean;
      source: string;
    }> = [];

    if (b.phone && phoneParsed?.e164) {
      contacts.push({
        type: 'PHONE',
        value: b.phone,
        valueNormalized: phoneParsed.e164,
        kind: phoneParsed.isMobile === true ? 'MOBILE' : phoneParsed.isMobile === false ? 'LANDLINE' : null,
        isPrimary: true,
        source: 'fake',
      });
    }
    if (b.email) {
      const cls = classifyEmail(b.email);
      contacts.push({
        type: 'EMAIL',
        value: b.email,
        valueNormalized: cls.normalized ?? b.email.toLowerCase(),
        kind: cls.kind,
        isPrimary: cls.kind === EmailKind.BUSINESS,
        source: 'fake',
      });
    }
    if (contacts.length > 0) {
      await prisma.businessContact.createMany({
        data: contacts.map((c) => ({ ...c, businessId: business.id })),
      });
    }

    // Registro de proveniência (spec §11).
    await prisma.businessSourceRecord.deleteMany({ where: { businessId: business.id } });
    await prisma.businessSourceRecord.create({
      data: {
        businessId: business.id,
        source: b.source,
        sourceUrl: b.sourceUrl ?? null,
        externalId: b.externalId,
        rawData: b.rawData as object,
      },
    });

    // Opt-out → lista de supressão (spec §29).
    if (meta.optOut) {
      const already = await prisma.suppressionEntry.findFirst({
        where: { businessId: business.id, reason: SuppressionReason.REQUESTED },
      });
      if (!already) {
        await prisma.suppressionEntry.create({
          data: {
            businessId: business.id,
            phone: phoneParsed?.e164 ?? null,
            email: b.email ?? null,
            reason: SuppressionReason.REQUESTED,
            notes: 'Empresa fake sinalizada como opt-out no seed (§49).',
            createdBy: 'seed',
          },
        });
      }
    }
  }
  log.info({ count: created }, 'empresas fake importadas (§49)');
}

async function main(): Promise<void> {
  log.warn('Executando seed com CREDENCIAIS DE DESENVOLVIMENTO INSEGURAS — não usar em produção.');
  await seedUsers();
  await seedOwnerAdmin();
  await seedPlans();
  const campaignId = await seedCampaign();
  await seedBusinesses(campaignId);
  log.info('seed concluído com sucesso');
}

main()
  .catch((err) => {
    log.error({ err }, 'falha no seed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
