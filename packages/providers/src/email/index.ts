import { ProviderDisabledError, ProviderNotImplementedError } from '../errors.js';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
  /** Cabeçalho para permitir descadastro (spec §27). */
  listUnsubscribe?: string;
}

export interface EmailSendResult {
  accepted: boolean;
  providerMessageId?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
}

/** Provider de e-mail desabilitado — recusa envio (padrão da Fase 1). */
export class DisabledEmailProvider implements EmailProvider {
  public readonly name = 'disabled';
  send(_message: EmailMessage): Promise<EmailSendResult> {
    return Promise.reject(new ProviderDisabledError('email', 'ENABLE_EMAIL_DELIVERY=false'));
  }
}

export interface EmailProviderEnv {
  EMAIL_PROVIDER: string;
  ENABLE_EMAIL_DELIVERY: boolean;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM_NAME?: string;
  SMTP_FROM_EMAIL?: string;
}

/**
 * Provider SMTP — implementação real (nodemailer) chega na Fase 5. Enquanto o
 * envio não estiver habilitado, retorna o provider desabilitado.
 */
export class SmtpEmailProvider implements EmailProvider {
  public readonly name = 'smtp';
  constructor(private readonly env: EmailProviderEnv) {}
  send(_message: EmailMessage): Promise<EmailSendResult> {
    throw new ProviderNotImplementedError('smtp', 'send');
  }
}

/** Seleciona o provider de e-mail. Sem entrega habilitada → desabilitado. */
export function getEmailProvider(env: EmailProviderEnv): EmailProvider {
  if (!env.ENABLE_EMAIL_DELIVERY) {
    return new DisabledEmailProvider();
  }
  if (env.EMAIL_PROVIDER === 'smtp') {
    return new SmtpEmailProvider(env);
  }
  return new DisabledEmailProvider();
}
