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
http://localhost/api/health
```

创建本地演示邀请：

```powershell
docker compose exec backend python -m app.scripts.create_demo_invitation
```

然后打开：

```text
http://localhost/i/demo-token
```

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
