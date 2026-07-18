# Arquitetura — Visão geral

Fonte de requisitos: [`spec.md`](../../spec.md). Delta de stack: [ADR-0001](../decisions/ADR-0001-stack-override.md).

## Fluxo do produto

```
Pesquisa de empresas → Qualificação de leads → Geração de demonstrações →
Prospecção comercial → CRM → Venda do site → Manutenção mensal
```

Premissa maior: **autonomia ponta-a-ponta** — o pipeline avança automaticamente
por filas BullMQ quando os critérios objetivos são satisfeitos, mantendo os
guardrails de compliance sempre ativos por código (supressão/opt-out, noindex,
aviso de demonstração, SSRF, auditoria, limites de custo).

## Apps

| App | Stack | Papel |
|-----|-------|-------|
| `apps/api` | Fastify + Prisma + Zod + Pino + Swagger | REST API, auth JWT+refresh, RBAC, auditoria |
| `apps/worker` | BullMQ | 24 filas (§39) + workers recorrentes (expiração de demo) |
| `apps/admin-web` | Nuxt 3 (SPA) | Painel administrativo |
| `apps/public-web` | Nuxt 3 (SSR) | Site institucional (www) |
| `apps/demo-renderer` | Nuxt 3 (SSR) | Demonstrações por slug, sempre noindex |
| `apps/cli` | commander | CLI `informatizou` |

## Packages

`config` (env Zod), `logging` (Pino), `shared` (enums/schemas/utils; subpath
`./server` para utils Node-only), `database` (Prisma: schema + client + seed),
`auth` (argon2 + JWT + RBAC), `search-providers` (fake + futuros), `providers`
(IA/e-mail/WhatsApp — disabled por padrão), `storage` (MinIO). Pacotes de fases
seguintes: `enrichment`, `website-verification`, `scoring`, `ai`,
`demo-templates`, `outreach`, `analytics`, `testing`.

## Padrão de pacotes internos

Os packages exportam **TypeScript source** (`exports: ./src/index.ts`),
consumidos por tsx/vitest/vite/tsc — sem etapa de build separada. Os apps Node
(api/worker/cli) rodam via `tsx`; os apps Nuxt via Nitro.

## Dados

Todas as entidades da spec §34 modeladas no Prisma desde a Fase 1 (uma migration
inicial). Enums espelham `@informatizou/shared`. Entidades críticas têm
`createdBy/updatedBy/deletedAt/version`.

## Segurança (§41)

argon2id · cookies httpOnly + refresh rotativo · rate limiting · Helmet/CSP ·
validação Zod · guarda SSRF (bloqueia localhost/privados/metadados, IPv4 e IPv6) ·
auditoria · bloqueio por tentativas · secrets só em env (com redaction nos logs).
