import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import { verifyAccessToken, can, type Action } from '@informatizou/auth';
import { apiEnv } from '../config.js';

/**
 * Autenticação e autorização (spec §41):
 * - registra cookies assinados (refresh token httpOnly);
 * - `authenticate`: exige Bearer token válido, popula `request.authUser`;
 * - `authorize(action)`: verifica RBAC do perfil.
 */
export const authPlugin = fp(async (app) => {
  const env = apiEnv();

  await app.register(cookie, { secret: env.ENCRYPTION_KEY });

  app.decorate('authenticate', async (request, reply) => {
    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      await reply.code(401).send({ error: 'Unauthorized', message: 'token de acesso ausente' });
      return;
    }
    const token = header.slice('Bearer '.length);
    try {
      request.authUser = verifyAccessToken(token, env.JWT_SECRET);
    } catch {
      await reply.code(401).send({ error: 'Unauthorized', message: 'token inválido ou expirado' });
    }
  });

  app.decorate('authorize', (action: Action) => async (request, reply) => {
    const user = request.authUser;
    if (!user) {
      await reply.code(401).send({ error: 'Unauthorized' });
      return;
    }
    if (!can(user.role, action)) {
      await reply.code(403).send({ error: 'Forbidden', message: `sem permissão para: ${action}` });
    }
  });
});
