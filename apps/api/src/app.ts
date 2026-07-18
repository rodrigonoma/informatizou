import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
} from 'fastify-type-provider-zod';
import { REDACT_PATHS } from '@informatizou/logging';
import { apiEnv } from './config.js';
import { securityPlugin } from './plugins/security.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { prismaPlugin } from './plugins/prisma.js';
import { authPlugin } from './plugins/auth.js';
import { configureQueues } from '@informatizou/queue';
import { healthRoutes } from './routes/health/index.js';
import { authRoutes } from './routes/auth/index.js';
import { campaignRoutes } from './routes/campaigns/index.js';
import { businessRoutes } from './routes/businesses/index.js';
import { leadRoutes } from './routes/leads/index.js';
import { demoRoutes } from './routes/demos/index.js';
import { outreachRoutes } from './routes/outreach/index.js';
import { salesRoutes } from './routes/sales/index.js';
import { adminRoutes } from './routes/admin/index.js';
import './types.js';

export interface BuildAppOptions {
  /** Habilita o logger Pino (desligado em testes). */
  logger?: boolean;
}

/** Constrói a instância Fastify com plugins, validação Zod e rotas. */
export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const useLogger = opts.logger ?? true;

  const app = Fastify(
    useLogger
      ? {
          logger: {
            name: 'api',
            level: apiEnv().LOG_LEVEL,
            redact: { paths: REDACT_PATHS, censor: '[Redacted]' },
          },
        }
      : { logger: false },
  );

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'validação falhou',
        issues: error.validation,
      });
    }
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ error: error.name, message: error.message });
    }
    request.log.error({ err: error }, 'erro não tratado na requisição');
    return reply.code(500).send({ error: 'Internal Server Error' });
  });

  // Producers de fila usam o Redis configurado (para enfileirar jobs).
  configureQueues(apiEnv().REDIS_URL);

  await app.register(securityPlugin);
  await app.register(swaggerPlugin);
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(campaignRoutes);
  await app.register(businessRoutes);
  await app.register(leadRoutes);
  await app.register(demoRoutes);
  await app.register(outreachRoutes);
  await app.register(salesRoutes);
  await app.register(adminRoutes);

  return app;
}
