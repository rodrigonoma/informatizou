/** Provider referenciado por configuração mas sem credenciais/setup válidos. */
export class ProviderNotConfiguredError extends Error {
  constructor(provider: string, detail?: string) {
    super(`Provider "${provider}" não configurado${detail ? `: ${detail}` : ''}`);
    this.name = 'ProviderNotConfiguredError';
  }
}

/** Operação recusada porque o canal está desabilitado (padrão seguro). */
export class ProviderDisabledError extends Error {
  constructor(provider: string, detail?: string) {
    super(`Provider "${provider}" desabilitado${detail ? `: ${detail}` : ''}`);
    this.name = 'ProviderDisabledError';
  }
}

/** Funcionalidade planejada para uma fase posterior. */
export class ProviderNotImplementedError extends Error {
  constructor(provider: string, operation: string) {
    super(`Operação "${operation}" do provider "${provider}" ainda não implementada`);
    this.name = 'ProviderNotImplementedError';
  }
}
