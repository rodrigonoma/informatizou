/** Erro lançado quando uma ação em lote é executada sem confirmação (§38). */
export class ConfirmationRequiredError extends Error {
  constructor(action: string) {
    super(
      `A ação em lote "${action}" exige confirmação. Repita o comando com --yes para prosseguir.`,
    );
    this.name = 'ConfirmationRequiredError';
  }
}

/**
 * Garante que ações em lote só rodem com confirmação explícita (spec §38).
 * Lança `ConfirmationRequiredError` quando `--yes` não foi informado.
 */
export function assertConfirmed(options: { yes?: boolean }, action: string): void {
  if (!options.yes) {
    throw new ConfirmationRequiredError(action);
  }
}
