import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { apiEnv } from '../config.js';

/**
 * Segurança de borda (spec §41): Helmet + CSP, CORS restrito às origens do painel,
 * e rate limiting global.
 */
export const securityPlugin = fp(async (app) => {
  const env = apiEnv();

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        // Permite o Swagger UI (assets same-origin com scripts/estilos inline).
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  });

  const allowedOrigins = [env.ADMIN_BASE_URL, env.APP_BASE_URL, env.DEMO_BASE_URL];
  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max: env.NODE_ENV === 'production' ? 120 : 1000,
    timeWindow: '1 minute',
  });
});
