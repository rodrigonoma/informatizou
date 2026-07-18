import { WebsiteStatus, ScoreCategory } from '@informatizou/shared';
import type { ScoreResult, ScoreItem } from '@informatizou/shared';

/** Pesos configuráveis do score comercial (spec §13). */
export interface ScoreRules {
  noWebsite: number;
  brokenWebsite: number;
  outdatedWebsite: number;
  socialOnly: number;
  marketplaceOnly: number;
  reviews500: number;
  reviews200: number;
  reviews100: number;
  reviews50: number;
  rating47: number;
  rating45: number;
  rating42: number;
  businessPhone: number;
  businessEmail: number;
  instagram: number;
  instagramActive: number;
  photos: number;
  addressConfirmed: number;
  activeBusiness: number;
  noValidContact: number;
  inconsistentData: number;
  littlePublicInfo: number;
  recentlyContacted: number;
  validInstitutionalWebsite: number;
}

export const DEFAULT_RULES: ScoreRules = {
  noWebsite: 25,
  brokenWebsite: 18,
  outdatedWebsite: 12,
  socialOnly: 15,
  marketplaceOnly: 13,
  reviews500: 15,
  reviews200: 12,
  reviews100: 10,
  reviews50: 7,
  rating47: 12,
  rating45: 10,
  rating42: 6,
  businessPhone: 5,
  businessEmail: 7,
  instagram: 5,
  instagramActive: 5,
  photos: 4,
  addressConfirmed: 3,
  activeBusiness: 5,
  noValidContact: -20,
  inconsistentData: -15,
  littlePublicInfo: -10,
  recentlyContacted: -20,
  validInstitutionalWebsite: -40,
};

export interface ScoreInput {
  websiteStatus: WebsiteStatus;
  reviewCount?: number;
  rating?: number;
  hasBusinessPhone?: boolean;
  hasBusinessEmail?: boolean;
  hasInstagram?: boolean;
  instagramActive?: boolean;
  hasPhotos?: boolean;
  addressConfirmed?: boolean;
  activeBusiness?: boolean;
  hasValidContact?: boolean;
  inconsistentData?: boolean;
  littlePublicInfo?: boolean;
  recentlyContacted?: boolean;
  // Condições de rejeição (§13).
  closed?: boolean;
  confirmedDuplicate?: boolean;
  optOut?: boolean;
}

function categorize(total: number): ScoreCategory {
  if (total >= 90) return ScoreCategory.EXCELLENT;
  if (total >= 75) return ScoreCategory.STRONG;
  if (total >= 60) return ScoreCategory.MODERATE;
  return ScoreCategory.WEAK; // 0–59 (inclui "baixa prioridade" 0–39)
}

/** Calcula o score comercial de 0 a 100 (spec §13). Configurável por `rules`. */
export function computeScore(input: ScoreInput, rules: ScoreRules = DEFAULT_RULES): ScoreResult {
  // Rejeições absolutas.
  const rejectReason =
    input.closed
      ? 'empresa fechada'
      : input.confirmedDuplicate
        ? 'duplicidade confirmada'
        : input.optOut
          ? 'solicitou não receber contato'
          : null;
  if (rejectReason) {
    return {
      total: 0,
      category: ScoreCategory.REJECTED,
      items: [{ rule: 'reject', points: 0, reason: rejectReason }],
    };
  }

  const items: ScoreItem[] = [];
  const add = (rule: string, points: number, reason: string): void => {
    if (points !== 0) items.push({ rule, points, reason });
  };

  // Situação do site (mutuamente exclusivo).
  switch (input.websiteStatus) {
    case WebsiteStatus.NO_WEBSITE:
      add('noWebsite', rules.noWebsite, 'sem site institucional');
      break;
    case WebsiteStatus.BROKEN_WEBSITE:
      add('brokenWebsite', rules.brokenWebsite, 'site quebrado');
      break;
    case WebsiteStatus.OUTDATED_WEBSITE:
      add('outdatedWebsite', rules.outdatedWebsite, 'site muito antigo');
      break;
    case WebsiteStatus.SOCIAL_MEDIA_ONLY:
      add('socialOnly', rules.socialOnly, 'somente rede social');
      break;
    case WebsiteStatus.MARKETPLACE_ONLY:
    case WebsiteStatus.LINK_AGGREGATOR_ONLY:
      add('marketplaceOnly', rules.marketplaceOnly, 'somente marketplace/agregador');
      break;
    case WebsiteStatus.DOMAIN_PARKED:
    case WebsiteStatus.UNDER_CONSTRUCTION:
      add('brokenWebsite', rules.brokenWebsite, 'domínio estacionado/em construção');
      break;
    case WebsiteStatus.VALID_INSTITUTIONAL_WEBSITE:
      add('validInstitutionalWebsite', rules.validInstitutionalWebsite, 'site institucional válido');
      break;
    default:
      break;
  }

  // Avaliações (faixa mais alta aplicável).
  const rc = input.reviewCount ?? 0;
  if (rc >= 500) add('reviews500', rules.reviews500, 'mais de 500 avaliações');
  else if (rc >= 200) add('reviews200', rules.reviews200, 'mais de 200 avaliações');
  else if (rc >= 100) add('reviews100', rules.reviews100, 'mais de 100 avaliações');
  else if (rc >= 50) add('reviews50', rules.reviews50, 'mais de 50 avaliações');

  // Nota (faixa mais alta aplicável).
  const rating = input.rating ?? 0;
  if (rating >= 4.7) add('rating47', rules.rating47, 'nota >= 4,7');
  else if (rating >= 4.5) add('rating45', rules.rating45, 'nota >= 4,5');
  else if (rating >= 4.2) add('rating42', rules.rating42, 'nota >= 4,2');

  if (input.hasBusinessPhone) add('businessPhone', rules.businessPhone, 'possui telefone comercial');
  if (input.hasBusinessEmail) add('businessEmail', rules.businessEmail, 'possui e-mail empresarial');
  if (input.hasInstagram) add('instagram', rules.instagram, 'possui Instagram');
  if (input.instagramActive) add('instagramActive', rules.instagramActive, 'Instagram aparentemente ativo');
  if (input.hasPhotos) add('photos', rules.photos, 'possui fotos adequadas');
  if (input.addressConfirmed) add('addressConfirmed', rules.addressConfirmed, 'endereço confirmado');
  if (input.activeBusiness) add('activeBusiness', rules.activeBusiness, 'negócio aparentemente ativo');

  if (input.hasValidContact === false) add('noValidContact', rules.noValidContact, 'sem contato válido');
  if (input.inconsistentData) add('inconsistentData', rules.inconsistentData, 'dados inconsistentes');
  if (input.littlePublicInfo) add('littlePublicInfo', rules.littlePublicInfo, 'pouca informação pública');
  if (input.recentlyContacted) add('recentlyContacted', rules.recentlyContacted, 'já recebeu contato recentemente');

  const raw = items.reduce((sum, i) => sum + i.points, 0);
  const total = Math.max(0, Math.min(100, raw));

  return { total, category: categorize(total), items };
}
