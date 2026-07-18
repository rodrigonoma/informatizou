import { EmailKind } from '../enums.js';

export interface EmailClassification {
  valid: boolean;
  kind: EmailKind;
  domain?: string;
  normalized?: string;
}

// Prefixos comerciais priorizados (spec §12).
const BUSINESS_PREFIXES = new Set([
  'contato',
  'atendimento',
  'comercial',
  'vendas',
  'faleconosco',
  'sac',
  'financeiro',
  'suporte',
  'adm',
  'administracao',
]);

// Provedores de e-mail pessoais comuns.
const PERSONAL_DOMAINS = new Set([
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'yahoo.com.br',
  'live.com',
  'icloud.com',
  'bol.com.br',
  'uol.com.br',
  'terra.com.br',
  'globo.com',
  'msn.com',
  'me.com',
]);

// Prefixos genéricos que existem em domínio próprio, mas não são "comerciais fortes".
const GENERIC_PREFIXES = new Set(['info', 'no-reply', 'noreply', 'contact', 'hello', 'oi']);

// Sintaxe pragmática de e-mail (não RFC-completa, mas robusta o suficiente).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Classifica um e-mail (spec §12): valida sintaxe e determina se é comercial,
 * genérico, pessoal ou inválido. A verificação de MX é feita de forma assíncrona
 * em `contact-validation` (fase posterior) — aqui é apenas sintaxe + heurística.
 */
export function classifyEmail(email: string): EmailClassification {
  const normalized = email.trim().toLowerCase();

  if (!EMAIL_RE.test(normalized) || normalized.includes('..')) {
    return { valid: false, kind: EmailKind.INVALID };
  }

  const atIndex = normalized.lastIndexOf('@');
  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);

  if (!localPart || !domain || !domain.includes('.')) {
    return { valid: false, kind: EmailKind.INVALID };
  }

  const prefix = localPart.split('+')[0] ?? localPart;

  let kind: EmailKind;
  if (PERSONAL_DOMAINS.has(domain)) {
    kind = EmailKind.PERSONAL;
  } else if (BUSINESS_PREFIXES.has(prefix)) {
    kind = EmailKind.BUSINESS;
  } else if (GENERIC_PREFIXES.has(prefix)) {
    kind = EmailKind.GENERIC;
  } else {
    // Domínio próprio (não pessoal) com prefixo qualquer → tratamos como comercial.
    kind = EmailKind.BUSINESS;
  }

  return { valid: true, kind, domain, normalized };
}
