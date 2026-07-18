# SPEC FINAL — Plataforma Informatizou de Prospecção e Geração de Sites

## 1. Visão do produto

Construir uma plataforma chamada **Informatizou Prospect**, hospedada na VPS do proprietário e integrada ao domínio:

```text
https://www.informatizou.com.br
```

A plataforma deverá:

1. pesquisar empresas brasileiras por segmento e localização;
2. identificar negócios sem site institucional válido;
3. armazenar informações públicas do estabelecimento;
4. calcular uma pontuação de oportunidade comercial;
5. selecionar os melhores leads;
6. gerar automaticamente um site institucional demonstrativo;
7. publicar a demonstração na infraestrutura da Informatizou;
8. disponibilizar a demonstração por 10 dias;
9. gerar screenshots;
10. gerar mensagens comerciais personalizadas;
11. permitir contato por e-mail e WhatsApp dentro das regras permitidas;
12. registrar toda a operação em um CRM;
13. acompanhar acessos, respostas, propostas e vendas;
14. converter a demonstração em um site oficial quando o cliente comprar;
15. oferecer criação, hospedagem, suporte e manutenção mensal.

Exemplo:

```text
Empresa: Padaria Maresias

Demonstração:
https://demo.informatizou.com.br/padaria-maresias

Expiração:
10 dias após a publicação
```

O sistema deve funcionar como uma plataforma de:

```text
Pesquisa de empresas
        ↓
Qualificação de leads
        ↓
Geração de demonstrações
        ↓
Prospecção comercial
        ↓
CRM
        ↓
Venda do site
        ↓
Manutenção mensal
```

---

# 2. Princípios obrigatórios

O sistema deve seguir estes princípios:

1. não se passar oficialmente pelo estabelecimento;
2. não publicar informações inventadas;
3. não apresentar a demonstração como site oficial;
4. não indexar as demonstrações em mecanismos de busca;
5. não realizar scraping agressivo diretamente no HTML do Google Maps;
6. utilizar provedores autorizados ou configuráveis;
7. manter registro da origem dos dados;
8. respeitar pedidos de remoção;
9. evitar contatos duplicados;
10. possuir lista de bloqueio;
11. não realizar spam;
12. não enviar WhatsApp automaticamente por automações não oficiais;
13. utilizar API oficial do WhatsApp quando o canal estiver habilitado;
14. exigir aprovação ou condição válida antes do envio;
15. proteger o domínio, IP, e-mail e número da Informatizou;
16. possuir auditoria de todas as ações;
17. permitir operação manual, semiautomática e automática controlada.

---

# 3. Domínios e URLs

## 3.1 Site institucional da Informatizou

```text
https://www.informatizou.com.br
```

Deverá conter:

* apresentação da Informatizou;
* serviços;
* criação de sites;
* planos de manutenção;
* portfólio;
* perguntas frequentes;
* formulário de contato;
* política de privacidade;
* termos de uso;
* informações comerciais;
* área de login.

## 3.2 Painel administrativo

Preferencialmente:

```text
https://app.informatizou.com.br
```

## 3.3 API

```text
https://api.informatizou.com.br
```

## 3.4 Demonstrações

Utilizar:

```text
https://demo.informatizou.com.br/{slug}
```

Exemplo:

```text
https://demo.informatizou.com.br/padaria-maresias
```

Não utilizar as demonstrações diretamente na raiz de:

```text
www.informatizou.com.br/{slug}
```

Separar as demonstrações em subdomínio para facilitar:

* segurança;
* certificados;
* expiração;
* publicação;
* remoção;
* logs;
* métricas;
* regras de cache;
* controle de indexação;
* migração para domínio oficial.

---

# 4. Stack técnica

Utilizar um monorepo TypeScript.

## Backend

* Node.js 22 ou superior;
* TypeScript estrito;
* NestJS;
* Prisma ORM;
* PostgreSQL;
* Redis;
* BullMQ;
* Zod;
* Pino;
* Swagger/OpenAPI.

## Frontend administrativo

* Next.js;
* React;
* TypeScript;
* Tailwind CSS;
* shadcn/ui;
* TanStack Query;
* React Hook Form;
* Zod.

## Renderização das demonstrações

* Next.js;
* React;
* templates reutilizáveis;
* conteúdo armazenado em JSON;
* renderização dinâmica por slug;
* cache controlado;
* sem necessidade de criar um projeto separado para cada lead.

## Navegação automatizada

* Playwright.

## Armazenamento

Preferencialmente:

* MinIO na VPS;
* ou armazenamento S3 compatível.

Armazenar:

* screenshots;
* imagens tratadas;
* exportações;
* logos;
* backups selecionados.

## IA

Criar abstração para provedores de inteligência artificial.

Primeira integração:

* Anthropic Claude API.

Permitir futuramente:

* OpenAI;
* modelos locais;
* outros provedores.

## E-mail

Criar abstração compatível com:

* SMTP;
* Amazon SES;
* Resend;
* Mailgun;
* outro provedor configurável.

## WhatsApp

Somente integração oficial configurável, como:

* WhatsApp Business Platform;
* Meta Cloud API;
* provedor oficial autorizado.

Não implementar:

* automação por WhatsApp Web;
* controle de navegador para enviar WhatsApp;
* bibliotecas que imitam um usuário;
* mecanismos destinados a evitar bloqueios.

---

# 5. Estrutura do monorepo

```text
informatizou-prospect/
├── apps/
│   ├── api/
│   ├── admin-web/
│   ├── public-web/
│   ├── demo-renderer/
│   ├── worker/
│   └── cli/
├── packages/
│   ├── database/
│   ├── shared/
│   ├── auth/
│   ├── config/
│   ├── logging/
│   ├── providers/
│   ├── search-providers/
│   ├── enrichment/
│   ├── website-verification/
│   ├── scoring/
│   ├── ai/
│   ├── demo-templates/
│   ├── outreach/
│   ├── storage/
│   ├── analytics/
│   └── testing/
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   ├── scripts/
│   ├── backups/
│   └── monitoring/
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── deployment/
│   ├── operations/
│   └── compliance/
├── docker-compose.yml
├── docker-compose.production.yml
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
├── .env.example
└── README.md
```

---

# 6. Perfis de usuário

Criar inicialmente:

```ts
enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  SALES = "SALES",
  REVIEWER = "REVIEWER",
  VIEWER = "VIEWER"
}
```

## ADMIN

Pode:

* configurar a plataforma;
* gerenciar usuários;
* criar campanhas;
* publicar demos;
* aprovar contatos;
* configurar integrações;
* visualizar custos;
* visualizar logs;
* excluir dados;
* alterar regras.

## MANAGER

Pode:

