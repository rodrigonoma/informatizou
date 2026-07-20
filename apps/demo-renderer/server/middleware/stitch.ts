/**
 * Serve demos do motor "stitch" como HTML cru (página completa e standalone).
 * Só intercepta caminhos de slug de topo (um segmento, sem ponto). Demos de
 * template e o caso "indisponível" continuam na página Vue (não intercepta).
 * Compliance §20: X-Robots-Tag noindex em toda resposta de demo.
 */
interface PublicDemo {
  available?: boolean;
  engine?: string;
  html?: string | null;
}

export default defineEventHandler(async (event) => {
  const path = event.path || '';
  // Um único segmento, sem ponto (ignora _nuxt/*, favicon.ico, api, etc.).
  const match = path.match(/^\/([^/.?#]+)\/?(?:\?.*)?$/);
  if (!match) return;
  const slug = match[1];
  if (!slug) return;

  const apiBase = useRuntimeConfig(event).apiBase as string;
  const demo = await $fetch<PublicDemo>(`${apiBase}/public/demos/${slug}`).catch(() => null);

  if (demo?.available && demo.engine === 'stitch' && demo.html) {
    setResponseHeader(event, 'content-type', 'text/html; charset=utf-8');
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive');
    return demo.html;
  }
  // Demais casos: segue para a página Vue (template / indisponível).
});
