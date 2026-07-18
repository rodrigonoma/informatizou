# Fase 1 — Fundação · Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) para implementar tarefa a tarefa. Steps usam checkbox (`- [ ]`).

**Goal:** Entregar a fundação executável do Informatizou Prospect: monorepo TypeScript com API Fastify, workers BullMQ, 3 frontends Nuxt, CLI, Prisma com todas as entidades, auth real, provider fake e Docker — tudo rodando via WSL, com lint/typecheck/testes/build verdes.

**Architecture:** Monorepo pnpm + Turborepo. Packages de domínio isolados e testáveis; apps finas que compõem os packages. API Fastify com plugins (auth JWT+refresh, RBAC, Helmet/CSP, rate-limit, Swagger, Prisma, Pino). Workers BullMQ conectam Redis e registram as 24 filas (processadores stub idempotentes). Frontends Nuxt 3 (admin SPA; public/demo SSR com noindex). Tudo containerizado.

**Tech Stack:** Node 22, TypeScript estrito, Fastify, Prisma, PostgreSQL, Redis, BullMQ, Zod, Pino, argon2, @fastify/jwt, Vitest, Nuxt 3, Vue 3, Tailwind, shadcn-vue, @tanstack/vue-query, VeeValidate, Playwright (config), MinIO, Docker Compose. Fonte de requisitos: `spec.md`. Fonte de arquitetura: `docs/superpowers/specs/2026-07-18-informatizou-prospect-design.md`.

## Global Constraints

- Node.js **22+**, TypeScript **strict** (todos os pacotes estendem `tsconfig.base.json`).
- Monorepo: **pnpm workspaces + Turborepo**. Package manager **pnpm 11**.
- **Nenhuma API paga** na Fase 1 (Google/Apify/SerpAPI/Outscraper/Anthropic/SES/WhatsApp): só abstrações + fake/disabled.
- **Ambiente:** código em `~/projetos/informatizou` (WSL). Editar via UNC `\\wsl.localhost\Ubuntu\home\rodrigonoma\projetos\informatizou`. Executar via `wsl.exe -- bash -lc "cd ~/projetos/informatizou && <cmd>"`.
- **Logs estruturados (Pino)** em toda transição/erro, com `correlationId`.
- **Compliance sempre-ativo por código:** noindex nas demos (`<meta robots noindex>` + `X-Robots-Tag`), aviso de demonstração, guarda SSRF, auditoria, supressão (modelo pronto). Nunca inventar dados.
- **Autonomia ponta-a-ponta** é a premissa maior — modelar modos automáticos como cidadãos de primeira classe (as regras de negócio autônomas chegam nas fases seguintes; a Fase 1 prepara o terreno: enums, flags, auditoria, orquestração de filas).
- **Não quebrar funcionalidade existente**; cada tarefa termina testável.
- Todas as entidades: `id` (cuid), `createdAt`, `updatedAt`. Críticas: `createdBy`, `updatedBy`, `deletedAt`, `version`.
- Convenção de nomes: pacotes sob escopo `@informatizou/*`.
- Commits frequentes, mensagem em PT-BR, com trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## Estrutura de arquivos (mapa)

```
package.json · pnpm-workspace.yaml · turbo.json · tsconfig.base.json · .npmrc · .nvmrc · .env.example
eslint.config.mjs · .prettierrc.json · vitest.workspace.ts
packages/
  config/        src/{env.ts,index.ts} + tests
  logging/       src/{logger.ts,index.ts} + tests
  shared/        src/{enums.ts, schemas/*, utils/{slug,phone,email,name,campaign-token,url-guard}.ts, index.ts} + tests
  database/      prisma/{schema.prisma, seed.ts} · src/{client.ts,index.ts} · fake/businesses.ts
  auth/          src/{password.ts, tokens.ts, rbac.ts, index.ts} + tests
  search-providers/ src/{types.ts, fake-provider.ts, index.ts} + tests
  providers/     src/{ai/*, email/*, whatsapp/*, index.ts} (abstrações + disabled)
  storage/       src/{client.ts, index.ts}
apps/
  api/           src/{app.ts, server.ts, plugins/*, routes/{health,auth}/*, hooks/audit.ts} + tests
  worker/        src/{queues.ts, worker.ts, processors/*} + tests
  admin-web/     nuxt (SPA) — login, dashboard, stores/auth, middleware/auth
  public-web/    nuxt (SSR) — home institucional
  demo-renderer/ nuxt (SSR) — [slug].vue, plugin noindex
  cli/           src/{index.ts, commands/*}
infrastructure/
  docker/{Dockerfile.api, Dockerfile.worker, Dockerfile.nuxt}
  nginx/{dev.conf}
  scripts/{backup-postgres.sh, restore-postgres.sh}
docker-compose.yml · docker-compose.production.yml
docs/decisions/{ADR-0001-stack-override.md, ADR-0002-wsl-environment.md}
docs/architecture/overview.md · README.md
```