* criar campanhas;
* aprovar leads;
* gerar demos;
* aprovar mensagens;
* acompanhar vendas;
* gerar relatórios.

## SALES

Pode:

* visualizar leads atribuídos;
* editar mensagens;
* realizar contatos permitidos;
* registrar atividades;
* mover leads no pipeline.

## REVIEWER

Pode:

* revisar dados;
* revisar imagens;
* revisar conteúdo;
* aprovar ou rejeitar demos.

## VIEWER

Pode apenas visualizar dados permitidos.

---

# 7. Fontes de empresas

Criar uma abstração:

```ts
interface BusinessSearchProvider {
  name: string;

  search(
    input: BusinessSearchInput
  ): Promise<BusinessSearchResult>;

  getBusinessDetails?(
    externalId: string
  ): Promise<BusinessDetailsResult>;
}
```

Suportar inicialmente:

1. provider fake;
2. importação CSV;
3. Google Places API, quando configurada;
4. Apify, quando configurado;
5. SerpAPI, quando configurado;
6. Outscraper, quando configurado.

Não acoplar o sistema a um único fornecedor.

## Entrada da pesquisa

```ts
interface BusinessSearchInput {
  segment: string;
  location: string;
  city?: string;
  state?: string;
  country: string;
  radiusKm?: number;
  limit: number;
  minimumRating?: number;
  minimumReviewCount?: number;
  language: string;
}
```

## Resultado normalizado

```ts
interface NormalizedBusinessResult {
  externalId: string;
  source: string;

  name: string;
  category?: string;
  categories: string[];

  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;

  latitude?: number;
  longitude?: number;

  phone?: string;
  website?: string;

  rating?: number;
  reviewCount?: number;

  openingHours?: unknown;
  photoUrls: string[];

  sourceUrl?: string;
  rawData: unknown;
}
```

---

# 8. Criação de campanhas

O usuário deverá criar uma campanha com:

```json
{
  "name": "Padarias sem site em Ribeirão Preto",
  "segment": "padarias",
  "location": "Ribeirão Preto, SP",
  "radiusKm": 30,
  "resultLimit": 300,
  "minimumRating": 4.2,
  "minimumReviewCount": 30,
  "websiteFilter": "WITHOUT_VALID_INSTITUTIONAL_WEBSITE",
  "minimumScoreForDemo": 80,
  "maximumDemos": 25,
  "provider": "GOOGLE_PLACES",
  "automaticDemoGeneration": false
}
```

Statuses:

```ts
enum CampaignStatus {
  DRAFT = "DRAFT",
  QUEUED = "QUEUED",
  RUNNING = "RUNNING",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED"
}
```

Exibir progresso:

```text
Empresas encontradas
Empresas processadas
Duplicidades removidas
Empresas com site
Empresas sem site
Leads qualificados
Demos criadas
Erros
Custo estimado
```

---

# 9. Deduplicação

Deduplicar empresas utilizando:

1. ID externo do provedor;
2. telefone normalizado;
3. domínio;
4. nome normalizado;
5. endereço;
6. coordenadas;
7. similaridade textual;
8. combinação de múltiplos sinais.

Criar uma pontuação de similaridade.

```ts
interface DuplicateAnalysis {
  isDuplicate: boolean;
  confidence: number;
  matchedBusinessId?: string;
  reasons: string[];
}
```

Casos de baixa confiança devem entrar em revisão.

---

# 10. Verificação de site institucional

Não confiar somente no campo `website`.

Executar:

1. verificar URL informada pelo provedor;
2. seguir redirects;
3. validar DNS;
4. validar HTTP e HTTPS;
5. verificar certificado;
6. carregar a página de forma segura;
7. comparar nome, endereço, telefone e marca;
8. identificar marketplace;
9. identificar rede social;
10. identificar domínio estacionado;
11. identificar site quebrado;
12. identificar página em construção;
13. identificar site antigo ou insuficiente;
14. localizar possíveis domínios por busca autorizada.

Statuses:

```ts
enum WebsiteStatus {
  NO_WEBSITE = "NO_WEBSITE",
  VALID_INSTITUTIONAL_WEBSITE = "VALID_INSTITUTIONAL_WEBSITE",
  OUTDATED_WEBSITE = "OUTDATED_WEBSITE",
  BROKEN_WEBSITE = "BROKEN_WEBSITE",
  SOCIAL_MEDIA_ONLY = "SOCIAL_MEDIA_ONLY",
  MARKETPLACE_ONLY = "MARKETPLACE_ONLY",
  LINK_AGGREGATOR_ONLY = "LINK_AGGREGATOR_ONLY",
  DOMAIN_PARKED = "DOMAIN_PARKED",
  UNDER_CONSTRUCTION = "UNDER_CONSTRUCTION",
  UNKNOWN = "UNKNOWN"
}
```

## Site institucional válido

Deve apresentar sinais como:

* domínio próprio;
* nome compatível;
* dados do estabelecimento;
* endereço ou telefone compatível;
* conteúdo relacionado à empresa.

## Não considerar site institucional

* Instagram;
* Facebook;
* TikTok;
* Google Maps;
* iFood;
* TripAdvisor;
* marketplace;
* agregador;
* página de catálogo genérico;
* domínio estacionado.

---

# 11. Enriquecimento do lead

Pesquisar, quando disponível:

* nome;
* categoria;
* endereço;
* bairro;
* cidade;
* telefone;
* telefone comercial;
* WhatsApp empresarial;
* e-mail empresarial;
* site;
* Instagram;
* Facebook;
* horário;
* serviços;
* produtos;
* descrição pública;
* fotos;
* logo;
* nota;
* quantidade de avaliações;
* frases recorrentes nas avaliações;
* situação operacional;
* data da última atividade identificável.

Não coletar deliberadamente:

* CPF;
* documentos pessoais;
* dados bancários;
* dados sensíveis;
* informações pessoais desnecessárias.

## Proveniência

Todo dado enriquecido deverá possuir:

```ts
interface DataProvenance {
  source: string;
  sourceUrl?: string;
  collectedAt: Date;
  confidence: number;
  collector: string;
}
```

---

# 12. Validação dos contatos

## Telefone

* converter para padrão E.164;
* validar DDD;
* registrar número original;
* identificar fixo ou móvel quando possível;
* não presumir WhatsApp apenas por ser celular.

## E-mail

* validar sintaxe;
* validar domínio;
* verificar registros MX;
* classificar e-mail genérico ou pessoal;
* priorizar e-mails empresariais como:

  * contato@;
  * atendimento@;
  * comercial@;
  * vendas@.

## WhatsApp

O campo deverá possuir:

