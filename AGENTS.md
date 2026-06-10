# AGENTS.md - company 执行规则索引

本文件只保存 Agent 执行规则和文档入口，不复制完整产品规格。产品、技术和验收细节以 `docs/DEVELOPMENT_RULES.md` 为准，长期项目状态以 `memory.md` 为准。

## 固定上下文

- 项目路径：`D:\openai\company`
- GitHub：`git@github.com:Mait31/company_register.git`
- 默认所有仓库命令都在 `D:\openai\company` 执行。
- 不要把本项目命令切换到 `D:\openai\AIGC` 或其他仓库。

## 接手必读顺序

每次开始开发、修复、审查或提交前，先读取：

1. `README.md`
2. `docs/DEVELOPMENT_RULES.md`
3. `memory.md`
4. `AGENTS.md`

规则冲突时：

- 系统/开发者指令优先于仓库文件。
- `docs/DEVELOPMENT_RULES.md` 是产品和技术主规格。
- `memory.md` 是当前进度、事实和下一步焦点。
- `AGENTS.md` 是本仓库执行约束索引。

## MVP 硬边界

第一阶段只做公司注册自动化 MVP：响应式网站、内部后台、客户邀请填写页、公司注册主链路、材料收集审核、转正式工单、文件生成、注册结果和公司归档。

不要把以下内容混入第一阶段：

- 完整税务平台、AI 自动报税。
- App、微信小程序。
- 微服务、Kubernetes、复杂审批流。
- 政府网站爬虫或全自动 RPA。
- 多国家复杂规则引擎。
- 在线支付网关。
- 企业微信聊天记录分析。
- 开放式散客获客池。
- 复杂报价单、客户在线确认报价、报价审批流。

## 当前语义提醒

- 当前 `/admin/orders` 前端页面实际是邀请资料台账，不是正式工单列表。
- “资料归档”只表示前置客户资料核对完成，不等于公司最终归档。
- 正式公司注册工单是 `registration_order`。
- 吉尔吉斯公司注册委托书自动填充目前是我方内部草稿，不替代公证系统、edoc、en 或 online 平台正式文件。

## 开发执行规则

- 先读文档，再读相关代码，再改动。
- 优先沿用仓库现有模式，不引入不必要的新抽象。
- 数据库结构变更必须通过 Alembic 迁移。
- 状态变化写入 `workflow_logs`，关键业务修改写入 `audit_logs`。
- 权限必须后端校验，不能只靠前端隐藏入口。
- 文件下载不能暴露真实存储路径。
- 客户公开链接必须使用不可猜测 token。
- 不要把正式工单状态机写死在微信 H5、未来小程序或入口前端里。
- 开发机可用 Windows，但生产按 Linux + Docker Compose 设计；不要写死 Windows 路径。

## PowerShell 中文乱码

在 Windows PowerShell 中看到中文乱码时，优先按终端编码问题处理，不要先修改业务数据、数据库字段、接口结构或前端文案。

常用修复：

```powershell
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001
```

读取/写入文本时显式使用 UTF-8：

```powershell
Get-Content -Raw -Encoding UTF8 .\file.txt
Set-Content -Encoding UTF8 .\file.txt -Value $content
```

## 验证索引

根据改动范围运行对应检查。

后端：

```powershell
$env:PYTHONPATH='D:\openai\company\.python_packages;D:\openai\company\backend'
python -c "import pytest, sys; sys.exit(pytest.main(['backend\\tests']))"
D:\openai\company\.python_packages\bin\ruff.exe check backend
```

前端：

```powershell
cd frontend
npm run lint
npm run typecheck
npm run build
```

文档：

```powershell
git diff --check -- README.md docs/DEVELOPMENT_RULES.md memory.md AGENTS.md
```

如果验证无法运行，说明原因和风险。

## 提交与推送

完成修改和验证后，优先使用项目脚本：

```powershell
.\scripts\codex-push.ps1 -Message "Commit message here" -Paths "path1,path2"
```

执行规则：

- 不要默认手动串行执行 `git add`、`git commit`、`git push`。
- 只传入相关路径，避免把未跟踪本地产物混入提交。
- 脚本失败时报告原因，不要未经授权绕过脚本手动 push。
- 用户明确要求手动 git 命令时，才直接执行。

