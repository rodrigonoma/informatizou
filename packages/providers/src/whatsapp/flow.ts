/* ============================================================================
   Fluxo do chatbot (híbrido): menu de opções + regras + IA.
   Função pura e testável — o worker decide o que fazer com o resultado.
   ========================================================================== */

export interface BotMenuOption {
  key: string;
  label: string;
  keywords?: string[];
  response: string;
  handoff?: boolean;
}

export interface BusinessHours {
  enabled: boolean;
  /** IANA tz (ex.: "America/Sao_Paulo"). Padrão: America/Sao_Paulo. */
  tz?: string;
  /** "0"(dom)…"6"(sáb) => faixas [["09:00","18:00"], ...]. Dia ausente/[] = fechado. */
  days: Record<string, Array<[string, string]>>;
}

export interface BotFlowConfig {
  aiEnabled: boolean;
  greeting?: string | null;
  awayMessage?: string | null;
  handoffMessage?: string | null;
  handoffKeyword?: string | null;
  fallbackMessage?: string | null;
  menuEnabled: boolean;
  menuHeader?: string | null;
  options: BotMenuOption[];
  businessHours?: BusinessHours | null;
}

export interface FlowContext {
  /** true se ainda não houve resposta nesta conversa (primeiro contato). */
  firstContact: boolean;
  now: Date;
}

export type FlowDecision =
  | { kind: 'away'; text: string }
  | { kind: 'greeting'; text: string }
  | { kind: 'option'; text: string; handoff: boolean }
  | { kind: 'handoff'; text: string }
  | { kind: 'ai' }
  | { kind: 'fallback'; text: string };

export function normalize(s: string): string {
  const nfd = s.normalize('NFD');
  let out = '';
  for (const ch of nfd) {
    const c = ch.codePointAt(0) ?? 0;
    if (c >= 0x300 && c <= 0x36f) continue; // remove marcas de acento combinantes
    out += ch;
  }
  return out.trim().toLowerCase();
}

const WEEKDAY: Record<string, string> = {
  Sun: '0',
  Mon: '1',
  Tue: '2',
  Wed: '3',
  Thu: '4',
  Fri: '5',
  Sat: '6',
};

/** Verifica se `now` está dentro do horário de atendimento (no fuso configurado). */
export function isWithinHours(hours: BusinessHours, now: Date): boolean {
  if (!hours.enabled) return true;
  const tz = hours.tz || 'America/Sao_Paulo';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = WEEKDAY[get('weekday')] ?? '0';
  let hh = get('hour');
  if (hh === '24') hh = '00';
  const cur = `${hh.padStart(2, '0')}:${get('minute').padStart(2, '0')}`;
  const ranges = hours.days?.[day] ?? [];
  return ranges.some(([open, close]) => cur >= open && cur < close);
}

function matchOption(options: BotMenuOption[], msg: string): BotMenuOption | undefined {
  for (let i = 0; i < options.length; i++) {
    const o = options[i]!;
    const key = normalize(o.key || String(i + 1));
    if (msg === key) return o;
    if (normalize(o.label) === msg) return o;
    for (const kw of o.keywords ?? []) {
      const k = normalize(kw);
      if (k && msg.includes(k)) return o;
    }
  }
  return undefined;
}

/** Monta o texto do menu (cabeçalho + opções numeradas). */
export function renderMenu(cfg: BotFlowConfig): string {
  const header = cfg.menuHeader || 'Como posso te ajudar? Responda com o número:';
  const lines = cfg.options.map((o, i) => `${o.key || i + 1}. ${o.label}`);
  return [header, ...lines].join('\n');
}

function greetingWithMenu(cfg: BotFlowConfig): string {
  const menu = renderMenu(cfg);
  return cfg.greeting ? `${cfg.greeting}\n\n${menu}` : menu;
}

/** Decide a resposta do bot para a mensagem do cliente (sem chamar a IA). */
export function decideFlow(cfg: BotFlowConfig, userMessage: string, ctx: FlowContext): FlowDecision {
  const msg = normalize(userMessage);

  const handoffWord = normalize(cfg.handoffKeyword || 'atendente');
  if (handoffWord && (msg === handoffWord || msg.includes(handoffWord))) {
    return {
      kind: 'handoff',
      text: cfg.handoffMessage || 'Certo! Vou chamar um atendente para continuar com você. 🙌',
    };
  }

  if (cfg.businessHours?.enabled && !isWithinHours(cfg.businessHours, ctx.now) && cfg.awayMessage) {
    return { kind: 'away', text: cfg.awayMessage };
  }

  if (cfg.menuEnabled && cfg.options.length) {
    const opt = matchOption(cfg.options, msg);
    if (opt) return { kind: 'option', text: opt.response, handoff: Boolean(opt.handoff) };
  }

  if (ctx.firstContact && cfg.menuEnabled && cfg.options.length) {
    return { kind: 'greeting', text: greetingWithMenu(cfg) };
  }

  if (cfg.aiEnabled) return { kind: 'ai' };

  return {
    kind: 'fallback',
    text: cfg.fallbackMessage || 'Recebi sua mensagem! Em breve um atendente responde por aqui.',
  };
}