---

## Task 1: Monorepo raiz + tooling

**Files:** Create `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.npmrc`, `.nvmrc`, `eslint.config.mjs`, `.prettierrc.json`, `vitest.workspace.ts`, `.env.example`.

**Produces:** workspace pnpm reconhecendo `packages/*` e `apps/*`; scripts raiz `lint`, `typecheck`, `test`, `build`, `dev`, `db:migrate`, `db:seed`; `tsconfig.base.json` estrito estendido por todos.

- [ ] **Step 1:** Criar `pnpm-workspace.yaml` com `packages: ['packages/*','apps/*']`.
- [ ] **Step 2:** Criar `tsconfig.base.json` com `strict:true`, `noUncheckedIndexedAccess:true`, `module:NodeNext`, `moduleResolution:NodeNext`, `target:ES2022`, `declaration:true`, `composite` conforme necessário, `types:['node']`.
- [ ] **Step 3:** Criar `package.json` raiz (private, `packageManager:"pnpm@11"`, `engines.node:">=22"`) com scripts delegando ao Turbo (`turbo run lint/typecheck/test/build`), `db:migrate`/`db:seed` apontando ao package database, e devDeps: typescript, turbo, vitest, eslint, @typescript-eslint, prettier, tsx.
- [ ] **Step 4:** Criar `turbo.json` com pipeline (`build` dependsOn `^build`; `test`, `lint`, `typecheck`).
- [ ] **Step 5:** Criar `eslint.config.mjs` (flat config, TS), `.prettierrc.json`, `.npmrc` (`auto-install-peers=true`, `shamefully-hoist=false`), `.nvmrc` (`22`).
- [ ] **Step 6:** Criar `vitest.workspace.ts` referenciando `packages/*` e `apps/*` que tenham testes.
- [ ] **Step 7:** Criar `.env.example` conforme spec §46 (verbatim das chaves).
- [ ] **Step 8:** `wsl … pnpm install` para validar o workspace.
- [ ] **Step 9:** Commit `chore: monorepo base (pnpm+turbo+ts estrito+tooling)`.

## Task 2: `@informatizou/config` (env)

**Files:** Create `packages/config/{package.json,tsconfig.json,src/env.ts,src/index.ts,src/env.test.ts}`.

**Interfaces — Produces:** `loadEnv(source?: NodeJS.ProcessEnv): Env` (valida com Zod, lança erro legível se faltar obrigatório); tipo `Env` com todas as chaves da spec §46 tipadas (portas number, flags boolean, enums). `env` singleton exportado.

- [ ] **Step 1:** Test `env.test.ts`: dado objeto mínimo válido → `loadEnv` retorna `Env` com defaults (`DEMO_EXPIRATION_DAYS=10`, `OUTREACH_MODE='APPROVAL_REQUIRED'`); dado faltando `DATABASE_URL` → lança com mensagem contendo `DATABASE_URL`.
- [ ] **Step 2:** Rodar teste → falha (módulo inexistente).
- [ ] **Step 3:** Implementar `env.ts` com schema Zod (coerce number/boolean, enums `AI_PROVIDER`, `STORAGE_PROVIDER`, `EMAIL_PROVIDER`, `WHATSAPP_PROVIDER`, `OUTREACH_MODE`), defaults conforme §46.
- [ ] **Step 4:** Rodar teste → passa.
- [ ] **Step 5:** Commit `feat(config): carregamento e validação de env com Zod`.

## Task 3: `@informatizou/logging` (Pino)

**Files:** Create `packages/logging/{package.json,tsconfig.json,src/logger.ts,src/index.ts,src/logger.test.ts}`.

