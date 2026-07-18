import { defineWorkspace } from 'vitest/config';

// Cada package/app com testes expõe seu próprio vitest.config.ts.
// Este workspace agrega todos para `pnpm test` na raiz.
export default defineWorkspace([
  'packages/*',
  'apps/api',
  'apps/worker',
  'apps/cli',
]);
