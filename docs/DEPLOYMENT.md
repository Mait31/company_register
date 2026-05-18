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

如果暂时没有 HTTPS 证书，不要复制 `https.conf.template`，只用 HTTP 完成首次验证。生产环境必须通过容器内 HTTPS 或外层反代提供 HTTPS。

检查：

```bash
docker compose ps
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
