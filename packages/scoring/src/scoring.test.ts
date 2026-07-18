import { describe, expect, it } from 'vitest';
import { computeScore } from './scoring.js';
import { WebsiteStatus, ScoreCategory } from '@informatizou/shared';

describe('computeScore (§13)', () => {
  it('empresa sem site com muitas avaliações e boa nota → forte/excelente', () => {
    const r = computeScore({
      websiteStatus: WebsiteStatus.NO_WEBSITE,
      reviewCount: 780,
      rating: 4.9,
      hasBusinessPhone: true,
      hasBusinessEmail: true,
      hasInstagram: true,
      instagramActive: true,
      hasPhotos: true,
      addressConfirmed: true,
      activeBusiness: true,
      hasValidContact: true,
    });
    // 25 +15 +12 +5 +7 +5 +5 +4 +3 +5 = 86 → STRONG
    expect(r.total).toBe(86);
    expect(r.category).toBe(ScoreCategory.STRONG);
  });

  it('site institucional válido penaliza fortemente', () => {
    const r = computeScore({
      websiteStatus: WebsiteStatus.VALID_INSTITUTIONAL_WEBSITE,
      reviewCount: 60,
      rating: 4.3,
    });
    // -40 +7 +6 = -27 → clamp 0 → WEAK
    expect(r.total).toBe(0);
    expect(r.category).toBe(ScoreCategory.WEAK);
  });

  it('empresa fechada é rejeitada', () => {
    const r = computeScore({ websiteStatus: WebsiteStatus.NO_WEBSITE, closed: true });
    expect(r.category).toBe(ScoreCategory.REJECTED);
    expect(r.items[0]!.reason).toContain('fechada');
  });

  it('opt-out e duplicidade são rejeitados', () => {
    expect(computeScore({ websiteStatus: WebsiteStatus.NO_WEBSITE, optOut: true }).category).toBe(
      ScoreCategory.REJECTED,
    );
    expect(
      computeScore({ websiteStatus: WebsiteStatus.NO_WEBSITE, confirmedDuplicate: true }).category,
    ).toBe(ScoreCategory.REJECTED);
  });

  it('aplica apenas a faixa mais alta de avaliações e de nota', () => {
    const r = computeScore({
      websiteStatus: WebsiteStatus.NO_WEBSITE,
      reviewCount: 250,
      rating: 4.8,
    });
    // 25 (noWebsite) + 12 (reviews200) + 12 (rating47) = 49
    expect(r.total).toBe(49);
    expect(r.items.filter((i) => i.rule.startsWith('reviews'))).toHaveLength(1);
    expect(r.items.filter((i) => i.rule.startsWith('rating'))).toHaveLength(1);
  });

  it('penaliza sem contato válido e pouca informação', () => {
    const r = computeScore({
      websiteStatus: WebsiteStatus.NO_WEBSITE,
      hasValidContact: false,
      littlePublicInfo: true,
    });
    // 25 -20 -10 = -5 → 0
    expect(r.total).toBe(0);
  });

  it('só marketplace pontua marketplaceOnly', () => {
    const r = computeScore({ websiteStatus: WebsiteStatus.MARKETPLACE_ONLY, rating: 4.3 });
    expect(r.items.some((i) => i.rule === 'marketplaceOnly')).toBe(true);
  });
});
