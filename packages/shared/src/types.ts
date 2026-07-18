import type { ScoreCategory, WhatsAppStatus } from './enums.js';

/** Entrada de pesquisa de empresas (spec §7). */
export interface BusinessSearchInput {
  segment: string;
  location: string;
  city?: string;
  state?: string;
  country: string;
  radiusKm?: number;
  limit: number;
  minimumRating?: number;
  minimumReviewCount?: number;
  language: string;
}

/** Resultado normalizado de empresa (spec §7). */
export interface NormalizedBusinessResult {
  externalId: string;
  source: string;

  name: string;
  category?: string;
  categories: string[];

  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;

  latitude?: number;
  longitude?: number;

  phone?: string;
  website?: string;

  rating?: number;
  reviewCount?: number;

  openingHours?: unknown;
  photoUrls: string[];

  email?: string;
  instagram?: string;
  facebook?: string;

  sourceUrl?: string;
  rawData: unknown;
}

/** Resultado de busca do provider (spec §7). */
export interface BusinessSearchResult {
  provider: string;
  query: BusinessSearchInput;
  results: NormalizedBusinessResult[];
  totalFound: number;
}

/** Detalhes de empresa (spec §7). */
export interface BusinessDetailsResult {
  externalId: string;
  details: NormalizedBusinessResult;
}

/** Proveniência de dado enriquecido (spec §11). */
export interface DataProvenance {
  source: string;
  sourceUrl?: string;
  collectedAt: Date;
  confidence: number;
  collector: string;
}

/** Contato de WhatsApp (spec §12). */
export interface WhatsAppContact {
  phone: string;
  status: WhatsAppStatus;
  verificationSource?: string;
  verifiedAt?: Date;
}

/** Item e resultado do score comercial (spec §13). */
export interface ScoreItem {
  rule: string;
  points: number;
  reason: string;
}

export interface ScoreResult {
  total: number;
  category: ScoreCategory;
  items: ScoreItem[];
}

/** Análise de duplicidade (spec §9). */
export interface DuplicateAnalysis {
  isDuplicate: boolean;
  confidence: number;
  matchedBusinessId?: string;
  reasons: string[];
}

/** Decisão do agente comercial (spec §28). */
export interface OutreachDecision {
  eligible: boolean;
  recommendedChannel?: 'EMAIL' | 'WHATSAPP' | 'PHONE' | 'MANUAL';
  requiresApproval: boolean;
  reasons: string[];
  blockingReasons: string[];
}
