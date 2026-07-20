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

/** Token do painel do cliente (área logada do negócio). `kind` isola do token interno. */
export interface PortalTokenPayload {
  sub: string; // customerId
  email: string;
  kind: 'customer';
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

/** Assina o access token do painel do cliente (curta duração). */
export function signPortalToken(
  payload: Omit<PortalTokenPayload, 'kind'>,
  secret: string,
  opts: TokenOptions = {},
): string {
  return jwt.sign({ ...payload, kind: 'customer' } satisfies PortalTokenPayload, secret, {
    expiresIn: opts.accessTtl ?? '1h',
  } as jwt.SignOptions);
}

/** Verifica o token do painel do cliente. Lança `TokenError` se inválido ou de outro tipo. */
export function verifyPortalToken(token: string, secret: string): PortalTokenPayload {
  try {
    const decoded = jwt.verify(token, secret) as PortalTokenPayload;
    if (decoded.kind !== 'customer') throw new Error('tipo de token inválido');
    return decoded;
  } catch (err) {
    throw new TokenError((err as Error).message);
  }
}
