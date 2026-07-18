import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Carrega o .env da raiz do monorepo para os testes de integração.
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../../.env') });
