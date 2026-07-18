import { AnthropicAiProvider } from './anthropic.js';
import { DisabledAiProvider } from './disabled.js';
import type { AiProvider } from './types.js';

export * from './types.js';
export { AnthropicAiProvider } from './anthropic.js';
export { DisabledAiProvider } from './disabled.js';

export interface AiProviderEnv {
  AI_PROVIDER: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
}

/**
 * Seleciona o provider de IA por configuração. Sem chave válida, cai para
 * `DisabledAiProvider` (Fase 1 não faz chamadas pagas).
 */
export function getAiProvider(env: AiProviderEnv): AiProvider {
  if (env.AI_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY) {
    return new AnthropicAiProvider({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL ?? 'claude-opus-4-8',
    });
  }
  return new DisabledAiProvider();
}
