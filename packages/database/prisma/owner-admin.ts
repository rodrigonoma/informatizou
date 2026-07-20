import { prisma } from '../src/client.js';
import { UserRole } from '../src/generated/client/index.js';
import { hashPassword } from '@informatizou/auth';
import { createLogger } from '@informatizou/logging';

const log = createLogger({ name: 'owner-admin' });

/**
 * Admin do proprietário (Rodrigo). Real — pode existir em produção.
 * Provisionado de forma idempotente; a senha pode ser trocada depois.
 */
const OWNER_ADMIN = {
  email: 'rodrigonoma@gmail.com',
  name: 'Rodrigo Noma',
  password: '@Rtn051120',
};

export async function seedOwnerAdmin(): Promise<void> {
  const passwordHash = await hashPassword(OWNER_ADMIN.password);
  await prisma.user.upsert({
    where: { email: OWNER_ADMIN.email },
    update: { name: OWNER_ADMIN.name, role: UserRole.ADMIN, isActive: true, passwordHash },
    create: { email: OWNER_ADMIN.email, name: OWNER_ADMIN.name, role: UserRole.ADMIN, passwordHash },
  });
  log.info({ email: OWNER_ADMIN.email }, 'admin do proprietário provisionado (ADMIN)');
}
