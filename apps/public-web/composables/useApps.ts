import { ICON_SVG } from './pixelIcons';

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

// Ícones pixelados coloridos com sombreamento (desenho original) — ./pixelIcons.
const G = ICON_SVG;

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
