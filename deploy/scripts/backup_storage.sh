#!/bin/sh
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups/storage}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

tar -czf "$BACKUP_DIR/storage-$TIMESTAMP.tar.gz" storage
echo "Storage backup written to $BACKUP_DIR/storage-$TIMESTAMP.tar.gz"
