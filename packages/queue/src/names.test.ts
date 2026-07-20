import { describe, expect, it } from 'vitest';
import { QUEUE_NAMES, ALL_QUEUE_NAMES } from './names.js';
import { parseRedisConnection, buildDefaultJobOptions } from './connection.js';

const EXPECTED = [
  'business-search', 'business-details', 'business-deduplication', 'website-discovery',
  'website-verification', 'business-enrichment', 'contact-validation', 'lead-scoring',
  'lead-review', 'website-content-generation', 'website-content-review', 'demo-generation',
  'demo-publication', 'screenshot-generation', 'demo-expiration', 'outreach-message-generation',
  'outreach-approval', 'outreach-delivery', 'outreach-response-processing', 'analytics-processing',
  'proposal-generation', 'export-generation', 'cleanup', 'backup',
  // Chatbot do WhatsApp (atendimento por IA + fluxo configurável).
  'whatsapp-inbound',
];

describe('queue names/connection (§39)', () => {
  it('define exatamente as 25 filas', () => {
    expect(ALL_QUEUE_NAMES).toHaveLength(25);
    for (const q of EXPECTED) expect(ALL_QUEUE_NAMES).toContain(q);
    expect(new Set(ALL_QUEUE_NAMES).size).toBe(25);
  });

  it('demo-expiration existe', () => {
    expect(QUEUE_NAMES.DEMO_EXPIRATION).toBe('demo-expiration');
  });

  it('opções padrão: 3 tentativas e backoff exponencial', () => {
    const o = buildDefaultJobOptions();
    expect(o.attempts).toBe(3);
    expect(o.backoff).toEqual({ type: 'exponential', delay: 2000 });
  });

  it('parseRedisConnection interpreta host/port/senha', () => {
    expect(parseRedisConnection('redis://localhost:6389')).toMatchObject({
      host: 'localhost',
      port: 6389,
      maxRetriesPerRequest: null,
    });
    expect(parseRedisConnection('redis://u:p@redis:6379')).toMatchObject({
      username: 'u',
      password: 'p',
    });
  });
});
