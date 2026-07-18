import { ProviderDisabledError, ProviderNotImplementedError } from '../errors.js';

export interface WhatsAppMessage {
  to: string;
  /** Nome do template aprovado (exigido pela API oficial quando aplicável). */
  templateName?: string;
  body?: string;
  variables?: Record<string, string>;
}

export interface WhatsAppSendResult {
  accepted: boolean;
  providerMessageId?: string;
}

export interface WhatsAppProvider {
  readonly name: string;
  /** Se o canal está apto a enviar (integração oficial configurada e habilitada). */
  canSend(): boolean;
  send(message: WhatsAppMessage): Promise<WhatsAppSendResult>;
}

/**
 * WhatsApp desabilitado — padrão da plataforma (spec §4).
 * PROIBIDO: automação por WhatsApp Web, controle de navegador, libs que imitam
 * um usuário ou mecanismos para evitar bloqueios. Só integração OFICIAL.
 */
export class DisabledWhatsAppProvider implements WhatsAppProvider {
  public readonly name = 'disabled';
  canSend(): boolean {
    return false;
  }
  send(_message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    return Promise.reject(
      new ProviderDisabledError('whatsapp', 'somente integração oficial habilitada envia'),
    );
  }
}

export interface WhatsAppProviderEnv {
  WHATSAPP_PROVIDER: string;
  ENABLE_WHATSAPP_DELIVERY: boolean;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID?: string;
}

/**
 * Provider oficial (Meta Cloud API) — implementação real chega na Fase 5.
 * Só envia com integração oficial configurada e entrega habilitada.
 */
export class OfficialWhatsAppProvider implements WhatsAppProvider {
  public readonly name = 'official';
  constructor(private readonly env: WhatsAppProviderEnv) {}
  canSend(): boolean {
    return (
      this.env.ENABLE_WHATSAPP_DELIVERY &&
      Boolean(this.env.WHATSAPP_ACCESS_TOKEN) &&
      Boolean(this.env.WHATSAPP_PHONE_NUMBER_ID)
    );
  }
  send(_message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    throw new ProviderNotImplementedError('whatsapp-official', 'send');
  }
}

/** Seleciona o provider de WhatsApp. Padrão seguro: desabilitado (§4). */
export function getWhatsAppProvider(env: WhatsAppProviderEnv): WhatsAppProvider {
  if (
    env.ENABLE_WHATSAPP_DELIVERY &&
    (env.WHATSAPP_PROVIDER === 'cloud_api' || env.WHATSAPP_PROVIDER === 'official')
  ) {
    return new OfficialWhatsAppProvider(env);
  }
  return new DisabledWhatsAppProvider();
}
