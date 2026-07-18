import type { PrismaClient } from '@informatizou/database';
import type { AccessTokenPayload, Action } from '@informatizou/auth';
import type { FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (action: Action) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    authUser?: AccessTokenPayload;
  }
}

export {};
