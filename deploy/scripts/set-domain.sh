#!/bin/sh
set -eu

usage() {
  cat <<'EOF'
Usage:
  sh deploy/scripts/set-domain.sh <domain> [--deploy] [--with-wecom] [--scheme https]

Examples:
  sh deploy/scripts/set-domain.sh jsutong.cn
  sh deploy/scripts/set-domain.sh jsutong.cn --deploy
  sh deploy/scripts/set-domain.sh jsutong.cn --with-wecom --deploy

Updates only domain-related values in .env:
  PUBLIC_BASE_URL
  SERVER_NAME
  WECHAT_MP_CALLBACK_BASE_URL
  WECHAT_SHARE_IMAGE_URL

With --with-wecom, also updates:
  WECOM_CALLBACK_BASE_URL

It does not change database credentials, storage paths, app secrets, or NGINX_HTTP_PORT.
EOF
}

domain=""
scheme="https"
run_deploy="0"
with_wecom="0"
env_file=".env"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --deploy)
      run_deploy="1"
      shift
      ;;
    --with-wecom)
      with_wecom="1"
      shift
      ;;
    --scheme)
      if [ "$#" -lt 2 ]; then
        usage
        exit 1
      fi
      scheme="$2"
      shift 2
      ;;
    --env-file)
      if [ "$#" -lt 2 ]; then
        usage
        exit 1
      fi
      env_file="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [ -n "$domain" ]; then
        usage
        exit 1
      fi
      domain="$1"
      shift
      ;;
  esac
done

if [ -z "$domain" ]; then
  usage
  exit 1
fi

case "$scheme" in
  http|https) ;;
  *)
    echo "ERROR: --scheme must be http or https" >&2
    exit 1
    ;;
esac

case "$domain" in
  http://*|https://*|*/*|*:*)
    echo "ERROR: pass only the domain, for example: jsutong.cn" >&2
    exit 1
    ;;
esac

case "$domain" in
  *[!A-Za-z0-9.-]*|.*|*.)
    echo "ERROR: invalid domain: $domain" >&2
    exit 1
    ;;
esac

cd "$(dirname "$0")/../.."

if [ ! -f "$env_file" ]; then
  echo "ERROR: $env_file not found. Create it from .env.example first." >&2
  exit 1
fi

base_url="${scheme}://${domain}"
share_image_url="${base_url}/wechat-share.png"
timestamp="$(date +%Y%m%d-%H%M%S)"
backup_file="${env_file}.backup-${timestamp}"
tmp_file="${env_file}.tmp-${timestamp}"

cp "$env_file" "$backup_file"

if [ "$with_wecom" = "1" ]; then
  keys="PUBLIC_BASE_URL SERVER_NAME WECHAT_MP_CALLBACK_BASE_URL WECHAT_SHARE_IMAGE_URL WECOM_CALLBACK_BASE_URL"
else
  keys="PUBLIC_BASE_URL SERVER_NAME WECHAT_MP_CALLBACK_BASE_URL WECHAT_SHARE_IMAGE_URL"
fi

awk \
  -v public_base_url="$base_url" \
  -v server_name="$domain" \
  -v wechat_callback_base_url="$base_url" \
  -v wechat_share_image_url="$share_image_url" \
  -v wecom_callback_base_url="$base_url" \
  -v with_wecom="$with_wecom" '
BEGIN {
  values["PUBLIC_BASE_URL"] = public_base_url
  values["SERVER_NAME"] = server_name
  values["WECHAT_MP_CALLBACK_BASE_URL"] = wechat_callback_base_url
  values["WECHAT_SHARE_IMAGE_URL"] = wechat_share_image_url
  if (with_wecom == "1") {
    values["WECOM_CALLBACK_BASE_URL"] = wecom_callback_base_url
  }
}
/^[A-Za-z_][A-Za-z0-9_]*=/ {
  key = $0
  sub(/=.*/, "", key)
  if (key in values) {
    print key "=" values[key]
    seen[key] = 1
    next
  }
}
{ print }
END {
  for (key in values) {
    if (!(key in seen)) {
      print key "=" values[key]
    }
  }
}
' "$env_file" > "$tmp_file"

mv "$tmp_file" "$env_file"

echo "Updated domain settings in $env_file"
echo "Backup: $backup_file"
echo
echo "Changed values:"
echo "  PUBLIC_BASE_URL=$base_url"
echo "  SERVER_NAME=$domain"
echo "  WECHAT_MP_CALLBACK_BASE_URL=$base_url"
echo "  WECHAT_SHARE_IMAGE_URL=$share_image_url"
if [ "$with_wecom" = "1" ]; then
  echo "  WECOM_CALLBACK_BASE_URL=$base_url"
fi
echo
echo "External Nginx should reverse proxy this domain to the project port, usually:"
echo "  http://127.0.0.1:8080"

if [ "$run_deploy" = "1" ]; then
  echo
  echo "Running deploy..."
  sh deploy/scripts/deploy.sh
fi
