/**
 * Reforço de compliance (spec §20): garante o cabeçalho X-Robots-Tag em TODAS
 * as respostas do renderer de demonstrações, inclusive páginas de erro —
 * redundante com routeRules, de propósito (defesa em profundidade).
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive');
});
