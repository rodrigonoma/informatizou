import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
// A helper `zodOutputFormat` do SDK usa a API zod v4 (disponível via subpath).
import { z } from 'zod/v4';
import { ProviderNotConfiguredError } from '../errors.js';
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
  /** Tokens máximos por resposta (inclui thinking). Padrão 6000. */
  maxTokens?: number;
  /** Cliente injetável (para testes). */
  client?: Pick<Anthropic['messages'], 'parse'>;
}

/**
 * Regras invioláveis da spec §15 (Proibições). Aplicadas a TODA geração: o
 * modelo só pode usar dados verificados fornecidos; quando faltar informação,
 * usa texto neutro (exemplo da própria spec). Nunca inventar.
 */
const PROHIBITIONS_PT = [
  'Você redige conteúdo institucional em português do Brasil para sites de demonstração de pequenos negócios.',
  'REGRA ABSOLUTA: use SOMENTE os dados verificados fornecidos. É TERMINANTEMENTE PROIBIDO inventar qualquer um destes itens:',
  '- ano de fundação ou história da empresa;',
  '- número de clientes, de funcionários ou de anos de mercado;',
  '- preços, promoções, formas de pagamento ou garantias;',
  '- cardápio, produtos, serviços ou certificações que não foram informados;',
  '- prêmios, depoimentos, avaliações específicas;',
  '- entrega, atendimento 24 horas ou qualquer diferencial não confirmado.',
  'Quando não houver informação para um trecho, use texto neutro e convidativo, por exemplo:',
  '"Entre em contato com a [empresa] para consultar produtos, disponibilidade, horários e outras informações."',
  'Não use superlativos falsos ("o melhor da cidade") nem afirmações não verificáveis.',
  'Tom profissional, acolhedor e claro. Foque em convidar o cliente a entrar em contato.',
].join('\n');

const websiteContentSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  intro: z.string(),
  about: z.string(),
  sections: z.array(z.object({ key: z.string(), heading: z.string(), body: z.string() })),
  productsOrServices: z.array(z.string()),
  differentials: z.array(z.string()),
  callToAction: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
});

const businessSummarySchema = z.object({
  summary: z.string(),
  highlights: z.array(z.string()),
});

const outreachSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

const reviewSchema = z.object({
  approved: z.boolean(),
  qualityScore: z.number(),
  issues: z.array(z.string()),
  fabricationSuspected: z.boolean(),
});

function verifiedFactsBlock(b: BusinessContext): string {
  const lines: string[] = [
    `nome: ${b.name}`,
    b.category ? `categoria: ${b.category}` : '',
    b.categories?.length ? `categorias: ${b.categories.join(', ')}` : '',
    b.city ? `cidade: ${b.city}` : '',
    b.state ? `estado: ${b.state}` : '',
    b.neighborhood ? `bairro: ${b.neighborhood}` : '',
    b.address ? `endereço: ${b.address}` : '',
    b.phone ? `telefone: ${b.phone}` : '',
    b.whatsapp ? `whatsapp: ${b.whatsapp}` : '',
    b.email ? `email: ${b.email}` : '',
    b.instagram ? `instagram: ${b.instagram}` : '',
    typeof b.rating === 'number' ? `nota média: ${b.rating}` : '',
    typeof b.reviewCount === 'number' ? `nº de avaliações: ${b.reviewCount}` : '',
    b.reviewHighlights?.length
      ? `trechos de avaliações públicas: ${b.reviewHighlights.join(' | ')}`
      : '',
  ].filter(Boolean);
  return lines.join('\n');
}

/**
 * Provider Anthropic Claude (spec §15/§28). Gera conteúdo estruturado e
 * validado (structured outputs), sempre respeitando as proibições da §15.
 * Só é instanciado quando há `ANTHROPIC_API_KEY`; nunca chama a API sem chave.
 */
export class AnthropicAiProvider implements AiProvider {
  public readonly name = 'anthropic';
  private readonly config: AnthropicConfig;
  private readonly messages: Pick<Anthropic['messages'], 'parse'>;

  constructor(config: AnthropicConfig) {
    if (!config.apiKey) {
      throw new ProviderNotConfiguredError('anthropic', 'ANTHROPIC_API_KEY ausente');
    }
    this.config = config;
    this.messages = config.client ?? new Anthropic({ apiKey: config.apiKey }).messages;
  }

  get model(): string {
    return this.config.model;
  }

