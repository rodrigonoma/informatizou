import type {
  BusinessSearchInput,
  BusinessSearchResult,
  BusinessDetailsResult,
  NormalizedBusinessResult,
} from '@informatizou/shared';
import type { BusinessSearchProvider } from './types.js';

/**
 * Fetcher injetável (para testes). Compatível com `globalThis.fetch`.
 */
export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}>;

export interface GooglePlacesProviderOptions {
  apiKey: string;
  /** Implementação de fetch (padrão: globalThis.fetch). */
  fetchImpl?: FetchLike;
  /** Base da Places API (New). Sobrescrevível em testes. */
  baseUrl?: string;
  /** Limite de páginas por busca (bound de custo). Padrão 5 (até 100 resultados). */
  maxPages?: number;
  /** Timeout por requisição (ms). Padrão 15000. */
  timeoutMs?: number;
}

/** Custo estimado por requisição de Text Search (New), em centavos de USD. */
const TEXT_SEARCH_COST_CENTS = 3.5; // ~US$35/1000 (SKU Text Search Advanced/Preferred).
/** Custo estimado por Place Details (Advanced), em centavos de USD. */
const PLACE_DETAILS_COST_CENTS = 2.0;

/** Campos pedidos à Places API (New) — mantém o custo previsível pela FieldMask. */
const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.addressComponents',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.types',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.businessStatus',
  'places.regularOpeningHours',
  'nextPageToken',
].join(',');

const DETAILS_FIELD_MASK = SEARCH_FIELD_MASK.split(',')
  .filter((f) => f.startsWith('places.'))
  .map((f) => f.replace(/^places\./, ''))
  .join(',');

interface GooglePlace {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  businessStatus?: string;
  regularOpeningHours?: unknown;
}

interface SearchTextResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

function componentByType(
  components: GooglePlace['addressComponents'],
  type: string,
): string | undefined {
  const found = components?.find((c) => c.types?.includes(type));
  return found?.longText ?? found?.shortText ?? undefined;
}

/** Normaliza um `Place` da API (New) para o formato interno (spec §7). */
export function normalizeGooglePlace(place: GooglePlace): NormalizedBusinessResult {
  const comps = place.addressComponents;
  // No Brasil: cidade = administrative_area_level_2; estado = _level_1; bairro = sublocality*.
  const city =
    componentByType(comps, 'administrative_area_level_2') ??
    componentByType(comps, 'locality');
  const state = componentByType(comps, 'administrative_area_level_1');
  const neighborhood =
    componentByType(comps, 'sublocality_level_1') ??
    componentByType(comps, 'sublocality');
  const postalCode = componentByType(comps, 'postal_code');
  const country = componentByType(comps, 'country');

  return {
    externalId: place.id ?? '',
    source: 'google_places',
    name: place.displayName?.text ?? '(sem nome)',
    category: place.primaryType ?? place.types?.[0],
    categories: place.types ?? [],
    address: place.formattedAddress,
    neighborhood,
    city,
    state,
    postalCode,
    country,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber,
    website: place.websiteUri,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    openingHours: place.regularOpeningHours,
    photoUrls: [],
    email: undefined,
    instagram: undefined,
    facebook: undefined,
    sourceUrl: place.googleMapsUri,
    rawData: place,
  };
}

/**
 * Provider Google Places API (New) — spec §7. Não acopla o sistema a um único
 * fornecedor: implementa a mesma interface do fake/csv. Requer apenas a chave
 * `GOOGLE_PLACES_API_KEY` para operar. Custo é estimado e reportado por busca.
 */
export class GooglePlacesBusinessSearchProvider implements BusinessSearchProvider {
  public readonly name = 'google_places';
  private readonly apiKey: string;
  private readonly fetchImpl: FetchLike;
  private readonly baseUrl: string;
  private readonly maxPages: number;
  private readonly timeoutMs: number;

  constructor(options: GooglePlacesProviderOptions) {
    if (!options.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY ausente — provider google_places não configurado');
    }
    this.apiKey = options.apiKey;
    const fallbackFetch = (globalThis as { fetch?: FetchLike }).fetch;
    const impl = options.fetchImpl ?? fallbackFetch;
    if (!impl) throw new Error('fetch indisponível: forneça fetchImpl');
    this.fetchImpl = impl;
    this.baseUrl = options.baseUrl ?? 'https://places.googleapis.com/v1';
    this.maxPages = Math.max(1, options.maxPages ?? 5);
    this.timeoutMs = options.timeoutMs ?? 15000;
  }

  private buildTextQuery(input: BusinessSearchInput): string {
    const place = input.city
      ? `${input.city}${input.state ? `, ${input.state}` : ''}`
      : input.location;
    return `${input.segment} em ${place}`.trim();
  }

  private async postSearchText(
    input: BusinessSearchInput,
    pageToken?: string,
  ): Promise<SearchTextResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const body: Record<string, unknown> = {
        textQuery: this.buildTextQuery(input),
        languageCode: input.language ?? 'pt-BR',
        pageSize: 20,
      };
      if (input.country?.toUpperCase() === 'BR') body.regionCode = 'BR';
      if (input.minimumRating != null) body.minRating = input.minimumRating;
      if (pageToken) body.pageToken = pageToken;

      const res = await this.fetchImpl(`${this.baseUrl}/places:searchText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': SEARCH_FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Google Places searchText falhou (HTTP ${res.status}): ${text.slice(0, 300)}`);
      }
      return (await res.json()) as SearchTextResponse;
    } finally {
      clearTimeout(timer);
    }
  }

  async search(input: BusinessSearchInput): Promise<BusinessSearchResult> {
    const collected: NormalizedBusinessResult[] = [];
    let pageToken: string | undefined;
    let requestCount = 0;

    for (let page = 0; page < this.maxPages; page++) {
      const resp = await this.postSearchText(input, pageToken);
      requestCount += 1;
      const places = resp.places ?? [];
      for (const place of places) {
        // Não ingerir estabelecimentos permanentemente fechados (não vendáveis).
        if (place.businessStatus === 'CLOSED_PERMANENTLY') continue;
        collected.push(normalizeGooglePlace(place));
      }
      pageToken = resp.nextPageToken;
      if (!pageToken || collected.length >= input.limit) break;
    }

    // Filtros mínimos (defensivo — a API já aplica minRating quando enviado).
    const filtered = collected.filter((b) => {
      if (input.minimumRating != null && (b.rating ?? 0) < input.minimumRating) return false;
      if (input.minimumReviewCount != null && (b.reviewCount ?? 0) < input.minimumReviewCount) {
        return false;
      }
      return true;
    });

    const results = filtered.slice(0, input.limit);

    return {
      provider: this.name,
      query: input,
      results,
      totalFound: filtered.length,
      requestCount,
      estimatedCostCents: Math.round(requestCount * TEXT_SEARCH_COST_CENTS),
    };
  }

  async getBusinessDetails(externalId: string): Promise<BusinessDetailsResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(
        `${this.baseUrl}/places/${encodeURIComponent(externalId)}`,
        {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': DETAILS_FIELD_MASK,
          },
          signal: controller.signal,
        },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Google Places details falhou (HTTP ${res.status}): ${text.slice(0, 300)}`);
      }
      const place = (await res.json()) as GooglePlace;
      return { externalId, details: normalizeGooglePlace(place) };
    } finally {
      clearTimeout(timer);
    }
  }

  /** Custo estimado (centavos) de uma consulta de detalhes — usado por chamadores. */
  static readonly detailsCostCents = PLACE_DETAILS_COST_CENTS;
}
