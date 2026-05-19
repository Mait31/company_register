# 生产部署说明

## 1. 服务器要求

- Linux 服务器，推荐 Ubuntu 22.04 或 24.04。
- Docker 和 Docker Compose。
- 一个公网域名，例如 `register.example.com`。
- 域名 A 记录指向服务器公网 IP。

## 2. 配置环境变量

```bash
cp .env.example .env
```

生产环境至少修改：

```text
APP_ENV=production
APP_SECRET_KEY=强随机字符串
POSTGRES_DB=company_registration
POSTGRES_USER=company
POSTGRES_PASSWORD=强数据库密码
DATABASE_URL=postgresql+psycopg://company:强数据库密码@postgres:5432/company_registration
PUBLIC_BASE_URL=https://register.example.com
SERVER_NAME=register.example.com
WECHAT_MODE=token_only
WECHAT_MP_CALLBACK_BASE_URL=https://register.example.com
NGINX_HTTP_PORT=127.0.0.1:8080
```

## 3. HTTPS 证书

把证书放到：

```text
deploy/nginx/certs/fullchain.pem
deploy/nginx/certs/privkey.pem
```

可以用 Let's Encrypt / certbot 申请证书，然后复制或软链接到上述路径。

启用容器内 HTTPS：

```bash
cp deploy/nginx/https.conf.template.example deploy/nginx/templates/https.conf.template
```

如果服务器外层已经有 Nginx/宝塔/Caddy 负责 HTTPS，也可以不启用容器内 HTTPS，只让外层反代到本项目 `80` 端口。

## 4. 启动

```bash
docker compose up -d --build
```

默认部署模式是：Docker 项目只在服务器本机监听一个端口，系统 Nginx 负责公网 `80/443`、域名、证书和 HTTPS。

```env
NGINX_HTTP_PORT=127.0.0.1:8080
```

系统 Nginx 反向代理到：

```text
http://127.0.0.1:8080
```

如果服务器访问 Debian、PyPI 或 npm 较慢，可以在 `.env` 中配置构建镜像源。腾讯云服务器可先使用：

```env
APT_DEBIAN_MIRROR=https://mirrors.cloud.tencent.com/debian
APT_SECURITY_MIRROR=https://mirrors.cloud.tencent.com/debian-security
PIP_INDEX_URL=https://mirrors.cloud.tencent.com/pypi/simple
PIP_DEFAULT_TIMEOUT=180
PIP_RETRIES=10
NPM_REGISTRY=https://mirrors.cloud.tencent.com/npm/
```

阿里云或其他国内服务器也可以改成对应云厂商镜像源。配置后重新执行：

```bash
docker compose up -d --build
```

如果暂时没有 HTTPS 证书，先用系统 Nginx 的 HTTP 反代完成首次验证。生产环境的 HTTPS 由系统 Nginx 负责。

检查：

```bash
docker compose ps
curl http://127.0.0.1:8080/api/health
curl https://register.example.com/api/health
```

## 5. 创建演示邀请

```bash
docker compose exec backend python -m app.scripts.create_demo_invitation
```

访问：

```text
https://register.example.com/i/demo-token
```

## 6. 备份

数据库备份：

```bash
sh deploy/scripts/backup_db.sh
```

文件备份：

```bash
sh deploy/scripts/backup_storage.sh
```

## 7. 更新

```bash
docker compose up -d --build
```

后端容器启动时会自动执行：

```bash
alembic upgrade head
```

## 8. 微信分享卡片

当前 H5 支持“用户在微信内打开页面后，再分享给别人时显示自定义卡片”。

服务器 `.env` 需要配置：

```env
WECHAT_MP_APP_ID=你的公众号 AppID
WECHAT_MP_APP_SECRET=你的公众号 AppSecret
WECHAT_MP_CALLBACK_BASE_URL=https://你的域名
WECHAT_SHARE_TITLE=公司注册信息登记
WECHAT_SHARE_DESC=请按要求补充公司登记所需信息
WECHAT_SHARE_IMAGE_URL=https://你的域名/wechat-share-v4.png
```

公众号后台需要配置：

- `JS 接口安全域名`：只填域名，不带 `https://`，不带路径。
- `API IP 白名单`：填服务器公网 IP。
- H5 必须使用 HTTPS 正式域名访问。

说明：

- `WECHAT_MODE=token_only` 可以继续保留，它只表示当前不强制 OAuth。
- JS SDK 分享签名仍然需要 AppID/AppSecret、JS 接口安全域名和 HTTPS。
- 分享卡片只控制“页面已经在微信内打开后，用户再分享出去”的展示效果。