  private async parse<T>(system: string, userPrompt: string, schema: z.ZodType<T>): Promise<T> {
    const res = await this.messages.parse({
      model: this.config.model,
      max_tokens: this.config.maxTokens ?? 6000,
      system,
      thinking: { type: 'adaptive' },
      output_config: { format: zodOutputFormat(schema) },
      messages: [{ role: 'user', content: userPrompt }],
    });
    const parsed = (res as { parsed_output?: unknown }).parsed_output;
    if (parsed == null) {
      const stop = (res as { stop_reason?: string }).stop_reason ?? 'desconhecido';
      throw new Error(`Anthropic não retornou saída estruturada (stop_reason=${stop})`);
    }
    return schema.parse(parsed);
  }

  async generateBusinessSummary(input: BusinessContext): Promise<BusinessSummary> {
    const prompt = [
      'Resuma este negócio em uma frase institucional e liste até 4 destaques verificáveis.',
      'Não invente nada além dos dados abaixo.',
      '',
      'DADOS VERIFICADOS:',
      verifiedFactsBlock(input),
    ].join('\n');
    return this.parse(PROHIBITIONS_PT, prompt, businessSummarySchema);
  }

  async generateWebsiteContent(input: WebsiteGenerationInput): Promise<WebsiteContent> {
    const prompt = [
      `Gere o conteúdo textual de um site de demonstração (template "${input.template}").`,
      input.tone ? `Tom desejado: ${input.tone}.` : '',
      'Produza: título, subtítulo, introdução, apresentação (about), seções (chave/heading/corpo),',
      'produtos ou serviços (SOMENTE se explicitamente informados — caso contrário, lista vazia),',
      'diferenciais (apenas verificáveis a partir dos dados), chamada para ação, SEO title e SEO description.',
      'Se um dado não estiver na lista abaixo, NÃO o mencione — use texto neutro.',
      '',
      'DADOS VERIFICADOS:',
      verifiedFactsBlock(input.business),
    ]
      .filter(Boolean)
      .join('\n');
    return this.parse(PROHIBITIONS_PT, prompt, websiteContentSchema);
  }

  async generateOutreachMessage(input: OutreachGenerationInput): Promise<OutreachMessageResult> {
    const channelLabel: Record<string, string> = {
      EMAIL: 'e-mail',
      WHATSAPP: 'WhatsApp',
      INSTAGRAM: 'mensagem direta no Instagram',
      PHONE: 'roteiro de ligação',
    };
    const system = [
      PROHIBITIONS_PT,
      '',
      'Você agora escreve uma mensagem de prospecção curta, respeitosa e sem pressão, convidando o dono do negócio a ver uma demonstração de site feita para ele.',
      'Seja transparente: é um contato comercial. Inclua o link da demonstração. Não prometa resultados nem invente benefícios.',
      'Para canais que não sejam e-mail, retorne subject como string vazia.',
    ].join('\n');
    const prompt = [
      `Canal: ${channelLabel[input.channel] ?? input.channel}.`,
      `Variante: ${input.variant ?? 'BASE'}.`,
      `Link da demonstração: ${input.demoUrl}`,
      '',
      'DADOS VERIFICADOS DO NEGÓCIO:',
      verifiedFactsBlock(input.business),
    ].join('\n');
    const result = await this.parse(system, prompt, outreachSchema);
    return {
      subject: input.channel === 'EMAIL' && result.subject ? result.subject : undefined,
      body: result.body,
    };
  }

  async reviewGeneratedContent(input: ContentReviewInput): Promise<ContentReviewResult> {
    const system = [
      'Você é um revisor de qualidade e conformidade de conteúdo institucional (spec §15).',
      'Sua tarefa é detectar QUALQUER informação inventada (fundação, preços, cardápio, prêmios, certificações,',
      'depoimentos, garantias, atendimento 24h, formas de pagamento, história) que NÃO esteja nos dados verificados.',
      'Se houver suspeita de invenção, marque fabricationSuspected=true e approved=false.',
      'qualityScore vai de 0 a 100. issues lista problemas objetivos.',
    ].join('\n');
    const prompt = [
      'DADOS VERIFICADOS DO NEGÓCIO:',
      verifiedFactsBlock(input.business),
      '',
      'CONTEÚDO GERADO (JSON):',
      JSON.stringify(input.content),
    ].join('\n');
    return this.parse(system, prompt, reviewSchema);
  }
}
