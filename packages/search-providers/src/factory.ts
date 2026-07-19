import type { BusinessSearchProvider } from './types.js';
import { FakeBusinessSearchProvider } from './fake-provider.js';
import { CsvBusinessSearchProvider } from './csv-provider.js';
import { GooglePlacesBusinessSearchProvider } from './google-places-provider.js';

export class SearchProviderNotConfiguredError extends Error {
  constructor(provider: string, detail?: string) {
    super(
      `Provider de busca "${provider}" não configurado${detail ? `: ${detail}` : ''}. ` +
        `Suportados: "fake", "csv", "google_places". Apify/SerpAPI/Outscraper entram por integração.`,
    );
    this.name = 'SearchProviderNotConfiguredError';
  }
}

export interface SearchProviderConfig {
  provider: string;
  csvContent?: string;
  /** Chave da Google Places API (obrigatória para provider "google_places"). */
  googlePlacesApiKey?: string;
}

/** Seleciona o provider de busca por configuração (spec §7 — não acoplar a um só). */
export function getSearchProvider(config: SearchProviderConfig): BusinessSearchProvider {
  const key = config.provider.toLowerCase();
  switch (key) {
    case 'fake':
      return new FakeBusinessSearchProvider();
    case 'csv':
      return new CsvBusinessSearchProvider(config.csvContent ?? '');
    case 'google_places':
      if (!config.googlePlacesApiKey) {
        throw new SearchProviderNotConfiguredError(config.provider, 'GOOGLE_PLACES_API_KEY ausente');
      }
      return new GooglePlacesBusinessSearchProvider({ apiKey: config.googlePlacesApiKey });
    default:
      throw new SearchProviderNotConfiguredError(config.provider);
  }
}
