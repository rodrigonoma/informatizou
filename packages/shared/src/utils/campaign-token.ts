import { randomBytes } from 'node:crypto';

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Gera um token opaco de campanha (spec §23):
 * - não revela ID sequencial;
 * - não contém dados pessoais;
 * - permite atribuição de campanha (armazenado no banco) e é revogável.
 *
 * Usa bytes criptográficos codificados em base62 (apenas [A-Za-z0-9], sem hífen).
 */
export function generateCampaignToken(byteLength = 18): string {
  const bytes = randomBytes(byteLength);
  let out = '';
  for (const byte of bytes) {
    out += BASE62[byte % 62];
  }
  return out;
}
