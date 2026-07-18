import jwt from 'jsonwebtoken';
import type { UserRole } from '@informatizou/shared';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string; // id da sessão, para revogação
}

export interface TokenOptions {
  accessTtl?: string | number;
  refreshTtl?: string | number;
}

const DEFAULT_ACCESS_TTL = '15m';
const DEFAULT_REFRESH_TTL = '7d';

export class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenError';
  }
}

/** Assina um access token de curta duração. */
export function signAccessToken(
  payload: AccessTokenPayload,
  secret: string,
  opts: TokenOptions = {},
): string {
  return jwt.sign(payload, secret, {
    expiresIn: opts.accessTtl ?? DEFAULT_ACCESS_TTL,
  } as jwt.SignOptions);
}

/** Assina um refresh token de longa duração (vinculado à sessão). */
export function signRefreshToken(
  payload: RefreshTokenPayload,
  secret: string,
  opts: TokenOptions = {},
): string {
  return jwt.sign(payload, secret, {
    expiresIn: opts.refreshTtl ?? DEFAULT_REFRESH_TTL,
  } as jwt.SignOptions);
}

/** Verifica e decodifica um access token. Lança `TokenError` se inválido/expirado. */
export function verifyAccessToken(token: string, secret: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded as AccessTokenPayload;
  } catch (err) {
    throw new TokenError((err as Error).message);
  }
}

/** Verifica e decodifica um refresh token. Lança `TokenError` se inválido/expirado. */
export function verifyRefreshToken(token: string, secret: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded as RefreshTokenPayload;
  } catch (err) {
    throw new TokenError((err as Error).message);
  }
}
