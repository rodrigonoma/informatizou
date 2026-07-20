// Site institucional público (informatizou.com.br) — SSR para SEO.
// Direção: Apple Human Interface — claridade, deferência, profundidade.
// Tipografia: pilha do sistema (SF Pro no ecossistema Apple), sem fontes externas.
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: true,
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      // API pública (o painel do cliente chama estes endpoints no navegador).
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:4000',
      // Client ID do Google (login social). Vazio = botão do Google oculto.
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      // Embedded Signup do WhatsApp (Meta). Vazio = botão "Conectar" oculto.
      metaAppId: process.env.NUXT_PUBLIC_META_APP_ID || '',
      whatsappEsConfigId: process.env.NUXT_PUBLIC_WHATSAPP_ES_CONFIG_ID || '',
    },
  },
  app: {
    head: {
      title: 'Informatizou — tudo para digitalizar o seu negócio',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Informatizou: sites profissionais, chatbot no WhatsApp, e-mail corporativo, hospedagem, manutenção e loja online. Tudo para digitalizar o seu negócio — com demonstração antes de decidir.',
        },
        { name: 'theme-color', content: '#008080' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:title', content: 'Informatizou — tudo para digitalizar o seu negócio' },
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