**Produces:** `createLogger(opts?: {name?:string; level?:string}): Logger` (Pino) com **redaction** de `password,token,secret,authorization,*.apiKey`; `withCorrelation(logger, correlationId)` → child logger.

- [ ] **Step 1:** Test: `createLogger` produz logger cujo `.child({correlationId})` inclui o campo; redaction configurada (checar `logger[symbol]`/serializer aplicando `[Redacted]`).
- [ ] **Step 2:** Falha.
- [ ] **Step 3:** Implementar com Pino (`redact` paths, `base:{app}`, level de env com fallback `info`).
- [ ] **Step 4:** Passa.
- [ ] **Step 5:** Commit `feat(logging): logger Pino estruturado com redaction e correlation`.

## Task 4: `@informatizou/shared` — enums e schemas

**Files:** Create `packages/shared/{package.json,tsconfig.json,src/enums.ts,src/schemas/index.ts,src/index.ts}`.

**Produces:** todos os enums da spec como `enum`/const TS + espelho para Prisma: `UserRole, CampaignStatus, WebsiteStatus, DemoSiteStatus, ReviewStatus, LeadStatus, OutreachMode, ProposalStatus`. Schemas Zod: `businessSearchInputSchema`, `loginSchema`, `campaignCreateSchema` (para uso futuro). Tipos `NormalizedBusinessResult`, `ScoreResult`, `DataProvenance`, `WhatsAppContact`, `OutreachDecision`, `DuplicateAnalysis`.

- [ ] **Step 1:** Criar `enums.ts` com os valores **exatos** da spec (§6, §8, §10, §12, §13, §18, §24, §27, §32).
- [ ] **Step 2:** Criar `schemas/index.ts` (Zod) para `loginSchema` (email+password) e `businessSearchInputSchema` (§7).
- [ ] **Step 3:** Criar `index.ts` reexportando tudo.
- [ ] **Step 4:** Commit `feat(shared): enums da spec e schemas Zod base`.

## Task 5: `@informatizou/shared` — utils com TDD

**Files:** Create `src/utils/{slug.ts,name.ts,phone.ts,email.ts,campaign-token.ts,url-guard.ts}` + `*.test.ts` cada.

**Produces:**
- `slugify(name:string, opts?:{citySuffix?:string}): string` — minúsculas, sem acento, hífens, sufixo cidade opcional.
- `normalizeName(name:string): string` — trim, colapsa espaços, remove acentos p/ comparação.
- `toE164(raw:string, countryCode?='55'): {e164:string|null; national:string; isMobile:boolean|null}` — valida DDD BR.
- `classifyEmail(email:string): {valid:boolean; kind:'BUSINESS'|'GENERIC'|'PERSONAL'|'INVALID'; domain?:string}` — sintaxe + prefixos comerciais.
- `generateCampaignToken(): string` — opaco (base62 de bytes aleatórios), não sequencial, sem PII. **Nota:** `Math.random` não está disponível aqui em runtime de plano, mas o código de produção usa `crypto.randomBytes` (Node) — permitido.
- `isSafeHttpUrl(url:string): {safe:boolean; reason?:string}` — bloqueia esquemas file/ftp/javascript/data, hosts localhost/127.0.0.1/0.0.0.0/169.254.169.254, e faixas privadas IPv4/IPv6 (§41); usado antes de qualquer fetch.

- [ ] **Step 1 (slug):** Test: `slugify('Padaria Maresias')==='padaria-maresias'`; com acento `slugify('Café São João')==='cafe-sao-joao'`; conflito `slugify('Padaria X',{citySuffix:'Ribeirão Preto'})==='padaria-x-ribeirao-preto'`. → falha → implementar → passa.
- [ ] **Step 2 (name):** Test: `normalizeName('  Açaí   do  José ')==='acai do jose'`. → TDD.
- [ ] **Step 3 (phone):** Test: `toE164('(16) 99999-8888').e164==='+5516999998888'` e `isMobile===true`; fixo `toE164('16 3333-2222').isMobile===false`; inválido → `e164===null`. → TDD.
- [ ] **Step 4 (email):** Test: `classifyEmail('contato@padaria.com.br').kind==='BUSINESS'`; `classifyEmail('joao@gmail.com').kind==='PERSONAL'`; `classifyEmail('x@@y').valid===false`. → TDD.
- [ ] **Step 5 (token):** Test: dois tokens diferentes, comprimento ≥ 22, só `[A-Za-z0-9]`, sem hífen. → TDD (usa `crypto.randomBytes`).
- [ ] **Step 6 (url-guard):** Test: `isSafeHttpUrl('http://169.254.169.254/').safe===false`; `isSafeHttpUrl('file:///etc/passwd').safe===false`; `isSafeHttpUrl('http://127.0.0.1').safe===false`; `isSafeHttpUrl('http://10.0.0.5').safe===false`; `isSafeHttpUrl('https://example.com').safe===true`. → TDD.
- [ ] **Step 7:** Rodar todo o pacote `shared` → verde. Commit `feat(shared): utils slug/name/phone/email/token/ssrf-guard com testes`.

