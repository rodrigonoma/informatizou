import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 20000,
    // Testes de integração compartilham o banco de dev — evitar concorrência.
    fileParallelism: false,
  },
});
