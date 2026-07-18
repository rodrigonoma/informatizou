import { WebsiteStatus } from '@informatizou/shared';
import { extractHost } from './host.js';

const SOCIAL_HOSTS = ['instagram.com', 'facebook.com', 'fb.com', 'tiktok.com', 'twitter.com', 'x.com', 'youtube.com'];
const MARKETPLACE_HOSTS = ['ifood.com.br', 'ifood.com', 'rappi.com.br', 'ubereats.com', 'aiqfome.com', 'goomer.app', 'mercadolivre.com.br'];
const AGGREGATOR_HOSTS = ['linktr.ee', 'linktree.com', 'bio.link', 'beacons.ai', 'linkbio', 'about.me'];
const DIRECTORY_HOSTS = ['google.com', 'goo.gl', 'maps.google', 'tripadvisor.com', 'yelp.com', 'foursquare.com'];

/**
 * Classificação por URL apenas (spec §10): identifica rede social, marketplace,
 * agregador e diretórios sem precisar buscar a página. Retorna `null` quando o
 * domínio parece próprio (precisa de verificação por fetch).
 */
export function classifyByUrl(website?: string | null): WebsiteStatus | null {
  if (!website || website.trim() === '') return WebsiteStatus.NO_WEBSITE;

  const host = extractHost(website);
  if (!host) return WebsiteStatus.UNKNOWN;

  const match = (list: string[]): boolean => list.some((h) => host === h || host.endsWith(`.${h}`));

  if (match(SOCIAL_HOSTS)) return WebsiteStatus.SOCIAL_MEDIA_ONLY;
  if (match(MARKETPLACE_HOSTS)) return WebsiteStatus.MARKETPLACE_ONLY;
  if (match(AGGREGATOR_HOSTS)) return WebsiteStatus.LINK_AGGREGATOR_ONLY;
  if (match(DIRECTORY_HOSTS)) return WebsiteStatus.MARKETPLACE_ONLY;

  // Domínio aparentemente próprio → precisa de fetch.
  return null;
}

const PARKED_MARKERS = [
  'domain is for sale',
  'domínio à venda',
  'this domain is parked',
  'buy this domain',
  'godaddy',
  'hugedomains',
  'sedoparking',
];
const CONSTRUCTION_MARKERS = [
  'em construção',
  'under construction',
  'coming soon',
  'em breve',
  'site em manutenção',
  'em manutenção',
];

/**
 * Classifica o conteúdo de uma página já carregada (spec §10):
 * detecta domínio estacionado, em construção, ou site aparentemente válido
 * (quando o texto contém o nome do negócio).
 */
export function classifyContent(
  html: string,
  businessName: string,
): WebsiteStatus {
  const lower = html.toLowerCase();

  if (PARKED_MARKERS.some((m) => lower.includes(m))) return WebsiteStatus.DOMAIN_PARKED;
  if (CONSTRUCTION_MARKERS.some((m) => lower.includes(m))) return WebsiteStatus.UNDER_CONSTRUCTION;

  // Sinal de institucional válido: o nome do negócio aparece no conteúdo.
  const tokens = businessName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .filter((t) => t.length >= 4);
  const cleanLower = lower.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const nameHits = tokens.filter((t) => cleanLower.includes(t)).length;

  if (tokens.length > 0 && nameHits >= Math.ceil(tokens.length / 2)) {
    return WebsiteStatus.VALID_INSTITUTIONAL_WEBSITE;
  }

  // Página curta/genérica sem o nome → tratada como insuficiente/antiga.
  if (html.length < 500) return WebsiteStatus.OUTDATED_WEBSITE;

  return WebsiteStatus.VALID_INSTITUTIONAL_WEBSITE;
}