```ts
interface WhatsAppContact {
  phone: string;
  status:
    | "UNKNOWN"
    | "AVAILABLE"
    | "UNAVAILABLE"
    | "OPTED_IN"
    | "OPTED_OUT";

  verificationSource?: string;
  verifiedAt?: Date;
}
```

Não considerar um número automaticamente autorizado a receber mensagem apenas porque possui WhatsApp.

---

# 13. Score comercial

Criar score de 0 a 100.

## Regras iniciais

```text
Sem site institucional:                  +25
Site quebrado:                           +18
Site muito antigo:                       +12
Somente rede social:                     +15
Somente marketplace:                     +13

Mais de 500 avaliações:                  +15
Mais de 200 avaliações:                  +12
Mais de 100 avaliações:                  +10
Mais de 50 avaliações:                   +7

Nota >= 4,7:                             +12
Nota >= 4,5:                             +10
Nota >= 4,2:                             +6

Possui telefone comercial:               +5
Possui e-mail empresarial:               +7
Possui Instagram:                        +5
Instagram aparentemente ativo:           +5
Possui fotos adequadas:                  +4
Endereço confirmado:                     +3
Negócio aparentemente ativo:             +5

Sem contato válido:                     -20
Dados inconsistentes:                   -15
Pouca informação pública:               -10
Já recebeu contato recentemente:        -20
Site institucional válido:              -40

Empresa fechada:                         rejeitar
Duplicidade confirmada:                  rejeitar
Solicitou não receber contato:           rejeitar
```

## Resultado

```ts
interface ScoreResult {
  total: number;

  category:
    | "EXCELLENT"
    | "STRONG"
    | "MODERATE"
    | "WEAK"
    | "REJECTED";

  items: Array<{
    rule: string;
    points: number;
    reason: string;
  }>;
}
```

Categorias:

```text
90–100: excelente
75–89: forte
60–74: moderado
40–59: fraco
0–39: baixa prioridade
```

As regras devem ser configuráveis no painel administrativo.

---

# 14. Fila de revisão

Antes de gerar uma demonstração, o sistema deverá verificar:

* nome correto;
* empresa ativa;
* endereço correto;
* telefone correto;
* contatos;
* fotos;
* logo;
* presença ou ausência de site;
* possível duplicidade;
* informações conflitantes;
* bloqueio de contato;
* score mínimo.

Statuses:

```ts
enum ReviewStatus {
  NOT_REVIEWED = "NOT_REVIEWED",
  AUTOMATICALLY_APPROVED = "AUTOMATICALLY_APPROVED",
  MANUAL_REVIEW_REQUIRED = "MANUAL_REVIEW_REQUIRED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}
```

O sistema deve suportar geração automática apenas para leads com:

```text
score mínimo configurado
dados com confiança suficiente
sem inconsistências
sem bloqueio
sem duplicidade
```

No início, usar aprovação manual por padrão.

---

# 15. Geração do conteúdo do site

Criar:

```ts
interface AiProvider {
  generateBusinessSummary(
    input: BusinessContext
  ): Promise<BusinessSummary>;

  generateWebsiteContent(
    input: WebsiteGenerationInput
  ): Promise<WebsiteContent>;

  generateOutreachMessage(
    input: OutreachGenerationInput
  ): Promise<OutreachMessageResult>;

  reviewGeneratedContent(
    input: ContentReviewInput
  ): Promise<ContentReviewResult>;
}
```

## Conteúdo do site

Gerar:

* título;
* subtítulo;
* introdução;
* apresentação;
* produtos ou serviços;
* diferenciais;
* galeria;
* localização;
* horários;
* telefone;
* WhatsApp, se confirmado;
* chamada para ação;
* SEO title;
* SEO description.

## Proibições

Não inventar:

* ano de fundação;
* número de clientes;
* quantidade de funcionários;
* preços;
* promoções;
* cardápio;
* serviços;
* certificações;
* prêmios;
* depoimentos;
* garantia;
* entrega;
* atendimento 24 horas;
* formas de pagamento;
* história da empresa.

Quando não houver informação, usar texto neutro.

Exemplo:

```text
Entre em contato com a Padaria Maresias para consultar produtos,
disponibilidade, horários e outras informações.
```

---

# 16. Templates de demonstração

Criar no mínimo:

1. `modern-food`;
2. `local-classic`;
3. `professional-services`;
4. `health-clean`;
5. `beauty-elegant`;
6. `automotive-dark`;
7. `retail-modern`.

Cada template deve ser:

* responsivo;
* rápido;
* acessível;
* editável;
* compatível com celular;
* reutilizável;
* visualmente profissional;
* baseado em dados estruturados;
* sem conteúdo fixo do lead no código.

## Seleção

```ts
const templateByCategory = {
  bakery: "modern-food",
  restaurant: "modern-food",
  pizzeria: "modern-food",
  clinic: "health-clean",
  dentist: "health-clean",
  beautySalon: "beauty-elegant",
  accountant: "professional-services",
  lawyer: "professional-services",
  mechanic: "automotive-dark",
  store: "retail-modern",
  default: "local-classic"
};
```

---

# 17. Imagens

Prioridade:

1. imagens oficiais disponibilizadas pela empresa;
2. imagens públicas cujo uso seja adequado e permitido;
3. banco de imagens licenciado;
4. placeholders;
5. imagens geradas, desde que claramente genéricas e não enganosas.

Registrar:

```ts
interface ImageAsset {
  id: string;
  businessId?: string;
  demoSiteId?: string;

  sourceType:
    | "BUSINESS_PUBLIC_SOURCE"
    | "LICENSED_STOCK"
    | "GENERATED"
    | "PLACEHOLDER";

  sourceUrl?: string;
  license?: string;
  storageUrl: string;
  hash: string;
  createdAt: Date;
}
```

Não reutilizar imagens sem origem registrada.

---

# 18. Demonstrações

Modelo:

```ts
enum DemoSiteStatus {
  DRAFT = "DRAFT",
  GENERATING = "GENERATING",
  REVIEW_REQUIRED = "REVIEW_REQUIRED",
  APPROVED = "APPROVED",
  PUBLISHED = "PUBLISHED",
  EXPIRED = "EXPIRED",
  SOLD = "SOLD",
  DISABLED = "DISABLED",
  DELETED = "DELETED"
}
```

```ts
interface DemoSite {
  id: string;
  leadId: string;
  slug: string;
  template: string;
  status: DemoSiteStatus;

  content: unknown;
  publicUrl?: string;

  publishedAt?: Date;
  expiresAt?: Date;
  expiredAt?: Date;

  accessCount: number;
  uniqueVisitorCount: number;

  createdAt: Date;
  updatedAt: Date;
}
```

## URL

```text
https://demo.informatizou.com.br/{slug}
```

## Slug

Exemplo:

```text
padaria-maresias
```

