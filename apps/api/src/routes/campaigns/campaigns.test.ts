import { describe, expect, it, afterAll, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';

const ADMIN_EMAIL = 'admin@informatizou.com.br';
const ADMIN_PASSWORD = 'informatizou-dev-2026';

let app: FastifyInstance;
let token: string;

beforeAll(async () => {
  app = await buildApp({ logger: false });
  await app.ready();
  const login = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  token = login.json().accessToken;
});

afterAll(async () => {
  await app.close();
});

function auth() {
  return { authorization: `Bearer ${token}` };
}

describe('campanhas (§35)', () => {
  let campaignId: string;

  it('cria campanha (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: auth(),
      payload: {
        name: 'Teste Padarias RP',
        segment: 'padarias',
        location: 'Ribeirão Preto, SP',
        provider: 'fake',
        resultLimit: 50,
      },
    });
    expect(res.statusCode).toBe(201);
    campaignId = res.json().id;
    expect(campaignId).toBeTruthy();
  });

  it('exige autenticação', async () => {
    const res = await app.inject({ method: 'GET', url: '/campaigns' });
    expect(res.statusCode).toBe(401);
  });

  it('lista campanhas', async () => {
    const res = await app.inject({ method: 'GET', url: '/campaigns', headers: auth() });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().items)).toBe(true);
  });

  it('executa a campanha (202) e cria execução QUEUED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/campaigns/${campaignId}/run`,
      headers: auth(),
    });
    expect(res.statusCode).toBe(202);
    expect(res.json().status).toBe('QUEUED');

    const prog = await app.inject({
      method: 'GET',
      url: `/campaigns/${campaignId}/progress`,
      headers: auth(),
    });
    expect(prog.statusCode).toBe(200);
    expect(prog.json().execution).toBeTruthy();
  });

  it('recusa segunda execução enquanto na fila (409)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/campaigns/${campaignId}/run`,
      headers: auth(),
    });
    expect(res.statusCode).toBe(409);
  });

  it('cancela a campanha', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/campaigns/${campaignId}/cancel`,
      headers: auth(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('CANCELLED');
  });

  it('importa empresas via CSV', async () => {
    const csv = 'name,city,phone\nPadaria CSV Teste,Ribeirão Preto,(16) 3610-9999';
    const res = await app.inject({
      method: 'POST',
      url: '/businesses/import',
      headers: auth(),
      payload: { csv },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().imported).toBe(1);
  });
});
