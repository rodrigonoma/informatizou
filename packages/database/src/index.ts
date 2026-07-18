export { prisma, disconnect } from './client.js';

// Reexporta o client gerado (tipos + enums do Prisma) para consumo tipado.
export * from './generated/client/index.js';
