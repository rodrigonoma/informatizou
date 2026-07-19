// Site institucional público (informatizou.com.br) — SSR para SEO.
// "Informatizou Motion System": experiência viva, monocromática, com um único
// sinal âmbar. Tipografia protagonista (Bricolage Grotesque + JetBrains Mono).
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: true,
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Informatizou — Presença digital viva',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'A Informatizou constrói presença digital viva para negócios: criação, hospedagem e manutenção de sites com uma experiência que ninguém esquece.',
        },
        { name: 'theme-color', content: '#0A0A0B' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:title', content: 'Informatizou — Presença digital viva' },
        { property: 'og:description', content: 'Não fazemos sites. Construímos presença.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'pt_BR' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },
});