Regras:

* minúsculas;
* sem acentos;
* hífens;
* único;
* não reutilizar slug de outra empresa;
* permitir sufixo de cidade em caso de conflito.

Exemplo:

```text
padaria-maresias-ribeirao-preto
```

---

# 19. Avisos obrigatórios

No topo da demonstração:

```text
Demonstração de site

Esta é uma proposta visual criada pela Informatizou e ainda não representa
o site oficial deste estabelecimento.
```

No rodapé:

```text
Demonstração não oficial criada para apresentação comercial.

As informações exibidas foram obtidas de fontes públicas e devem ser
confirmadas pelo estabelecimento antes da publicação oficial.
```

Exibir de forma visível, mas sem prejudicar excessivamente o design.

---

# 20. Proibição de indexação

Toda demonstração deverá possuir:

```html
<meta name="robots" content="noindex, nofollow, noarchive">
```

Também enviar:

```http
X-Robots-Tag: noindex, nofollow, noarchive
```

Regras adicionais:

* não incluir demos no sitemap;
* não gerar schema oficial de empresa local;
* não cadastrar a demo em plataformas externas;
* não tentar posicionar a demonstração por nome da empresa;
* não servir demos expiradas como páginas comerciais do estabelecimento.

---

# 21. Expiração em 10 dias

Ao publicar:

```ts
expiresAt = addDays(publishedAt, 10);
```

Criar worker recorrente:

```text
demo-expiration-worker
```

Executar, no máximo, a cada hora.

Ao expirar:

1. alterar status para `EXPIRED`;
2. remover o conteúdo comercial da empresa da visualização pública;
3. manter o registro interno;
4. cancelar novas mensagens relacionadas à demo;
5. apresentar página genérica da Informatizou;
6. permitir renovação manual;
7. registrar atividade.

Página expirada:

```text
Esta demonstração não está mais disponível.

O projeto foi criado pela Informatizou como uma proposta visual temporária.

Deseja criar um site profissional para sua empresa?

[Falar com a Informatizou]
```

## Renovação

Usuários autorizados poderão estender:

* 3 dias;
* 5 dias;
* 10 dias;
* data personalizada.

Toda renovação deverá ser auditada.

---

# 22. Screenshots

Usar Playwright.

Gerar:

```text
Desktop: 1440 × 1000
Mobile: 390 × 844
Social preview: 1200 × 630
Full page: página completa
```

Modelo:

```ts
interface SiteScreenshot {
  id: string;
  demoSiteId: string;

  type:
    | "DESKTOP"
    | "MOBILE"
    | "SOCIAL_PREVIEW"
    | "FULL_PAGE";

  storageUrl: string;
  width: number;
  height: number;
  createdAt: Date;
}
```

---

# 23. Analytics da demonstração

Registrar:

* visualização;
* visitante único aproximado;
* data;
* URL;
* origem;
* dispositivo;
* navegador;
* clique em telefone;
* clique em WhatsApp;
* clique em mapa;
* clique no contato da Informatizou;
* expiração.

Não coletar dados excessivos.

## Token de campanha

Adicionar parâmetro seguro à mensagem:

```text
https://demo.informatizou.com.br/padaria-maresias?ref=TOKEN
```

O token deve:

* não revelar ID sequencial;
* não conter dados pessoais;
* permitir atribuição de campanha;
* ser revogável.

---

# 24. CRM

Statuses:

```ts
enum LeadStatus {
  NEW = "NEW",
  PROCESSING = "PROCESSING",
  QUALIFIED = "QUALIFIED",
  REJECTED = "REJECTED",
  REVIEW_REQUIRED = "REVIEW_REQUIRED",
  DEMO_GENERATING = "DEMO_GENERATING",
  DEMO_REVIEW = "DEMO_REVIEW",
  DEMO_READY = "DEMO_READY",
  READY_TO_CONTACT = "READY_TO_CONTACT",
  CONTACT_APPROVAL_REQUIRED = "CONTACT_APPROVAL_REQUIRED",
  CONTACTED = "CONTACTED",
  DELIVERED = "DELIVERED",
  OPENED = "OPENED",
  DEMO_VIEWED = "DEMO_VIEWED",
  REPLIED = "REPLIED",
  INTERESTED = "INTERESTED",
  MEETING_SCHEDULED = "MEETING_SCHEDULED",
  PROPOSAL_SENT = "PROPOSAL_SENT",
  NEGOTIATING = "NEGOTIATING",
  WON = "WON",
  LOST = "LOST",
  EXPIRED = "EXPIRED",
  DO_NOT_CONTACT = "DO_NOT_CONTACT"
}
```

Exibir:

* empresa;
* segmento;
* cidade;
* score;
* nota;
* avaliações;
* website status;
* telefone;
* e-mail;
* WhatsApp;
* Instagram;
* origem;
* responsável;
* demo;
* expiração;
* visualizações;
* mensagem;
* contatos;
* respostas;
* proposta;
* valor;
* plano;
* observações;
* histórico.

---

# 25. Pipeline Kanban

Colunas iniciais:

```text
Novos
Qualificados
Em revisão
Demo em criação
Demo pronta
Aguardando aprovação de contato
Contatados
Visualizaram
Responderam
Interessados
Reunião
Proposta enviada
Negociação
Ganhos
Perdidos
Não contatar
```

Suportar:

* drag and drop;
* filtros;
* responsável;
* prioridade;
* segmento;
* campanha;
* data;
* expiração.

---

# 26. Mensagens comerciais

Criar versões para:

* e-mail;
* WhatsApp autorizado;
* Instagram Direct manual;
* ligação;
* follow-up;
* resposta a interesse;
* resposta a recusa.

## Mensagem-base

```text
Olá! Tudo bem?

Encontrei a {{businessName}} ao pesquisar estabelecimentos da região e
percebi que vocês possuem uma boa presença online, mas não localizei um
site institucional próprio.

Por isso, preparei sem compromisso uma demonstração personalizada de como
o site da empresa poderia ficar:

{{demoUrl}}

A demonstração ficará disponível por 10 dias para que vocês possam
visualizar e avaliar com tranquilidade.

Caso gostem do projeto, podemos ajustar textos, fotos, domínio, WhatsApp e
demais informações, além de colocar o site oficial no ar.

Também oferecemos um plano mensal opcional para hospedagem, manutenção,
segurança, backups e atualizações.

Caso não tenham interesse, basta informar e não realizaremos novos contatos.
```

## Mensagem curta

```text
Olá! Preparei uma demonstração gratuita de site para a {{businessName}}:

{{demoUrl}}

Ela ficará disponível por 10 dias. É apenas uma proposta visual, sem
compromisso, e ainda não representa o site oficial da empresa.

Caso gostem, podemos personalizar e publicar o site oficial, além de cuidar
da hospedagem e manutenção mensal.

Se não houver interesse, é só me avisar.
```

