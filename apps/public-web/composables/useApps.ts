export interface AppFeature {
  t: string;
  d: string;
}

export interface OsApp {
  id: string;
  name: string;
  kind: 'product' | 'readme' | 'contact';
  accent: string;
  accent2: string;
  glyph: string; // SVG inline (stroke currentColor)
  tagline?: string;
  intro?: string;
  features?: AppFeature[];
  cta?: { label: string; href: string };
  onDesktop: boolean;
  inDock: boolean;
  w?: number;
  h?: number;
}

const MAIL = 'mailto:contato@informatizou.com.br';
const mail = (assunto: string) => `${MAIL}?subject=${encodeURIComponent(assunto)}`;

// Ícones (linha, 24x24, herdam currentColor).
const G = {
  site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><circle cx="6.5" cy="6.5" r=".6" fill="currentColor"/><circle cx="8.7" cy="6.5" r=".6" fill="currentColor"/><path d="M7 13h6M7 16h9"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a7.5 7.5 0 0 1-10.8 6.7L4 20l1.3-4A7.5 7.5 0 1 1 20 12Z"/><path d="M9 11h.01M12 11h.01M15 11h.01"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
  server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 16h6M9 10h2"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 5.5c0 8 6 14 14 14 .8 0 1.5-.6 1.6-1.4l.3-2a1.4 1.4 0 0 0-.9-1.5l-2.6-1a1.4 1.4 0 0 0-1.6.4l-.7.9a10.6 10.6 0 0 1-4.3-4.3l.9-.7a1.4 1.4 0 0 0 .4-1.6l-1-2.6A1.4 1.4 0 0 0 8.6 3.6l-2 .3A1.6 1.6 0 0 0 4.5 5.5Z"/></svg>',
};

