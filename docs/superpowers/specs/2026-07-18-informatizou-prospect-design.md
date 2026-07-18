# Design — Informatizou Prospect (adaptação de stack + arquitetura)

> **Fonte de requisitos de produto:** `spec.md` (59 seções). Este documento **não substitui** a spec — ele registra as **decisões de arquitetura** e o **delta de stack** aprovados pelo proprietário, além da estratégia de ambiente e o plano de fases. Em caso de conflito de _requisito de produto_, a spec prevalece; em caso de conflito de _stack_, este documento prevalece (as instruções diretas do proprietário sobrepõem a seção 4 da spec).

Data: 2026-07-18 · Autor: Rodrigo Noma + Claude (arquiteto/dev)

---

## 1. Delta de stack (vs. seção 4 da spec)

O proprietário determinou a stack. As instruções diretas sobrepõem a seção 4 da spec. Mudanças:

| Camada | Spec (seção 4) | **Decidido** | Motivo |
|--------|----------------|--------------|--------|
| Backend framework | NestJS | **Fastify** | Instrução do proprietário. Fastify + plugins + rotas modulares + services. |
| Frontends | Next.js / React | **Nuxt 3 / Vue 3** | Instrução do proprietário. |
| UI kit | shadcn/ui (React) | **shadcn-vue** (Reka UI) + Tailwind | Equivalente Vue; mantém a intenção (Tailwind + componentes copiáveis/customizáveis). |
| Data fetching | TanStack Query (React) | **@tanstack/vue-query** | Equivalente Vue. |
| Forms | React Hook Form | **VeeValidate + @vee-validate/zod** | Equivalente Vue, valida com os mesmos schemas Zod. |

**Mantidos exatamente como na spec:** TypeScript estrito, Node.js 22, Prisma ORM, PostgreSQL, Redis, **BullMQ**, Zod, Pino, Swagger/OpenAPI, Playwright, MinIO (S3-compatível), Anthropic Claude (primeiro provider de IA), pnpm + Turborepo, monorepo.

Registro formal em `docs/decisions/ADR-0001-stack-override.md`.

---

## 2. Ambiente de desenvolvimento e execução

- **Onde o código mora:** filesystem nativo do **WSL Ubuntu 24.04** em `~/projetos/informatizou` (perf de Docker/HMR nativa).
- **Como Claude edita:** via caminho UNC `\\wsl.localhost\Ubuntu\home\rodrigonoma\projetos\informatizou` (Read/Write/Edit confirmados; line endings LF preservados).
- **Como Claude executa:** `wsl.exe -- bash -lc "cd ~/projetos/informatizou && <cmd>"`.
- **Ferramentas no WSL (confirmadas):** Node v22.22.2, pnpm 11.0.8 (via nvm), Docker 29.4.3, Docker Compose v5.1.3.
- **Sem Docker Desktop no Windows** — todo Docker roda dentro do WSL.
- **Alvo de produção:** VPS Linux (Hostinger) — Ubuntu LTS + Docker Compose + Nginx + Certbot.

Registro formal em `docs/decisions/ADR-0002-wsl-environment.md`.

---

## 3. Estrutura do monorepo

Conforme seção 5 da spec, adaptada à stack:

```
informatizou-prospect/
├── apps/
│   ├── api/            # Fastify + Prisma + Zod + Pino + Swagger (REST, seção 35)
│   ├── admin-web/      # Nuxt 3 (SPA, ssr:false) — painel (seção 36)
│   ├── public-web/     # Nuxt 3 (SSR) — site institucional (seção 3.1)
│   ├── demo-renderer/  # Nuxt 3 (SSR) — demos por slug, noindex, expiração (18–21)
│   ├── worker/         # BullMQ workers (seção 39) + recorrentes (expiração)
│   └── cli/            # CLI `informatizou` (seção 38)
├── packages/
│   ├── database/          # Prisma schema, migrations, seed, client
│   ├── shared/            # tipos, enums da spec, schemas Zod, utils (slug, phone, email, token)
│   ├── auth/              # hash de senha (argon2), JWT+refresh, RBAC, guards
│   ├── config/            # carregamento e validação de env (Zod)
│   ├── logging/           # Pino (logger estruturado, redaction de secrets)
│   ├── providers/         # abstrações: ai, email, whatsapp, storage
│   ├── search-providers/  # BusinessSearchProvider: fake, csv, google, apify, serpapi, outscraper
│   ├── enrichment/        # enriquecimento de lead (seção 11)
│   ├── website-verification/ # verificação de site + guarda SSRF (seções 10, 41)
│   ├── scoring/           # score comercial configurável (seção 13)
│   ├── ai/                # AiProvider (Anthropic Claude) (seções 15, 28)
│   ├── demo-templates/    # 7 templates Vue + JSON estruturado (seção 16)
│   ├── outreach/          # mensagens, elegibilidade, supressão, follow-up (26–30)
│   ├── storage/           # cliente MinIO/S3 (seção 17)
│   ├── analytics/         # eventos de demo, token de campanha (seção 23)
│   └── testing/           # helpers de teste, factories, fixtures
├── infrastructure/
│   ├── docker/            # Dockerfiles por app
│   ├── nginx/             # confs por subdomínio
│   ├── scripts/           # backup, restore, deploy
│   ├── backups/
│   └── monitoring/
├── docs/
│   ├── architecture/  ├── decisions/  ├── deployment/  ├── operations/  └── compliance/
├── docker-compose.yml
├── docker-compose.production.yml
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
├── .env.example
├── .gitignore
└── README.md
```

**Princípio de isolamento:** cada `package` tem um propósito único, interface tipada e testável isoladamente. Nenhum conteúdo de lead fica hard-coded em template (seção 16).

---

## 4. Modelo de dados (Prisma) — completo já na Fase 1

Decisão aprovada: modelar **todas as entidades da seção 34** já na Fase 1 (uma migration inicial), mesmo que só um subconjunto seja exercitado agora. Evita retrabalho e fixa o modelo. Entidades:

`User, UserSession, AuditLog · SearchCampaign, CampaignExecution, CampaignCost · Business, BusinessCategory, BusinessSourceRecord, BusinessContact, BusinessSocialProfile, BusinessImage, BusinessReviewSummary · WebsiteVerification, WebsiteCandidate · Lead, LeadScore, LeadReview, LeadAssignment, LeadActivity, LeadTag · DemoSite, DemoSiteVersion, DemoSitePublication, SiteScreenshot, DemoAnalyticsEvent · OutreachMessage, OutreachApproval, OutreachAttempt, OutreachConversation, OutreachResponse, SuppressionEntry · ProductPlan, Proposal, ProposalItem · Customer, CustomerSite, CustomerSubscription, CustomerOnboardingTask · Integration, ProviderUsage, SystemSetting, JobExecution, ExportFile`

Convenções (seção 34): todas com `id` (cuid), `createdAt`, `updatedAt`. Entidades críticas com `createdBy`, `updatedBy`, `deletedAt` (soft delete), `version` (optimistic locking). Enums da spec (UserRole, CampaignStatus, WebsiteStatus, DemoSiteStatus, ReviewStatus, LeadStatus, OutreachMode, ProposalStatus, etc.) modelados como enums Prisma/PG.

---

## 5. Arquitetura da API (Fastify)

