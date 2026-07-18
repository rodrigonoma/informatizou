import { ProviderNotConfiguredError, ProviderNotImplementedError } from '../errors.js';
import type {
  AiProvider,
  BusinessContext,
  BusinessSummary,
  WebsiteGenerationInput,
  WebsiteContent,
  OutreachGenerationInput,
  OutreachMessageResult,
  ContentReviewInput,
  ContentReviewResult,
} from './types.js';

export interface AnthropicConfig {
  apiKey: string;
  model: string;
}

/**
 * Provider Anthropic Claude (spec §15). Na Fase 1 apenas a estrutura e o guard
 * de configuração existem — as chamadas reais (com controle de custo, cache e
 * validação Zod) são implementadas na Fase 4. Nunca chama a API paga sem key.
 */
export class AnthropicAiProvider implements AiProvider {
  public readonly name = 'anthropic';
  private readonly config: AnthropicConfig;

  constructor(config: AnthropicConfig) {
    if (!config.apiKey) {
      throw new ProviderNotConfiguredError('anthropic', 'ANTHROPIC_API_KEY ausente');
    }
    this.config = config;
  }

  get model(): string {
    return this.config.model;
  }

  generateBusinessSummary(_input: BusinessContext): Promise<BusinessSummary> {
    throw new ProviderNotImplementedError('anthropic', 'generateBusinessSummary');
  }

  generateWebsiteContent(_input: WebsiteGenerationInput): Promise<WebsiteContent> {
    throw new ProviderNotImplementedError('anthropic', 'generateWebsiteContent');
  }

  generateOutreachMessage(_input: OutreachGenerationInput): Promise<OutreachMessageResult> {
    throw new ProviderNotImplementedError('anthropic', 'generateOutreachMessage');
  }

  reviewGeneratedContent(_input: ContentReviewInput): Promise<ContentReviewResult> {
    throw new ProviderNotImplementedError('anthropic', 'reviewGeneratedContent');
  }
}
