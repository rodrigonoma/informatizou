// Site institucional público (informatizou.com.br) — SSR para SEO.
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: true,
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  app: {
    head: {
      title: 'Informatizou · Sites profissionais para o seu negócio',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'A Informatizou cria, hospeda e mantém sites institucionais profissionais para pequenos e médios negócios, com suporte e manutenção mensal.',
        },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:title', content: 'Informatizou · Sites profissionais para o seu negócio' },
        { property: 'og:type', content: 'website' },
      ],
    },
  },
});
