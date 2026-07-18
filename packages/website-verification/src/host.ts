/** Extrai o host (sem www) de uma URL/domínio para classificação. */
export function extractHost(website: string): string | null {
  try {
    const url = new URL(website.includes('://') ? website : `http://${website}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}
