#!/usr/bin/env bash
# Backup TrendMind PostgreSQL (TimescaleDB) database
# Usage: ./backup-db.sh [backup-dir]
# Default backup dir: ./backups

set -euo pipefail

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/trendmind_${TIMESTAMP}.dump"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-trendmind}"
DB_USERNAME="${DB_USERNAME:-trendmind_user}"
CONTAINER="${POSTGRES_CONTAINER:-trendmind-postgres}"

mkdir -p "$BACKUP_DIR"

echo "Starting backup of database '${DB_NAME}' at ${TIMESTAMP}..."

# Prefer running pg_dump inside the container if it's running
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER}$"; then
  docker exec "$CONTAINER" pg_dump \
    -U "$DB_USERNAME" \
    -d "$DB_NAME" \
    --format=custom \
    --no-password \
    > "$BACKUP_FILE"
else
  PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USERNAME" \
    -d "$DB_NAME" \
    --format=custom \
    > "$BACKUP_FILE"
fi

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "Backup complete: ${BACKUP_FILE} (${SIZE})"

# Remove backups older than 7 days
find "$BACKUP_DIR" -name "trendmind_*.dump" -mtime +7 -delete
echo "Old backups cleaned up."
