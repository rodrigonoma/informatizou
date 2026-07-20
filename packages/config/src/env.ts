import { z } from 'zod';

/**
 * Schema de variáveis de ambiente da plataforma (spec §46).
 *
 * - Valores obrigatórios sem default fazem `loadEnv` lançar com mensagem legível.
 * - Coerções: portas/números como number, flags como boolean.
 * - Enums restringem provedores e modos de contato.
 */

const booleanFromString = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === 'boolean') return value;
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
  });

const numberFromString = z
  .union([z.number(), z.string()])
  .transform((value) => (typeof value === 'number' ? value : Number(value)))
  .pipe(z.number({ invalid_type_error: 'esperado número' }));

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  APP_NAME: z.string().default('Informatizou Prospect'),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_BASE_URL: z.string().url().default('http://localhost:3001'),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  DEMO_BASE_URL: z.string().url().default('http://localhost:3002'),

  PUBLIC_SITE_DOMAIN: z.string().default('www.informatizou.com.br'),
  ADMIN_DOMAIN: z.string().default('app.informatizou.com.br'),
  API_DOMAIN: z.string().default('api.informatizou.com.br'),
  DEMO_DOMAIN: z.string().default('demo.informatizou.com.br'),

  // Obrigatórios — sem default. Falha explícita se ausentes.
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  REDIS_URL: z.string().min(1, 'REDIS_URL é obrigatório'),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET é obrigatório'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET é obrigatório'),
  ENCRYPTION_KEY: z.string().min(1, 'ENCRYPTION_KEY é obrigatório'),

  // Login social do painel do cliente (Google). Vazio = SSO desabilitado.
  GOOGLE_OAUTH_CLIENT_ID: z.string().default(''),

  // Geração de layout premium via Google Stitch (leads de alto potencial).
  ENABLE_STITCH: booleanFromString.default(false),
  GOOGLE_STITCH_SA_B64: z.string().default(''), // conta de serviço (JSON) em base64
  STITCH_MODEL: z.string().default('GEMINI_3_1_PRO'), // só o Pro gera HTML
  // Critério de "alto potencial" para reservar o Stitch (limite ~350/mês).
  STITCH_MIN_REVIEWS: numberFromString.default(100),
  STITCH_MIN_RATING: numberFromString.default(4.0),

  AI_PROVIDER: z.enum(['anthropic', 'openai', 'local', 'disabled']).default('anthropic'),
  ANTHROPIC_API_KEY: z.string().default(''),
  ANTHROPIC_MODEL: z.string().default('claude-opus-4-8'),

  BUSINESS_SEARCH_PROVIDER: z
    .enum(['fake', 'csv', 'google_places', 'apify', 'serpapi', 'outscraper'])
    .default('fake'),
  GOOGLE_PLACES_API_KEY: z.string().default(''),
  APIFY_API_TOKEN: z.string().default(''),
  SERPAPI_API_KEY: z.string().default(''),
  OUTSCRAPER_API_KEY: z.string().default(''),

  STORAGE_PROVIDER: z.enum(['minio', 's3', 'disabled']).default('minio'),
  MINIO_ENDPOINT: z.string().default('http://localhost:9000'),
  MINIO_ACCESS_KEY: z.string().default(''),
  MINIO_SECRET_KEY: z.string().default(''),
  MINIO_BUCKET: z.string().default('informatizou'),

  EMAIL_PROVIDER: z.enum(['smtp', 'ses', 'resend', 'mailgun', 'disabled']).default('smtp'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: numberFromString.default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  SMTP_FROM_NAME: z.string().default('Informatizou'),
  SMTP_FROM_EMAIL: z.string().default(''),

  WHATSAPP_PROVIDER: z.enum(['disabled', 'cloud_api', 'official']).default('disabled'),
  WHATSAPP_ACCESS_TOKEN: z.string().default(''),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default(''),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().default(''),
  // Cloud API — chatbot: verificação do webhook e assinatura das notificações.
  WHATSAPP_API_VERSION: z.string().default('v21.0'),
  WHATSAPP_VERIFY_TOKEN: z.string().default(''),
  WHATSAPP_APP_SECRET: z.string().default(''),
  // Embedded Signup (onboarding self-service do WhatsApp do cliente).
  WHATSAPP_APP_ID: z.string().default(''),

  DEMO_EXPIRATION_DAYS: numberFromString.default(10),
  DEFAULT_MINIMUM_DEMO_SCORE: numberFromString.default(80),

  MAX_CAMPAIGN_RESULTS: numberFromString.default(500),
  MAX_CAMPAIGN_DEMOS: numberFromString.default(50),
  MAX_CAMPAIGN_COST_CENTS: numberFromString.default(25000),

  OUTREACH_MODE: z
    .enum(['MANUAL', 'APPROVAL_REQUIRED', 'AUTOMATIC_WHEN_ALLOWED'])
    .default('APPROVAL_REQUIRED'),
  MAX_FOLLOW_UPS: numberFromString.default(1),
  FOLLOW_UP_DELAY_DAYS: numberFromString.default(4),

  ENABLE_ANALYTICS: booleanFromString.default(true),
  ENABLE_EMAIL_DELIVERY: booleanFromString.default(false),
  ENABLE_WHATSAPP_DELIVERY: booleanFromString.default(false),

  // Premissa do proprietário: autonomia ponta-a-ponta.
  AUTONOMOUS_MODE: booleanFromString.default(false),

  API_PORT: numberFromString.default(4000),
  ADMIN_WEB_PORT: numberFromString.default(3001),
  PUBLIC_WEB_PORT: numberFromString.default(3000),
  DEMO_RENDERER_PORT: numberFromString.default(3002),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Erro lançado quando a validação de ambiente falha, com detalhes por campo.
 */
export class EnvValidationError extends Error {
  public readonly issues: string[];
  constructor(issues: string[]) {
    super(`Configuração de ambiente inválida:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

/**
 * Carrega e valida o ambiente. Lança `EnvValidationError` com mensagem legível
 * em caso de configuração ausente/inválida.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (issue) => `${issue.path.join('.') || '(raiz)'}: ${issue.message}`,
    );
    throw new EnvValidationError(issues);
  }
  return parsed.data;
}

let cached: Env | undefined;

/**
 * Retorna o ambiente validado (memoizado). Use em runtime de aplicação.
 */
export function getEnv(): Env {
  if (!cached) {
    cached = loadEnv();
  }
  return cached;
}

/** Limpa o cache (uso em testes). */
export function resetEnvCache(): void {
  cached = undefined;
}
