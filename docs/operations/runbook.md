# Runbook de operações

## Monitoramento (spec §45)

- **Health checks:** `GET /health` (liveness), `GET /health/ready` (Postgres).
- **Métricas de operação:** `GET /admin/metrics` (autenticado, perfil com `logs.view`):
  jobs por status, falhas por fila, demos expirando em 24h, entradas de supressão.
- **Dashboard:** `GET /stats/dashboard` — funil (empresas, leads, demos, contatos,
  interessados, vendas), receita de implantação/mensal e custo de provedores.
- **Logs estruturados (Pino):** cada transição de fila, job (início/fim/erro/retry) e
  decisão do pipeline é logada com `correlationId` (campanha/lead/job). Secrets são
  redigidos automaticamente.
- **Filas (BullMQ):** estado inspecionável no Redis; jobs falhos vão para retenção
  (dead-letter) com backoff exponencial (3 tentativas).

Integrações futuras: Grafana/Prometheus/Loki/Sentry/Uptime Kuma (pontos de extensão).

## Backups (spec §44)

```bash
# Diário (retenção: 7 diários, 4 semanais, 3 mensais)
infrastructure/scripts/backup-postgres.sh
# Restauração
infrastructure/scripts/restore-postgres.sh infrastructure/backups/daily/informatizou-YYYYMMDD-HHMMSS.sql.gz
```

Agende via cron na VPS:

```cron
0 3 * * * cd /caminho/informatizou && PGHOST=localhost PGPORT=5442 infrastructure/scripts/backup-postgres.sh >> /var/log/informatizou-backup.log 2>&1
```

Backup do MinIO: usar `mc mirror` do bucket `informatizou` para um destino externo.

## Expiração de demonstrações (spec §21)

O worker `demo-expiration` roda a cada hora (job recorrente BullMQ) e expira
demonstrações publicadas cujo `expiresAt` passou (status → EXPIRED). Renovação
manual via `POST /demo-sites/:id/extend`.

## Modos de operação

- `AUTONOMOUS_MODE=false` (padrão): revisão/aprovação manual em cada etapa.
- `AUTONOMOUS_MODE=true`: o pipeline avança sozinho quando os critérios objetivos
  são satisfeitos (score/confiança/sem bloqueio), mantendo compliance por código.
- `OUTREACH_MODE`: `MANUAL` | `APPROVAL_REQUIRED` (padrão) | `AUTOMATIC_WHEN_ALLOWED`.
- `ENABLE_EMAIL_DELIVERY` / `ENABLE_WHATSAPP_DELIVERY`: só habilitar com provedor válido.

## Incidentes comuns

- **API não sobe:** verifique `.env` (variáveis obrigatórias) e `docker compose logs api`.
- **Jobs falhando:** `GET /admin/metrics` → `failuresByQueue`; inspecione `JobExecution`.
- **E-mails não saem:** confirme `ENABLE_EMAIL_DELIVERY=true` e credenciais SMTP.
- **Demo não indexa (esperado):** noindex é intencional (§20) e nunca deve ser removido
  para demonstrações.
