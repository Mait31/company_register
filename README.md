# 公司注册自动化 MVP

第一阶段目标：用响应式网站跑通公司注册工单主链路，并完整接入企业微信自建应用登录和通知。

主规格文档：[docs/DEVELOPMENT_RULES.md](docs/DEVELOPMENT_RULES.md)

生产部署说明：[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 技术栈

- 前端：React + TypeScript + Vite + Ant Design
- 后端：FastAPI + SQLAlchemy + Pydantic + Alembic
- 数据库：PostgreSQL
- 部署：Docker Compose + Nginx

## 本地启动

```bash
cp .env.example .env
docker compose up --build
```

健康检查：

```text
http://127.0.0.1:8080/api/health
```

创建本地演示邀请：

```powershell
docker compose exec backend python -m app.scripts.create_demo_invitation
```

然后打开：

```text
http://127.0.0.1:8080/i/demo-token
```

## 服务器部署

服务器上优先使用部署脚本，不需要每次手敲完整 Docker 命令。

全量更新：

```bash
sh deploy/scripts/deploy.sh
```

只更新前端：

```bash
sh deploy/scripts/deploy.sh frontend
```

只更新后端：

```bash
sh deploy/scripts/deploy.sh backend
```

脚本会执行：

```text
git pull --ff-only
docker compose up -d --build
```

传入 `frontend` 或 `backend` 时，只构建并重启对应服务。

## 清理测试数据

当前演示阶段如果误提交了测试数据，可以在服务器项目目录执行：

```bash
sh deploy/scripts/cleanup_test_data.sh
```

这个脚本只清理：

- 本地演示邀请 `demo-token`
- 当前测试提交里使用过的 `aaasd` / `dfadfsa` / `asdfsfsd` 这类测试记录

有真实客户数据后，不要随意扩大这个脚本的匹配条件。

## 质量检查

GitHub Actions 会在 `main` 分支 push 和 pull request 时自动运行后端、前端检查。

后端：

```bash
cd backend
ruff check
pytest
```

如果在当前 Windows/Scoop 环境中无法创建 venv，可使用项目内依赖目录：

```powershell
python -m pip install --target .python_packages -r backend\requirements-dev.txt
$env:PYTHONPATH='D:\openai\company\.python_packages;D:\openai\company\backend'
python -c "import pytest, sys; sys.exit(pytest.main())"
D:\openai\company\.python_packages\bin\ruff.exe check
```

前端：

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```
