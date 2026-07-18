import { normalizeName } from '@informatizou/shared';
import type { DuplicateAnalysis } from '@informatizou/shared';
import { stringSimilarity, haversineKm, extractDomain } from './similarity.js';

/** Subconjunto de campos usado na deduplicação (spec §9). */
export interface DedupRecord {
  id?: string;
  externalId?: string | null;
  source?: string | null;
  name: string;
  phoneE164?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

export interface DedupThresholds {
  /** Acima disto é duplicata confirmada. */
  duplicate: number;
  /** Entre `review` e `duplicate` → baixa confiança, vai para revisão. */
  review: number;
}

export const DEFAULT_THRESHOLDS: DedupThresholds = { duplicate: 0.85, review: 0.6 };

interface PairScore {
  confidence: number;
  reasons: string[];
}

/** Pontua a similaridade entre dois registros combinando múltiplos sinais (§9). */
export function scorePair(a: DedupRecord, b: DedupRecord): PairScore {
  const reasons: string[] = [];

  // ID externo do mesmo provedor → duplicata definitiva.
  if (a.externalId && b.externalId && a.source && b.source) {
    if (a.externalId === b.externalId && a.source === b.source) {
      return { confidence: 1, reasons: ['external_id'] };
    }
  }

  let confidence = 0;

  if (a.phoneE164 && b.phoneE164 && a.phoneE164 === b.phoneE164) {
    confidence += 0.6;
    reasons.push('phone');
  }

  const domainA = extractDomain(a.website);
  const domainB = extractDomain(b.website);
  if (domainA && domainB && domainA === domainB) {
    confidence += 0.6;
    reasons.push('domain');
  }

  const nameSim = stringSimilarity(normalizeName(a.name), normalizeName(b.name));
  if (nameSim >= 0.9) {
    confidence += 0.4 * nameSim;
    reasons.push('name');
  } else if (nameSim >= 0.75) {
    confidence += 0.2 * nameSim;
    reasons.push('name_partial');
  }

  if (
    a.latitude != null &&
    a.longitude != null &&
    b.latitude != null &&
    b.longitude != null
  ) {
    const km = haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
    if (km <= 0.1) {
      confidence += 0.2;
      reasons.push('coords_very_close');
    } else if (km <= 0.5) {
      confidence += 0.1;
      reasons.push('coords_close');
    }
  }

  if (a.address && b.address) {
    const addrSim = stringSimilarity(normalizeName(a.address), normalizeName(b.address));
    if (addrSim >= 0.85) {
      confidence += 0.15;
      reasons.push('address');
    }
  }

  return { confidence: Math.min(1, confidence), reasons };
}

/**
 * Analisa se `candidate` é duplicata de algum registro em `existing` (spec §9).
 * Retorna a melhor correspondência e a confiança combinada.
 */
export function analyzeDuplicate(
  candidate: DedupRecord,
  existing: DedupRecord[],
  thresholds: DedupThresholds = DEFAULT_THRESHOLDS,
): DuplicateAnalysis {
  let best: { record: DedupRecord; score: PairScore } | null = null;

  for (const record of existing) {
    if (record.id && candidate.id && record.id === candidate.id) continue;
    const score = scorePair(candidate, record);
    if (!best || score.confidence > best.score.confidence) {
      best = { record, score };
    }
  }

  if (!best || best.score.confidence < thresholds.review) {
    return { isDuplicate: false, confidence: best?.score.confidence ?? 0, reasons: [] };
  }

  return {
    isDuplicate: best.score.confidence >= thresholds.duplicate,
    confidence: best.score.confidence,
    matchedBusinessId: best.record.id,
    reasons: best.score.reasons,
  };
}

/** true quando o caso precisa de revisão manual (baixa confiança, §9). */
export function needsReview(
  analysis: DuplicateAnalysis,
  thresholds: DedupThresholds = DEFAULT_THRESHOLDS,
): boolean {
  return (
    !analysis.isDuplicate &&
    analysis.confidence >= thresholds.review &&
    analysis.confidence < thresholds.duplicate
  );
}
