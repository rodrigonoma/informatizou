export interface DevCredential {
  role: string;
  email: string;
}

/**
 * Credenciais de desenvolvimento do seed (spec §50) — INSEGURAS, apenas dev.
 * A senha é a mesma para todos os perfis no ambiente local.
 */
export const DEV_PASSWORD = 'informatizou-dev-2026';

export const DEV_CREDENTIALS: DevCredential[] = [
  { role: 'ADMIN', email: 'admin@informatizou.com.br' },
  { role: 'MANAGER', email: 'manager@informatizou.com.br' },
  { role: 'SALES', email: 'sales@informatizou.com.br' },
  { role: 'REVIEWER', email: 'reviewer@informatizou.com.br' },
];

export function formatSeedInfo(): string {
  const lines = [
    '⚠️  CREDENCIAIS DE DESENVOLVIMENTO — INSEGURAS (nunca usar em produção)',
    '',
    ...DEV_CREDENTIALS.map((c) => `  ${c.role.padEnd(8)} ${c.email}`),
    '',
    `  Senha (todos): ${DEV_PASSWORD}`,
  ];
  return lines.join('\n');
}
