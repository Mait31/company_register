#!/bin/sh
set -eu

cd "$(dirname "$0")/../.."

mirror_prefix="${1:-docker.m.daocloud.io/library}"
env_file=".env"

if [ ! -f "$env_file" ]; then
  echo "[ERROR] .env not found in $(pwd)"
  exit 1
fi

backup="$env_file.bak.$(date +%Y%m%d%H%M%S)"
cp "$env_file" "$backup"
echo "[INFO] Backup created: $backup"

tmp_file="$(mktemp)"

grep -v -E '^(PYTHON_IMAGE|NODE_IMAGE|NGINX_IMAGE|POSTGRES_IMAGE)=' "$env_file" > "$tmp_file"

cat >> "$tmp_file" <<EOF_IMAGES
PYTHON_IMAGE=${mirror_prefix}/python:3.12-slim
NODE_IMAGE=${mirror_prefix}/node:22-alpine
NGINX_IMAGE=${mirror_prefix}/nginx:1.27-alpine
POSTGRES_IMAGE=${mirror_prefix}/postgres:16-alpine
EOF_IMAGES

mv "$tmp_file" "$env_file"

echo "[INFO] Docker base images updated in .env:"
grep -E '^(PYTHON_IMAGE|NODE_IMAGE|NGINX_IMAGE|POSTGRES_IMAGE)=' "$env_file"
