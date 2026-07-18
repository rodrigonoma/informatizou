# ADR-0001 — Ajuste de stack (Fastify + Vue/Nuxt)

- **Status:** Aceito
- **Data:** 2026-07-18
- **Decisor:** Rodrigo Noma (proprietário)

## Contexto

A `spec.md` (seção 4) especifica NestJS no backend e Next.js/React + shadcn/ui no
frontend. O proprietário determinou uma stack diferente. Instruções diretas do
proprietário prevalecem sobre a seção 4 da spec (requisitos de _produto_ da spec
continuam valendo).

## Decisão

| Camada | Spec (§4) | Adotado |
|--------|-----------|---------|
| Backend | NestJS | **Fastify** (plugins + rotas modulares + services) |
| Frontends | Next.js/React | **Nuxt 3 / Vue 3** |
| UI kit | shadcn/ui | **shadcn-vue** (Reka UI) + Tailwind — adotado a partir da Fase 4 |
| Data fetching | TanStack Query (React) | **@tanstack/vue-query** |
| Forms | React Hook Form | **VeeValidate + @vee-validate/zod** |

Mantidos como na spec: TypeScript estrito, Node 22, Prisma, PostgreSQL, Redis,
**BullMQ**, Zod, Pino, Swagger, Playwright, MinIO, Anthropic, pnpm + Turborepo.

## Consequências

- Reaproveitamento total das camadas de dados/fila conforme a spec.
- Frontends SSR (public-web, demo-renderer) via Nuxt; painel como SPA Nuxt.
- Na Fase 1, o painel usa componentes Tailwind próprios; shadcn-vue entra na Fase 4,
  junto com os templates premium (onde o polish visual é o produto).
- Enums de `@informatizou/shared` são const-object + union type para casarem
  estruturalmente com os enums gerados pelo Prisma (evita casts na fronteira).
