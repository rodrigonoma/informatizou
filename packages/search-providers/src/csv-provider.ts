import type {
  BusinessSearchInput,
  BusinessSearchResult,
  NormalizedBusinessResult,
} from '@informatizou/shared';
import type { BusinessSearchProvider } from './types.js';

/** Parser CSV mínimo com suporte a campos entre aspas e vírgulas internas. */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && content[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/**
 * Converte um CSV (com cabeçalho) em resultados normalizados (spec §7).
 * Colunas reconhecidas (case-insensitive): name, category, address, neighborhood,
 * city, state, postalCode, phone, website, email, instagram, rating, reviewCount, externalId.
 */
export function parseBusinessesCsv(content: string): NormalizedBusinessResult[] {
  const rows = parseCsv(content);
  if (rows.length < 2) return [];

  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  const idx = (name: string): number => header.indexOf(name.toLowerCase());
  const col = (row: string[], name: string): string | undefined => {
    const i = idx(name);
    const v = i >= 0 ? row[i]?.trim() : undefined;
    return v ? v : undefined;
  };

  const results: NormalizedBusinessResult[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]!;
    const name = col(row, 'name');
    if (!name) continue;

    const ratingRaw = col(row, 'rating');
    const reviewRaw = col(row, 'reviewCount') ?? col(row, 'reviews');
    const category = col(row, 'category');

    results.push({
      externalId: col(row, 'externalId') ?? `csv-${r}`,
      source: 'csv',
      name,
      category,
      categories: category ? [category] : [],
      address: col(row, 'address'),
      neighborhood: col(row, 'neighborhood'),
      city: col(row, 'city'),
      state: col(row, 'state'),
      postalCode: col(row, 'postalCode') ?? col(row, 'cep'),
      country: col(row, 'country') ?? 'BR',
      phone: col(row, 'phone'),
      website: col(row, 'website'),
      email: col(row, 'email'),
      instagram: col(row, 'instagram'),
      rating: ratingRaw ? Number(ratingRaw.replace(',', '.')) : undefined,
      reviewCount: reviewRaw ? Number(reviewRaw) : undefined,
      photoUrls: [],
      rawData: { csvRow: r },
    });
  }
  return results;
}

/** Provider que serve empresas a partir de um CSV importado (spec §7). */
export class CsvBusinessSearchProvider implements BusinessSearchProvider {
  public readonly name = 'csv';
  private readonly records: NormalizedBusinessResult[];

  constructor(csvContent: string) {
    this.records = parseBusinessesCsv(csvContent);
  }

  async search(input: BusinessSearchInput): Promise<BusinessSearchResult> {
    const filtered = this.records.filter((b) => {
      if (input.minimumRating != null && (b.rating ?? 0) < input.minimumRating) return false;
      if (input.minimumReviewCount != null && (b.reviewCount ?? 0) < input.minimumReviewCount) {
        return false;
      }
      return true;
    });
    return {
      provider: this.name,
      query: input,
      results: filtered.slice(0, input.limit),
      totalFound: filtered.length,
    };
  }
}