## Regras

Não usar:

* falsa urgência;
* alegação de parceria;
* alegação de solicitação inexistente;
* promessa de vendas garantidas;
* informação inventada;
* ameaça de retirar algo que já pertence à empresa;
* linguagem manipulativa;
* mensagens repetidas em excesso.

---

# 27. Regras de contato

Criar modos:

```ts
enum OutreachMode {
  MANUAL = "MANUAL",
  APPROVAL_REQUIRED = "APPROVAL_REQUIRED",
  AUTOMATIC_WHEN_ALLOWED = "AUTOMATIC_WHEN_ALLOWED"
}
```

Configuração padrão:

```text
MANUAL ou APPROVAL_REQUIRED
```

## E-mail

O sistema poderá enviar e-mail empresarial quando:

* o endereço tiver origem registrada;
* o domínio for válido;
* o contato não estiver bloqueado;
* a mensagem estiver aprovada;
* a campanha respeitar limites;
* houver identificação da Informatizou;
* houver forma de interromper contatos.

Todo e-mail deve conter:

```text
Informatizou
Site oficial: https://www.informatizou.com.br

Caso não queira receber novas mensagens, responda solicitando a remoção.
```

## WhatsApp

Somente enviar quando:

* a integração oficial estiver configurada;
* o contato estiver em estado permitido;
* houver opt-in ou outra condição válida para o canal;
* o template, quando exigido, estiver aprovado;
* o contato não estiver bloqueado;
* a política da plataforma permitir o envio.

Caso não seja permitido, o sistema deverá:

* gerar a mensagem;
* colocá-la para revisão;
* permitir cópia manual;
* não realizar disparo.

---

# 28. Agente comercial

Criar um agente de IA para auxiliar, não para ignorar as regras.

Responsabilidades:

1. selecionar leads aptos;
2. gerar mensagens;
3. personalizar abordagem;
4. resumir informações do comércio;
5. sugerir melhor canal;
6. sugerir melhor horário;
7. acompanhar expiração;
8. sugerir follow-up;
9. classificar respostas;
10. criar tarefa para vendedor;
11. registrar atividades;
12. interromper contatos quando solicitado.

O agente não pode:

* contornar aprovação;
* remover bloqueios;
* enviar por canal não autorizado;
* inventar consentimento;
* alterar dados para viabilizar envio;
* continuar após opt-out;
* enviar repetidamente;
* ocultar a identidade da Informatizou.

## Decisão do agente

```ts
interface OutreachDecision {
  eligible: boolean;
  recommendedChannel?: "EMAIL" | "WHATSAPP" | "PHONE" | "MANUAL";
  requiresApproval: boolean;
  reasons: string[];
  blockingReasons: string[];
}
```

---

# 29. Opt-out e lista de supressão

Criar lista central:

```ts
interface SuppressionEntry {
  id: string;

  businessId?: string;
  phone?: string;
  email?: string;
  domain?: string;

  reason:
    | "REQUESTED"
    | "COMPLAINT"
    | "INVALID_CONTACT"
    | "BLOCKED_BY_ADMIN"
    | "LEGAL"
    | "OTHER";

  notes?: string;
  createdAt: Date;
}
```

Antes de qualquer envio, consultar a lista.

Quando o lead disser:

```text
não tenho interesse
não envie mais
remova meu número
pare de enviar
```

O sistema deverá:

1. classificar como opt-out;
2. inserir na lista;
3. cancelar mensagens agendadas;
4. marcar como `DO_NOT_CONTACT`;
5. registrar a solicitação;
6. impedir novos contatos por todos os canais configurados.

---

# 30. Follow-up

Configurar no máximo uma quantidade limitada.

Padrão recomendado:

```text
Contato inicial
1 follow-up após 3 a 5 dias
Nenhum novo contato após recusa ou opt-out
```

O sistema deve tornar o limite configurável.

Não enviar follow-up quando:

* o lead respondeu;
* houve opt-out;
* o contato falhou definitivamente;
* a demo expirou;
* o lead foi vendido;
* a campanha foi pausada;
* a mensagem não estiver aprovada;
* o canal não permitir.

---

# 31. Oferta comercial

Criar cadastro de produtos.

## Implantação

Exemplos de itens:

* criação do site;
* personalização;
* domínio;
* formulário;
* WhatsApp;
* mapa;
* SEO básico;
* analytics;
* configuração inicial.

## Manutenção mensal

Exemplos:

* hospedagem;
* certificado SSL;
* backups;
* atualizações;
* pequenas alterações;
* monitoramento;
* suporte;
* relatórios;
* segurança.

Modelo:

```ts
interface ProductPlan {
  id: string;
  name: string;
  type: "ONE_TIME" | "MONTHLY";
  description: string;
  features: string[];
  priceCents: number;
  active: boolean;
}
```

Permitir valores personalizados na proposta.

---

# 32. Propostas

Criar geração de proposta com:

* empresa;
* responsável;
* descrição;
* escopo;
* valor de implantação;
* mensalidade;
* prazo;
* condições;
* validade;
* itens incluídos;
* itens não incluídos;
* dados da Informatizou.

Statuses:

```ts
enum ProposalStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  VIEWED = "VIEWED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED"
}
```

Inicialmente, gerar HTML e PDF.

---

# 33. Conversão da demo em site oficial

Quando o lead for vendido:

1. alterar status para `WON`;
2. marcar demo como `SOLD`;
3. copiar conteúdo para um projeto oficial;
4. criar checklist de onboarding;
5. solicitar confirmação dos dados;
6. solicitar imagens oficiais;
7. solicitar logo;
8. solicitar domínio;
9. solicitar textos;
10. configurar hospedagem;
11. remover o aviso de demonstração;
12. permitir indexação somente após aprovação;
13. configurar analytics;
14. configurar backups;
15. registrar plano mensal.

## Site oficial

Poderá ser publicado:

```text
https://www.nomedocliente.com.br
```

ou temporariamente:

```text
https://clientes.informatizou.com.br/nome-do-cliente
```

O sistema deve manter separação completa entre:

* demo;
* site oficial;
* site institucional da Informatizou.

---

# 34. Modelo de dados

Criar as entidades:

