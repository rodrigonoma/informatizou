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
  site: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="1" width="14" height="10" fill="#c3c7cb" stroke="#000"/><rect x="2" y="2" width="12" height="8" fill="#fff"/><rect x="2" y="2" width="12" height="2" fill="#0a5bd3"/><rect x="3" y="5" width="8" height="1" fill="#8a8a8a"/><rect x="3" y="7" width="9" height="1" fill="#8a8a8a"/><rect x="6" y="11" width="4" height="2" fill="#9a9ea3" stroke="#000"/><rect x="3" y="13" width="10" height="2" fill="#9a9ea3" stroke="#000"/></svg>',
  chat: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="2" width="14" height="9" fill="#25d366" stroke="#000"/><rect x="3" y="10" width="4" height="3" fill="#25d366" stroke="#000"/><rect x="4" y="6" width="2" height="2" fill="#fff"/><rect x="7" y="6" width="2" height="2" fill="#fff"/><rect x="10" y="6" width="2" height="2" fill="#fff"/></svg>',
  mail: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="3" width="14" height="10" fill="#fff" stroke="#000"/><polyline points="1,3 8,9 15,3" fill="none" stroke="#000"/></svg>',
  server: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="2" width="12" height="5" fill="#c3c7cb" stroke="#000"/><rect x="2" y="9" width="12" height="5" fill="#c3c7cb" stroke="#000"/><rect x="4" y="4" width="1" height="1" fill="#2ecc40"/><rect x="4" y="11" width="1" height="1" fill="#2ecc40"/><rect x="7" y="4" width="5" height="1" fill="#8a8a8a"/><rect x="7" y="11" width="5" height="1" fill="#8a8a8a"/></svg>',
  gear: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="6" y="1" width="4" height="14" fill="#9a9ea3"/><rect x="1" y="6" width="14" height="4" fill="#9a9ea3"/><rect x="3" y="3" width="10" height="10" fill="#c3c7cb" stroke="#000"/><rect x="6" y="6" width="4" height="4" fill="#5a5e63" stroke="#000"/></svg>',
  bag: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="5" width="10" height="9" fill="#ff5aa0" stroke="#000"/><rect x="5" y="2" width="6" height="1" fill="#000"/><rect x="5" y="3" width="1" height="2" fill="#000"/><rect x="10" y="3" width="1" height="2" fill="#000"/><rect x="5" y="8" width="6" height="1" fill="#fff"/></svg>',
  doc: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><polygon points="3,1 10,1 13,4 13,15 3,15" fill="#fff" stroke="#000"/><polyline points="10,1 10,4 13,4" fill="none" stroke="#000"/><rect x="5" y="6" width="6" height="1" fill="#0a5bd3"/><rect x="5" y="8" width="6" height="1" fill="#8a8a8a"/><rect x="5" y="10" width="5" height="1" fill="#8a8a8a"/><rect x="5" y="12" width="6" height="1" fill="#8a8a8a"/></svg>',
  phone: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="9" width="10" height="5" fill="#1f7a3d" stroke="#000"/><rect x="4" y="3" width="8" height="3" fill="#25d366" stroke="#000"/><rect x="3" y="4" width="2" height="4" fill="#25d366" stroke="#000"/><rect x="11" y="4" width="2" height="4" fill="#25d366" stroke="#000"/><rect x="6" y="11" width="1" height="1" fill="#9effb8"/><rect x="9" y="11" width="1" height="1" fill="#9effb8"/></svg>',
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
