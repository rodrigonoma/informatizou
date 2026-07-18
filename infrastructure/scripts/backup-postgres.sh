#!/usr/bin/env bash
# Backup do PostgreSQL do Informatizou (spec §44).
# Uso: ./backup-postgres.sh
# Variáveis (com defaults):
#   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, BACKUP_DIR
set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5442}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-informatizou}"
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/../backups}"

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly" "$BACKUP_DIR/monthly"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DOW="$(date +%u)"   # 1..7 (segunda..domingo)
DOM="$(date +%d)"   # dia do mês
FILE="$BACKUP_DIR/daily/informatizou-$TIMESTAMP.sql.gz"

echo "[backup] gerando dump de $PGDATABASE em $FILE"
PGPASSWORD="${PGPASSWORD:-postgres}" pg_dump \
  -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
  | gzip > "$FILE"

# Cópias semanais (domingo) e mensais (dia 1).
if [ "$DOW" = "7" ]; then cp "$FILE" "$BACKUP_DIR/weekly/"; fi
if [ "$DOM" = "01" ]; then cp "$FILE" "$BACKUP_DIR/monthly/"; fi

# Retenção (spec §44): diária 7 dias, semanal 4 semanas, mensal 3 meses.
find "$BACKUP_DIR/daily" -name '*.sql.gz' -mtime +7 -delete || true
find "$BACKUP_DIR/weekly" -name '*.sql.gz' -mtime +28 -delete || true
find "$BACKUP_DIR/monthly" -name '*.sql.gz' -mtime +90 -delete || true

echo "[backup] concluído: $FILE"