```text
User
UserSession
AuditLog

SearchCampaign
CampaignExecution
CampaignCost

Business
BusinessCategory
BusinessSourceRecord
BusinessContact
BusinessSocialProfile
BusinessImage
BusinessReviewSummary

WebsiteVerification
WebsiteCandidate

Lead
LeadScore
LeadReview
LeadAssignment
LeadActivity
LeadTag

DemoSite
DemoSiteVersion
DemoSitePublication
SiteScreenshot
DemoAnalyticsEvent

OutreachMessage
OutreachApproval
OutreachAttempt
OutreachConversation
OutreachResponse
SuppressionEntry

ProductPlan
Proposal
ProposalItem

Customer
CustomerSite
CustomerSubscription
CustomerOnboardingTask

Integration
ProviderUsage
SystemSetting
JobExecution
ExportFile
```

Todas as entidades devem possuir:

```text
id
createdAt
updatedAt
```

Entidades críticas devem possuir:

```text
createdBy
updatedBy
deletedAt
version
```

---

# 35. API REST

## Autenticação

```text
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
```

## Campanhas

```text
POST   /campaigns
GET    /campaigns
GET    /campaigns/:id
PATCH  /campaigns/:id
POST   /campaigns/:id/run
POST   /campaigns/:id/pause
POST   /campaigns/:id/resume
POST   /campaigns/:id/cancel
GET    /campaigns/:id/progress
GET    /campaigns/:id/costs
```

## Empresas

```text
GET    /businesses
GET    /businesses/:id
PATCH  /businesses/:id
POST   /businesses/:id/reverify
POST   /businesses/import
```

## Leads

```text
GET    /leads
GET    /leads/:id
PATCH  /leads/:id
POST   /leads/:id/qualify
POST   /leads/:id/reject
POST   /leads/:id/assign
POST   /leads/:id/review
POST   /leads/:id/do-not-contact
```

## Demos

```text
POST   /leads/:id/generate-demo
GET    /demo-sites/:id
PATCH  /demo-sites/:id
POST   /demo-sites/:id/review
POST   /demo-sites/:id/approve
POST   /demo-sites/:id/publish
POST   /demo-sites/:id/unpublish
POST   /demo-sites/:id/extend
POST   /demo-sites/:id/expire
POST   /demo-sites/:id/screenshot
GET    /demo-sites/:id/analytics
```

## Mensagens

```text
POST   /leads/:id/generate-message
GET    /outreach/messages
GET    /outreach/messages/:id
PATCH  /outreach/messages/:id
POST   /outreach/messages/:id/approve
POST   /outreach/messages/:id/reject
POST   /outreach/messages/:id/send
POST   /outreach/messages/:id/cancel
```

## Propostas

```text
POST   /proposals
GET    /proposals
GET    /proposals/:id
PATCH  /proposals/:id
POST   /proposals/:id/generate-pdf
POST   /proposals/:id/send
POST   /proposals/:id/accept
POST   /proposals/:id/reject
```

## Exportações

```text
POST   /exports/leads/csv
POST   /exports/leads/xlsx
POST   /exports/campaigns/xlsx
GET    /exports/:id/download
```

---

# 36. Painel administrativo

Criar páginas:

```text
/login
/dashboard
/campaigns
/campaigns/new
/campaigns/:id

/businesses
/businesses/:id

/leads
/leads/:id
/pipeline

/demo-sites
/demo-sites/:id
/demo-sites/:id/edit
/demo-sites/:id/analytics

/outreach
/outreach/:id

/proposals
/proposals/:id

/customers
/customers/:id

/plans
/integrations
/users
/settings
/audit
```

---

# 37. Dashboard

Exibir:

* empresas encontradas;
* empresas sem site;
* leads qualificados;
* demos em criação;
* demos publicadas;
* demos expirando;
* contatos pendentes;
* contatos enviados;
* demos visualizadas;
* respostas;
* interessados;
* propostas;
* vendas;
* receita de implantação;
* receita mensal;
* custo de provedores;
* custo por lead;
* custo por demo;
* conversão por campanha;
* conversão por segmento;
* conversão por cidade.

---

# 38. CLI

Criar CLI chamada:

```text
informatizou
```

## Campanhas

```bash
informatizou campaign create \
  --name "Padarias Ribeirão Preto" \
  --segment "padarias" \
  --location "Ribeirão Preto, SP" \
  --radius 30 \
  --limit 300 \
  --minimum-rating 4.2 \
  --minimum-reviews 30
```

## Executar

```bash
informatizou campaign run CAMPAIGN_ID
```

## Leads

```bash
informatizou leads list \
  --campaign CAMPAIGN_ID \
  --minimum-score 80
```

## Gerar demo

```bash
informatizou demo generate --lead LEAD_ID
```

## Publicar

```bash
informatizou demo publish --demo DEMO_ID
```

## Exportar

```bash
informatizou export leads \
  --campaign CAMPAIGN_ID \
  --format xlsx
```

A CLI deve exigir confirmação para ações em lote.

---

# 39. Filas

Criar filas:

```text
business-search
business-details
business-deduplication
website-discovery
website-verification
business-enrichment
contact-validation
lead-scoring
lead-review
website-content-generation
website-content-review
demo-generation
demo-publication
screenshot-generation
demo-expiration
outreach-message-generation
outreach-approval
outreach-delivery
outreach-response-processing
analytics-processing
proposal-generation
export-generation
cleanup
backup
```

Cada job deve possuir:

* idempotência;
* timeout;
* limite de tentativas;
* backoff exponencial;
* dead-letter handling;
* logs;
* métricas;
* progresso;
* cancelamento;
* correlação com campanha;
* tratamento de falhas parciais.

---

# 40. Controle de custos

Modelo:

```ts
interface ProviderUsage {
  id: string;
  campaignId?: string;
  leadId?: string;
  demoSiteId?: string;

  provider: string;
  operation: string;

  requestCount: number;
  inputUnits?: number;
  outputUnits?: number;

  estimatedCostCents: number;
  createdAt: Date;
}
```

Configurações:

```text
máximo de empresas por campanha
máximo de leads processados
máximo de demos
máximo de mensagens
máximo de custo
máximo de tokens
máximo de chamadas por minuto
máximo de chamadas por dia
```

Ao atingir limites:

* pausar campanha;
* registrar alerta;
* notificar administrador;
* não continuar silenciosamente.

---

# 41. Segurança

Implementar:

* autenticação;
* autorização por função;
* hash seguro de senha;
* cookies seguros;
* refresh tokens;
* CSRF quando aplicável;
* rate limiting;
* validação de entrada;
* sanitização;
* proteção contra XSS;
* proteção contra SQL injection;
* proteção contra SSRF;
* Content Security Policy;
* secrets em variáveis;
* logs sem credenciais;
* trilha de auditoria;
* backups;
* rotação de chaves;
* acesso mínimo;
* proteção da área administrativa;
* 2FA opcional;
* bloqueio por tentativas.

## SSRF

Bloquear:

```text
localhost
127.0.0.1
0.0.0.0
169.254.169.254
faixas privadas IPv4
faixas privadas IPv6
file://
ftp://
javascript:
data:
```

