// Site institucional público (informatizou.com.br) — SSR para SEO.
// Direção: Apple Human Interface — claridade, deferência, profundidade.
// Tipografia: pilha do sistema (SF Pro no ecossistema Apple), sem fontes externas.
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: true,
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Informatizou — Sites profissionais, sem complicação',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'A Informatizou cria, hospeda e mantém sites profissionais para o seu negócio. Você recebe uma demonstração antes de decidir. Simples assim.',
        },
        { name: 'theme-color', content: '#ffffff' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:title', content: 'Informatizou — Sites profissionais, sem complicação' },
        {
          property: 'og:description',
          content: 'Criação, hospedagem e manutenção de sites. Veja uma demonstração antes de decidir.',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'pt_BR' },
        { property: 'og:image', content: 'https://www.informatizou.com.br/og-image.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo-mark.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
});
