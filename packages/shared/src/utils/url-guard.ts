/**
 * Guarda contra SSRF (spec §41). Deve ser chamado ANTES de qualquer fetch a
 * uma URL derivada de dados externos (verificação de site, descoberta de domínio).
 *
 * Bloqueia:
 *  - esquemas que não sejam http/https (file:, ftp:, javascript:, data: ...);
 *  - hosts localhost / loopback;
 *  - IPs literais em faixas privadas/reservadas IPv4 e IPv6;
 *  - endpoint de metadados de nuvem (169.254.169.254 — coberto por link-local).
 *
 * A validação de DNS (resolver o host e revalidar o IP, inclusive após redirects)
 * é feita no momento do fetch, no pacote `website-verification` (fase posterior).
 * Este guard é a primeira linha, síncrona, sobre a própria URL.
 */

export interface UrlGuardResult {
  safe: boolean;
  reason?: string;
  hostname?: string;
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export function isSafeHttpUrl(input: string): UrlGuardResult {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { safe: false, reason: 'URL inválida' };
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return { safe: false, reason: `esquema não permitido: ${url.protocol}` };
  }

  // URL.hostname remove os colchetes de IPv6.
  const hostname = url.hostname.toLowerCase();

  if (!hostname) {
    return { safe: false, reason: 'host ausente' };
  }

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return { safe: false, reason: 'localhost bloqueado', hostname };
  }

  // IPv6 literal (o hostname vem sem colchetes, ex.: "::1", "fe80::1").
  if (hostname.includes(':')) {
    if (isBlockedIpv6(hostname)) {
      return { safe: false, reason: 'IPv6 privado/reservado bloqueado', hostname };
    }
    return { safe: true, hostname };
  }

  // IPv4 literal?
  if (isIpv4(hostname)) {
    if (isBlockedIpv4(hostname)) {
      return { safe: false, reason: 'IPv4 privado/reservado bloqueado', hostname };
    }
    return { safe: true, hostname };
  }

  // Hostname comum (será resolvido e revalidado no fetch).
  return { safe: true, hostname };
}

function isIpv4(host: string): boolean {
  const parts = host.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

function ipv4ToLong(host: string): number {
  const parts = host.split('.').map(Number);
  return (
    ((parts[0]! << 24) >>> 0) +
    ((parts[1]! << 16) >>> 0) +
    ((parts[2]! << 8) >>> 0) +
    parts[3]!
  );
}

interface Cidr {
  base: string;
  bits: number;
}

const BLOCKED_IPV4_CIDRS: Cidr[] = [
  { base: '0.0.0.0', bits: 8 }, // "this" network (inclui 0.0.0.0)
  { base: '10.0.0.0', bits: 8 }, // privada
  { base: '100.64.0.0', bits: 10 }, // CGNAT
  { base: '127.0.0.0', bits: 8 }, // loopback
  { base: '169.254.0.0', bits: 16 }, // link-local (inclui 169.254.169.254 metadados)
  { base: '172.16.0.0', bits: 12 }, // privada
  { base: '192.0.0.0', bits: 24 }, // IETF protocol assignments
  { base: '192.0.2.0', bits: 24 }, // TEST-NET-1
  { base: '192.168.0.0', bits: 16 }, // privada
  { base: '198.18.0.0', bits: 15 }, // benchmark
  { base: '198.51.100.0', bits: 24 }, // TEST-NET-2
  { base: '203.0.113.0', bits: 24 }, // TEST-NET-3
  { base: '224.0.0.0', bits: 4 }, // multicast
  { base: '240.0.0.0', bits: 4 }, // reservada (inclui 255.255.255.255)
];

function isBlockedIpv4(host: string): boolean {
  const ip = ipv4ToLong(host);
  return BLOCKED_IPV4_CIDRS.some(({ base, bits }) => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (ip & mask) === (ipv4ToLong(base) & mask);
  });
}

/**
 * Expande um endereço IPv6 (com compressão `::` e IPv4 embutido) em 8 hextets
 * de 16 bits. Retorna null se malformado.
 */
function parseIpv6(host: string): number[] | null {
  const h = host.replace(/^\[|\]$/g, '');
  if (h === '') return null;

  const parts = h.split('::');
  if (parts.length > 2) return null;

  const expandSide = (side: string): number[] | null => {
    if (side === '') return [];
    const groups: number[] = [];
    for (const token of side.split(':')) {
      if (token.includes('.')) {
        // IPv4 embutido → dois hextets.
        if (!isIpv4(token)) return null;
        const long = ipv4ToLong(token);
        groups.push((long >>> 16) & 0xffff, long & 0xffff);
      } else {
        if (!/^[0-9a-f]{1,4}$/i.test(token)) return null;
        groups.push(parseInt(token, 16));
      }
    }
    return groups;
  };

  const head = expandSide(parts[0] ?? '');
  const tail = parts.length === 2 ? expandSide(parts[1] ?? '') : [];
  if (head === null || tail === null) return null;

  if (parts.length === 2) {
    const missing = 8 - head.length - tail.length;
    if (missing < 0) return null;
    return [...head, ...new Array<number>(missing).fill(0), ...tail];
  }

  return head.length === 8 ? head : null;
}

function isBlockedIpv6(host: string): boolean {
  const groups = parseIpv6(host);
  if (!groups) return false; // não é IPv6 reconhecível → deixa passar (será resolvido no fetch)

  const allZeroExceptLast = groups.slice(0, 7).every((g) => g === 0);
  // Não especificado (::) e loopback (::1).
  if (groups.every((g) => g === 0)) return true;
  if (allZeroExceptLast && groups[7] === 1) return true;

  // IPv4-mapeado ::ffff:0:0/96 → valida a parte IPv4.
  const firstFiveZero = groups.slice(0, 5).every((g) => g === 0);
  if (firstFiveZero && groups[5] === 0xffff) {
    const ipv4 = `${(groups[6]! >>> 8) & 0xff}.${groups[6]! & 0xff}.${(groups[7]! >>> 8) & 0xff}.${groups[7]! & 0xff}`;
    return isBlockedIpv4(ipv4);
  }

  const first = groups[0]!;
  // fc00::/7 (ULA).
  if ((first & 0xfe00) === 0xfc00) return true;
  // fe80::/10 (link-local).
  if ((first & 0xffc0) === 0xfe80) return true;

  return false;
}
