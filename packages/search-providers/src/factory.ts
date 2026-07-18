import type { BusinessSearchProvider } from './types.js';
import { FakeBusinessSearchProvider } from './fake-provider.js';
import { CsvBusinessSearchProvider } from './csv-provider.js';

export class SearchProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(
      `Provider de busca "${provider}" não configurado. A Fase 2 suporta "fake" e "csv"; ` +
        `Google Places/Apify/SerpAPI/Outscraper entram quando configurados por integração.`,
    );
    this.name = 'SearchProviderNotConfiguredError';
  }
}

export interface SearchProviderConfig {
  provider: string;
  csvContent?: string;
}

/** Seleciona o provider de busca por configuração (spec §7 — não acoplar a um só). */
export function getSearchProvider(config: SearchProviderConfig): BusinessSearchProvider {
  const key = config.provider.toLowerCase();
  switch (key) {
    case 'fake':
      return new FakeBusinessSearchProvider();
    case 'csv':
      return new CsvBusinessSearchProvider(config.csvContent ?? '');
    default:
      throw new SearchProviderNotConfiguredError(config.provider);
  }
}
