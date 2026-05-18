#!/bin/sh
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups/db}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_DIR/db-$TIMESTAMP.sql"
echo "Database backup written to $BACKUP_DIR/db-$TIMESTAMP.sql"