- **Bootstrap:** `app.ts` registra plugins: `@fastify/sensible`, `@fastify/cookie`, `@fastify/jwt`, `@fastify/helmet` (CSP), `@fastify/cors`, `@fastify/rate-limit`, `@fastify/swagger` + `@fastify/swagger-ui`, plugin Prisma, plugin de logging (Pino), plugin de auth/RBAC.
- **Validação:** Zod em todas as entradas via `fastify-type-provider-zod` (schemas compartilhados do package `shared`). Saídas tipadas.
- **Auth (seção 41):** login → access token (curto, em memória/Authorization) + refresh token (cookie httpOnly seguro). `POST /auth/refresh`, `GET /auth/me`, logout revoga sessão (UserSession). Senha com **argon2**. Bloqueio por tentativas. 2FA opcional fica para fase posterior (flag).
- **RBAC:** decorator/preHandler que valida `UserRole` por rota. Cinco perfis (seção 6).
- **Auditoria (seção 34/41):** hook que grava `AuditLog` em ações críticas (createdBy/updatedBy).
- **Rotas Fase 1:** `/health` (+ readiness), `/auth/*`. Demais grupos (campaigns, businesses, leads, demo-sites, outreach, proposals, exports) entram nas fases correspondentes, mas o roteador é organizado por módulo desde já.

---

## 6. Workers / Filas (BullMQ)

- `apps/worker` conecta ao Redis e registra os 24 processadores da seção 39. Na Fase 1, o worker sobe e conecta; processadores reais são preenchidos por fase.
- Cada job (seção 39): idempotência, timeout, tentativas, backoff exponencial, dead-letter, logs, métricas, progresso, cancelamento, correlação com campanha.
- Worker recorrente `demo-expiration` (≤ 1×/hora) chega na Fase 4.

---

## 7. Segurança transversal (seção 41) — desde a Fase 1

argon2 · cookies seguros httpOnly · refresh tokens com rotação · rate limiting · validação Zod · Helmet/CSP · secrets só em env (validados, com redaction nos logs) · trilha de auditoria · **guarda SSRF** no package `website-verification` (bloqueia localhost/127.0.0.1/0.0.0.0/169.254.169.254/faixas privadas IPv4+IPv6/file:/ftp:/javascript:/data:, valida DNS antes e depois de redirects) — implementado e testado já na Fase 1 como utilitário, mesmo antes do uso pleno na Fase 3.

---

## 8. Frontends (Nuxt 3)

- **admin-web:** Nuxt em modo SPA (`ssr:false`) — é área logada, SEO irrelevante. shadcn-vue + Tailwind, @tanstack/vue-query, VeeValidate+Zod. Na Fase 1: tela de `/login` funcional + `/dashboard` mínimo autenticado + guard de rota.
- **public-web:** Nuxt SSR. Fase 1: home institucional inicial + rotas placeholder estruturadas (sem "telas vazias" enganosas — conteúdo real mínimo).
- **demo-renderer:** Nuxt SSR. Fase 1: esqueleto que resolve `/[slug]`, injeta `<meta name="robots" noindex...>` e header `X-Robots-Tag`, e renderiza página "demo não encontrada/indisponível". Render por template real chega na Fase 4.

---

## 9. Infra / Docker

- `docker-compose.yml` (dev): postgres, redis, minio, api, admin-web, public-web, demo-renderer, worker. Nginx local opcional para rotear subdomínios via `*.localhost`.
- `docker-compose.production.yml`: + nginx + certbot, imagens buildadas, secrets via env.
- Nginx roteia: www→public-web, app→admin-web, api→api, demo→demo-renderer (seção 42).
- `.env.example` conforme seção 46.

---

## 10. Plano de fases (a spec manda; executa-se uma por vez, cada uma executável)

| Fase | Escopo (spec §52) | Entrega |
|------|-------------------|---------|
| **1 — Fundação** | monorepo, Docker, PG/Redis/MinIO, Nginx local, auth, usuários/RBAC, Prisma schema completo + migration + seed, logs, health checks, provider fake (20 empresas) | **Esta entrega** |
| 2 — Pesquisa | campanhas, providers, busca, import CSV, deduplicação, progresso, custos | próximo ciclo |
| 3 — Qualificação | verificação de site (+SSRF), enriquecimento, validação de contatos, score, revisão, CRM inicial | |
| 4 — Demos | templates, IA, conteúdo, revisão, editor, publicação, noindex, screenshots, analytics, expiração | |
| 5 — Prospecção | mensagens, aprovações, e-mail, abstração WhatsApp, opt-out, follow-up, respostas, agente comercial | |
| 6 — Vendas | planos, propostas, PDF, negociação, clientes, conversão da demo, assinaturas | |
| 7 — Produção | deploy VPS, Nginx, SSL, DNS, backups, monitoramento, segurança, docs | |

