import { buildApp } from './app.js';
import { apiEnv } from './config.js';

/** Ponto de entrada do servidor da API. */
async function main(): Promise<void> {
  const env = apiEnv();
  const app = await buildApp();

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'encerrando API...');
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error({ err }, 'falha ao iniciar a API');
    process.exit(1);
  }
}

void main();
