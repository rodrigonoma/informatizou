/**
 * Normaliza um nome de empresa para comparação/deduplicação:
 * minúsculas, sem acento, espaços colapsados, sem pontuação nas bordas.
 * NÃO é para exibição — apenas para casar duplicatas (spec §9).
 */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
