#!/usr/bin/env bash
# Restauração do PostgreSQL do Informatizou (spec §44).
# Uso: ./restore-postgres.sh <arquivo.sql.gz>
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Uso: $0 <arquivo.sql.gz>" >&2
  exit 1
fi

FILE="$1"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5442}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-informatizou}"

if [ ! -f "$FILE" ]; then
  echo "Arquivo não encontrado: $FILE" >&2
  exit 1
fi

echo "[restore] ATENÇÃO: isto irá sobrescrever dados de $PGDATABASE."
echo "[restore] restaurando a partir de $FILE"
gunzip -c "$FILE" | PGPASSWORD="${PGPASSWORD:-postgres}" psql \
  -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE"

echo "[restore] concluído."
