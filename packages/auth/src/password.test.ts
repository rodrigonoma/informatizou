import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password (argon2id)', () => {
  it('gera hash diferente da senha e verifica corretamente', async () => {
    const hash = await hashPassword('SenhaForte#123');
    expect(hash).not.toBe('SenhaForte#123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, 'SenhaForte#123')).toBe(true);
  });

  it('rejeita senha incorreta', async () => {
    const hash = await hashPassword('SenhaForte#123');
    expect(await verifyPassword(hash, 'errada')).toBe(false);
  });

  it('não quebra com hash inválido', async () => {
    expect(await verifyPassword('não-é-hash', 'x')).toBe(false);
  });
});
