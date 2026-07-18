import { PrismaClient } from './generated/client/index.js';

/**
 * Singleton do Prisma Client. Reutiliza a instância entre hot-reloads em dev
 * para não esgotar conexões.
 */
const globalForPrisma = globalThis as unknown as {
  __informatizouPrisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { level: 'warn', emit: 'stdout' },
            { level: 'error', emit: 'stdout' },
          ]
        : [{ level: 'error', emit: 'stdout' }],
  });
}

export const prisma: PrismaClient = globalForPrisma.__informatizouPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__informatizouPrisma = prisma;
}

/** Encerra a conexão (uso em shutdown gracioso e testes). */
export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
