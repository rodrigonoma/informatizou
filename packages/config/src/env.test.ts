import { describe, expect, it } from 'vitest';
import { loadEnv, EnvValidationError } from './env.js';

const minimalValid: NodeJS.ProcessEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/informatizou',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'x',
  JWT_REFRESH_SECRET: 'y',
  ENCRYPTION_KEY: 'z',
};

describe('loadEnv', () => {
  it('retorna Env com defaults quando o mínimo obrigatório está presente', () => {
    const env = loadEnv(minimalValid);
    expect(env.DEMO_EXPIRATION_DAYS).toBe(10);
    expect(env.OUTREACH_MODE).toBe('APPROVAL_REQUIRED');
    expect(env.AI_PROVIDER).toBe('anthropic');
    expect(env.ENABLE_EMAIL_DELIVERY).toBe(false);
    expect(env.AUTONOMOUS_MODE).toBe(false);
    expect(env.API_PORT).toBe(4000);
  });

  it('coage números e booleans vindos de string', () => {
    const env = loadEnv({
      ...minimalValid,
      SMTP_PORT: '2525',
      MAX_FOLLOW_UPS: '3',
      ENABLE_ANALYTICS: 'true',
      AUTONOMOUS_MODE: 'yes',
    });
    expect(env.SMTP_PORT).toBe(2525);
    expect(env.MAX_FOLLOW_UPS).toBe(3);
    expect(env.ENABLE_ANALYTICS).toBe(true);
    expect(env.AUTONOMOUS_MODE).toBe(true);
  });

  it('lança EnvValidationError citando DATABASE_URL quando ausente', () => {
    const { DATABASE_URL: _omit, ...withoutDb } = minimalValid;
    void _omit;
    expect(() => loadEnv(withoutDb)).toThrow(EnvValidationError);
    try {
      loadEnv(withoutDb);
    } catch (err) {
      expect((err as EnvValidationError).message).toContain('DATABASE_URL');
    }
  });

  it('rejeita enum inválido de OUTREACH_MODE', () => {
    expect(() => loadEnv({ ...minimalValid, OUTREACH_MODE: 'ALWAYS' })).toThrow(
      EnvValidationError,
    );
  });
});
