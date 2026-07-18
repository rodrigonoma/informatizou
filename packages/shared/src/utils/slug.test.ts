import { describe, expect, it } from 'vitest';
import { slugify } from './slug.js';

describe('slugify', () => {
  it('gera slug simples em minúsculas com hífens', () => {
    expect(slugify('Padaria Maresias')).toBe('padaria-maresias');
  });

  it('remove acentos', () => {
    expect(slugify('Café São João')).toBe('cafe-sao-joao');
    expect(slugify('Açaí do José')).toBe('acai-do-jose');
  });

  it('colapsa separadores e apara pontas', () => {
    expect(slugify('  Loja   & Cia --- ')).toBe('loja-cia');
  });

  it('adiciona sufixo de cidade para desambiguar', () => {
    expect(slugify('Padaria X', { citySuffix: 'Ribeirão Preto' })).toBe(
      'padaria-x-ribeirao-preto',
    );
  });

  it('remove caracteres especiais e emojis', () => {
    expect(slugify('Pizzaria 100% 🍕 Boa!')).toBe('pizzaria-100-boa');
  });
});
