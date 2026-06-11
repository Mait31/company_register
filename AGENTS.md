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

## Notion 联动

- Notion 是项目管理、任务单、验收标准、讨论纪要和人工决策入口，不是代码事实来源。
- 开发前优先查看 Notion 中标记为 `Ready for Codex` 的任务，并核对任务目标是否仍在 MVP 边界内。
- 代码事实以本地仓库、测试结果和 GitHub commit 为准。
- 不要因为 Notion 中有设计图、说明或流程图就默认代码已实现，必须回到仓库核对。
- 完成修改并推送后，把 commit hash、验证结果、影响范围和下一步回写到 Notion。

## MVP 硬边界

第一阶段只做公司注册自动化 MVP：响应式网站、内部后台、客户邀请填写页、公司注册主链路、材料收集审核、基于 Word 模板的委托书内部草稿生成、注册结果和公司归档。

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
- 当前第一阶段前端主链路不要求先转正式 `registration_order`；三项委托书材料审核通过后直接基于 Word 模板生成委托书 DOCX 内部草稿。
- 吉尔吉斯公司注册委托书自动填充目前是我方 DOCX 内部草稿，不替代公证系统、edoc、en 或 online 平台正式文件。

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

## 服务端验收优先

本项目以服务端部署后的真实效果作为验收标准。更改代码、修复问题后，不要把本地浏览器或本地 Docker 验证当成最终结论。

执行原则：

- 本地命令最多作为提交前预检，用于发现语法、类型、构建或单元测试错误。
- 涉及前端交互、上传、下载、Nginx、Docker、存储目录、微信内访问、生产域名、环境变量或接口联调的问题，修复后必须部署到服务器检测实际效果。
- 如果用户反馈的是生产页面问题，优先围绕服务器部署后的页面和接口排查，不要只在本地复现。
- 最终回复必须区分“本地预检结果”和“服务端实际验收结果”。
- 如果暂时无法做服务端验收，必须明确说明“尚未完成服务端实际验收”，并列出服务器上需要执行的命令和检查点。

提交前可按改动范围运行必要预检。

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

## 服务器操作输出

每次完成代码、配置、数据库、部署脚本或依赖改动后，最终回复必须说明服务器是否需要操作。

如果需要服务器操作，必须列出：

- 是否需要更新服务器代码；如果推荐使用 `sh deploy/scripts/deploy.sh`，不要再把 `git pull origin main` 单独列为必跑命令。
- 是否需要执行部署脚本，例如 `sh deploy/scripts/deploy.sh`。
- 是否需要数据库迁移，例如 `alembic upgrade head` 或容器内等价命令。
- 是否需要新增或修改 `.env` / Nginx / Docker Compose 配置。
- 是否需要重启服务、重建镜像或清理缓存。
- 推荐的生产验证命令或 URL。
- 有风险时说明回滚方式或注意事项。

部署脚本规则：

- 本项目 `deploy/scripts/deploy.sh` 已包含 `git pull --ff-only` 和 `docker compose up -d --build`。
- 正常服务器更新只输出：

```bash
cd /你的/company_register/项目目录
sh deploy/scripts/deploy.sh
```

- 只有在不使用部署脚本、需要手动更新代码时，才单独输出 `git pull origin main`。
- 不要同时把 `git pull origin main` 和 `sh deploy/scripts/deploy.sh` 写成连续必跑步骤，避免重复和误解。

如果不需要服务器操作，也要明确写出：`服务器无需额外操作`。

## 提交与推送

每次完成文件修改并验证后，都需要提交并推送，除非用户明确要求只本地修改、不提交。

提交推送优先使用项目脚本：

```powershell
.\scripts\codex-push.ps1 -Message "Commit message here" -Paths "path1,path2"
```

执行规则：

- 不要默认手动串行执行 `git add`、`git commit`、`git push`。
- 只传入相关路径，避免把未跟踪本地产物混入提交。
- 每次提交前确认提交范围，只提交本次相关文件。
- 脚本失败时报告原因，不要未经授权绕过脚本手动 push。
- 用户明确要求手动 git 命令时，才直接执行。
