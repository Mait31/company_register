# AGENTS.md - company

本文件是 Codex 自动加载的项目执行规则。项目事实、架构、接口、业务流程和当前范围统一放在 `memory.md`。

## 固定上下文

- 项目路径：`D:\openai\company`
- GitHub：`git@github.com:Mait31/company_register.git`
- 默认所有命令都在 `D:\openai\company` 执行。
- 不要把命令切换到 `D:\openai\AIGC` 或其他项目目录。

## 每次接手必读

每次开始开发、修复、审查、整理或提交前，先读取：

```text
D:\openai\company\memory.md
```

不要把 `README.md` 或长期产品设想作为 Codex 接手入口；本项目的 Codex 入口只保留 `AGENTS.md` 和 `memory.md`。

## 当前硬边界

- 本项目只做到吉尔吉斯公司注册委托书模板生成。
- 跑通客户资料收集、委托书材料收集、材料审核、基于 Word 模板生成 DOCX 内部草稿后，项目暂停。
- 不继续扩展报价、客户在线确认报价、付费确认、注册办理、结果上传、公司最终归档、完整税务平台、App、小程序、微服务或复杂审批流。

## 开发规则

- 先读 `memory.md`，再读相关代码。
- 优先沿用现有 FastAPI、React、SQLAlchemy、Alembic 和 Ant Design 模式。
- 数据库结构变更必须通过 Alembic 迁移。
- 权限必须后端校验，不能只靠前端隐藏入口。
- 文件下载不能暴露真实存储路径。
- 客户公开链接必须使用不可猜测 token。
- 开发机可用 Windows，生产按 Linux + Docker Compose 设计；不要写死 Windows 路径。

## 验证命令

后端：

```powershell
$env:PYTHONPATH='D:\openai\company\.python_packages;D:\openai\company\backend'
python -c "import pytest, sys; sys.exit(pytest.main(['backend\\tests']))"
D:\openai\company\.python_packages\bin\ruff.exe check backend
```

前端：

```powershell
cd D:\openai\company\frontend
npm run lint
npm run typecheck
npm run build
```

文档检查：

```powershell
cd D:\openai\company
git diff --check -- AGENTS.md memory.md
```

## 提交与推送

完成修改并验证后，使用项目脚本提交推送：

```powershell
cd D:\openai\company
.\scripts\codex-push.ps1 -Message "Commit message here" -Paths "AGENTS.md,memory.md"
```

只传入本次相关路径，不要把未跟踪产物混入提交。脚本失败时报告原因，不绕过脚本手动 push，除非用户明确授权。

## 服务器说明

涉及代码、配置、数据库、部署脚本或依赖改动时，最终回复必须说明服务器是否需要操作。

常规部署脚本：

```bash
cd /你的/company_register/项目目录
sh deploy/scripts/deploy.sh
```

如果只是修改 `AGENTS.md` 或 `memory.md`，服务器无需额外操作。

## Notion 同步

- 规则与记忆同步中心：`https://app.notion.com/p/37d688a0cb2281898f1be96a94ebd379`
- 本项目同步页：`https://app.notion.com/p/37d688a0cb228134bdc9ed950361f1d2`
- 只同步 `AGENTS.md` 和 `memory.md` 的全文副本。
- 每次修改这两个文件后，回写 Notion 对应副本并追加同步记录。

## Windows 中文输出

PowerShell 中文乱码优先按终端编码处理，不要先改业务字段、数据库或前端文案：

```powershell
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001
```
