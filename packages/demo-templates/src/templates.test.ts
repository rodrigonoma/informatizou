import { describe, expect, it } from 'vitest';
import { selectTemplate, designTokensFor, TEMPLATE_KEYS } from './templates.js';
import { buildDemoContent } from './content.js';

describe('selectTemplate (§16)', () => {
  it('mapeia categorias conhecidas', () => {
    expect(selectTemplate('bakery')).toBe('modern-food');
    expect(selectTemplate('restaurant')).toBe('modern-food');
    expect(selectTemplate('dentist')).toBe('health-clean');
    expect(selectTemplate('lawyer')).toBe('professional-services');
    expect(selectTemplate('mechanic')).toBe('automotive-dark');
    expect(selectTemplate('store')).toBe('retail-modern');
  });
  it('categoria desconhecida/ausente → local-classic', () => {
    expect(selectTemplate('coisa-estranha')).toBe('local-classic');
    expect(selectTemplate(null)).toBe('local-classic');
  });
  it('todos os templates têm tokens de design', () => {
    for (const t of TEMPLATE_KEYS) {
      const tokens = designTokensFor(t);
      expect(tokens.primary).toMatch(/^#/);
      expect(tokens.fontHeading).toBeTruthy();
    }
  });
});

describe('buildDemoContent (§15 — não inventa)', () => {
  const content = buildDemoContent({
    name: 'Padaria Maresias',
    category: 'bakery',
    city: 'Ribeirão Preto',
    address: 'Rua X, 123',
    phone: '(16) 3610-1234',
    rating: 4.6,
    reviewCount: 320,
    photoUrls: ['https://x/1.jpg'],
  });

  it('usa o nome real e categoria', () => {
    expect(content.title).toBe('Padaria Maresias');
    expect(content.subtitle).toContain('Padaria');
    expect(content.subtitle).toContain('Ribeirão Preto');
  });

  it('não inventa produtos/serviços', () => {
    expect(content.productsOrServices).toEqual([]);
  });

  it('usa texto neutro de contato (§15)', () => {
    expect(content.about).toContain('Entre em contato');
    expect(content.callToAction).toContain('Padaria Maresias');
  });

  it('diferenciais só a partir de dados factuais', () => {
    expect(content.differentials).toContain('Bem avaliado pelos clientes');
    expect(content.differentials).toContain('Referência na região');
  });

  it('sem dados → sem diferenciais inventados', () => {
    const c = buildDemoContent({ name: 'Loja Y', category: 'store' });
    expect(c.differentials).toEqual([]);
    expect(c.gallery).toEqual([]);
  });
});