## Task 6: `@informatizou/database` — Prisma schema completo

**Files:** Create `packages/database/{package.json,tsconfig.json,prisma/schema.prisma,src/client.ts,src/index.ts}`.

**Produces:** `prisma` client singleton exportado como `prisma`; `disconnect()`. Schema com **todas as entidades da spec §34** + enums, timestamps e campos de auditoria conforme Global Constraints.

- [ ] **Step 1:** `package.json` com deps `@prisma/client`, devDeps `prisma`; scripts `generate`, `migrate:dev`, `migrate:deploy`, `seed`.
- [ ] **Step 2:** `schema.prisma`: datasource PG (`env("DATABASE_URL")`), generator client. Enums: todos da §34/spec. Models (§34): `User, UserSession, AuditLog, SearchCampaign, CampaignExecution, CampaignCost, Business, BusinessCategory, BusinessSourceRecord, BusinessContact, BusinessSocialProfile, BusinessImage, BusinessReviewSummary, WebsiteVerification, WebsiteCandidate, Lead, LeadScore, LeadReview, LeadAssignment, LeadActivity, LeadTag, DemoSite, DemoSiteVersion, DemoSitePublication, SiteScreenshot, DemoAnalyticsEvent, OutreachMessage, OutreachApproval, OutreachAttempt, OutreachConversation, OutreachResponse, SuppressionEntry, ProductPlan, Proposal, ProposalItem, Customer, CustomerSite, CustomerSubscription, CustomerOnboardingTask, Integration, ProviderUsage, SystemSetting, JobExecution, ExportFile`. Relações coerentes (Business 1-N Lead; Lead 1-1 DemoSite; etc.). Todos `id String @id @default(cuid())`, `createdAt`, `updatedAt`. Críticos com `createdBy/updatedBy/deletedAt/version`.
- [ ] **Step 3:** `src/client.ts` singleton com log de queries em dev via Pino.
- [ ] **Step 4:** `wsl … pnpm --filter @informatizou/database prisma format && prisma validate` → ok.
- [ ] **Step 5:** Commit `feat(database): schema Prisma completo (todas entidades §34)`.

## Task 7: Migration inicial + client gerado

**Files:** Modify env; Create `packages/database/prisma/migrations/*`.

- [ ] **Step 1:** Subir só o Postgres via compose (Task 15 pode vir antes; se ainda não, usar container ad-hoc): `docker compose up -d postgres`.
- [ ] **Step 2:** `pnpm --filter @informatizou/database prisma migrate dev --name init`.
- [ ] **Step 3:** Verificar geração do client e criação das tabelas (`prisma migrate status`).
- [ ] **Step 4:** Commit `feat(database): migration inicial`.

## Task 8: Provider fake — 20 empresas (§49)

**Files:** Create `packages/search-providers/{package.json,tsconfig.json,src/types.ts,src/fake-provider.ts,src/fake-data.ts,src/index.ts,src/fake-provider.test.ts}`.

**Produces:** `interface BusinessSearchProvider` (spec §7); `FakeBusinessSearchProvider implements BusinessSearchProvider`; `FAKE_BUSINESSES: NormalizedBusinessResult[]` com **20 empresas** cobrindo todos os casos §49 (sem site, site válido, quebrado, antigo, só Instagram, só marketplace, duplicidade, fechada, muitas avaliações, poucas, sem telefone, com email, com whatsapp, dados conflitantes, opt-out, domínio estacionado, em construção, imagens ausentes, score alto, score baixo).

