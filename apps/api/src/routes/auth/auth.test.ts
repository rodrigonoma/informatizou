import { describe, expect, it, afterAll, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';

/**
 * Testes de integração de autenticação. Dependem do seed de desenvolvimento
 * (admin@informatizou.com.br) e de um Postgres no ar.
 */
const ADMIN_EMAIL = 'admin@informatizou.com.br';
const ADMIN_PASSWORD = 'informatizou-dev-2026';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ logger: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('POST /auth/login', () => {
  it('rejeita credenciais inválidas com 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: ADMIN_EMAIL, password: 'senha-errada' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('valida corpo malformado com 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'não-é-email' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('autentica admin e retorna access token + cookie de refresh', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(typeof body.accessToken).toBe('string');
    expect(body.user.email).toBe(ADMIN_EMAIL);
    expect(body.user.role).toBe('ADMIN');
    const setCookie = res.headers['set-cookie'];
    expect(String(setCookie)).toContain('refresh_token=');
  });
});

describe('GET /auth/me', () => {
  it('sem token retorna 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' });
    expect(res.statusCode).toBe(401);
  });

  it('com token válido retorna o usuário', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const { accessToken } = login.json();
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().email).toBe(ADMIN_EMAIL);
  });
});

describe('POST /auth/refresh + logout', () => {
  it('rotaciona o refresh e depois revoga no logout', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const cookie = String(login.headers['set-cookie']);

    const refreshed = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie },
    });
    expect(refreshed.statusCode).toBe(200);
    expect(typeof refreshed.json().accessToken).toBe('string');

    const newCookie = String(refreshed.headers['set-cookie']);
    const logout = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { cookie: newCookie },
    });
    expect(logout.statusCode).toBe(204);
  });
});
