import { describe, expect, it } from 'vitest';
import { classifyEmail } from './email.js';
import { EmailKind } from '../enums.js';

describe('classifyEmail', () => {
  it('classifica prefixo comercial em domínio próprio como BUSINESS', () => {
    const r = classifyEmail('contato@padaria.com.br');
    expect(r.valid).toBe(true);
    expect(r.kind).toBe(EmailKind.BUSINESS);
    expect(r.domain).toBe('padaria.com.br');
  });

  it('classifica provedor pessoal como PERSONAL', () => {
    expect(classifyEmail('joao@gmail.com').kind).toBe(EmailKind.PERSONAL);
    expect(classifyEmail('maria@hotmail.com').kind).toBe(EmailKind.PERSONAL);
  });

  it('classifica prefixo genérico em domínio próprio como GENERIC', () => {
    expect(classifyEmail('info@empresa.com.br').kind).toBe(EmailKind.GENERIC);
    expect(classifyEmail('noreply@empresa.com.br').kind).toBe(EmailKind.GENERIC);
  });

  it('trata domínio próprio com prefixo qualquer como BUSINESS', () => {
    expect(classifyEmail('joao@empresazinha.com.br').kind).toBe(EmailKind.BUSINESS);
  });

  it('rejeita sintaxe inválida', () => {
    expect(classifyEmail('x@@y').valid).toBe(false);
    expect(classifyEmail('sem-arroba.com').valid).toBe(false);
    expect(classifyEmail('a@b').valid).toBe(false);
    expect(classifyEmail('a..b@c.com').valid).toBe(false);
  });

  it('normaliza caixa e espaços', () => {
    expect(classifyEmail('  Contato@Padaria.COM.BR ').normalized).toBe('contato@padaria.com.br');
  });
});
