import { describe, expect, it } from 'vitest';
import { analyzeDuplicate, scorePair, needsReview } from './dedup.js';
import { extractDomain, stringSimilarity, haversineKm } from './similarity.js';
import type { DedupRecord } from './dedup.js';

const padaria: DedupRecord = {
  id: '1',
  externalId: 'fake-001',
  source: 'fake',
  name: 'Padaria Pão Quente',
  phoneE164: '+551636101234',
  latitude: -21.1775,
  longitude: -47.8103,
  address: 'Rua Padre Euclides, 123 - Centro',
};

describe('similarity helpers', () => {
  it('stringSimilarity é 1 para iguais e menor para diferentes', () => {
    expect(stringSimilarity('abc', 'abc')).toBe(1);
    expect(stringSimilarity('padaria', 'padoria')).toBeGreaterThan(0.8);
    expect(stringSimilarity('padaria', 'mecanica')).toBeLessThan(0.5);
  });

  it('extractDomain normaliza www e protocolo', () => {
    expect(extractDomain('https://www.exemplo.com.br/menu')).toBe('exemplo.com.br');
    expect(extractDomain('exemplo.com.br')).toBe('exemplo.com.br');
    expect(extractDomain(null)).toBeNull();
  });

  it('haversineKm ~0 para o mesmo ponto', () => {
    expect(haversineKm(-21.17, -47.81, -21.17, -47.81)).toBeLessThan(0.001);
  });
});

describe('scorePair', () => {
  it('external id igual → confiança 1', () => {
    const r = scorePair(padaria, { ...padaria, id: '2' });
    expect(r.confidence).toBe(1);
    expect(r.reasons).toContain('external_id');
  });

  it('mesmo telefone e nome parecido → alta confiança', () => {
    const dup: DedupRecord = {
      id: '2',
      externalId: 'other-007',
      source: 'other',
      name: 'Padaria Pao Quente',
      phoneE164: '+551636101234',
      latitude: -21.1775,
      longitude: -47.8103,
    };
    const r = scorePair(padaria, dup);
    expect(r.confidence).toBeGreaterThanOrEqual(0.85);
    expect(r.reasons).toEqual(expect.arrayContaining(['phone', 'name']));
  });

  it('empresas distintas → baixa confiança', () => {
    const other: DedupRecord = {
      id: '3',
      externalId: 'x',
      source: 'fake',
      name: 'Oficina Turbo',
      phoneE164: '+551632223333',
      latitude: -21.2,
      longitude: -47.9,
    };
    expect(scorePair(padaria, other).confidence).toBeLessThan(0.6);
  });
});

describe('analyzeDuplicate', () => {
  const existing: DedupRecord[] = [padaria];

  it('detecta duplicata pelo external id', () => {
    const analysis = analyzeDuplicate(
      { ...padaria, id: undefined },
      existing,
    );
    expect(analysis.isDuplicate).toBe(true);
    expect(analysis.matchedBusinessId).toBe('1');
  });

  it('não marca duplicata para empresa nova', () => {
    const analysis = analyzeDuplicate(
      {
        externalId: 'novo',
        source: 'fake',
        name: 'Sorveteria Gelato',
        phoneE164: '+551636187575',
        latitude: -21.3,
        longitude: -47.7,
      },
      existing,
    );
    expect(analysis.isDuplicate).toBe(false);
  });

  it('casos de confiança intermediária vão para revisão (§9)', () => {
    const partial: DedupRecord = {
      externalId: 'p',
      source: 'other',
      name: 'Padaria Pao Quente',
      latitude: -21.1776,
      longitude: -47.8104,
      address: 'Rua Padre Euclides, 123',
    };
    const analysis = analyzeDuplicate(partial, existing);
    // Nome + coords próximas + endereço, sem telefone/domínio → zona de revisão.
    expect(analysis.confidence).toBeGreaterThanOrEqual(0.6);
    expect(needsReview(analysis) || analysis.isDuplicate).toBe(true);
  });
});
