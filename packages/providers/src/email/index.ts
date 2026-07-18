import nodemailer, { type Transporter } from 'nodemailer';
import { ProviderDisabledError } from '../errors.js';

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

/** Provider SMTP real (nodemailer). Conexão preguiçosa. */
export class SmtpEmailProvider implements EmailProvider {
  public readonly name = 'smtp';
  private transporter: Transporter | null = null;

  constructor(private readonly env: EmailProviderEnv) {}

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const port = this.env.SMTP_PORT ?? 587;
      this.transporter = nodemailer.createTransport({
        host: this.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: this.env.SMTP_USER
          ? { user: this.env.SMTP_USER, pass: this.env.SMTP_PASSWORD }
          : undefined,
      });
    }
    return this.transporter;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const fromName = message.fromName ?? this.env.SMTP_FROM_NAME ?? 'Informatizou';
    const fromEmail = message.fromEmail ?? this.env.SMTP_FROM_EMAIL;
    const info = await this.getTransporter().sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      headers: message.listUnsubscribe
        ? { 'List-Unsubscribe': message.listUnsubscribe }
        : undefined,
    });
    return { accepted: (info.accepted?.length ?? 0) > 0, providerMessageId: info.messageId };
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
