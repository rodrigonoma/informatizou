import { createHmac, timingSafeEqual } from 'node:crypto';
import { ProviderDisabledError } from '../errors.js';

export * from './flow.js';

/** Fetch injetável (para testes), compatível com globalThis.fetch. */
export type FetchLike = (
  input: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; text(): Promise<string>; json(): Promise<unknown> }>;

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
  WHATSAPP_API_VERSION?: string;
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
  async send(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    if (!this.canSend()) {
      throw new ProviderDisabledError('whatsapp', 'integração oficial não configurada/habilitada');
    }
    return sendCloudApiText({
      apiVersion: this.env.WHATSAPP_API_VERSION,
      phoneNumberId: this.env.WHATSAPP_PHONE_NUMBER_ID!,
      accessToken: this.env.WHATSAPP_ACCESS_TOKEN!,
      to: message.to,
      text: message.body ?? '',
    });
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

// ---------------------------------------------------------------------------
// Cloud API — envio, verificação de webhook e parsing de mensagens recebidas
// ---------------------------------------------------------------------------

const GRAPH = 'https://graph.facebook.com';

export interface SendCloudApiTextParams {
  apiVersion?: string;
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
  fetchImpl?: FetchLike;
}

/** Envia uma mensagem de texto pela Cloud API oficial (dentro da janela de 24h). */
export async function sendCloudApiText(params: SendCloudApiTextParams): Promise<WhatsAppSendResult> {
  const fetchImpl = params.fetchImpl ?? (globalThis as { fetch?: FetchLike }).fetch;
  if (!fetchImpl) throw new Error('fetch indisponível');
  const version = params.apiVersion || 'v21.0';
  const res = await fetchImpl(`${GRAPH}/${version}/${params.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: params.to,
      type: 'text',
      text: { preview_url: false, body: params.text.slice(0, 4096) },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Cloud API send falhou (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { messages?: Array<{ id?: string }> };
  return { accepted: true, providerMessageId: data.messages?.[0]?.id };
}

/** Credenciais de envio de um número específico (multi-cliente). */
export interface WhatsappSendCreds {
  phoneNumberId?: string;
  accessToken?: string;
  apiVersion?: string;
  /** ENABLE_WHATSAPP_DELIVERY — trava de segurança global. */
  enabled: boolean;
  fetchImpl?: FetchLike;
}

/**
 * Envia uma resposta usando as credenciais do NÚMERO DA CONVERSA (não um número
 * global). Assim a plataforma atende vários clientes, cada um no seu número.
 * Devolve `delivered: false` quando a entrega está desligada ou faltam credenciais.
 */
export async function sendWhatsappReply(
  creds: WhatsappSendCreds,
  to: string,
  text: string,
): Promise<{ delivered: boolean; providerMessageId?: string }> {
  if (!creds.enabled || !creds.accessToken || !creds.phoneNumberId) {
    return { delivered: false };
  }
  const res = await sendCloudApiText({
    apiVersion: creds.apiVersion,
    phoneNumberId: creds.phoneNumberId,
    accessToken: creds.accessToken,
    to,
    text,
    fetchImpl: creds.fetchImpl,
  });
  return { delivered: res.accepted, providerMessageId: res.providerMessageId };
}

/** Verifica a assinatura X-Hub-Signature-256 do webhook (HMAC-SHA256 do corpo cru). */
export function verifyWhatsappSignature(
  appSecret: string,
  rawBody: string,
  signature?: string,
): boolean {
  if (!appSecret) return true; // sem segredo configurado (ambiente de desenvolvimento)
  if (!signature) return false;
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface WaWebhookMessage {
  from?: string;
  id?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { list_reply?: { title?: string }; button_reply?: { title?: string } };
}
interface WaWebhookValue {
  metadata?: { phone_number_id?: string; display_phone_number?: string };
  contacts?: Array<{ profile?: { name?: string } }>;
  messages?: WaWebhookMessage[];
}

export interface WhatsappInboundMessage {
  from: string;
  waMessageId?: string;
  type: string;
  text?: string;
  contactName?: string;
}
export interface WhatsappInboundBatch {
  phoneNumberId?: string;
  displayPhone?: string;
  messages: WhatsappInboundMessage[];
}

/** Extrai as mensagens recebidas do payload de webhook da Cloud API. */
export function parseInboundMessages(payload: unknown): WhatsappInboundBatch {
  const out: WhatsappInboundBatch = { messages: [] };
  const entries = (payload as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return out;
  for (const entry of entries) {
    const changes = (entry as { changes?: Array<{ value?: WaWebhookValue }> })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const value = change?.value;
      if (!value) continue;
      out.phoneNumberId = value.metadata?.phone_number_id ?? out.phoneNumberId;
      out.displayPhone = value.metadata?.display_phone_number ?? out.displayPhone;
      const contactName = value.contacts?.[0]?.profile?.name;
      for (const m of value.messages ?? []) {
        out.messages.push({
          from: String(m.from ?? ''),
          waMessageId: m.id,
          type: String(m.type ?? 'unknown'),
          text:
            m.text?.body ??
            m.button?.text ??
            m.interactive?.list_reply?.title ??
            m.interactive?.button_reply?.title,
          contactName,
        });
      }
    }
  }
  return out;
}
