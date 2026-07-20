import { prisma } from '../src/client.js';
import { seedOwnerAdmin } from './owner-admin.js';

/**
 * Provisiona apenas o admin do proprietário (idempotente), SEM dados fake.
 * Seguro para rodar em produção: `pnpm --filter @informatizou/database db:ensure-admin`.
 */
seedOwnerAdmin()
  .then(() => {
    console.log('admin garantido: rodrigonoma@gmail.com (ADMIN)');
  })
  .catch((err) => {
    console.error('falha ao garantir admin', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
