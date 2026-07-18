import { WebsiteStatus, isSafeHttpUrl } from '@informatizou/shared';
import { classifyByUrl, classifyContent } from './classify.js';

export interface FetchResult {
  ok: boolean;
  status: number;
  body: string;
  finalUrl: string;
}

export type Fetcher = (url: string) => Promise<FetchResult>;

export interface VerifyInput {
  website?: string | null;
  businessName: string;
}

export interface VerifyResult {
  status: WebsiteStatus;
  url?: string;
  reason: string;
  safe: boolean;
}

/** Fetcher padrão: fetch com timeout e user-agent identificado. */
export async function defaultFetcher(url: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'InformatizouBot/1.0 (+https://www.informatizou.com.br)' },
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body: body.slice(0, 200_000), finalUrl: res.url || url };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Verifica um site institucional (spec §10): classificação por URL, guarda SSRF
 * (§41) antes e depois de redirects, fetch e classificação de conteúdo.
 * O `fetcher` é injetável para testes (sem rede).
 */
export async function verifyWebsite(
  input: VerifyInput,
  fetcher: Fetcher = defaultFetcher,
): Promise<VerifyResult> {
  const byUrl = classifyByUrl(input.website);
  if (byUrl !== null) {
    return { status: byUrl, url: input.website ?? undefined, reason: 'classificação por URL', safe: true };
  }

  const website = input.website as string;
  const url = website.includes('://') ? website : `https://${website}`;

  const guard = isSafeHttpUrl(url);
  if (!guard.safe) {
    return { status: WebsiteStatus.UNKNOWN, url, reason: `bloqueado (SSRF): ${guard.reason}`, safe: false };
  }

  try {
    const res = await fetcher(url);
    // Revalida o host final após redirects (§41).
    const finalGuard = isSafeHttpUrl(res.finalUrl || url);
    if (!finalGuard.safe) {
      return { status: WebsiteStatus.UNKNOWN, url, reason: 'redirect para host inseguro', safe: false };
    }
    if (!res.ok || res.status >= 400) {
      return { status: WebsiteStatus.BROKEN_WEBSITE, url, reason: `HTTP ${res.status}`, safe: true };
    }
    return { status: classifyContent(res.body, input.businessName), url, reason: 'conteúdo', safe: true };
  } catch {
    return { status: WebsiteStatus.BROKEN_WEBSITE, url, reason: 'falha de rede', safe: true };
  }
}

/**
 * Mapeia um cenário fake (dados de desenvolvimento §49) para o WebsiteStatus,
 * evitando rede no pipeline de desenvolvimento/teste.
 */
export function scenarioToStatus(scenario: string | undefined): WebsiteStatus {
  switch (scenario) {
    case 'NO_WEBSITE':
      return WebsiteStatus.NO_WEBSITE;
    case 'VALID':
      return WebsiteStatus.VALID_INSTITUTIONAL_WEBSITE;
    case 'BROKEN':
      return WebsiteStatus.BROKEN_WEBSITE;
    case 'OUTDATED':
      return WebsiteStatus.OUTDATED_WEBSITE;
    case 'SOCIAL_ONLY':
      return WebsiteStatus.SOCIAL_MEDIA_ONLY;
    case 'MARKETPLACE_ONLY':
      return WebsiteStatus.MARKETPLACE_ONLY;
    case 'DOMAIN_PARKED':
      return WebsiteStatus.DOMAIN_PARKED;
    case 'UNDER_CONSTRUCTION':
      return WebsiteStatus.UNDER_CONSTRUCTION;
    default:
      return WebsiteStatus.UNKNOWN;
  }
}
