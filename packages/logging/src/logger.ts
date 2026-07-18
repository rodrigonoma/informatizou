import { pino, type DestinationStream, type Logger, type LoggerOptions } from 'pino';

/** Campos redigidos nos logs para nunca vazar credenciais (spec §41). */
export const REDACT_PATHS = [
  'password',
  'newPassword',
  'currentPassword',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'secret',
  'apiKey',
  'anthropicApiKey',
  '*.password',
  '*.token',
  '*.secret',
  '*.apiKey',
  '*.authorization',
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
];

export interface CreateLoggerOptions {
  name?: string;
  level?: string;
  /** Destino customizado (uso em testes para capturar a saída). */
  destination?: DestinationStream;
}

export type { Logger };

/**
 * Cria um logger Pino estruturado com redaction de segredos.
 * O nível padrão vem de `LOG_LEVEL` ou `info`.
 */
export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const level = options.level ?? process.env.LOG_LEVEL ?? 'info';

  const base: LoggerOptions = {
    level,
    name: options.name,
    redact: {
      paths: REDACT_PATHS,
      censor: '[Redacted]',
    },
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  return options.destination ? pino(base, options.destination) : pino(base);
}

/**
 * Retorna um child logger correlacionado (campanha/lead/job) para rastrear
 * o fluxo autônomo ponta a ponta.
 */
export function withCorrelation(logger: Logger, correlationId: string): Logger {
  return logger.child({ correlationId });
}
