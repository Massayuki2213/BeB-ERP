#!/usr/bin/env bash
# Backup diário do banco. Roda NO SERVIDOR (não no seu PC).
# Gera um dump comprimido e mantém os últimos 14 dias.
#
# Instalar no cron (uma vez):
#   mkdir -p ~/backups
#   crontab -e
#   # adicione a linha (backup todo dia às 03:00):
#   0 3 * * * /caminho/para/scripts/backup.sh >> ~/backups/backup.log 2>&1

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
DB_CONTAINER="${DB_CONTAINER:-beb-db}"
DB_NAME="${DB_NAME:-loja}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%F_%H%M)"
OUT="$BACKUP_DIR/${DB_NAME}-${STAMP}.sql.gz"

echo "[$(date)] iniciando backup -> $OUT"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$OUT"
echo "[$(date)] backup ok ($(du -h "$OUT" | cut -f1))"

# Remove backups mais antigos que RETENTION_DAYS
find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "[$(date)] limpeza concluida (mantendo ${RETENTION_DAYS} dias)"
