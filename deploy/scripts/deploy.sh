#!/bin/sh
set -eu

cd "$(dirname "$0")/../.."

TARGET="${1:-all}"

git pull --ff-only

case "$TARGET" in
  all)
    docker compose up -d --build
    ;;
  frontend|backend|nginx|postgres)
    docker compose build "$TARGET"
    docker compose up -d "$TARGET"
    ;;
  *)
    echo "Usage: sh deploy/scripts/deploy.sh [all|frontend|backend|nginx|postgres]"
    exit 1
    ;;
esac

docker compose ps
