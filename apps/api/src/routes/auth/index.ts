import type { FastifyInstance, FastifyReply } from 'fastify';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loginSchema } from '@informatizou/shared';
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@informatizou/auth';
import type { User } from '@informatizou/database';
import { apiEnv } from '../../config.js';
import { writeAudit } from '../../hooks/audit.js';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

const publicUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable(),
});

const errorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  issues: z.unknown().optional(),
});

function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function setRefreshCookie(reply: FastifyReply, token: string): void {
  const env = apiEnv();
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth',
    maxAge: REFRESH_TTL_MS / 1000,
    signed: false,
  });
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const env = apiEnv();
  const r = app.withTypeProvider<ZodTypeProvider>();

  // POST /auth/login
  r.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Autentica e retorna access token (refresh em cookie httpOnly)',
        body: loginSchema,
        response: {
          200: z.object({ accessToken: z.string(), user: publicUserSchema }),
          400: errorSchema,
          401: errorSchema,
          423: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const ip = request.ip;
      const userAgent = request.headers['user-agent'] ?? null;

      const user = await app.prisma.user.findUnique({ where: { email } });

      if (!user || user.deletedAt || !user.isActive) {
        await writeAudit(app.prisma, {
          action: 'auth.login_failed',
          entityType: 'User',
          entityId: user?.id ?? null,
          after: { email, reason: 'not_found_or_inactive' },
          ip,
          userAgent,
        });
        return reply.code(401).send({ error: 'Unauthorized', message: 'credenciais inválidas' });
      }

      if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
        return reply
          .code(423)
          .send({ error: 'Locked', message: 'conta temporariamente bloqueada' });
      }

      const ok = await verifyPassword(user.passwordHash, password);
      if (!ok) {
        const attempts = user.failedLoginAttempts + 1;
        const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MS) : null;
        await app.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: attempts, lockedUntil },
        });
        await writeAudit(app.prisma, {
          action: 'auth.login_failed',
          entityType: 'User',
          entityId: user.id,
          after: { email, reason: 'bad_password', attempts },
          ip,
          userAgent,
        });
        app.log.warn({ email, attempts }, 'login falhou: senha incorreta');
        return reply.code(401).send({ error: 'Unauthorized', message: 'credenciais inválidas' });
      }

      // Sucesso: reseta contadores e registra login.
      const updated = await app.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      });

      const session = await app.prisma.userSession.create({
        data: {
          userId: user.id,
          refreshTokenHash: '',
          expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
          ip,
          userAgent,
        },
      });

      const accessToken = signAccessToken(
        { sub: user.id, role: user.role, email: user.email },
        env.JWT_SECRET,
      );
      const refreshToken = signRefreshToken(
        { sub: user.id, sid: session.id },
        env.JWT_REFRESH_SECRET,
      );

      await app.prisma.userSession.update({
        where: { id: session.id },
        data: { refreshTokenHash: sha256(refreshToken) },
      });

      setRefreshCookie(reply, refreshToken);
      await writeAudit(app.prisma, {
        userId: user.id,
        action: 'auth.login_success',
        entityType: 'User',
        entityId: user.id,
        ip,
        userAgent,
      });

      return { accessToken, user: toPublicUser(updated) };
    },
  );

  // POST /auth/refresh
  r.post(
    '/refresh',
    { schema: { tags: ['auth'], summary: 'Rotaciona o refresh token e emite novo access token' } },
    async (request, reply) => {
      const token = request.cookies[REFRESH_COOKIE];
      if (!token) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'refresh ausente' });
      }

      let payload;
      try {
        payload = verifyRefreshToken(token, env.JWT_REFRESH_SECRET);
      } catch {
        return reply.code(401).send({ error: 'Unauthorized', message: 'refresh inválido' });
      }

      const session = await app.prisma.userSession.findUnique({ where: { id: payload.sid } });
      if (
        !session ||
        session.revokedAt ||
        session.expiresAt.getTime() < Date.now() ||
        session.refreshTokenHash !== sha256(token)
      ) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'sessão inválida' });
      }

      const user = await app.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.deletedAt || !user.isActive) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'usuário indisponível' });
      }

      // Rotação: revoga a sessão atual e cria uma nova.
      await app.prisma.userSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      const newSession = await app.prisma.userSession.create({
        data: {
          userId: user.id,
          refreshTokenHash: '',
          expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
          ip: request.ip,
          userAgent: request.headers['user-agent'] ?? null,
        },
      });

      const accessToken = signAccessToken(
        { sub: user.id, role: user.role, email: user.email },
        env.JWT_SECRET,
      );
      const newRefresh = signRefreshToken(
        { sub: user.id, sid: newSession.id },
        env.JWT_REFRESH_SECRET,
      );
      await app.prisma.userSession.update({
        where: { id: newSession.id },
        data: { refreshTokenHash: sha256(newRefresh) },
      });

      setRefreshCookie(reply, newRefresh);
      return { accessToken };
    },
  );

  // GET /auth/me
  r.get(
    '/me',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Retorna o usuário autenticado',
        security: [{ bearerAuth: [] }],
        response: { 200: publicUserSchema, 401: errorSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      const user = await app.prisma.user.findUnique({ where: { id: authUser.sub } });
      if (!user || user.deletedAt) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      return toPublicUser(user);
    },
  );

  // POST /auth/logout
  r.post(
    '/logout',
    { schema: { tags: ['auth'], summary: 'Encerra a sessão e revoga o refresh token' } },
    async (request, reply) => {
      const token = request.cookies[REFRESH_COOKIE];
      if (token) {
        try {
          const payload = verifyRefreshToken(token, env.JWT_REFRESH_SECRET);
          await app.prisma.userSession.updateMany({
            where: { id: payload.sid, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          await writeAudit(app.prisma, {
            userId: payload.sub,
            action: 'auth.logout',
            entityType: 'User',
            entityId: payload.sub,
            ip: request.ip,
          });
        } catch {
          // token inválido/expirado — apenas limpa o cookie.
        }
      }
      reply.clearCookie(REFRESH_COOKIE, { path: '/auth' });
      return reply.code(204).send();
    },
  );
}