- [ ] **Step 1:** Test: `new FakeBusinessSearchProvider().search({segment:'padarias',location:'Ribeirão Preto, SP',country:'BR',limit:50,language:'pt-BR'})` retorna ≥20 resultados; existe ao menos um com `website` vazio e um com website válido; todos têm `externalId` único e `source==='fake'`.
- [ ] **Step 2:** Falha.
- [ ] **Step 3:** Implementar `fake-data.ts` (20 registros realistas) + `fake-provider.ts` (filtra por limit, aplica rating/reviews mínimos, latência simulada opcional).
- [ ] **Step 4:** Passa.
- [ ] **Step 5:** Commit `feat(search-providers): interface + FakeBusinessSearchProvider com 20 empresas (§49)`.

## Task 9: `@informatizou/auth`

**Files:** Create `packages/auth/{package.json,tsconfig.json,src/password.ts,src/tokens.ts,src/rbac.ts,src/index.ts}` + tests.

**Produces:**
- `hashPassword(pwd:string): Promise<string>` / `verifyPassword(hash,pwd): Promise<boolean>` (argon2id).
- `signAccessToken(payload:{sub:string;role:UserRole}, secret:string): string` (exp 15m) / `signRefreshToken` (exp 7d) / `verifyToken`.
- `can(role:UserRole, action:string): boolean` — matriz RBAC dos 5 perfis (§6).

- [ ] **Step 1 (password):** Test: `verifyPassword(await hashPassword('x'),'x')===true`; senha errada → false. → TDD (argon2).
- [ ] **Step 2 (rbac):** Test: `can('ADMIN','users.manage')===true`; `can('VIEWER','users.manage')===false`; `can('SALES','leads.movePipeline')===true`. → TDD.
- [ ] **Step 3 (tokens):** Test: token assinado e verificado retorna `sub/role`; token expirado/segredo errado lança. → TDD (jsonwebtoken).
- [ ] **Step 4:** Commit `feat(auth): argon2 + JWT/refresh + RBAC dos 5 perfis`.

## Task 10: Seed (usuários + fake businesses)

**Files:** Create `packages/database/prisma/seed.ts`; Modify `packages/database/package.json` (prisma.seed).

**Produces:** seed idempotente: usuários ADMIN/MANAGER/SALES/REVIEWER (senha dev **claramente insegura**, marcada), 1 `SearchCampaign` DRAFT exemplo, importa as 20 fake businesses como `Business`+`BusinessContact`+`BusinessSourceRecord`. Loga contagens.

- [ ] **Step 1:** Implementar `seed.ts` usando `hashPassword`, `upsert` por email/externalId (idempotência), Pino para contagens.
- [ ] **Step 2:** `pnpm --filter @informatizou/database prisma db seed` → cria dados; rodar 2× para provar idempotência.
- [ ] **Step 3:** Commit `feat(database): seed com usuários dev e 20 empresas fake`.

## Task 11: Abstrações de providers (IA/e-mail/WhatsApp/storage) — sem chamadas pagas

**Files:** Create `packages/providers/{package.json,tsconfig.json,src/ai/{types.ts,anthropic.ts,index.ts},src/email/{types.ts,smtp.ts,disabled.ts,index.ts},src/whatsapp/{types.ts,disabled.ts,index.ts},src/index.ts}`; Create `packages/storage/{package.json,tsconfig.json,src/client.ts,src/index.ts}`.

**Produces:** interfaces `AiProvider` (spec §15), `EmailProvider`, `WhatsAppProvider`; factory por env. Fase 1: `AnthropicAiProvider` só com o esqueleto e **guard que lança se chamado sem key** (não chama pago); `EmailProvider` default `disabled`; `WhatsAppProvider` default `disabled` (§4 proíbe automação não-oficial). `storage` = wrapper MinIO (`putObject/getSignedUrl`) usando env, sem exigir conexão em import.

- [ ] **Step 1:** Definir interfaces conforme spec (AiProvider com `generateBusinessSummary/generateWebsiteContent/generateOutreachMessage/reviewGeneratedContent`).
- [ ] **Step 2:** Implementar factories por env (`getAiProvider()`, `getEmailProvider()`, `getWhatsAppProvider()`), com `disabled` que loga e recusa envio.
- [ ] **Step 3:** Teste unit: factory retorna `disabled` quando flag off; `AnthropicAiProvider.generateWebsiteContent` lança `ProviderNotConfiguredError` sem key (sem rede).
- [ ] **Step 4:** Commit `feat(providers): abstrações IA/e-mail/WhatsApp/storage (disabled por padrão, sem chamadas pagas)`.

