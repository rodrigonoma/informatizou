import type { Job } from 'bullmq';
import { prisma } from '@informatizou/database';
import { createStorageService } from '@informatizou/storage';
import { loadEnv } from '@informatizou/config';
import { ScreenshotType } from '@informatizou/shared';
import { createLogger, withCorrelation } from '@informatizou/logging';

const baseLog = createLogger({ name: 'screenshot-generation' });

interface Viewport {
  type: ScreenshotType;
  width: number;
  height: number;
  fullPage: boolean;
}

const VIEWPORTS: Viewport[] = [
  { type: ScreenshotType.DESKTOP, width: 1440, height: 1000, fullPage: false },
  { type: ScreenshotType.MOBILE, width: 390, height: 844, fullPage: false },
  { type: ScreenshotType.SOCIAL_PREVIEW, width: 1200, height: 630, fullPage: false },
  { type: ScreenshotType.FULL_PAGE, width: 1440, height: 1000, fullPage: true },
];

/**
 * Gera screenshots da demo com Playwright (spec §22). Import dinâmico e
 * best-effort: se o Playwright/os browsers não estiverem instalados, registra e
 * pula (o restante do pipeline segue). Para ativar: `pnpm add -w playwright` e
 * `npx playwright install chromium`.
 */
export async function screenshotGenerationHandler(job: Job): Promise<unknown> {
  const demoSiteId = String(job.data?.demoSiteId ?? '');
  const log = withCorrelation(baseLog, demoSiteId);
  const env = loadEnv();

  const demo = await prisma.demoSite.findUnique({ where: { id: demoSiteId } });
  if (!demo?.publicUrl) return { skipped: true, reason: 'sem publicUrl' };

  // Import dinâmico (especificador não-literal para não exigir a dependência).
  const spec = 'playwright';
  let playwright: unknown = null;
  try {
    playwright = await import(spec);
  } catch {
    playwright = null;
  }
  if (!playwright) {
    log.info('playwright indisponível — screenshots pulados (instale para ativar §22)');
    return { skipped: true, reason: 'playwright-indisponivel' };
  }

  const { chromium } = playwright as {
    chromium: { launch: (o?: unknown) => Promise<PlaywrightBrowser> };
  };
  const storage = createStorageService(env);

  let browser: PlaywrightBrowser | null = null;
  const created: string[] = [];
  try {
    browser = await chromium.launch({ args: ['--no-sandbox'] });
    await storage.ensureBucket();

    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto(demo.publicUrl, { waitUntil: 'networkidle', timeout: 20_000 });
      const buffer = await page.screenshot({ fullPage: vp.fullPage, type: 'png' });
      const key = `screenshots/${demo.id}/${vp.type.toLowerCase()}.png`;
      await storage.putObject(key, buffer, 'image/png');
      await prisma.siteScreenshot.create({
        data: {
          demoSiteId: demo.id,
          type: vp.type,
          storageUrl: key,
          width: vp.width,
          height: vp.height,
        },
      });
      created.push(vp.type);
      await page.close();
    }
    log.info({ created }, 'screenshots gerados');
    return { created };
  } catch (err) {
    log.error({ err }, 'falha ao gerar screenshots');
    return { skipped: true, reason: 'erro', error: (err as Error).message };
  } finally {
    if (browser) await browser.close();
  }
}

interface PlaywrightBrowser {
  newPage: (o?: unknown) => Promise<PlaywrightPage>;
  close: () => Promise<void>;
}
interface PlaywrightPage {
  goto: (url: string, o?: unknown) => Promise<unknown>;
  screenshot: (o?: unknown) => Promise<Buffer>;
  close: () => Promise<void>;
}
