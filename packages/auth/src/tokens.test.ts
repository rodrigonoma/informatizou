import { describe, expect, it } from 'vitest';
import { UserRole } from '@informatizou/shared';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  TokenError,
} from './tokens.js';

const SECRET = 'test-secret';
const REFRESH_SECRET = 'test-refresh-secret';

describe('tokens (JWT)', () => {
  it('assina e verifica access token preservando payload', () => {
    const token = signAccessToken(
      { sub: 'u1', role: UserRole.ADMIN, email: 'a@b.com' },
      SECRET,
    );
    const payload = verifyAccessToken(token, SECRET);
    expect(payload.sub).toBe('u1');
    expect(payload.role).toBe(UserRole.ADMIN);
    expect(payload.email).toBe('a@b.com');
  });

  it('assina e verifica refresh token com sid', () => {
    const token = signRefreshToken({ sub: 'u1', sid: 's1' }, REFRESH_SECRET);
    const payload = verifyRefreshToken(token, REFRESH_SECRET);
    expect(payload.sub).toBe('u1');
    expect(payload.sid).toBe('s1');
  });

  it('lança TokenError com segredo errado', () => {
    const token = signAccessToken({ sub: 'u1', role: UserRole.SALES, email: 'a@b.com' }, SECRET);
    expect(() => verifyAccessToken(token, 'outro-segredo')).toThrow(TokenError);
  });

  it('lança TokenError para token expirado', () => {
    const token = signAccessToken(
      { sub: 'u1', role: UserRole.SALES, email: 'a@b.com' },
      SECRET,
      { accessTtl: '-1s' },
    );
    expect(() => verifyAccessToken(token, SECRET)).toThrow(TokenError);
  });
});