## Task 12: API Fastify — bootstrap + /health

**Files:** Create `apps/api/{package.json,tsconfig.json,src/app.ts,src/server.ts,src/plugins/{prisma.ts,logging.ts,security.ts,swagger.ts,auth.ts},src/routes/health/index.ts}` + `src/app.test.ts`.

**Produces:** `buildApp(): Promise<FastifyInstance>`; `/health` (liveness) e `/health/ready` (checa PG+Redis). Plugins: Pino logger, Helmet+CSP, CORS, rate-limit, cookie, jwt, swagger+swagger-ui, prisma decorator. Validação Zod via `fastify-type-provider-zod`.

- [ ] **Step 1:** Test (`app.test.ts`, vitest+`app.inject`): `GET /health` → 200 `{status:'ok'}`.
- [ ] **Step 2:** Falha.
- [ ] **Step 3:** Implementar `app.ts` registrando plugins e rota health; `server.ts` para listen com env.
- [ ] **Step 4:** Passa.
- [ ] **Step 5:** Commit `feat(api): bootstrap Fastify + health + plugins de segurança/swagger`.

## Task 13: API — auth `/auth/login|refresh|me|logout` + auditoria + RBAC

**Files:** Create `apps/api/src/routes/auth/index.ts`, `src/hooks/audit.ts`, `src/plugins/rbac.ts` + `src/routes/auth/auth.test.ts`.

**Interfaces — Consumes:** `@informatizou/auth` (hash/verify/sign/verify/can), `@informatizou/database` (`prisma`), `loginSchema` de `shared`.

**Produces:** `POST /auth/login` (valida, verifica argon2, cria `UserSession`, set refresh cookie httpOnly seguro, retorna access token + user); `POST /auth/refresh` (rotaciona); `GET /auth/me` (requer bearer); `POST /auth/logout` (revoga sessão). Hook de auditoria grava `AuditLog`. preHandler `authenticate` + `authorize(action)`. Bloqueio por tentativas (contador em `UserSession`/memória).

- [ ] **Step 1:** Test integração: seedar 1 user; `POST /auth/login` credenciais válidas → 200 + `accessToken` + Set-Cookie refresh; inválidas → 401. `GET /auth/me` com token → 200 user; sem token → 401.
- [ ] **Step 2:** Falha.
- [ ] **Step 3:** Implementar rotas + hooks + rbac plugin. Logar cada login (sucesso/falha) com Pino (sem senha).
- [ ] **Step 4:** Passa.
- [ ] **Step 5:** Commit `feat(api): auth login/refresh/me/logout com sessão, cookie seguro, RBAC e auditoria`.

## Task 14: Worker BullMQ — filas + processadores stub

**Files:** Create `apps/worker/{package.json,tsconfig.json,src/queues.ts,src/worker.ts,src/processors/index.ts}` + `src/queues.test.ts`.

**Produces:** `QUEUE_NAMES` (as 24 filas da §39); `createQueues(connection)`; `startWorkers(connection)` registrando um `Worker` por fila com processador stub idempotente que loga `{queue,jobId,correlationId}` e grava `JobExecution`. Opções default: `attempts:3`, `backoff:{type:'exponential',delay:2000}`, `removeOnComplete`, timeout.

- [ ] **Step 1:** Test: `QUEUE_NAMES` contém as 24 filas exatas da §39; `buildDefaultJobOptions()` tem `attempts===3` e backoff exponencial.
- [ ] **Step 2:** Falha.
- [ ] **Step 3:** Implementar; `worker.ts` conecta Redis (env) e chama `startWorkers`.
- [ ] **Step 4:** Passa.
- [ ] **Step 5:** Commit `feat(worker): registro das 24 filas BullMQ com processadores stub idempotentes`.

## Task 15: Infraestrutura Docker (dev)

**Files:** Create `infrastructure/docker/{Dockerfile.api,Dockerfile.worker,Dockerfile.nuxt}`, `infrastructure/nginx/dev.conf`, `docker-compose.yml`.

