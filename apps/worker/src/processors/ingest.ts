import { prisma } from '@informatizou/database';
import {
  normalizeName,
  toE164,
  classifyEmail,
  EmailKind,
  type NormalizedBusinessResult,
} from '@informatizou/shared';

export interface PersistResult {
  businessId: string;
  hadWebsite: boolean;
}

/**
 * Persiste um resultado normalizado como Business + contatos + registro de
 * proveniência (spec §11), de forma idempotente (upsert por source+externalId).
 * Aplica opt-out à lista de supressão (§29) quando sinalizado no rawData fake.
 */
export async function persistNormalizedBusiness(
  result: NormalizedBusinessResult,
  opts: { campaignId?: string; createdBy?: string } = {},
): Promise<PersistResult> {
  const phoneParsed = result.phone ? toE164(result.phone) : null;

  const business = await prisma.business.upsert({
    where: { source_externalId: { source: result.source, externalId: result.externalId } },
    update: {
      name: result.name,
      normalizedName: normalizeName(result.name),
      rating: result.rating ?? null,
      reviewCount: result.reviewCount ?? null,
      website: result.website ?? null,
      phone: result.phone ?? null,
      phoneE164: phoneParsed?.e164 ?? null,
      campaignId: opts.campaignId ?? undefined,
    },
    create: {
      externalId: result.externalId,
      source: result.source,
      name: result.name,
      normalizedName: normalizeName(result.name),
      category: result.category ?? null,
      categories: result.categories,
      address: result.address ?? null,
      neighborhood: result.neighborhood ?? null,
      city: result.city ?? null,
      state: result.state ?? null,
      postalCode: result.postalCode ?? null,
      country: result.country ?? 'BR',
      latitude: result.latitude ?? null,
      longitude: result.longitude ?? null,
      phone: result.phone ?? null,
      phoneE164: phoneParsed?.e164 ?? null,
      website: result.website ?? null,
      rating: result.rating ?? null,
      reviewCount: result.reviewCount ?? null,
      rawData: result.rawData as object,
      campaignId: opts.campaignId ?? null,
      createdBy: opts.createdBy ?? null,
    },
  });

  // Contatos (idempotente).
  await prisma.businessContact.deleteMany({ where: { businessId: business.id } });
  const contacts: Array<{
    businessId: string;
    type: string;
    value: string;
    valueNormalized: string | null;
    kind: string | null;
    isPrimary: boolean;
    source: string;
  }> = [];
  if (result.phone && phoneParsed?.e164) {
    contacts.push({
      businessId: business.id,
      type: 'PHONE',
      value: result.phone,
      valueNormalized: phoneParsed.e164,
      kind:
        phoneParsed.isMobile === true
          ? 'MOBILE'
          : phoneParsed.isMobile === false
            ? 'LANDLINE'
            : null,
      isPrimary: true,
      source: result.source,
    });
  }
  if (result.email) {
    const cls = classifyEmail(result.email);
    contacts.push({
      businessId: business.id,
      type: 'EMAIL',
      value: result.email,
      valueNormalized: cls.normalized ?? result.email.toLowerCase(),
      kind: cls.kind,
      isPrimary: cls.kind === EmailKind.BUSINESS,
      source: result.source,
    });
  }
  if (contacts.length > 0) {
    await prisma.businessContact.createMany({ data: contacts });
  }

  // Redes sociais.
  await prisma.businessSocialProfile.deleteMany({ where: { businessId: business.id } });
  const socials: Array<{ businessId: string; network: string; url: string }> = [];
  if (result.instagram) {
    socials.push({ businessId: business.id, network: 'INSTAGRAM', url: result.instagram });
  }
  if (result.facebook) {
    socials.push({ businessId: business.id, network: 'FACEBOOK', url: result.facebook });
  }
  if (socials.length > 0) {
    await prisma.businessSocialProfile.createMany({ data: socials });
  }

  // Proveniência (§11).
  await prisma.businessSourceRecord.deleteMany({ where: { businessId: business.id } });
  await prisma.businessSourceRecord.create({
    data: {
      businessId: business.id,
      source: result.source,
      sourceUrl: result.sourceUrl ?? null,
      externalId: result.externalId,
      rawData: result.rawData as object,
    },
  });

  return { businessId: business.id, hadWebsite: Boolean(result.website) };
}
