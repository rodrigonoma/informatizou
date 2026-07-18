/**
 * Construtor de conteúdo determinístico (spec §15). NÃO inventa dados —
 * fundação, preços, cardápio, prêmios, história etc. Usa apenas o que foi
 * verificado; quando falta informação, usa texto neutro (exemplo da §15).
 * Quando um provedor de IA estiver configurado, ele pode enriquecer isto;
 * este builder é o fallback que mantém o pipeline autônomo sem custo.
 */

export interface BusinessDemoInput {
  name: string;
  category?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  photoUrls?: string[];
  openingHours?: unknown;
}

export interface DemoSection {
  key: string;
  heading: string;
  body: string;
}

export interface DemoContent {
  businessName: string;
  title: string;
  subtitle: string;
  intro: string;
  about: string;
  sections: DemoSection[];
  productsOrServices: string[];
  differentials: string[];
  gallery: string[];
  location: { address?: string; city?: string; neighborhood?: string };
  contact: { phone?: string; whatsapp?: string; email?: string; instagram?: string };
  callToAction: string;
  seoTitle: string;
  seoDescription: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  bakery: 'Padaria',
  restaurant: 'Restaurante',
  pizzeria: 'Pizzaria',
  cafe: 'Cafeteria',
  clinic: 'Clínica',
  dentist: 'Consultório odontológico',
  beautysalon: 'Salão de beleza',
  barbershop: 'Barbearia',
  accountant: 'Escritório de contabilidade',
  lawyer: 'Escritório de advocacia',
  mechanic: 'Oficina mecânica',
  store: 'Loja',
  petshop: 'Pet shop',
};

function categoryLabel(category?: string | null): string {
  if (!category) return 'Estabelecimento';
  const key = category.toLowerCase().replace(/[^a-z]/g, '');
  return CATEGORY_LABEL[key] ?? 'Estabelecimento';
}

/** Constrói o conteúdo estruturado da demonstração a partir de dados verificados. */
export function buildDemoContent(input: BusinessDemoInput): DemoContent {
  const label = categoryLabel(input.category);
  const place = input.city ? ` em ${input.city}` : '';

  const differentials: string[] = [];
  if (typeof input.rating === 'number' && input.rating >= 4.5) {
    differentials.push('Bem avaliado pelos clientes');
  }
  if (typeof input.reviewCount === 'number' && input.reviewCount >= 100) {
    differentials.push('Referência na região');
  }
  if (input.address) differentials.push('Fácil acesso e localização');

  const sections: DemoSection[] = [
    {
      key: 'about',
      heading: 'Sobre',
      body: `Conheça a ${input.name}, ${label.toLowerCase()}${place}. Entre em contato para consultar produtos, serviços, disponibilidade, horários e outras informações.`,
    },
    {
      key: 'contact',
      heading: 'Atendimento',
      body: `Fale com a ${input.name} pelos canais disponíveis e confirme as informações diretamente com o estabelecimento.`,
    },
  ];

  return {
    businessName: input.name,
    title: input.name,
    subtitle: `${label}${place}`,
    intro: `${input.name} — ${label.toLowerCase()}${place}.`,
    about: `Entre em contato com a ${input.name} para consultar produtos, disponibilidade, horários e outras informações.`,
    sections,
    // Não inventa produtos/serviços: mantém vazio quando não há dado verificado.
    productsOrServices: [],
    differentials,
    gallery: input.photoUrls ?? [],
    location: {
      address: input.address ?? undefined,
      city: input.city ?? undefined,
      neighborhood: input.neighborhood ?? undefined,
    },
    contact: {
      phone: input.phone ?? undefined,
      whatsapp: input.whatsapp ?? undefined,
      email: input.email ?? undefined,
      instagram: input.instagram ?? undefined,
    },
    callToAction: `Entre em contato com a ${input.name}`,
    seoTitle: `${input.name} — ${label}${place}`,
    seoDescription: `${input.name}, ${label.toLowerCase()}${place}. Entre em contato para mais informações.`,
  };
}
