/* eslint-disable no-undef */
/**
 * Runner isolado do Stitch — executado em um subprocesso Node fresco por demo.
 * Roda no processo longo do worker o SDK do Stitch acumula estado (transport
 * MCP) e falha; num processo novo funciona sempre. Recebe a conta de serviço
 * (base64) e o modelo por env, o título por argv e o prompt por stdin; imprime
 * { html, screenshotUrl, projectId, screenId } em JSON no stdout.
 */
import { GoogleAuth } from 'google-auth-library';
import { StitchToolClient, Stitch } from '@google/stitch-sdk';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
  });
}

async function main() {
  const sa = JSON.parse(Buffer.from(process.env.GOOGLE_STITCH_SA_B64 || '', 'base64').toString('utf8'));
  const projectTitle = process.argv[2] || 'Informatizou Demo';
  const model = process.env.STITCH_MODEL || 'GEMINI_3_1_PRO';
  const baseUrl = process.env.STITCH_HOST || 'https://stitch.googleapis.com/mcp';
  const prompt = (await readStdin()).trim();
  if (!prompt) throw new Error('prompt vazio');

  const auth = new GoogleAuth({ credentials: sa, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const token = (await (await auth.getClient()).getAccessToken()).token;
  if (!token) throw new Error('sem token OAuth');

  const client = new StitchToolClient({ accessToken: token, projectId: sa.project_id, baseUrl });
  const stitch = new Stitch(client);

  const project = await stitch.createProject(projectTitle);
  const projectId = project.projectId ?? project.id;

  // O Stitch (experimental) é FLAKY em duas frentes: (1) o generate retorna
  // "invalid argument" ~2/3 das vezes; (2) às vezes o HTML não materializa no
  // polling. Retry do CICLO inteiro (gerar + esperar o HTML) resolve. Falhas
  // do generate voltam rápido; o sucesso leva ~85s.
  let screenId;
  let htmlUrl = '';
  for (let cycle = 1; cycle <= 3 && !htmlUrl; cycle++) {
    let screen;
    for (let attempt = 1; attempt <= 8 && !screen; attempt++) {
      try {
        screen = await project.generate(prompt, 'DESKTOP', model);
      } catch (e) {
        process.stderr.write(`gen ciclo ${cycle} tent ${attempt}: ${String(e?.message).slice(0, 60)}\n`);
        await sleep(2500);
      }
    }
    if (!screen) continue;
    screenId = screen.screenId ?? screen.id;
    htmlUrl = await screen.getHtml().catch(() => '');
    for (let i = 0; i < 9 && !htmlUrl; i++) {
      await sleep(12000);
      const raw = await client.callTool('get_screen', {
        projectId,
        screenId,
        name: `projects/${projectId}/screens/${screenId}`,
      });
      htmlUrl = raw?.htmlCode?.downloadUrl ?? '';
    }
    if (!htmlUrl) process.stderr.write(`ciclo ${cycle}: HTML não veio, novo ciclo\n`);
  }
  if (!htmlUrl) throw new Error('HTML não ficou pronto após ciclos');

  const res = await fetch(htmlUrl);
  if (!res.ok) throw new Error(`falha ao baixar HTML (HTTP ${res.status})`);
  const html = await res.text();

  let screenshotUrl = '';
  try {
    screenshotUrl = (await screen.getImage()) || '';
  } catch {
    screenshotUrl = '';
  }

  process.stdout.write(JSON.stringify({ html, screenshotUrl, projectId, screenId }));
}

main().catch((err) => {
  process.stderr.write(String(err?.message ?? err));
  process.exit(1);
});
