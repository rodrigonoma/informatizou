export type ReplyClassification = 'OPT_OUT' | 'INTEREST' | 'REJECTION' | 'NEUTRAL';

// Frases de opt-out (spec §29).
const OPT_OUT_PATTERNS = [
  'nao tenho interesse',
  'sem interesse',
  'nao envie mais',
  'nao quero receber',
  'remova meu numero',
  'remova meu contato',
  'pare de enviar',
  'descadastrar',
  'remover',
  'nao contatar',
  'nao me envie',
];

const INTEREST_PATTERNS = [
  'tenho interesse',
  'gostei',
  'quero saber mais',
  'como funciona',
  'quanto custa',
  'valor',
  'preco',
  'vamos conversar',
  'me chama',
  'quero sim',
  'legal',
  'adorei',
];

const REJECTION_PATTERNS = ['ja tenho site', 'nao preciso', 'no momento nao', 'talvez depois'];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Classifica uma resposta recebida (spec §29). Opt-out tem prioridade: qualquer
 * sinal de recusa de contato marca OPT_OUT para inserir na supressão.
 */
export function classifyReply(text: string): ReplyClassification {
  const t = normalize(text);
  if (OPT_OUT_PATTERNS.some((p) => t.includes(p))) return 'OPT_OUT';
  if (INTEREST_PATTERNS.some((p) => t.includes(p))) return 'INTEREST';
  if (REJECTION_PATTERNS.some((p) => t.includes(p))) return 'REJECTION';
  return 'NEUTRAL';
}

/** Detalha se a resposta é um opt-out (spec §29). */
export function isOptOut(text: string): boolean {
  return classifyReply(text) === 'OPT_OUT';
}