export const APPS: OsApp[] = [
  {
    id: 'bem-vindo',
    name: 'Leia-me',
    kind: 'readme',
    accent: '#3b9dff',
    accent2: '#22d3ee',
    glyph: G.doc,
    onDesktop: true,
    inDock: false,
    w: 560,
    h: 440,
  },
  {
    id: 'criador-de-sites',
    name: 'Criador de Sites',
    kind: 'product',
    accent: '#ff6a3d',
    accent2: '#ff3d8b',
    glyph: G.site,
    tagline: 'Seu site profissional, pronto para vender.',
    intro:
      'Criamos sites institucionais sob medida — rápidos, responsivos e com a cara do seu negócio. E você vê uma demonstração antes de decidir.',
    features: [
      { t: 'Design sob medida', d: 'Nada de template genérico. Layout pensado para o seu segmento.' },
      { t: 'Pronto para o celular', d: 'Responsivo e leve em qualquer tela.' },
      { t: 'Domínio e publicação', d: 'Cuidamos de domínio, SSL e da publicação.' },
      { t: 'Demonstração antes de pagar', d: 'Você aprova a prévia antes de fechar.' },
    ],
    cta: { label: 'Pedir demonstração', href: mail('Quero um site — Criador de Sites') },
    onDesktop: true,
    inDock: true,
  },
  {
    id: 'chatbot-whatsapp',
    name: 'ChatBot WhatsApp',
    kind: 'product',
    accent: '#34c759',
    accent2: '#22d3ee',
    glyph: G.chat,
    tagline: 'Atendimento automático no WhatsApp, 24 horas.',
    intro:
      'Um assistente que responde seus clientes na hora, tira dúvidas, qualifica contatos e encaminha vendas — direto no WhatsApp do seu negócio.',
    features: [
      { t: 'Respostas instantâneas', d: 'Atende quando você não pode.' },
      { t: 'Qualifica e encaminha', d: 'Filtra curiosos e passa as oportunidades pra você.' },
      { t: 'No tom da sua marca', d: 'Fala com a linguagem e as informações da sua empresa.' },
      { t: 'Integrado ao seu site', d: 'Botão e fluxo conectados à sua presença digital.' },
    ],
    cta: { label: 'Quero um chatbot', href: mail('Quero um ChatBot no WhatsApp') },
    onDesktop: true,
    inDock: true,
  },
  {
    id: 'email-corporativo',
    name: 'E-mail Corporativo',
    kind: 'product',
    accent: '#3b9dff',
    accent2: '#a855f7',
    glyph: G.mail,
    tagline: 'E-mail com o seu domínio: voce@suaempresa.com.br.',
    intro:
      'Passe uma imagem profissional com e-mails no domínio da sua empresa — com caixa segura, antispam e suporte.',
    features: [
      { t: 'Domínio próprio', d: 'contato@suaempresa.com.br no lugar de um @gmail.' },
      { t: 'Seguro e confiável', d: 'Antispam, criptografia e backups.' },
      { t: 'Onde você já trabalha', d: 'Funciona no celular e nos apps que você usa.' },
      { t: 'Contas para a equipe', d: 'Um e-mail para cada pessoa do time.' },
    ],
    cta: { label: 'Quero e-mail próprio', href: mail('Quero E-mail Corporativo') },
    onDesktop: true,
    inDock: true,
  },
  {
    id: 'hospedagem',
    name: 'Hospedagem',
    kind: 'product',
    accent: '#a855f7',
    accent2: '#3b9dff',
    glyph: G.server,
    tagline: 'Seu site sempre no ar, rápido e seguro.',
    intro:
      'Infraestrutura gerenciada com SSL, backups automáticos e monitoramento. Você não precisa se preocupar com a parte técnica.',
    features: [
      { t: 'SSL incluído', d: 'Cadeado de segurança e HTTPS no seu domínio.' },
      { t: 'Backups automáticos', d: 'Cópias diárias para dormir tranquilo.' },
      { t: 'Monitoramento', d: 'Acompanhamos para o site não sair do ar.' },
      { t: 'Suporte de verdade', d: 'Gente pra ajudar quando precisar.' },
    ],
    cta: { label: 'Quero hospedagem', href: mail('Quero Hospedagem') },
    onDesktop: true,
    inDock: true,
  },
  {
    id: 'manutencao',
    name: 'Manutenção',
    kind: 'product',
    accent: '#22d3ee',
    accent2: '#34c759',
    glyph: G.gear,
    tagline: 'Seu site sempre atualizado e cuidado.',
    intro:
      'Plano mensal com alterações, atualizações, suporte e acompanhamento — o site evolui junto com o seu negócio.',
    features: [
      { t: 'Pequenas alterações', d: 'Trocar textos, fotos e informações quando precisar.' },
      { t: 'Atualizações', d: 'Segurança e melhorias em dia.' },
      { t: 'Relatórios', d: 'Você acompanha o que foi feito.' },
      { t: 'Suporte próximo', d: 'Fala com quem cuida do seu site.' },
    ],
    cta: { label: 'Quero manutenção', href: mail('Quero Manutenção') },
    onDesktop: true,
    inDock: true,
  },
  {
    id: 'loja-online',
    name: 'Loja Online',
    kind: 'product',
    accent: '#ff3d8b',
    accent2: '#a855f7',
    glyph: G.bag,
    tagline: 'Venda pela internet, do seu jeito.',
    intro:
      'Uma loja virtual simples de gerenciar, integrada a pagamentos e ao WhatsApp, para vender além do balcão.',
    features: [
      { t: 'Catálogo de produtos', d: 'Suas fotos, preços e descrições organizados.' },
      { t: 'Pagamento online', d: 'Receba com praticidade e segurança.' },
      { t: 'Integração com WhatsApp', d: 'Feche a venda por onde o cliente já fala.' },
      { t: 'Gestão simples', d: 'Fácil de atualizar, sem complicação técnica.' },
    ],
    cta: { label: 'Quero uma loja', href: mail('Quero uma Loja Online') },
    onDesktop: true,
    inDock: true,
  },
  {
    id: 'contato',
    name: 'Contato',
    kind: 'contact',
    accent: '#34c759',
    accent2: '#22d3ee',
    glyph: G.phone,
    cta: { label: 'Enviar e-mail', href: mail('Contato — Informatizou') },
    onDesktop: false,
    inDock: true,
    w: 480,
    h: 380,
  },
];

export function useApps() {
  const getApp = (id: string) => APPS.find((a) => a.id === id);
  return {
    apps: APPS,
    desktopApps: APPS.filter((a) => a.onDesktop),
    dockApps: APPS.filter((a) => a.inDock),
    getApp,
  };
}
