import type {
  BusinessSearchInput,
  BusinessSearchResult,
  BusinessDetailsResult,
} from '@informatizou/shared';

/**
 * Abstração de fonte de empresas (spec §7). O sistema NÃO deve se acoplar a um
 * único fornecedor: fake, CSV, Google Places, Apify, SerpAPI, Outscraper.
 */
export interface BusinessSearchProvider {
  readonly name: string;

  search(input: BusinessSearchInput): Promise<BusinessSearchResult>;

  getBusinessDetails?(externalId: string): Promise<BusinessDetailsResult>;
}

/**
 * Cenário de website embutido nos dados fake (rawData.scenario), usado pelas
 * fases posteriores (verificação de site / score) para simular a realidade
 * sem chamadas externas.
 */
export type FakeWebsiteScenario =
  | 'NO_WEBSITE'
  | 'VALID'
  | 'BROKEN'
  | 'OUTDATED'
  | 'SOCIAL_ONLY'
  | 'MARKETPLACE_ONLY'
  | 'DOMAIN_PARKED'
  | 'UNDER_CONSTRUCTION';

export interface FakeScenarioMeta {
  scenario: FakeWebsiteScenario;
  /** Rótulo do caso da spec §49 (para depuração/seed). */
  case: string;
  /** Empresa fechada (§49). */
  closed?: boolean;
  /** Já solicitou não receber contato — deve entrar em supressão (§49). */
  optOut?: boolean;
  /** Marca duplicidade proposital com outro externalId (§49). */
  duplicateOf?: string;
  /** Dados conflitantes propositais (§49). */
  conflictingData?: boolean;
  /** Sinaliza expectativa de score alto/baixo (§49). */
  expectedScore?: 'HIGH' | 'LOW';
}