Validar DNS antes e depois de redirects.

---

# 42. VPS e infraestrutura

O projeto deverá ser implantável em uma VPS Linux.

Utilizar:

* Ubuntu LTS;
* Docker;
* Docker Compose;
* Nginx;
* Certbot ou solução equivalente;
* PostgreSQL;
* Redis;
* MinIO;
* aplicação;
* workers;
* backups;
* monitoramento.

## Containers

```text
nginx
postgres
redis
minio
api
admin-web
public-web
demo-renderer
worker
```

## Produção

Criar:

```text
docker-compose.production.yml
```

## Nginx

Configurar:

```text
www.informatizou.com.br  → public-web
app.informatizou.com.br  → admin-web
api.informatizou.com.br  → api
demo.informatizou.com.br → demo-renderer
```

Configurar:

* HTTPS;
* redirects HTTP para HTTPS;
* headers de segurança;
* compressão;
* limites de upload;
* proxy timeouts;
* cache;
* WebSocket, quando necessário;
* logs separados.

---

# 43. DNS

Documentar os registros necessários:

```text
A     @       IP_DA_VPS
A     www     IP_DA_VPS
A     app     IP_DA_VPS
A     api     IP_DA_VPS
A     demo    IP_DA_VPS
```

Caso seja usado wildcard futuramente:

```text
A     *.demo  IP_DA_VPS
```

Não exigir wildcard no MVP.

---

# 44. Backups

Criar scripts para:

* backup do PostgreSQL;
* backup de configurações;
* backup de arquivos;
* backup do MinIO;
* retenção;
* limpeza;
* restauração.

Padrão:

```text
backup diário
retenção diária: 7 dias
retenção semanal: 4 semanas
retenção mensal: 3 meses
```

Documentar procedimento de restauração.

---

# 45. Monitoramento

Implementar inicialmente:

* health checks;
* métricas de filas;
* logs estruturados;
* uso de CPU;
* memória;
* disco;
* PostgreSQL;
* Redis;
* erros;
* demos próximas da expiração;
* falhas de provedores;
* falhas de envio;
* custos.

Permitir integração futura com:

* Grafana;
* Prometheus;
* Loki;
* Sentry;
* Uptime Kuma.

---

# 46. Variáveis de ambiente

Criar `.env.example`:

```env
NODE_ENV=development

APP_NAME=Informatizou Prospect
APP_BASE_URL=http://localhost:3000
ADMIN_BASE_URL=http://localhost:3001
API_BASE_URL=http://localhost:4000
DEMO_BASE_URL=http://localhost:3002

PUBLIC_SITE_DOMAIN=www.informatizou.com.br
ADMIN_DOMAIN=app.informatizou.com.br
API_DOMAIN=api.informatizou.com.br
DEMO_DOMAIN=demo.informatizou.com.br

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/informatizou
REDIS_URL=redis://redis:6379

JWT_SECRET=
JWT_REFRESH_SECRET=
ENCRYPTION_KEY=

AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=

BUSINESS_SEARCH_PROVIDER=fake
GOOGLE_PLACES_API_KEY=
APIFY_API_TOKEN=
SERPAPI_API_KEY=
OUTSCRAPER_API_KEY=

STORAGE_PROVIDER=minio
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=informatizou

EMAIL_PROVIDER=smtp
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=Informatizou
SMTP_FROM_EMAIL=

WHATSAPP_PROVIDER=disabled
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=

DEMO_EXPIRATION_DAYS=10
DEFAULT_MINIMUM_DEMO_SCORE=80

MAX_CAMPAIGN_RESULTS=500
MAX_CAMPAIGN_DEMOS=50
MAX_CAMPAIGN_COST_CENTS=25000

OUTREACH_MODE=APPROVAL_REQUIRED
MAX_FOLLOW_UPS=1
FOLLOW_UP_DELAY_DAYS=4

ENABLE_ANALYTICS=true
ENABLE_EMAIL_DELIVERY=false
ENABLE_WHATSAPP_DELIVERY=false
```

---

# 47. Docker

O projeto deverá iniciar localmente com:

```bash
docker compose up --build
```

Produção:

```bash
docker compose -f docker-compose.production.yml up -d --build
```

Modo de desenvolvimento:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

---

# 48. Testes

## Unitários

Criar testes para:

* normalização de nome;
* telefone;
* e-mail;
* slug;
* deduplicação;
* website status;
* score;
* expiração;
* seleção de template;
* lista de supressão;
* elegibilidade de contato;
* limites;
* geração de token;
* validação de URL;
* proteção SSRF.

## Integração

* campanhas;
* importação;
* busca fake;
* processamento;
* lead;
* demo;
* publicação;
* expiração;
* screenshot;
* mensagem;
* aprovação;
* supressão;
* exportação;
* proposta.

## E2E

Fluxo:

1. login;
2. criar campanha;
3. executar provider fake;
4. importar empresas;
5. deduplicar;
6. verificar websites;
7. calcular score;
8. revisar lead;
9. gerar demo;
10. revisar;
11. publicar;
12. gerar screenshots;
13. gerar mensagem;
14. aprovar;
15. simular envio;
16. registrar visualização;
17. criar proposta;
18. marcar como venda;
19. converter em cliente.

Não consumir serviços pagos nos testes.

---

# 49. Provider fake

Criar pelo menos 20 empresas fictícias, incluindo:

* empresa sem site;
* empresa com site válido;
* site quebrado;
* site antigo;
* somente Instagram;
* somente marketplace;
* duplicidade;
* empresa fechada;
* muitas avaliações;
* poucas avaliações;
* sem telefone;
* com e-mail;
* com WhatsApp;
* dados conflitantes;
* opt-out;
* domínio estacionado;
* página em construção;
* imagens ausentes;
* score alto;
* score baixo.

---

# 50. Dados de demonstração

Criar seed com:

* administrador;
* vendedor;
* revisor;
* campanhas;
* leads;
* demos;
* mensagens;
* propostas;
* planos.

Credenciais de desenvolvimento deverão ser claramente marcadas como inseguras e nunca usadas em produção.

---

# 51. Critérios de aceite

O sistema será considerado funcional quando for possível:

1. iniciar por Docker;
2. acessar o site público;
3. acessar o painel;
4. autenticar;
5. criar campanha;
6. buscar empresas pelo provider fake;
7. integrar provider real por configuração;
8. deduplicar;
9. verificar sites;
10. enriquecer contatos;
11. calcular score;
12. revisar leads;
13. gerar demo;
14. editar demo;
15. publicar demo;
16. acessar pela URL pública;
17. impedir indexação;
18. gerar screenshots;
19. expirar após 10 dias;
20. renovar manualmente;
21. gerar mensagem;
22. aprovar contato;
23. enviar e-mail quando habilitado;
24. bloquear WhatsApp quando não autorizado;
25. registrar opt-out;
26. impedir novo contato;
27. acompanhar analytics;
28. gerar proposta;
29. marcar venda;
30. converter demo em cliente;
31. exportar CSV e XLSX;
32. visualizar custos;
33. visualizar auditoria;
34. executar testes;
35. fazer backup;
36. documentar deploy.

