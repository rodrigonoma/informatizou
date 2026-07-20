/**
 * Abstração de provedor de IA (spec §15 e §28). Primeira integração: Anthropic Claude.
 * Toda geração deve respeitar as PROIBIÇÕES da spec §15 (nunca inventar fundação,
 * preços, cardápio, prêmios, etc.). As saídas são estruturadas e validáveis.
 */

export interface BusinessContext {
  businessId: string;
  name: string;
  category?: string;
  categories?: string[];
  city?: string;
  state?: string;
  neighborhood?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  rating?: number;
  reviewCount?: number;
  /** Frases recorrentes já extraídas de avaliações públicas. */
  reviewHighlights?: string[];
  /** Somente dados verificados de fontes públicas. */
  verifiedFacts?: Record<string, unknown>;
  language?: string;
}

export interface BusinessSummary {
  summary: string;
  highlights: string[];
}

export interface WebsiteGenerationInput {
  business: BusinessContext;
  template: string;
  tone?: string;
}

export interface WebsiteSection {
  key: string;
  heading: string;
  body: string;
}

export interface WebsiteContent {
  title: string;
  subtitle: string;
  intro: string;
  about: string;
  sections: WebsiteSection[];
  productsOrServices: string[];
  differentials: string[];
  callToAction: string;
  seoTitle: string;
  seoDescription: string;
}

export type OutreachChannelKind = 'EMAIL' | 'WHATSAPP' | 'INSTAGRAM' | 'PHONE';

export interface OutreachGenerationInput {
  business: BusinessContext;
  demoUrl: string;
  channel: OutreachChannelKind;
  variant?: 'BASE' | 'SHORT' | 'FOLLOW_UP' | 'REPLY_INTEREST' | 'REPLY_REJECTION';
}

export interface OutreachMessageResult {
  subject?: string;
  body: string;
}

export interface ContentReviewInput {
  content: WebsiteContent;
  business: BusinessContext;
}

export interface ContentReviewResult {
  approved: boolean;
  qualityScore: number; // 0-100
  issues: string[];
  /** true se detectou possível informação inventada (bloqueia auto-aprovação). */
  fabricationSuspected: boolean;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatReplyInput {
  business: BusinessContext;
  /** Base de conhecimento / FAQ da empresa (texto). */
  knowledge?: string;
  tone?: string;
  /** Histórico recente da conversa, em ordem cronológica. */
  history: ChatTurn[];
  /** Mensagem atual do cliente. */
  userMessage: string;
}

export interface ChatReplyResult {
  reply: string;
  /** true => transferir a conversa para um atendente humano. */
  handoff: boolean;
  reason?: string;
}

export interface AiProvider {
  readonly name: string;

  generateBusinessSummary(input: BusinessContext): Promise<BusinessSummary>;
  generateWebsiteContent(input: WebsiteGenerationInput): Promise<WebsiteContent>;
  generateOutreachMessage(input: OutreachGenerationInput): Promise<OutreachMessageResult>;
  reviewGeneratedContent(input: ContentReviewInput): Promise<ContentReviewResult>;
  /** Resposta do atendente por IA no WhatsApp (spec §15: sem inventar dados). */
  generateChatReply(input: ChatReplyInput): Promise<ChatReplyResult>;
}
