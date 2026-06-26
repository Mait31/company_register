#!/bin/sh
set -eu

cd "$(dirname "$0")/../.."

git pull --ff-only

attempt=1
max_attempts=3

while [ "$attempt" -le "$max_attempts" ]; do
  echo "[INFO] docker compose up -d --build attempt $attempt/$max_attempts"

  if docker compose up -d --build; then
    break
  fi

  if [ "$attempt" -eq "$max_attempts" ]; then
    cat <<'EOF'
[ERROR] Docker build failed after retries.

If the log contains errors like:
  failed to resolve source metadata for docker.io/library/node:22-alpine
  failed to resolve source metadata for docker.io/library/python:3.12-slim
  Head "https://registry-1.docker.io/..." EOF

the server cannot reach Docker Hub reliably. On Tencent Cloud CVM, configure the
Docker registry mirror once, then run this deploy script again:

  sudo mkdir -p /etc/docker
  sudo tee /etc/docker/daemon.json >/dev/null <<'JSON'
  {
    "registry-mirrors": [
      "https://mirror.ccs.tencentyun.com"
    ]
  }
  JSON
  sudo systemctl daemon-reload
  sudo systemctl restart docker
  docker info | sed -n '/Registry Mirrors/,+5p'
  sh deploy/scripts/deploy.sh

If the daemon mirror is not available in the current region, set explicit image
sources in .env and run this deploy script again. Example:

  cp .env .env.bak.$(date +%Y%m%d%H%M%S)
  cat >> .env <<'EOF_IMAGES'
  PYTHON_IMAGE=docker.m.daocloud.io/library/python:3.12-slim
  NODE_IMAGE=docker.m.daocloud.io/library/node:22-alpine
  NGINX_IMAGE=docker.m.daocloud.io/library/nginx:1.27-alpine
  POSTGRES_IMAGE=docker.m.daocloud.io/library/postgres:16-alpine
  EOF_IMAGES
  sh deploy/scripts/deploy.sh
EOF
    exit 1
  fi

  attempt=$((attempt + 1))
  sleep 8
done

docker compose ps
