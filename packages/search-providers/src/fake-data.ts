import type { NormalizedBusinessResult } from '@informatizou/shared';
import type { FakeScenarioMeta } from './types.js';

/** Constrói um resultado normalizado fake com metadados de cenário no rawData. */
function biz(
  data: Omit<NormalizedBusinessResult, 'source' | 'rawData' | 'categories' | 'photoUrls'> &
    Partial<Pick<NormalizedBusinessResult, 'categories' | 'photoUrls'>>,
  scenario: FakeScenarioMeta,
): NormalizedBusinessResult {
  return {
    source: 'fake',
    categories: data.category ? [data.category] : [],
    photoUrls: [],
    ...data,
    rawData: scenario,
  };
}

const RP = { city: 'Ribeirão Preto', state: 'SP', country: 'BR' } as const;

/**
 * 20 empresas fictícias cobrindo TODOS os casos da spec §49.
 * Nada aqui é real — dados apenas para desenvolvimento/teste.
 */
export const FAKE_BUSINESSES: NormalizedBusinessResult[] = [
  // 1. Sem site institucional
  biz(
    {
      externalId: 'fake-001',
      name: 'Padaria Pão Quente',
      category: 'bakery',
      address: 'Rua Padre Euclides, 123 - Centro',
      neighborhood: 'Centro',
      ...RP,
      postalCode: '14010-100',
      latitude: -21.1775,
      longitude: -47.8103,
      phone: '(16) 3610-1234',
      rating: 4.6,
      reviewCount: 320,
      photoUrls: ['https://picsum.photos/seed/pao1/800/600'],
      instagram: 'https://instagram.com/padariapaoquente',
    },
    { scenario: 'NO_WEBSITE', case: 'sem site' },
  ),

  // 2. Site institucional válido
  biz(
    {
      externalId: 'fake-002',
      name: 'Restaurante Sabor da Terra',
      category: 'restaurant',
      address: 'Av. Nove de Julho, 980 - Jardim Sumaré',
      neighborhood: 'Jardim Sumaré',
      ...RP,
      postalCode: '14025-000',
      latitude: -21.1902,
      longitude: -47.8265,
      phone: '(16) 3620-4455',
      website: 'https://www.sabordaterra.com.br',
      rating: 4.4,
      reviewCount: 210,
      photoUrls: ['https://picsum.photos/seed/sabor1/800/600'],
    },
    { scenario: 'VALID', case: 'site válido' },
  ),

  // 3. Site quebrado
  biz(
    {
      externalId: 'fake-003',
      name: 'Pizzaria Forno a Lenha',
      category: 'pizzeria',
      address: 'Rua São José, 456 - Campos Elíseos',
      neighborhood: 'Campos Elíseos',
      ...RP,
      phone: '(16) 3630-7788',
      website: 'http://pizzariafornoalenha-rp.com.br',
      rating: 4.5,
      reviewCount: 175,
      photoUrls: ['https://picsum.photos/seed/pizza1/800/600'],
    },
    { scenario: 'BROKEN', case: 'site quebrado' },
  ),

  // 4. Site muito antigo
  biz(
    {
      externalId: 'fake-004',
      name: 'Auto Center Silva',
      category: 'mechanic',
      address: 'Av. Independência, 2100 - Ipiranga',
      neighborhood: 'Ipiranga',
      ...RP,
      phone: '(16) 3640-9900',
      website: 'http://www.autocentersilva.com.br',
      rating: 4.2,
      reviewCount: 95,
      photoUrls: ['https://picsum.photos/seed/auto1/800/600'],
    },
    { scenario: 'OUTDATED', case: 'site antigo' },
  ),

  // 5. Somente rede social (Instagram)
  biz(
    {
      externalId: 'fake-005',
      name: 'Salão Beleza Pura',
      category: 'beautySalon',
      address: 'Rua Duque de Caxias, 77 - Centro',
      neighborhood: 'Centro',
      ...RP,
      phone: '(16) 99711-2233',
      rating: 4.8,
      reviewCount: 140,
      photoUrls: ['https://picsum.photos/seed/salao1/800/600'],
      instagram: 'https://instagram.com/salaobelezapura',
    },
    { scenario: 'SOCIAL_ONLY', case: 'só rede social' },
  ),

  // 6. Somente marketplace (iFood)
  biz(
    {
      externalId: 'fake-006',
      name: 'Hamburgueria do Zé',
      category: 'restaurant',
      address: 'Rua Amador Bueno, 320 - Vila Tibério',
      neighborhood: 'Vila Tibério',
      ...RP,
      phone: '(16) 99822-4455',
      website: 'https://www.ifood.com.br/delivery/hamburgueria-do-ze',
      rating: 4.3,
      reviewCount: 260,
      photoUrls: ['https://picsum.photos/seed/burg1/800/600'],
    },
    { scenario: 'MARKETPLACE_ONLY', case: 'só marketplace' },
  ),

  // 7. Duplicidade (mesma empresa da #1, outra listagem)
  biz(
    {
      externalId: 'fake-007',
      name: 'Padaria Pao Quente',
      category: 'bakery',
      address: 'R. Padre Euclides, 123 - Centro',
      neighborhood: 'Centro',
      ...RP,
      phone: '(16) 3610-1234',
      rating: 4.6,
      reviewCount: 318,
      photoUrls: ['https://picsum.photos/seed/pao2/800/600'],
    },
    { scenario: 'NO_WEBSITE', case: 'duplicidade', duplicateOf: 'fake-001' },
  ),

  // 8. Empresa fechada
  biz(
    {
      externalId: 'fake-008',
      name: 'Lanchonete Central',
      category: 'restaurant',
      address: 'Praça XV de Novembro, 10 - Centro',
      neighborhood: 'Centro',
      ...RP,
      phone: '(16) 3611-0001',
      rating: 3.9,
      reviewCount: 60,
      photoUrls: [],
    },
    { scenario: 'NO_WEBSITE', case: 'empresa fechada', closed: true },
  ),

  // 9. Muitas avaliações (500+)
  biz(
    {
      externalId: 'fake-009',
      name: 'Cafeteria Grão Nobre',
      category: 'restaurant',
      address: 'Av. Presidente Vargas, 1500 - Jardim Irajá',
      neighborhood: 'Jardim Irajá',
      ...RP,
      phone: '(16) 3612-5678',
      rating: 4.7,
      reviewCount: 640,
      photoUrls: ['https://picsum.photos/seed/cafe1/800/600'],
      instagram: 'https://instagram.com/graonobrecafe',
    },
    { scenario: 'NO_WEBSITE', case: 'muitas avaliações' },
  ),

  // 10. Poucas avaliações
  biz(
    {
      externalId: 'fake-010',
      name: 'Barbearia Novo Estilo',
      category: 'beautySalon',
      address: 'Rua Visconde de Inhaúma, 45 - Centro',
      neighborhood: 'Centro',
      ...RP,
      phone: '(16) 99733-1122',
      rating: 4.9,
      reviewCount: 7,
      photoUrls: ['https://picsum.photos/seed/barber1/800/600'],
    },
    { scenario: 'NO_WEBSITE', case: 'poucas avaliações' },
  ),

  // 11. Sem telefone
  biz(
    {
      externalId: 'fake-011',
      name: 'Mercearia do Bairro',
      category: 'store',
      address: 'Rua das Palmeiras, 210 - Sumarezinho',
      neighborhood: 'Sumarezinho',
      ...RP,
      rating: 4.1,
      reviewCount: 34,
      photoUrls: ['https://picsum.photos/seed/merc1/800/600'],
    },
    { scenario: 'NO_WEBSITE', case: 'sem telefone' },
  ),

  // 12. Com e-mail empresarial
  biz(
    {
      externalId: 'fake-012',
      name: 'Clínica Odontológica Sorriso',
      category: 'dentist',
      address: 'Av. Café, 800 - Vila Amélia',
      neighborhood: 'Vila Amélia',
      ...RP,
      phone: '(16) 3613-2020',
      email: 'contato@clinicasorriso.com.br',
      rating: 4.8,
      reviewCount: 190,
      photoUrls: ['https://picsum.photos/seed/dent1/800/600'],
    },
    { scenario: 'NO_WEBSITE', case: 'com e-mail' },
  ),

  // 13. Com WhatsApp
  biz(
    {
      externalId: 'fake-013',
      name: 'Pet Shop Amigo Fiel',
      category: 'store',
      address: 'Rua Tibiriçá, 555 - Jardim Paulista',
      neighborhood: 'Jardim Paulista',
      ...RP,
      phone: '(16) 99744-8899',
      rating: 4.6,
      reviewCount: 120,
      photoUrls: ['https://picsum.photos/seed/pet1/800/600'],
      instagram: 'https://instagram.com/petamigofiel',
    },
    { scenario: 'NO_WEBSITE', case: 'com whatsapp' },
  ),

  // 14. Dados conflitantes
  biz(
    {
      externalId: 'fake-014',
      name: 'Oficina Mecânica Turbo',
      category: 'mechanic',
      address: 'Av. Costábile Romano, 900 - Nova Ribeirânia',
      neighborhood: 'Nova Ribeirânia',
      ...RP,
      phone: '(16) 3614-3131',
      rating: 4.0,
      reviewCount: 80,
      photoUrls: ['https://picsum.photos/seed/turbo1/800/600'],
    },
    { scenario: 'NO_WEBSITE', case: 'dados conflitantes', conflictingData: true },
  ),

  // 15. Opt-out (solicitou não receber contato)
  biz(
    {
      externalId: 'fake-015',
      name: 'Floricultura Jardim Secreto',
      category: 'store',
      address: 'Rua General Osório, 88 - Centro',
      neighborhood: 'Centro',
      ...RP,
      phone: '(16) 3615-4242',
      email: 'contato@jardimsecretoflores.com.br',
      rating: 4.5,
      reviewCount: 55,
      photoUrls: ['https://picsum.photos/seed/flor1/800/600'],
    },
    { scenario: 'NO_WEBSITE', case: 'opt-out', optOut: true },
  ),

  // 16. Domínio estacionado
  biz(
    {
      externalId: 'fake-016',
      name: 'Doceria Doce Encanto',
      category: 'bakery',
      address: 'Rua Álvares Cabral, 300 - Higienópolis',
      neighborhood: 'Higienópolis',
      ...RP,
      phone: '(16) 3616-5353',
      website: 'http://doceencanto.com.br',
      rating: 4.7,
      reviewCount: 130,
      photoUrls: ['https://picsum.photos/seed/doce1/800/600'],
    },
    { scenario: 'DOMAIN_PARKED', case: 'domínio estacionado' },
  ),

  // 17. Página em construção
  biz(
    {
      externalId: 'fake-017',
      name: 'Academia Corpo em Foco',
      category: 'store',
      address: 'Av. Wladimir Meirelles Ferreira, 1200 - Jardim Botânico',
      neighborhood: 'Jardim Botânico',
      ...RP,
      phone: '(16) 3617-6464',
      website: 'http://corpoemfoco.com.br',
      rating: 4.4,
      reviewCount: 210,
      photoUrls: ['https://picsum.photos/seed/aca1/800/600'],
    },
    { scenario: 'UNDER_CONSTRUCTION', case: 'em construção' },
  ),

  // 18. Imagens ausentes
  biz(
    {
      externalId: 'fake-018',
      name: 'Sorveteria Gelato Real',
      category: 'restaurant',
      address: 'Rua Barão do Amazonas, 640 - Centro',
      neighborhood: 'Centro',
      ...RP,
      phone: '(16) 3618-7575',
      rating: 4.6,
      reviewCount: 98,
      photoUrls: [],
    },
    { scenario: 'NO_WEBSITE', case: 'imagens ausentes' },
  ),

  // 19. Score alto (sem site, muitas avaliações, nota alta, contatos ricos)
  biz(
    {
      externalId: 'fake-019',
      name: 'Restaurante Cantina Bella',
      category: 'restaurant',
      address: 'Av. Portugal, 1500 - Jardim Canadá',
      neighborhood: 'Jardim Canadá',
      ...RP,
      phone: '(16) 99755-3344',
      email: 'comercial@cantinabella.com.br',
      rating: 4.9,
      reviewCount: 780,
      photoUrls: [
        'https://picsum.photos/seed/cant1/800/600',
        'https://picsum.photos/seed/cant2/800/600',
      ],
      instagram: 'https://instagram.com/cantinabella',
      facebook: 'https://facebook.com/cantinabella',
    },
    { scenario: 'NO_WEBSITE', case: 'score alto', expectedScore: 'HIGH' },
  ),

  // 20. Score baixo (pouca informação, sem contato válido)
  biz(
    {
      externalId: 'fake-020',
      name: 'Quiosque Lanches Rápidos',
      category: 'restaurant',
      address: 'Parque Municipal - s/n',
      ...RP,
      rating: 3.5,
      reviewCount: 4,
      photoUrls: [],
    },
    { scenario: 'NO_WEBSITE', case: 'score baixo', expectedScore: 'LOW' },
  ),
];
