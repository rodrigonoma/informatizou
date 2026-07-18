import { describe, expect, it, afterAll, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ logger: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('health routes', () => {
  it('GET /health retorna 200 ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('api');
    expect(typeof body.timestamp).toBe('string');
  });

  it('GET /health/ready verifica o banco', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    // 200 se o Postgres estiver no ar (dev), 503 caso contrário.
    expect([200, 503]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.json().db).toBe('up');
    }
  });
});