**Produces:** compose dev com `postgres`, `redis`, `minio`, `api`, `worker`, `admin-web`, `public-web`, `demo-renderer`, `nginx`. Healthchecks. Volumes nomeados. `nginx` roteia `app.localhost`/`api.localhost`/`www.localhost`/`demo.localhost`.

- [ ] **Step 1:** Escrever Dockerfiles multi-stage (base pnpm, build por app).
- [ ] **Step 2:** `docker-compose.yml` com serviços, envs de `.env`, depends_on/healthcheck.
- [ ] **Step 3:** `nginx/dev.conf` roteando subdomínios `.localhost`.
- [ ] **Step 4:** `docker compose config` valida; `docker compose up -d postgres redis minio` sobe infra base.
- [ ] **Step 5:** Commit `feat(infra): docker-compose dev + Dockerfiles + nginx local`.

## Task 16: admin-web (Nuxt SPA) — login + dashboard

**Files:** Create `apps/admin-web/` (nuxt.config.ts SPA, tailwind, shadcn-vue init, `pages/login.vue`, `pages/dashboard.vue`, `stores/auth.ts`, `middleware/auth.ts`, `composables/useApi.ts`, `plugins/vue-query.ts`).

**Produces:** login funcional contra a API (`/auth/login`), guarda de rota que exige auth, dashboard mínimo mostrando o usuário logado (via `/auth/me`). @tanstack/vue-query + VeeValidate/Zod no form.

- [ ] **Step 1:** `nuxt.config.ts` com `ssr:false`, Tailwind, runtimeConfig `apiBase`.
- [ ] **Step 2:** shadcn-vue: inicializar componentes base (Button, Input, Card, Form).
- [ ] **Step 3:** `stores/auth.ts` (Pinia) com login/logout/me; `middleware/auth.ts` redireciona p/ /login.
- [ ] **Step 4:** `pages/login.vue` (form Zod) e `pages/dashboard.vue` (protegida).
- [ ] **Step 5:** `wsl … pnpm --filter admin-web build` → ok. Commit `feat(admin-web): Nuxt SPA com login e dashboard autenticado`.

## Task 17: public-web (Nuxt SSR) — home institucional

**Files:** Create `apps/public-web/` (nuxt.config.ts SSR, Tailwind, `pages/index.vue`, seções institucionais iniciais, `app.vue`).

**Produces:** home institucional SSR com conteúdo real mínimo (apresentação, serviços, planos, contato-CTA) — nada de tela vazia. SEO tags padrão (indexável).

- [ ] **Step 1:** `nuxt.config.ts` SSR + Tailwind + meta base.
- [ ] **Step 2:** `pages/index.vue` com hero + seções (serviços, planos, FAQ resumida, CTA contato).
- [ ] **Step 3:** `pnpm --filter public-web build` → ok. Commit `feat(public-web): home institucional SSR inicial`.

## Task 18: demo-renderer (Nuxt SSR) — [slug] + noindex

**Files:** Create `apps/demo-renderer/` (nuxt.config.ts SSR, `pages/[slug].vue`, `server/middleware/noindex.ts`, `plugins/robots.ts`, `pages/index.vue`).

**Produces:** rota `/[slug]` que (Fase 1) busca a demo por slug via API/DB e, se não publicada/expirada, mostra página "indisponível" (§21). **Sempre** injeta `<meta name="robots" content="noindex, nofollow, noarchive">` e header `X-Robots-Tag: noindex, nofollow, noarchive` (§20). Aviso de demonstração no topo/rodapé (§19) já como componente reutilizável.

- [ ] **Step 1:** `nuxt.config.ts` SSR; `server/middleware/noindex.ts` seta o header em toda resposta.
- [ ] **Step 2:** `pages/[slug].vue` com `useHead` (meta robots) + componentes `DemoBanner`/`DemoFooter` (avisos §19) + estado "indisponível".
- [ ] **Step 3:** Test (nuxt test util ou vitest de componente): resposta contém meta robots noindex. (Se custoso, validar via build + asserção no server middleware unitário.)
- [ ] **Step 4:** `pnpm --filter demo-renderer build` → ok. Commit `feat(demo-renderer): SSR por slug com noindex, X-Robots-Tag e avisos de demonstração`.

## Task 19: CLI `informatizou`

**Files:** Create `apps/cli/{package.json,tsconfig.json,src/index.ts,src/commands/{health.ts,seed-info.ts}}` + test.