---

# 52. Fases de implementação

## Fase 1 — Fundação

* monorepo;
* Docker;
* PostgreSQL;
* Redis;
* MinIO;
* Nginx local;
* autenticação;
* usuários;
* banco;
* migrations;
* seed;
* logs;
* health checks;
* provider fake.

## Fase 2 — Pesquisa

* campanhas;
* providers;
* busca;
* importação CSV;
* deduplicação;
* progresso;
* custos.

## Fase 3 — Qualificação

* verificação de site;
* enriquecimento;
* validação de contatos;
* score;
* revisão;
* CRM inicial.

## Fase 4 — Demos

* templates;
* IA;
* conteúdo;
* revisão;
* editor;
* publicação;
* noindex;
* screenshots;
* analytics;
* expiração.

## Fase 5 — Prospecção

* mensagens;
* aprovações;
* e-mail;
* abstração de WhatsApp;
* opt-out;
* follow-up;
* respostas;
* agente comercial.

## Fase 6 — Vendas

* planos;
* propostas;
* PDF;
* negociação;
* clientes;
* conversão da demo;
* assinaturas mensais.

## Fase 7 — Produção

* deploy VPS;
* Nginx;
* SSL;
* DNS;
* backups;
* monitoramento;
* segurança;
* documentação.

---

# 53. Regras para o Claude

Você deve atuar como arquiteto, desenvolvedor, revisor, testador e responsável técnico pelo projeto.

## Regras obrigatórias

1. leia toda a spec;
2. não implemente tudo em um único arquivo;
3. não reduza o escopo sem registrar;
4. não escreva apenas pseudocódigo;
5. não use mocks fora dos pontos explicitamente permitidos;
6. não deixe funções essenciais com `TODO`;
7. implemente por fases;
8. mantenha o projeto executável após cada fase;
9. crie migrations;
10. crie testes;
11. atualize o README;
12. use TypeScript estrito;
13. trate erros;
14. valide entradas;
15. proteja secrets;
16. não faça scraping agressivo;
17. não automatize WhatsApp Web;
18. não invente dados;
19. não envie mensagens sem as regras definidas;
20. implemente lista de supressão;
21. implemente noindex;
22. implemente aviso de demonstração;
23. implemente expiração;
24. implemente auditoria;
25. implemente custos;
26. execute lint;
27. execute typecheck;
28. execute testes;
29. corrija falhas antes de avançar;
30. registre decisões arquiteturais em `docs/decisions`;
31. não apagar código funcional sem necessidade;
32. usar bibliotecas mantidas;
33. evitar dependências desnecessárias;
34. preservar idempotência;
35. manter compatibilidade com Docker;
36. documentar comandos de produção.

---

# 54. Protocolo de trabalho do Claude

Antes de alterar arquivos em cada fase:

1. resumir o objetivo da fase;
2. listar decisões;
3. listar arquivos que serão criados;
4. listar arquivos que serão alterados;
5. apontar dependências;
6. apontar riscos.

Depois da implementação:

1. executar lint;
2. executar typecheck;
3. executar testes;
4. executar build;
5. corrigir problemas;
6. apresentar resultado.

Formato obrigatório:

```text
IMPLEMENTADO
ARQUIVOS CRIADOS
ARQUIVOS ALTERADOS
MIGRATIONS
TESTES EXECUTADOS
RESULTADO DOS TESTES
COMO EXECUTAR
COMO VALIDAR
PENDÊNCIAS
PRÓXIMA FASE
```

---

# 55. Primeiro ciclo de execução

Após ler esta spec:

1. analise o projeto;
2. apresente a arquitetura;
3. apresente o modelo de dados;
4. apresente os módulos;
5. apresente a estratégia de deploy;
6. apresente o plano de fases;
7. inicialize o monorepo;
8. implemente integralmente a Fase 1;
9. rode lint;
10. rode typecheck;
11. rode testes;
12. rode build;
13. corrija os problemas;
14. apresente os comandos.

Não iniciar integrações pagas na Fase 1.

---

# 56. Primeira entrega esperada

```text
Monorepo funcional
Docker Compose funcional
PostgreSQL
Redis
MinIO
API
Painel administrativo
Site público inicial
Renderer de demos inicial
Worker
CLI inicial
Autenticação
Usuários e permissões
Prisma
Migrations
Seed
Provider fake
Logs
Health checks
Testes iniciais
README
.env.example
Documentação de arquitetura
```

---

# 57. Comando inicial para o Claude CLI

Salve esta especificação como:

```text
SPEC.md
```

Execute:

```bash
claude
```

Depois envie:

```text
Leia integralmente o arquivo SPEC.md.

Este arquivo é a fonte oficial de requisitos do projeto. Não reduza o escopo,
não substitua funcionalidades por pseudocódigo e não ignore os requisitos de
segurança, expiração, revisão, opt-out, auditoria e implantação na VPS.

Primeiro apresente:

1. arquitetura proposta;
2. modelo de dados;
3. estrutura do monorepo;
4. decisões técnicas;
5. plano completo por fases;
6. riscos e dependências.

Depois implemente integralmente a Fase 1.

Ao finalizar, execute lint, typecheck, testes e build. Corrija todos os erros
antes de apresentar o resultado.

Não utilize APIs pagas nesta primeira fase. Utilize o provider fake.

Mantenha o projeto executável ao final de cada fase.
```

---

# 58. Continuação das fases

Depois que a Fase 1 estiver validada, executar:

```text
Leia novamente o SPEC.md e continue para a próxima fase ainda não concluída.

Antes de editar, informe os arquivos que serão criados ou alterados.

Implemente a fase integralmente, execute lint, typecheck, testes e build,
corrija os erros e atualize o README e a documentação.

Não marque tarefas como concluídas sem código funcional e testes.
```

---

# 59. Regra final de qualidade

Nenhuma funcionalidade deve ser considerada concluída apenas porque:

* existe uma tela;
* existe uma interface;
* existe um botão;
* existe um endpoint vazio;
* existe um comentário;
* existe um mock;
* existe pseudocódigo.

Uma funcionalidade estará concluída somente quando houver:

```text
implementação funcional
persistência
validação
tratamento de erro
autorização
logs
testes
documentação
forma de execução
forma de validação
```
