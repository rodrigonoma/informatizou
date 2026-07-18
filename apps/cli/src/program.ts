import { Command } from 'commander';
import { checkHealth } from './commands/health.js';
import { formatSeedInfo } from './commands/seed-info.js';
import { assertConfirmed } from './confirm.js';

export interface BuildProgramOptions {
  /** Sink de saída (para testes). Padrão: console.log. */
  out?: (msg: string) => void;
  apiBase?: string;
}

/** Constrói o programa `informatizou` (spec §38). Testável via exitOverride. */
export function buildProgram(opts: BuildProgramOptions = {}): Command {
  const out = opts.out ?? ((m: string) => console.log(m));
  const apiBase = opts.apiBase ?? process.env.API_BASE_URL ?? 'http://localhost:4000';

  const program = new Command();
  program
    .name('informatizou')
    .description('CLI da plataforma Informatizou Prospect')
    .version('0.1.0');

  program
    .command('health')
    .description('Verifica a saúde da API')
    .action(async () => {
      const result = await checkHealth(apiBase);
      out(
        result.ok
          ? `✔ API saudável (${result.apiBase}) — status: ${result.status}`
          : `✖ API indisponível (${result.apiBase}) — ${result.status}${
              result.detail ? `: ${result.detail}` : ''
            }`,
      );
    });

  const db = program.command('db').description('Comandos de banco de dados');
  db.command('seed-info')
    .description('Mostra as credenciais de desenvolvimento do seed (§50)')
    .action(() => {
      out(formatSeedInfo());
    });

  const demo = program.command('demo').description('Comandos de demonstrações');
  demo
    .command('expire-all')
    .description('Expira TODAS as demonstrações publicadas (ação em lote)')
    .option('-y, --yes', 'confirma a execução da ação em lote')
    .action((options: { yes?: boolean }) => {
      // §38: ações em lote exigem confirmação explícita.
      assertConfirmed(options, 'demo expire-all');
      // Fase 1: a lógica real de expiração chega na Fase 4. Aqui apenas confirma.
      out('✔ Confirmado. (A expiração em lote será implementada na Fase 4.)');
    });

  return program;
}
