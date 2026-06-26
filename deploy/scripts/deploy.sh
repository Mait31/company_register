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

If the mirror is not available in the current region, fix Docker Hub connectivity
or set an available Docker registry mirror before deploying.
EOF
    exit 1
  fi

  attempt=$((attempt + 1))
  sleep 8
done

docker compose ps
