import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

/** Health checks (spec §45): liveness e readiness (checa Postgres). */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Liveness',
        response: {
          200: z.object({
            status: z.literal('ok'),
            service: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
    async () => ({
      status: 'ok' as const,
      service: 'api',
      timestamp: new Date().toISOString(),
    }),
  );

  r.get(
    '/health/ready',
    {
      schema: {
        tags: ['health'],
        summary: 'Readiness (verifica Postgres)',
      },
    },
    async (_request, reply) => {
      try {
        await app.prisma.$queryRaw`SELECT 1`;
        return { status: 'ready', db: 'up' };
      } catch (err) {
        app.log.error({ err }, 'readiness falhou: banco indisponível');
        return reply.code(503).send({ status: 'unavailable', db: 'down' });
      }
    },
  );
}
