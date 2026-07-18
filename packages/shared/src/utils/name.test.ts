import { describe, expect, it } from 'vitest';
import { normalizeName } from './name.js';

describe('normalizeName', () => {
  it('normaliza acentos, caixa e espaços', () => {
    expect(normalizeName('  Açaí   do  José ')).toBe('acai do jose');
  });

  it('remove pontuação', () => {
    expect(normalizeName('Padaria & Confeitaria Maresias!')).toBe(
      'padaria confeitaria maresias',
    );
  });

  it('casa variações da mesma empresa', () => {
    expect(normalizeName('MECÂNICA DO ZÉ LTDA')).toBe(normalizeName('Mecânica do Zé ltda'));
  });
});
