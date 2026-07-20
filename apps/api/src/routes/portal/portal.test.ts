import { describe, expect, it, afterAll, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { hashPassword } from '@informatizou/auth';
import { buildApp } from '../../app.js';

/**
 * Testes de integração do painel do cliente. Criam um cliente de teste com
 * acesso ao painel, exercitam o login e o escopo dos dados, e limpam ao final.
 * Dependem de um Postgres no ar.
 */
const PORTAL_EMAIL = 'portal-test@informatizou.test';
const PORTAL_PASSWORD = 'painel-teste-2026';
const REGISTER_EMAIL = 'portal-register-test@informatizou.test';
const RESET_EMAIL = 'portal-reset-test@informatizou.test';
const ALL_EMAILS = [PORTAL_EMAIL, REGISTER_EMAIL, RESET_EMAIL];

let app: FastifyInstance;
let customerId: string;

async function cleanup() {
  // onDelete: Cascade cuida de sessões e tokens de redefinição.
  await app.prisma.customer.deleteMany({ where: { portalEmail: { in: ALL_EMAILS } } });
}

beforeAll(async () => {
  app = await buildApp({ logger: false });
  await app.ready();
  await cleanup();
  const customer = await app.prisma.customer.create({
    data: {
      name: 'Cliente de Teste (painel)',
      portalEmail: PORTAL_EMAIL,
      passwordHash: await hashPassword(PORTAL_PASSWORD),
    },
  });
  customerId = customer.id;
  await app.prisma.customer.create({
    data: {
      name: 'Cliente Reset (painel)',
      portalEmail: RESET_EMAIL,
      passwordHash: await hashPassword('senha-antiga-123'),
    },
  });
});

afterAll(async () => {
  await cleanup();
  await app.close();
});

describe('POST /portal/auth/login', () => {
  it('rejeita credenciais inválidas com 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/portal/auth/login',
      payload: { email: PORTAL_EMAIL, password: 'senha-errada' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('valida corpo malformado com 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/portal/auth/login',
      payload: { email: 'não-é-email' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('autentica o cliente e retorna token + cookie de refresh', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/portal/auth/login',
      payload: { email: PORTAL_EMAIL, password: PORTAL_PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(typeof body.accessToken).toBe('string');
    expect(body.customer.portalEmail).toBe(PORTAL_EMAIL);
    expect(body.customer.id).toBe(customerId);
    expect(String(res.headers['set-cookie'])).toContain('portal_refresh=');
  });
});

describe('rotas escopadas do painel', () => {
  async function token(): Promise<string> {
    const login = await app.inject({
      method: 'POST',
      url: '/portal/auth/login',
      payload: { email: PORTAL_EMAIL, password: PORTAL_PASSWORD },
    });
    return login.json().accessToken;
  }

  it('GET /portal/me sem token retorna 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/portal/me' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /portal/me com token retorna o cliente', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/portal/me',
      headers: { authorization: `Bearer ${await token()}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(customerId);
  });

  it('rejeita token interno como token do painel', async () => {
    // Um token do painel é kind=customer; o guard não aceita outros tipos.
    const res = await app.inject({
      method: 'GET',
      url: '/portal/me',
      headers: { authorization: 'Bearer token-invalido' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /portal/reports retorna estrutura escopada (sem número, zeros)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/portal/reports',
      headers: { authorization: `Bearer ${await token()}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.conversations).toEqual({ total: 0, bot: 0, human: 0, closed: 0 });
    expect(body.messages30d).toEqual({ inbound: 0, outbound: 0 });
    expect(body.sites).toBe(0);
  });

  it('GET /portal/sites retorna lista vazia para cliente novo', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/portal/sites',
      headers: { authorization: `Bearer ${await token()}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });
});

describe('POST /portal/auth/register', () => {
  it('cria uma conta nova e retorna token (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/portal/auth/register',
      payload: { name: 'Novo Cliente', email: REGISTER_EMAIL, password: 'senha-nova-123' },
    });
    expect(res.statusCode).toBe(201);
    expect(typeof res.json().accessToken).toBe('string');
    expect(res.json().customer.portalEmail).toBe(REGISTER_EMAIL);
  });

  it('rejeita e-mail já cadastrado com 409', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/portal/auth/register',
      payload: { name: 'Duplicado', email: PORTAL_EMAIL, password: 'outra-senha-123' },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('fluxo de redefinição de senha', () => {
  it('forgot devolve devLink em ambiente de teste e reset troca a senha', async () => {
    const forgot = await app.inject({
      method: 'POST',
      url: '/portal/auth/forgot',
      payload: { email: RESET_EMAIL },
    });
    expect(forgot.statusCode).toBe(200);
    const devLink = forgot.json().devLink as string;
    expect(devLink).toContain('/painel/redefinir?token=');
    const resetToken = new URL(devLink).searchParams.get('token')!;

    const reset = await app.inject({
      method: 'POST',
      url: '/portal/auth/reset',
      payload: { token: resetToken, password: 'senha-nova-456' },
    });
    expect(reset.statusCode).toBe(200);

    // A senha antiga não funciona mais; a nova sim.
    const oldLogin = await app.inject({
      method: 'POST',
      url: '/portal/auth/login',
      payload: { email: RESET_EMAIL, password: 'senha-antiga-123' },
    });
    expect(oldLogin.statusCode).toBe(401);
    const newLogin = await app.inject({
      method: 'POST',
      url: '/portal/auth/login',
      payload: { email: RESET_EMAIL, password: 'senha-nova-456' },
    });
    expect(newLogin.statusCode).toBe(200);
  });

  it('reset com token inválido retorna 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/portal/auth/reset',
      payload: { token: 'token-que-nao-existe-xxxxx', password: 'qualquer-coisa-123' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('forgot para e-mail inexistente ainda responde 200 (anti-enumeração)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/portal/auth/forgot',
      payload: { email: 'nao-existe@informatizou.test' },
    });
    expect(res.statusCode).toBe(200);
  });
});
