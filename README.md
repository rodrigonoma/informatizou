# Informatizou Prospect

Plataforma de prospecção e geração de sites institucionais. Pesquisa empresas,
qualifica leads, gera demonstrações de sites, faz prospecção comercial dentro das
regras, gerencia CRM, propostas e a conversão em cliente — com foco em
**autonomia ponta-a-ponta**.

> Fonte de requisitos: [`spec.md`](./spec.md). Arquitetura: [`docs/architecture/overview.md`](./docs/architecture/overview.md).
> Decisões: [`docs/decisions`](./docs/decisions). Este repositório está na **Fase 1 (Fundação)**.

## Stack

Node 22 · TypeScript estrito · pnpm + Turborepo · **Fastify** · **Prisma** ·
PostgreSQL · Redis · **BullMQ** · Zod · Pino · Swagger · **Nuxt 3 / Vue 3** ·
Tailwind · @tanstack/vue-query · VeeValidate · MinIO · Playwright · Docker.

## Estrutura

```
apps/       api · worker · admin-web · public-web · demo-renderer · cli
packages/   config · logging · shared · database · auth · search-providers · providers · storage
infrastructure/  docker · nginx · scripts · backups
docs/       architecture · decisions · superpowers (spec/plans)
```

## Pré-requisitos

- Node 22+, pnpm 11, Docker + Docker Compose.
- Neste ambiente de dev (Windows + WSL), rode tudo no WSL. Ver
  [ADR-0002](./docs/decisions/ADR-0002-wsl-environment.md).

## Desenvolvimento

```bash
cp .env.example .env            # ajuste as portas se necessário (ver nota abaixo)
pnpm install

# Infraestrutura (Postgres, Redis, MinIO) via Docker:
docker compose up -d postgres redis minio

pnpm db:migrate                 # aplica migrations (Prisma)
pnpm db:seed                    # cria usuários dev e 20 empresas fake

pnpm dev                        # sobe api + worker + os 3 frontends (Turbo)
```

Ou tudo em containers:

```bash
docker compose up --build       # sobe o stack completo (api, worker, 3 web, nginx, infra)
```

### Portas (dev)

| Serviço | URL |
|---------|-----|
| API | http://localhost:4000 (Swagger em `/docs`) |
| Painel (admin-web) | http://localhost:3001 |
| Site (public-web) | http://localhost:3000 |
| Demos (demo-renderer) | http://localhost:3002 |
| Nginx (subdomínios) | http://app.localhost:8080 · api.localhost:8080 · demo.localhost:8080 |
| Postgres · Redis · MinIO | localhost:5442 · 6389 · 9100 (console 9101) |

> **Portas deslocadas** (5442/6389/9100) para não colidir com outros projetos na
> mesma máquina. O `.env.example` segue a spec (5432/6379/9000); o `.env` local usa
> as deslocadas. Ver [ADR-0002](./docs/decisions/ADR-0002-wsl-environment.md).

### Credenciais de desenvolvimento (INSEGURAS)

`admin@informatizou.com.br` · `manager@…` · `sales@…` · `reviewer@…`
Senha (todos): `informatizou-dev-2026`. Veja também `informatizou db seed-info`.

## Qualidade

```bash
pnpm lint         # ESLint
pnpm typecheck    # TypeScript estrito
pnpm test         # Vitest (unit + integração)
pnpm build        # build de todos os pacotes/apps
```

## CLI

```bash
pnpm --filter @informatizou/cli start health          # checa a API
pnpm --filter @informatizou/cli start db seed-info    # credenciais dev
pnpm --filter @informatizou/cli start demo expire-all --yes   # ação em lote (exige --yes)
```

## Produção (VPS)

```bash
# na VPS, com .env de produção e DNS apontando para o servidor (spec §43):
docker compose -f docker-compose.production.yml up -d --build
```

Backups (spec §44):

```bash
infrastructure/scripts/backup-postgres.sh          # dump diário com retenção
infrastructure/scripts/restore-postgres.sh <arquivo.sql.gz>
```

## Compliance sempre ativo

noindex + `X-Robots-Tag` nas demos (§20) · aviso de demonstração (§19) · guarda
SSRF (§41) · auditoria · lista de supressão/opt-out (§29) · WhatsApp apenas
oficial e desabilitado por padrão (§4). Nenhuma API paga é usada na Fase 1.

## Roadmap por fases (todas concluídas ✅)

1. **Fundação** — monorepo, auth, banco (todas as entidades §34), seed, provider fake, health, Docker.
2. **Pesquisa** — campanhas, providers (fake/CSV), deduplicação §9, orquestração BullMQ, progresso e custos.
3. **Qualificação** — verificação de site §10 (+SSRF), contatos §12, score §13, revisão §14, CRM.
4. **Demos** — 7 templates §16, conteúdo §15 (sem inventar), geração/publicação/expiração §21, noindex, analytics §23.
5. **Prospecção** — mensagens §26, aprovações §27, e-mail (SMTP), opt-out §29, follow-up §30, agente comercial §28.
6. **Vendas** — planos §31, propostas §32 (HTML+PDF), conversão da demo em cliente §33, assinaturas.
7. **Produção** — deploy VPS, Nginx+SSL, DNS §43, backups §44, monitoramento §45, dashboard.

**Fluxo autônomo ponta-a-ponta** (com `AUTONOMOUS_MODE=true`): pesquisa → qualificação → demo →
publicação → prospecção → proposta → cliente, com os guardrails de compliance sempre ativos.

135 testes automatizados. Documentação de deploy em [`docs/deployment`](./docs/deployment) e
operações em [`docs/operations`](./docs/operations).
