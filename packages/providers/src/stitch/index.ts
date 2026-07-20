import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ProviderDisabledError } from '../errors.js';

/** Ambiente do provider Stitch (geração de layout premium por IA). */
export interface StitchProviderEnv {
  ENABLE_STITCH: boolean;
  /** Conta de serviço (JSON) em base64. Vazio = desabilitado. */
  GOOGLE_STITCH_SA_B64?: string;
  /** Modelo de geração. Só o Pro produz HTML. */
  STITCH_MODEL?: string;
}

export interface StitchGenerateInput {
  prompt: string;
  deviceType?: string;
  modelId?: string;
  /** Título do projeto no Stitch (organizacional). */
  projectTitle?: string;
}

export interface StitchGenerateResult {
  html: string;
  screenshotUrl?: string;
  projectId: string;
  screenId: string;
}

export interface StitchProvider {
  readonly name: string;
  canGenerate(): boolean;
  generate(input: StitchGenerateInput): Promise<StitchGenerateResult>;
}

/** Padrão seguro: desabilitado. */
export class DisabledStitchProvider implements StitchProvider {
  public readonly name = 'disabled';
  canGenerate(): boolean {
    return false;
  }
  generate(): Promise<StitchGenerateResult> {
    return Promise.reject(new ProviderDisabledError('stitch', 'ENABLE_STITCH=false ou sem credencial'));
  }
}

interface ServiceAccount {
  project_id: string;
  [k: string]: unknown;
}

/**
 * Provider oficial do Google Stitch (Gemini). Autentica com conta de serviço
 * (o Stitch NÃO aceita API key), cria um projeto, gera a tela com o modelo Pro
 * e faz polling até o HTML ficar pronto (o screenshot sai antes do código).
 *
 * A geração roda em um SUBPROCESSO Node fresco (runner.mjs): no processo longo
 * do worker o SDK do Stitch acumula estado (transport MCP) e falha
 * ("create_project invalid argument"); num processo novo funciona sempre.
 */
export class GoogleStitchProvider implements StitchProvider {
  public readonly name = 'stitch';
  constructor(
    private readonly sa: ServiceAccount,
    private readonly model: string,
  ) {}

  canGenerate(): boolean {
    return true;
  }

  generate(input: StitchGenerateInput): Promise<StitchGenerateResult> {
    const runner = join(dirname(fileURLToPath(import.meta.url)), 'runner.mjs');
    const saB64 = Buffer.from(JSON.stringify(this.sa)).toString('base64');
    return new Promise<StitchGenerateResult>((resolve, reject) => {
      const child = spawn('node', [runner, input.projectTitle ?? 'Informatizou Demo'], {
        env: {
          ...process.env,
          GOOGLE_STITCH_SA_B64: saB64,
          STITCH_MODEL: input.modelId ?? this.model,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      let out = '';
      let err = '';
      const timer = setTimeout(() => child.kill('SIGKILL'), 5 * 60 * 1000);
      child.stdout.on('data', (d) => (out += d));
      child.stderr.on('data', (d) => (err += d));
      child.on('error', (e) => {
        clearTimeout(timer);
        reject(e);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          reject(new Error(`stitch runner saiu com código ${code}: ${err.slice(0, 300)}`));
          return;
        }
        try {
          const r = JSON.parse(out) as StitchGenerateResult;
          if (!r.html) throw new Error('sem html');
          resolve(r);
        } catch {
          reject(new Error(`stitch runner: saída inválida (${err.slice(0, 200)})`));
        }
      });
      child.stdin.write(input.prompt);
      child.stdin.end();
    });
  }
}

/** Seleciona o provider do Stitch. Padrão seguro: desabilitado. */
export function getStitchProvider(env: StitchProviderEnv): StitchProvider {
  if (!env.ENABLE_STITCH || !env.GOOGLE_STITCH_SA_B64) {
    return new DisabledStitchProvider();
  }
  let sa: ServiceAccount;
  try {
    sa = JSON.parse(Buffer.from(env.GOOGLE_STITCH_SA_B64, 'base64').toString('utf8')) as ServiceAccount;
  } catch {
    return new DisabledStitchProvider();
  }
  if (!sa.project_id) return new DisabledStitchProvider();
  return new GoogleStitchProvider(sa, env.STITCH_MODEL || 'GEMINI_3_1_PRO');
}

/** Monta o prompt do Stitch a partir dos dados verificados do negócio (§15). */
export function buildStitchPrompt(b: {
  name: string;
  category?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  phone?: string;
  whatsapp?: string;
  openingHours?: string;
}): string {
  const facts: string[] = [`Nome do negócio: ${b.name}`];
  if (b.category) facts.push(`Segmento: ${b.category}`);
  const loc = [b.neighborhood, b.city, b.state].filter(Boolean).join(', ');
  if (loc) facts.push(`Localização: ${loc}`);
  if (b.phone) facts.push(`Telefone: ${b.phone}`);
  if (b.whatsapp) facts.push(`WhatsApp: ${b.whatsapp}`);
  if (b.openingHours) facts.push(`Horário: ${b.openingHours}`);

  return [
    `Gere uma landing page profissional, moderna e responsiva (HTML) em português (pt-BR) para o negócio abaixo.`,
    `Seções: hero com título marcante e foto apetitosa, "nossos produtos/serviços" em cards, sobre, horário, localização/contato e um botão de WhatsApp.`,
    `Visual caloroso, elegante e profissional, com boa tipografia.`,
    ``,
    `IMPORTANTE (não inventar dados): use SOMENTE os fatos verificados abaixo.`,
    `NÃO invente endereço exato, preços, anos de fundação, número de avaliações, nomes de funcionários nem promoções específicas.`,
    `Para itens ilustrativos (ex.: tipos de produto), deixe genéricos e claramente ilustrativos.`,
    ``,
    `Fatos verificados:`,
    ...facts.map((f) => `- ${f}`),
  ].join('\n');
}
