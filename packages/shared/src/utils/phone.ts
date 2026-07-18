/**
 * Normalização de telefone para E.164 (spec §12), focado no Brasil.
 * - Registra o número original.
 * - Detecta fixo vs. móvel quando possível (não presume WhatsApp).
 */

export interface PhoneParseResult {
  /** Número em E.164 (ex.: +5516999998888) ou null se inválido. */
  e164: string | null;
  /** Somente dígitos nacionais (DDD + número), quando reconhecível. */
  national: string;
  /** Número original informado. */
  original: string;
  /** true=móvel, false=fixo, null=indeterminado. */
  isMobile: boolean | null;
  /** DDD (2 dígitos) quando reconhecido. */
  areaCode: string | null;
}

// DDDs válidos no Brasil (2 dígitos). Lista dos códigos de área em uso.
const VALID_BR_AREA_CODES = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
]);

/**
 * Converte um telefone bruto brasileiro para E.164.
 * `countryCode` padrão '55'. Retorna e164=null se não for reconhecível.
 */
export function toE164(raw: string, countryCode = '55'): PhoneParseResult {
  const original = raw;
  const digits = raw.replace(/\D/g, '');

  const result: PhoneParseResult = {
    e164: null,
    national: '',
    original,
    isMobile: null,
    areaCode: null,
  };

  let national = digits;
  // Remove o código do país se presente (ex.: 55 + DDD + número).
  if (national.startsWith(countryCode) && national.length > 10) {
    national = national.slice(countryCode.length);
  }
  // Remove zero de tronco eventual (0XX).
  if (national.length > 11 && national.startsWith('0')) {
    national = national.slice(1);
  }

  // Nacional válido: 10 (fixo) ou 11 (móvel com 9) dígitos = DDD(2) + assinante(8/9).
  if (national.length !== 10 && national.length !== 11) {
    return result;
  }

  const areaCode = national.slice(0, 2);
  if (!VALID_BR_AREA_CODES.has(areaCode)) {
    return result;
  }

  const subscriber = national.slice(2);
  // Móvel: 9 dígitos começando com 9. Fixo: 8 dígitos começando com 2-5.
  let isMobile: boolean | null = null;
  if (subscriber.length === 9 && subscriber.startsWith('9')) {
    isMobile = true;
  } else if (subscriber.length === 8 && /^[2-5]/.test(subscriber)) {
    isMobile = false;
  } else if (subscriber.length === 8 && /^[6-9]/.test(subscriber)) {
    // Alguns móveis antigos de 8 dígitos — indeterminado, tratamos como móvel provável.
    isMobile = true;
  } else {
    return result;
  }

  result.national = national;
  result.areaCode = areaCode;
  result.isMobile = isMobile;
  result.e164 = `+${countryCode}${national}`;
  return result;
}
