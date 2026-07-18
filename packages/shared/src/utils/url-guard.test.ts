import { describe, expect, it } from 'vitest';
import { isSafeHttpUrl } from './url-guard.js';

describe('isSafeHttpUrl', () => {
  it('permite URLs http/https públicas', () => {
    expect(isSafeHttpUrl('https://example.com').safe).toBe(true);
    expect(isSafeHttpUrl('http://padaria-maresias.com.br/menu').safe).toBe(true);
    expect(isSafeHttpUrl('https://8.8.8.8').safe).toBe(true);
  });

  it('bloqueia esquemas não-http', () => {
    expect(isSafeHttpUrl('file:///etc/passwd').safe).toBe(false);
    expect(isSafeHttpUrl('ftp://host/x').safe).toBe(false);
    expect(isSafeHttpUrl('javascript:alert(1)').safe).toBe(false);
    expect(isSafeHttpUrl('data:text/html,<script>').safe).toBe(false);
  });

  it('bloqueia localhost e loopback', () => {
    expect(isSafeHttpUrl('http://localhost').safe).toBe(false);
    expect(isSafeHttpUrl('http://localhost:8080/x').safe).toBe(false);
    expect(isSafeHttpUrl('http://127.0.0.1').safe).toBe(false);
    expect(isSafeHttpUrl('http://127.9.9.9').safe).toBe(false);
  });

  it('bloqueia faixas privadas e o endpoint de metadados', () => {
    expect(isSafeHttpUrl('http://10.0.0.5').safe).toBe(false);
    expect(isSafeHttpUrl('http://192.168.1.1').safe).toBe(false);
    expect(isSafeHttpUrl('http://172.16.0.1').safe).toBe(false);
    expect(isSafeHttpUrl('http://169.254.169.254/latest/meta-data').safe).toBe(false);
    expect(isSafeHttpUrl('http://0.0.0.0').safe).toBe(false);
  });

  it('bloqueia IPv6 privado/loopback', () => {
    expect(isSafeHttpUrl('http://[::1]/').safe).toBe(false);
    expect(isSafeHttpUrl('http://[fe80::1]/').safe).toBe(false);
    expect(isSafeHttpUrl('http://[fc00::1]/').safe).toBe(false);
    expect(isSafeHttpUrl('http://[::ffff:127.0.0.1]/').safe).toBe(false);
  });

  it('rejeita URL malformada', () => {
    expect(isSafeHttpUrl('not a url').safe).toBe(false);
    expect(isSafeHttpUrl('').safe).toBe(false);
  });
});
