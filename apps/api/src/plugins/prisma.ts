import fp from 'fastify-plugin';
import { prisma } from '@informatizou/database';

/** Disponibiliza o Prisma Client em `app.prisma` e encerra no shutdown. */
export const prismaPlugin = fp(async (app) => {
  app.decorate('prisma', prisma);
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
