import { describe, expect, it, vi } from 'vitest';
import {
  GooglePlacesBusinessSearchProvider,
  normalizeGooglePlace,
  type FetchLike,
} from './google-places-provider.js';

const PLACE_A = {
  id: 'places/AAA',
  displayName: { text: 'Padaria Central' },
  formattedAddress: 'Rua X, 100, Centro, Ribeirão Preto - SP, 14000-000, Brasil',
  addressComponents: [
    { longText: 'Centro', types: ['sublocality_level_1', 'sublocality'] },
    { longText: 'Ribeirão Preto', types: ['administrative_area_level_2'] },
    { longText: 'São Paulo', shortText: 'SP', types: ['administrative_area_level_1'] },
    { longText: '14000-000', types: ['postal_code'] },
    { longText: 'Brasil', types: ['country'] },
  ],
  location: { latitude: -21.17, longitude: -47.81 },
  rating: 4.6,
  userRatingCount: 210,
  nationalPhoneNumber: '(16) 3610-1000',
  websiteUri: 'https://padariacentral.com.br',
  googleMapsUri: 'https://maps.google.com/?cid=1',
  types: ['bakery', 'store'],
  primaryType: 'bakery',
  businessStatus: 'OPERATIONAL',
};

const PLACE_CLOSED = {
  id: 'places/BBB',
  displayName: { text: 'Fechou Ltda' },
  rating: 4.9,
  userRatingCount: 500,
  businessStatus: 'CLOSED_PERMANENTLY',
  types: ['store'],
};

const PLACE_LOW = {
  id: 'places/CCC',
  displayName: { text: 'Nota Baixa' },
  rating: 3.1,
  userRatingCount: 5,
  businessStatus: 'OPERATIONAL',
  types: ['store'],
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  };
}

const baseInput = {
  segment: 'padaria',
  location: 'Ribeirão Preto, SP',
  city: 'Ribeirão Preto',
  state: 'SP',
  country: 'BR',
  limit: 20,
  language: 'pt-BR',
};

describe('normalizeGooglePlace', () => {
  it('mapeia endereço, contato e metadados corretamente', () => {
    const n = normalizeGooglePlace(PLACE_A);
    expect(n.externalId).toBe('places/AAA');
    expect(n.source).toBe('google_places');
    expect(n.name).toBe('Padaria Central');
    expect(n.city).toBe('Ribeirão Preto');
    expect(n.state).toBe('São Paulo');
    expect(n.neighborhood).toBe('Centro');
    expect(n.postalCode).toBe('14000-000');
    expect(n.phone).toBe('(16) 3610-1000');
    expect(n.website).toBe('https://padariacentral.com.br');
    expect(n.rating).toBe(4.6);
    expect(n.reviewCount).toBe(210);
    expect(n.latitude).toBe(-21.17);
    expect(n.category).toBe('bakery');
    expect(n.categories).toEqual(['bakery', 'store']);
    expect(n.photoUrls).toEqual([]);
  });
});

describe('GooglePlacesBusinessSearchProvider', () => {
  it('exige apiKey', () => {
    expect(() => new GooglePlacesBusinessSearchProvider({ apiKey: '' })).toThrow(/GOOGLE_PLACES_API_KEY/);
  });

  it('busca, descarta permanentemente fechados e aplica filtros', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ places: [PLACE_A, PLACE_CLOSED, PLACE_LOW] }),
    ) as unknown as FetchLike;

    const provider = new GooglePlacesBusinessSearchProvider({ apiKey: 'k', fetchImpl });
    const result = await provider.search({ ...baseInput, minimumRating: 4, minimumReviewCount: 50 });

    expect(result.provider).toBe('google_places');
    expect(result.results).toHaveLength(1);
    expect(result.results[0]!.externalId).toBe('places/AAA');
    expect(result.requestCount).toBe(1);
    expect(result.estimatedCostCents).toBeGreaterThan(0);
  });

  it('envia FieldMask e chave nos headers', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ places: [PLACE_A] })) as unknown as FetchLike;
    const provider = new GooglePlacesBusinessSearchProvider({ apiKey: 'secret', fetchImpl });
    await provider.search(baseInput);

    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(init.method).toBe('POST');
    expect(init.headers['X-Goog-Api-Key']).toBe('secret');
    expect(init.headers['X-Goog-FieldMask']).toContain('places.id');
    const body = JSON.parse(init.body);
    expect(body.textQuery).toContain('padaria');
    expect(body.regionCode).toBe('BR');
  });

  it('pagina até o limite via nextPageToken', async () => {
    const page1 = jsonResponse({ places: [PLACE_A], nextPageToken: 'tok' });
    const page2 = jsonResponse({ places: [{ ...PLACE_A, id: 'places/DDD' }] });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2) as unknown as FetchLike;

    const provider = new GooglePlacesBusinessSearchProvider({ apiKey: 'k', fetchImpl });
    const result = await provider.search({ ...baseInput, limit: 40 });

    expect(result.results.map((r) => r.externalId)).toEqual(['places/AAA', 'places/DDD']);
    expect(result.requestCount).toBe(2);
  });

  it('lança erro em HTTP não-ok', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ error: 'bad' }, false, 403),
    ) as unknown as FetchLike;
    const provider = new GooglePlacesBusinessSearchProvider({ apiKey: 'k', fetchImpl });
    await expect(provider.search(baseInput)).rejects.toThrow(/HTTP 403/);
  });
});
