import { describe, expect, it } from 'vitest';
import { buildProgram } from './program.js';
import { assertConfirmed, ConfirmationRequiredError } from './confirm.js';
import { formatSeedInfo, DEV_CREDENTIALS } from './commands/seed-info.js';

function buildTestProgram(): { output: string[] } {
  const output: string[] = [];
  const program = buildProgram({ out: (m) => output.push(m), apiBase: 'http://localhost:4000' });
  program.exitOverride();
  program.configureOutput({ writeErr: () => {}, writeOut: () => {} });
  return { output };
}

describe('CLI informatizou', () => {
  it('reconhece os comandos principais', () => {
    const program = buildProgram({ out: () => {} });
    const names = program.commands.map((c) => c.name());
    expect(names).toContain('health');
    expect(names).toContain('db');
    expect(names).toContain('demo');
  });

  it('db seed-info lista as credenciais de dev', () => {
    const info = formatSeedInfo();
    expect(info).toContain('INSEGURAS');
    for (const c of DEV_CREDENTIALS) {
      expect(info).toContain(c.email);
    }
  });

  it('ação em lote sem --yes é bloqueada (§38)', () => {
    expect(() => assertConfirmed({}, 'demo expire-all')).toThrow(ConfirmationRequiredError);
  });

  it('ação em lote com --yes prossegue', () => {
    expect(() => assertConfirmed({ yes: true }, 'demo expire-all')).not.toThrow();
  });

  it('buildProgram é instanciável sem efeitos colaterais', () => {
    expect(() => buildTestProgram()).not.toThrow();
  });
});
