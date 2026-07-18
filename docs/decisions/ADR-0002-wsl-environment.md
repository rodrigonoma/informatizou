# ADR-0002 — Ambiente de desenvolvimento no WSL

- **Status:** Aceito
- **Data:** 2026-07-18

## Contexto

A máquina de desenvolvimento é Windows 11 **sem Docker Desktop**, com **WSL2
(Ubuntu 24.04)** contendo Docker 29, Node 22 (nvm) e pnpm 11. Outros projetos na
mesma máquina já usam as portas 5432 (Postgres) e 6379 (Redis).

## Decisão

1. **Código no filesystem nativo do WSL** (`~/projetos/informatizou`) para
   performance de Docker/HMR (bind mounts nativos Linux).
2. **Toda a toolchain roda no WSL** (`wsl.exe -- bash -lic '…'`).
3. **Portas de host deslocadas** para não colidir com outros projetos:
   - Postgres `5442` · Redis `6389` · MinIO `9100/9101`.
   - Internamente (rede do compose) os serviços usam as portas padrão via nome de
     serviço (`postgres:5432`, `redis:6379`, `minio:9000`).
   - `.env.example` permanece fiel à spec §46; o `.env` local usa as portas deslocadas.
4. **Alvo de produção:** VPS Linux (Hostinger) — Ubuntu LTS + Docker Compose +
   Nginx + Certbot, onde as portas padrão são usadas normalmente.

## Consequências

- Comandos de banco locais carregam o `.env` via `dotenv-cli` (o `.env` tem
  valores com espaço que quebram `source`).
- Scripts `*:deploy` permanecem "crus" (sem dotenv) para produção, onde o env vem
  do ambiente do container.
