import { describe, expect, it } from 'vitest';
import {
  QUEUE_NAMES,
  ALL_QUEUE_NAMES,
  buildDefaultJobOptions,
  parseRedisConnection,
} from './queues.js';

// As 24 filas exatas da spec §39.
const EXPECTED_QUEUES = [
  'business-search',
  'business-details',
  'business-deduplication',
  'website-discovery',
  'website-verification',
  'business-enrichment',
  'contact-validation',
  'lead-scoring',
  'lead-review',
  'website-content-generation',
  'website-content-review',
  'demo-generation',
  'demo-publication',
  'screenshot-generation',
  'demo-expiration',
  'outreach-message-generation',
  'outreach-approval',
  'outreach-delivery',
  'outreach-response-processing',
  'analytics-processing',
  'proposal-generation',
  'export-generation',
  'cleanup',
  'backup',
];

describe('filas BullMQ (§39)', () => {
  it('define exatamente as 24 filas da spec', () => {
    expect(ALL_QUEUE_NAMES).toHaveLength(24);
    for (const q of EXPECTED_QUEUES) {
      expect(ALL_QUEUE_NAMES).toContain(q);
    }
  });

  it('não tem filas duplicadas', () => {
    expect(new Set(ALL_QUEUE_NAMES).size).toBe(ALL_QUEUE_NAMES.length);
  });

  it('expõe demo-expiration (worker recorrente §21)', () => {
    expect(QUEUE_NAMES.DEMO_EXPIRATION).toBe('demo-expiration');
  });

  it('opções padrão têm 3 tentativas e backoff exponencial', () => {
    const opts = buildDefaultJobOptions();
    expect(opts.attempts).toBe(3);
    expect(opts.backoff).toEqual({ type: 'exponential', delay: 2000 });
  });

  it('parseRedisConnection interpreta host/port/senha', () => {
    const conn = parseRedisConnection('redis://localhost:6389');
    expect(conn).toMatchObject({ host: 'localhost', port: 6389, maxRetriesPerRequest: null });
    const withAuth = parseRedisConnection('redis://user:pass@redis:6379');
    expect(withAuth).toMatchObject({ host: 'redis', port: 6379, username: 'user', password: 'pass' });
  });
});
