# 公司注册自动化 MVP

第一阶段目标：用响应式网站跑通公司注册资料收集和委托书生成主链路。当前主线是客户通过微信卡片或邀请链接填写资料，内部人员在网站后台核对资料并收集委托书材料，材料审核通过后直接生成委托书内部草稿。

主规格文档：[docs/DEVELOPMENT_RULES.md](docs/DEVELOPMENT_RULES.md)

生产部署说明：[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

Codex 长期项目记忆：[memory.md](memory.md)

## 技术栈

- 前端：React + TypeScript + Vite + Ant Design
- 后端：FastAPI + SQLAlchemy + Pydantic + Alembic
- 数据库：PostgreSQL
- 部署：Docker Compose + Nginx

## 当前主流程

```text
内部创建邀请
-> 客户打开微信卡片或邀请链接
-> 客户填写基础资料
-> 内部在 /admin/orders 核对资料并标记资料归档
-> 内部发起委托书材料收集
-> 客户上传护照翻译件、PIN 码、落地签
-> 内部审核材料
-> 材料通过后生成委托书内部草稿
-> 后续进入付费确认、办理、注册结果和公司最终归档
```

注意：

- 当前 `/admin/orders` 前端页面实际是邀请资料台账，不是正式工单列表。
- “资料归档”只表示前置客户资料核对完成，不等于公司最终归档。
- 第一阶段不要求先转正式 `registration_order` 才生成委托书；材料审核通过后直接生成内部草稿。
- 第一阶段不做复杂报价单和客户在线确认报价；价格由业务人员线下沟通，后续只保留轻量付费确认或办理启动状态。

## Codex / Notion / GitHub 协作

- Notion：记录项目中枢、任务单、验收标准、讨论纪要和人工决策。
- Codex：在本机仓库执行开发、测试、文档更新和提交准备。
- GitHub：保存代码历史、提交记录和部署触发事实。
- `memory.md`：保存 Codex 每次接手前必须恢复的长期项目记忆。

工作顺序：

```text
Notion 任务进入 Ready for Codex
-> Codex 读取 README / DEVELOPMENT_RULES / memory.md
-> Codex 在本机仓库开发和验证
-> 使用 scripts\codex-push.ps1 提交并推送
-> Notion 回写 commit、验证结果和下一步
```

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

```bash
sh deploy/scripts/deploy.sh
```

脚本会执行：

```text
git pull --ff-only
docker compose up -d --build
```

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
