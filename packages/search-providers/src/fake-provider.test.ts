import { describe, expect, it } from 'vitest';
import type { BusinessSearchInput, NormalizedBusinessResult } from '@informatizou/shared';
import { FakeBusinessSearchProvider } from './fake-provider.js';
import { FAKE_BUSINESSES } from './fake-data.js';
import type { FakeScenarioMeta } from './types.js';

const baseInput: BusinessSearchInput = {
  segment: 'padarias',
  location: 'Ribeirão Preto, SP',
  country: 'BR',
  limit: 50,
  language: 'pt-BR',
};

describe('FakeBusinessSearchProvider', () => {
  it('retorna pelo menos 20 empresas', async () => {
    const provider = new FakeBusinessSearchProvider();
    const result = await provider.search(baseInput);
    expect(result.provider).toBe('fake');
    expect(result.results.length).toBeGreaterThanOrEqual(20);
    expect(result.totalFound).toBeGreaterThanOrEqual(20);
  });

  it('todas têm externalId único e source=fake', () => {
    const ids = new Set(FAKE_BUSINESSES.map((b) => b.externalId));
    expect(ids.size).toBe(FAKE_BUSINESSES.length);
    expect(FAKE_BUSINESSES.every((b) => b.source === 'fake')).toBe(true);
  });

  it('cobre todos os casos exigidos pela §49', () => {
    const cases = new Set(
      FAKE_BUSINESSES.map((b) => (b.rawData as FakeScenarioMeta).case),
    );
    const required = [
      'sem site',
      'site válido',
      'site quebrado',
      'site antigo',
      'só rede social',
      'só marketplace',
      'duplicidade',
      'empresa fechada',
      'muitas avaliações',
      'poucas avaliações',
      'sem telefone',
      'com e-mail',
      'com whatsapp',
      'dados conflitantes',
      'opt-out',
      'domínio estacionado',
      'em construção',
      'imagens ausentes',
      'score alto',
      'score baixo',
    ];
    for (const req of required) {
      expect(cases.has(req), `caso ausente: ${req}`).toBe(true);
    }
  });

  it('tem ao menos uma empresa sem site e uma com site válido', () => {
    const noWebsite = FAKE_BUSINESSES.filter((b) => !b.website);
    const valid = FAKE_BUSINESSES.filter(
      (b) => (b.rawData as FakeScenarioMeta).scenario === 'VALID',
    );
    expect(noWebsite.length).toBeGreaterThan(0);
    expect(valid.length).toBeGreaterThan(0);
  });

  it('respeita o limite', async () => {
    const provider = new FakeBusinessSearchProvider();
    const result = await provider.search({ ...baseInput, limit: 5 });
    expect(result.results).toHaveLength(5);
  });

  it('aplica filtro de avaliações mínimas', async () => {
    const provider = new FakeBusinessSearchProvider();
    const result = await provider.search({ ...baseInput, minimumReviewCount: 500 });
    expect(result.results.every((b: NormalizedBusinessResult) => (b.reviewCount ?? 0) >= 500)).toBe(
      true,
    );
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('getBusinessDetails retorna a empresa por externalId', async () => {
    const provider = new FakeBusinessSearchProvider();
    const details = await provider.getBusinessDetails('fake-001');
    expect(details.details.name).toBe('Padaria Pão Quente');
  });
});
