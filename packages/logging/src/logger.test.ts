import { describe, expect, it } from 'vitest';
import { Writable } from 'node:stream';
import { createLogger, withCorrelation } from './logger.js';

/** Captura as linhas JSON emitidas pelo logger. */
function captureLogs(): { stream: Writable; lines: () => Record<string, unknown>[] } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk.toString());
      cb();
    },
  });
  return {
    stream,
    lines: () =>
      chunks
        .join('')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l) as Record<string, unknown>),
  };
}

describe('createLogger', () => {
  it('redige campos sensíveis (password/token/apiKey)', () => {
    const cap = captureLogs();
    const logger = createLogger({ level: 'info', destination: cap.stream });

    logger.info({ password: 'hunter2', token: 'abc', user: { apiKey: 'sk-123' } }, 'login');

    const entry = cap.lines()[0];
    if (!entry) throw new Error('esperava ao menos uma linha de log');
    expect(entry.password).toBe('[Redacted]');
    expect(entry.token).toBe('[Redacted]');
    expect((entry.user as Record<string, unknown>).apiKey).toBe('[Redacted]');
    expect(JSON.stringify(entry)).not.toContain('hunter2');
    expect(JSON.stringify(entry)).not.toContain('sk-123');
  });

  it('withCorrelation injeta correlationId em todas as linhas', () => {
    const cap = captureLogs();
    const base = createLogger({ level: 'info', destination: cap.stream });
    const logger = withCorrelation(base, 'camp-42');

    logger.info('processando');

    const [entry] = cap.lines();
    expect(entry?.correlationId).toBe('camp-42');
    expect(entry?.msg).toBe('processando');
  });

  it('respeita o nível configurado (debug abaixo do nível é omitido)', () => {
    const cap = captureLogs();
    const logger = createLogger({ level: 'warn', destination: cap.stream });

    logger.info('não deve aparecer');
    logger.warn('deve aparecer');

    const lines = cap.lines();
    expect(lines).toHaveLength(1);
    expect(lines[0]?.msg).toBe('deve aparecer');
  });
});
