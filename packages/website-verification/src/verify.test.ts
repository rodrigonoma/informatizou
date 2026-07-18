import { describe, expect, it } from 'vitest';
import { WebsiteStatus } from '@informatizou/shared';
import { classifyByUrl, classifyContent } from './classify.js';
import { verifyWebsite, scenarioToStatus, type Fetcher } from './verify.js';

describe('classifyByUrl (§10)', () => {
  it('sem site → NO_WEBSITE', () => {
    expect(classifyByUrl(null)).toBe(WebsiteStatus.NO_WEBSITE);
    expect(classifyByUrl('')).toBe(WebsiteStatus.NO_WEBSITE);
  });
  it('rede social → SOCIAL_MEDIA_ONLY', () => {
    expect(classifyByUrl('https://instagram.com/padaria')).toBe(WebsiteStatus.SOCIAL_MEDIA_ONLY);
    expect(classifyByUrl('https://www.facebook.com/x')).toBe(WebsiteStatus.SOCIAL_MEDIA_ONLY);
  });
  it('marketplace → MARKETPLACE_ONLY', () => {
    expect(classifyByUrl('https://www.ifood.com.br/delivery/x')).toBe(WebsiteStatus.MARKETPLACE_ONLY);
  });
  it('agregador → LINK_AGGREGATOR_ONLY', () => {
    expect(classifyByUrl('https://linktr.ee/empresa')).toBe(WebsiteStatus.LINK_AGGREGATOR_ONLY);
  });
  it('domínio próprio → null (precisa fetch)', () => {
    expect(classifyByUrl('https://www.minhaempresa.com.br')).toBeNull();
  });
});

describe('classifyContent (§10)', () => {
  it('detecta domínio estacionado', () => {
    expect(classifyContent('<html>Buy this domain - GoDaddy</html>', 'Padaria X')).toBe(
      WebsiteStatus.DOMAIN_PARKED,
    );
  });
  it('detecta em construção', () => {
    expect(classifyContent('<h1>Site em construção</h1>', 'Padaria X')).toBe(
      WebsiteStatus.UNDER_CONSTRUCTION,
    );
  });
  it('nome no conteúdo → válido', () => {
    const html = '<html><body>' + 'x'.repeat(600) + ' Padaria Maresias bem-vindo</body></html>';
    expect(classifyContent(html, 'Padaria Maresias')).toBe(
      WebsiteStatus.VALID_INSTITUTIONAL_WEBSITE,
    );
  });
});

describe('verifyWebsite (§10 + SSRF §41)', () => {
  it('bloqueia URL interna (SSRF) sem fazer fetch', async () => {
    const r = await verifyWebsite({ website: 'http://169.254.169.254/', businessName: 'X' });
    expect(r.safe).toBe(false);
    expect(r.status).toBe(WebsiteStatus.UNKNOWN);
  });

  it('classifica social por URL sem fetch', async () => {
    const r = await verifyWebsite({ website: 'https://instagram.com/x', businessName: 'X' });
    expect(r.status).toBe(WebsiteStatus.SOCIAL_MEDIA_ONLY);
  });

  it('HTTP 404 → site quebrado (fetcher mock)', async () => {
    const fetcher: Fetcher = async (url) => ({ ok: false, status: 404, body: '', finalUrl: url });
    const r = await verifyWebsite({ website: 'https://x.com.br', businessName: 'X' }, fetcher);
    expect(r.status).toBe(WebsiteStatus.BROKEN_WEBSITE);
  });

  it('página válida com nome → institucional (fetcher mock)', async () => {
    const fetcher: Fetcher = async (url) => ({
      ok: true,
      status: 200,
      body: '<html>' + 'y'.repeat(600) + ' Restaurante Sabor da Terra</html>',
      finalUrl: url,
    });
    const r = await verifyWebsite(
      { website: 'https://sabordaterra.com.br', businessName: 'Restaurante Sabor da Terra' },
      fetcher,
    );
    expect(r.status).toBe(WebsiteStatus.VALID_INSTITUTIONAL_WEBSITE);
  });

  it('redirect para host interno é bloqueado', async () => {
    const fetcher: Fetcher = async () => ({
      ok: true,
      status: 200,
      body: 'ok',
      finalUrl: 'http://127.0.0.1/admin',
    });
    const r = await verifyWebsite({ website: 'https://x.com.br', businessName: 'X' }, fetcher);
    expect(r.safe).toBe(false);
  });
});

describe('scenarioToStatus (§49)', () => {
  it('mapeia cenários fake', () => {
    expect(scenarioToStatus('NO_WEBSITE')).toBe(WebsiteStatus.NO_WEBSITE);
    expect(scenarioToStatus('VALID')).toBe(WebsiteStatus.VALID_INSTITUTIONAL_WEBSITE);
    expect(scenarioToStatus('MARKETPLACE_ONLY')).toBe(WebsiteStatus.MARKETPLACE_ONLY);
    expect(scenarioToStatus('desconhecido')).toBe(WebsiteStatus.UNKNOWN);
  });
});