Após cada fase: lint, typecheck, testes, build; correção de erros; atualização de README/docs; formato de entrega da spec §54 (IMPLEMENTADO / ARQUIVOS / MIGRATIONS / TESTES / COMO EXECUTAR / COMO VALIDAR / PENDÊNCIAS / PRÓXIMA FASE).

---

## 11. Escopo detalhado da Fase 1 (esta entrega)

**Objetivo:** fundação executável com `docker compose up` (via WSL), painel e site público acessíveis, autenticação real, banco migrado e semeado, provider fake operante, health checks e testes verdes.

**Entregáveis:**
1. Monorepo pnpm + Turborepo + tsconfig base estrito.
2. `packages/config`, `packages/logging`, `packages/shared` (enums + Zod + utils com testes: slug, phone E.164, email, token de campanha, guarda SSRF/URL).
3. `packages/database`: schema Prisma completo (todas entidades §34), migration inicial, `seed.ts` (admin, manager, sales, reviewer; credenciais dev marcadas como inseguras) + 20 empresas fake (§49).
4. `packages/auth`: argon2, JWT+refresh, RBAC.
5. `packages/search-providers`: `FakeBusinessSearchProvider` com 20 empresas cobrindo os 20 casos da §49.
6. `apps/api`: Fastify com `/health`, `/auth/login|logout|refresh|me`, Swagger, RBAC, auditoria, rate limit, Helmet/CSP.
7. `apps/worker`: conecta Redis/BullMQ, registra filas (processadores stub idempotentes prontos para preenchimento).
8. `apps/admin-web`: Nuxt SPA com `/login` + `/dashboard` autenticado + guard.
9. `apps/public-web`: Nuxt SSR com home institucional inicial.
10. `apps/demo-renderer`: Nuxt SSR com `/[slug]`, noindex + X-Robots-Tag, página de indisponível.
11. `apps/cli`: `informatizou` com comando inicial (ex.: `db:seed` info, `health`) e confirmação para ações em lote.
12. `infrastructure/`: Dockerfiles, docker-compose dev, nginx local, .env.example.
13. Testes: unitários (§48 — normalização nome/telefone/email/slug, token, URL/SSRF) + ao menos 1 integração (login) + smoke de health.
14. `docs/decisions/ADR-0001`, `ADR-0002`, `docs/architecture/overview.md`, README com comandos.

**Fora do escopo da Fase 1:** qualquer API paga (Google/Apify/SerpAPI/Outscraper/Anthropic/SES/WhatsApp) — só abstrações + fake. Geração real de demo, screenshots, envio de mensagens, propostas — fases seguintes.

**Critério de pronto (Fase 1):** `docker compose up` sobe tudo; `pnpm db:migrate && pnpm db:seed` ok; login funciona no painel; `/health` verde; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` verdes.

---

## 12. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Perf de I/O Docker/HMR no WSL | Código no FS nativo do WSL (já decidido); watch com polling se necessário. |
| Schema Prisma grande de uma vez | Migration inicial única, revisada; enums centralizados em `shared`. |
| shadcn-vue menos maduro que shadcn/ui | Componentes-base copiados/versionados no repo; fallback Tailwind puro se algo faltar. |
| Escopo enorme (7 fases) | Entrega estritamente fase a fase, executável e testada antes de avançar (spec §55–58). |
| Edição via UNC \\wsl.localhost | Confirmado funcional (Read/Write/Edit + LF). Comandos sempre via `wsl.exe`. |
| Segredos/compliance (§2, §41) | noindex, aviso de demo, opt-out, auditoria, SSRF tratados como requisitos de primeira classe, não opcionais. |

---

## 13. Próximo passo

Após aprovação deste design pelo proprietário: invocar a skill **writing-plans** para produzir o plano de implementação detalhado da **Fase 1**, e então executar.
