import { GoogleAuth } from 'google-auth-library';
import { StitchToolClient, Stitch } from '@google/stitch-sdk';
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

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

interface ServiceAccount {
  project_id: string;
  [k: string]: unknown;
}

/**
 * Provider oficial do Google Stitch (Gemini). Autentica com conta de serviço
 * (o Stitch NÃO aceita API key), cria um projeto, gera a tela com o modelo Pro
 * e faz polling até o HTML ficar pronto (o screenshot sai antes do código).
 * Cliente instanciado por chamada com token novo (o token OAuth expira ~1h).
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

  private async mintToken(): Promise<string> {
    const auth = new GoogleAuth({
      credentials: this.sa as Record<string, unknown>,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;
    if (!token) throw new Error('stitch: não foi possível obter o token OAuth');
    return token;
  }

  async generate(input: StitchGenerateInput): Promise<StitchGenerateResult> {
    const accessToken = await this.mintToken();
    // Cliente explícito com token novo (evita o singleton cacheado do SDK).
    // baseUrl é obrigatório — sem ela o cliente vai ao endpoint errado.
    const client = new StitchToolClient({
      accessToken,
      projectId: this.sa.project_id,
      baseUrl: process.env.STITCH_HOST || 'https://stitch.googleapis.com/mcp',
    } as never);
    const stitch = new Stitch(client as never);

    const project = (await stitch.createProject(input.projectTitle ?? 'Informatizou Demo')) as {
      projectId?: string;
      id?: string;
    };
    const projectId = project.projectId ?? project.id;
    if (!projectId) throw new Error('stitch: projeto sem id');

    const screen = (await (project as unknown as {
      generate(p: string, d?: string, m?: string): Promise<{ screenId?: string; id?: string; getHtml(): Promise<string>; getImage(): Promise<string> }>;
    }).generate(input.prompt, input.deviceType ?? 'DESKTOP', input.modelId ?? this.model));
    const screenId = screen.screenId ?? screen.id;
    if (!screenId) throw new Error('stitch: tela sem id');

    // O HTML pode sair alguns segundos depois do screenshot — polling.
    let htmlUrl = await screen.getHtml().catch(() => '');
    for (let i = 0; i < 12 && !htmlUrl; i++) {
      await sleep(15000);
      const raw = (await (client as unknown as {
        callTool(name: string, args: unknown): Promise<{ htmlCode?: { downloadUrl?: string } }>;
      }).callTool('get_screen', {
        projectId,
        screenId,
        name: `projects/${projectId}/screens/${screenId}`,
      }));
      htmlUrl = raw?.htmlCode?.downloadUrl ?? '';
    }
    if (!htmlUrl) throw new Error('stitch: HTML não ficou pronto no tempo esperado');

    const res = await fetch(htmlUrl);
    if (!res.ok) throw new Error(`stitch: falha ao baixar HTML (HTTP ${res.status})`);
    const html = await res.text();

    let screenshotUrl: string | undefined;
    try {
      screenshotUrl = (await screen.getImage()) || undefined;
    } catch {
      screenshotUrl = undefined;
    }

    return { html, screenshotUrl, projectId, screenId };
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