**Produces:** binário `informatizou` (commander) com `health` (chama `/health` da API), `db seed --info` (mostra credenciais dev), e um comando de exemplo de ação em lote que **exige confirmação** (§38). Logs claros.

- [ ] **Step 1:** Test: parser reconhece `health` e `db seed`; ação em lote sem `--yes` aborta pedindo confirmação.
- [ ] **Step 2:** TDD → implementar commander.
- [ ] **Step 3:** Commit `feat(cli): CLI informatizou inicial (health, seed-info, confirmação em lote)`.

## Task 20: docker-compose.production + scripts de backup

**Files:** Create `docker-compose.production.yml`, `infrastructure/scripts/{backup-postgres.sh,restore-postgres.sh}`.

**Produces:** compose de produção (imagens buildadas, nginx+certbot placeholder, restart policies, secrets via env) e scripts de backup/restore do Postgres (retenção §44).

- [ ] **Step 1:** `docker-compose.production.yml` (serviços de app + nginx + certbot + volumes) — `docker compose -f … config` valida.
- [ ] **Step 2:** Scripts bash de backup/restore (pg_dump/psql) com retenção e logs.
- [ ] **Step 3:** Commit `feat(infra): compose de produção + scripts de backup/restore Postgres`.

## Task 21: Docs (ADRs, arquitetura, README)

**Files:** Create `docs/decisions/ADR-0001-stack-override.md`, `docs/decisions/ADR-0002-wsl-environment.md`, `docs/architecture/overview.md`, `README.md`.

**Produces:** ADRs do delta de stack e do ambiente WSL; overview de arquitetura; README com comandos de dev/prod (§47), estrutura, e como validar a Fase 1.

- [ ] **Step 1:** Escrever ADR-0001 (Fastify/Vue/Nuxt/shadcn-vue) e ADR-0002 (WSL/UNC).
- [ ] **Step 2:** `overview.md` com diagrama textual do fluxo e mapa de packages/apps.
- [ ] **Step 3:** `README.md` com pré-requisitos, `pnpm install`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`, `docker compose up`, credenciais dev, e checklist de validação.
- [ ] **Step 4:** Commit `docs: ADRs, overview de arquitetura e README da Fase 1`.

## Task 22: Verificação final da Fase 1

**Files:** N/A (execução).

- [ ] **Step 1:** `wsl … pnpm install` limpo.
- [ ] **Step 2:** `pnpm lint` → corrigir até verde.
- [ ] **Step 3:** `pnpm typecheck` → corrigir até verde.
- [ ] **Step 4:** `pnpm test` → corrigir até verde.
- [ ] **Step 5:** `pnpm build` → corrigir até verde.
- [ ] **Step 6:** `docker compose up -d` → subir stack; `curl http://localhost:4000/health` (via nginx `api.localhost`) → ok; migrate+seed; login pelo painel.
- [ ] **Step 7:** Commit final `chore(fase-1): fundação executável verde (lint/typecheck/test/build)` e apresentar no formato da spec §54.

---

## Self-Review (cobertura vs. spec — Fase 1 §52)

- monorepo ✅ T1 · Docker ✅ T15/T20 · PostgreSQL ✅ T6/T7/T15 · Redis ✅ T14/T15 · MinIO ✅ T11/T15 · Nginx local ✅ T15 · autenticação ✅ T9/T13 · usuários ✅ T6/T10 · banco+migrations ✅ T6/T7 · seed ✅ T10 · logs ✅ T3 (usado em todos) · health checks ✅ T12 · provider fake ✅ T8.
- Requisitos transversais de compliance com base já na Fase 1: noindex ✅ T18 · aviso de demo ✅ T18 · SSRF guard ✅ T5 · auditoria ✅ T13 · supressão (modelo) ✅ T6.
- Sem APIs pagas ✅ (T11 disabled/guard). Autonomia: enums/flags/orquestração preparados ✅ (T4/T14); regras autônomas completas nas fases 2+.
- Placeholder scan: sem TBD/TODO nos steps. Type consistency: nomes de funções (`slugify`, `toE164`, `isSafeHttpUrl`, `hashPassword`, `can`, `buildApp`, `QUEUE_NAMES`, `getAiProvider`) usados consistentemente entre tasks.
