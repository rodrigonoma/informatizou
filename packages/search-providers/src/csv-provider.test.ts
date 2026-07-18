import { describe, expect, it } from 'vitest';
import { parseCsv, parseBusinessesCsv, CsvBusinessSearchProvider } from './csv-provider.js';

const CSV = `name,category,city,state,phone,website,rating,reviewCount
Padaria Central,bakery,Ribeirão Preto,SP,(16) 3610-1000,,4.5,120
"Restaurante, do Zé",restaurant,Ribeirão Preto,SP,(16) 3620-2000,https://www.zerest.com.br,4.2,80
Sem Nota,store,Ribeirão Preto,SP,,,,`;

describe('parseCsv', () => {
  it('respeita aspas e vírgulas internas', () => {
    const rows = parseCsv(CSV);
    expect(rows[0]).toEqual([
      'name',
      'category',
      'city',
      'state',
      'phone',
      'website',
      'rating',
      'reviewCount',
    ]);
    expect(rows[2]![0]).toBe('Restaurante, do Zé');
  });
});

describe('parseBusinessesCsv', () => {
  it('normaliza linhas em resultados', () => {
    const results = parseBusinessesCsv(CSV);
    expect(results).toHaveLength(3);
    expect(results[0]!.name).toBe('Padaria Central');
    expect(results[0]!.source).toBe('csv');
    expect(results[0]!.rating).toBe(4.5);
    expect(results[1]!.website).toBe('https://www.zerest.com.br');
  });

  it('ignora linhas sem nome', () => {
    const results = parseBusinessesCsv('name,city\n,Ribeirão\nPadaria,Ribeirão');
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe('Padaria');
  });
});

describe('CsvBusinessSearchProvider', () => {
  it('aplica filtro de nota mínima', async () => {
    const provider = new CsvBusinessSearchProvider(CSV);
    const res = await provider.search({
      segment: 's',
      location: 'Ribeirão Preto',
      country: 'BR',
      limit: 10,
      language: 'pt-BR',
      minimumRating: 4.3,
    });
    expect(res.results.every((b) => (b.rating ?? 0) >= 4.3)).toBe(true);
    expect(res.results).toHaveLength(1);
  });
});
