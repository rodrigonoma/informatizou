import type {
  BusinessSearchInput,
  BusinessSearchResult,
  BusinessDetailsResult,
  NormalizedBusinessResult,
} from '@informatizou/shared';
import type { BusinessSearchProvider } from './types.js';
import { FAKE_BUSINESSES } from './fake-data.js';

export interface FakeProviderOptions {
  /** Conjunto de empresas a usar (padrão: as 20 da spec §49). */
  dataset?: NormalizedBusinessResult[];
  /** Latência simulada por chamada (ms) para aproximar de um provider real. */
  latencyMs?: number;
}

/**
 * Provider fake (spec §49). Não faz rede. Aplica limite e filtros mínimos de
 * nota/avaliações da entrada, para exercitar o mesmo caminho de um provider real.
 */
export class FakeBusinessSearchProvider implements BusinessSearchProvider {
  public readonly name = 'fake';
  private readonly dataset: NormalizedBusinessResult[];
  private readonly latencyMs: number;

  constructor(options: FakeProviderOptions = {}) {
    this.dataset = options.dataset ?? FAKE_BUSINESSES;
    this.latencyMs = options.latencyMs ?? 0;
  }

  async search(input: BusinessSearchInput): Promise<BusinessSearchResult> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }

    const filtered = this.dataset.filter((b) => {
      if (input.minimumRating != null && (b.rating ?? 0) < input.minimumRating) {
        return false;
      }
      if (
        input.minimumReviewCount != null &&
        (b.reviewCount ?? 0) < input.minimumReviewCount
      ) {
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
    };
  }

  async getBusinessDetails(externalId: string): Promise<BusinessDetailsResult> {
    const found = this.dataset.find((b) => b.externalId === externalId);
    if (!found) {
      throw new Error(`empresa fake não encontrada: ${externalId}`);
    }
    return { externalId, details: found };
  }
}
