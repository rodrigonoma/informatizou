import { describe, expect, it } from 'vitest';
import { toE164 } from './phone.js';

describe('toE164', () => {
  it('converte celular com máscara para E.164 e marca como móvel', () => {
    const r = toE164('(16) 99999-8888');
    expect(r.e164).toBe('+5516999998888');
    expect(r.isMobile).toBe(true);
    expect(r.areaCode).toBe('16');
  });

  it('reconhece telefone fixo (8 dígitos)', () => {
    const r = toE164('16 3333-2222');
    expect(r.e164).toBe('+551633332222');
    expect(r.isMobile).toBe(false);
  });

  it('remove código de país já presente', () => {
    const r = toE164('+55 (11) 98888-7777');
    expect(r.e164).toBe('+5511988887777');
    expect(r.isMobile).toBe(true);
  });

  it('remove zero de tronco', () => {
    const r = toE164('016 99999-8888');
    expect(r.e164).toBe('+5516999998888');
  });

  it('retorna e164 null para número inválido', () => {
    expect(toE164('123').e164).toBeNull();
    expect(toE164('99 99999-8888').areaCode).toBe('99');
    // DDD inexistente
    expect(toE164('10 99999-8888').e164).toBeNull();
  });

  it('preserva o número original', () => {
    expect(toE164('(16) 99999-8888').original).toBe('(16) 99999-8888');
  });
});
