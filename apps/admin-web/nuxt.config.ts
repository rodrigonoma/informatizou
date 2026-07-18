// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  // Painel administrativo é área logada: SPA (sem SSR).
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:4000',
    },
  },
  app: {
    head: {
      title: 'Informatizou · Painel',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      htmlAttrs: { lang: 'pt-BR' },
    },
  },
});
