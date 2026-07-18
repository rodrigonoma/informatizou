// Renderer de demonstrações (demo.informatizou.com.br/{slug}) — SSR.
// COMPLIANCE (spec §20): toda resposta é noindex/nofollow/noarchive.
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: true,
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    // Usado no SSR para buscar o conteúdo da demo na API.
    apiBase: process.env.API_BASE_URL || 'http://localhost:4000',
  },
  routeRules: {
    // X-Robots-Tag em TODAS as rotas (§20) — nunca indexar demonstrações.
    '/**': {
      headers: {
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        // Meta robots noindex global (§20), reforçado por página.
        { name: 'robots', content: 'noindex, nofollow, noarchive' },
      ],
    },
  },
});
