# company memory

本文件是 `company` 的长期项目记忆，记录当前范围、代码架构、API 和业务链路。Codex 每次处理本项目任务前必须先读本文件。

## 项目定位

- 本地路径：`D:\openai\company`
- GitHub：`git@github.com:Mait31/company_register.git`
- 当前目标：只做到吉尔吉斯公司注册委托书模板生成。
- 完成标准：客户资料收集、委托书材料收集、材料审核、基于 Word 模板生成委托书 DOCX 内部草稿跑通后，项目暂停。

## 当前不做

```text
报价
客户在线确认报价
付费确认
注册办理
注册结果上传
公司最终归档
完整税务平台
App / 微信小程序
微服务 / Kubernetes / 复杂审批流
政府网站爬虫或全自动 RPA
多国家复杂规则引擎
企业微信聊天记录分析
额外 PDF/DOCX 正式文件扩展
```

## 代码架构

```text
frontend/    React + TypeScript + Vite + Ant Design
backend/     FastAPI + SQLAlchemy + Pydantic + Alembic
templates/   Word/PDF 业务模板
storage/     运行时文件挂载目录
deploy/      Nginx、Docker、部署脚本
```

前端主要页面：

```text
/login
/admin/orders
/admin/orders/:id
/admin/orders/:id/edit
/i/:token
/invitations/:token
/i/:token/materials
```

后端统一挂载 `/api`。

## 官网现状

- 当前公网域名：`https://jsutong.cn/`
- 官网品牌展示名：`吉速通出入境服务`
- 主体公司名称：`吉速通（杭州）出入境服务有限公司`
- ICP 备案号：`浙ICP备2026036299号-1`，官网页脚链接到 `https://beian.miit.gov.cn/`。
- 官网首页是中文展示页，不做英文版。
- 首页展示范围：吉尔吉斯斯坦、塔吉克斯坦签证服务，公司办理，财税服务，商务落地，自然风貌展示，微信咨询二维码。
- 首页不提供电话咨询入口；所有公开咨询入口统一引导用户微信扫码联系。
- 移动端导航收敛为三项：`首页`、`服务项目`、`联系我们`。桌面端保留完整导航。
- 官网 Open Graph / WhatsApp 链接预览图使用 `/social-preview.png`，规格为 1200x630，源图保存在 `docs/design/social-preview-source.png` 并通过 `scripts/generate-social-preview.py` 生成；旧 `/wechat-share.png` 继续保留给微信邀请或历史分享入口兼容。
- 官网 SEO 页面矩阵第一批：围绕 `吉尔吉斯斯坦签证` 和费用类长尾词建立 `/visa/...` 落地页，`/visa` 作为签证指南中心承接长尾入口；首页不展示完整长尾卡片，只在签证模块保留轻量指南入口并通过 footer 链接分发内部权重；`robots.txt` 和 `sitemap.xml` 位于 `frontend/public/`。
- 官网公司注册 SEO 页面矩阵第一批：围绕 `吉尔吉斯斯坦公司注册`、费用、材料、流程、周期、中国人注册公司、LLC/ОсОО、税务记账等问题建立 `/company/...` 落地页，`/company` 作为公司注册指南中心；首页企业服务模块只保留轻量指南入口，页面内容参考吉尔吉斯经济和商业部、trade.gov、UNCTAD 投资法资料和当地律所实务口径，并明确不替代律师或会计意见。
- 公司注册信息登记入口仍保留在 `/i/company-registration`，不是首页。
- 委托书材料上传入口仍通过 `/i/:token/materials` 或 `/invitations/:token/materials` 使用。

## 部署和域名

- 生产部署按 Ubuntu + Docker Compose 运行。
- Docker Compose 内置 Nginx 通过 `.env` 的 `NGINX_HTTP_PORT` 暴露，当前推荐保持 `127.0.0.1:8080`。
- 服务器外层 Nginx 负责 HTTPS 证书和公网域名，反向代理到 `http://127.0.0.1:8080`。
- 域名切换脚本：`deploy/scripts/set-domain.sh`。
- 切换主域名示例：

```bash
sh deploy/scripts/set-domain.sh jsutong.cn --deploy
```

- 脚本会更新 `.env` 中的 `PUBLIC_BASE_URL`、`SERVER_NAME`、`WECHAT_MP_CALLBACK_BASE_URL`、`WECHAT_SHARE_IMAGE_URL`，不会修改数据库账号、存储目录或 Docker 端口。

## 当前主流程

```text
内部创建邀请
-> 客户打开微信卡片或邀请链接
-> 客户填写基础资料
-> 内部在 /admin/orders 核对资料并标记资料归档
-> 内部发起委托书材料收集
-> 客户上传护照翻译件、PIN 码、落地签
-> 内部审核三项材料
-> 材料通过后基于 Word 模板生成委托书 DOCX 内部草稿
-> 项目暂停
```

注意：

- `/admin/orders` 当前实际是邀请资料台账，不是正式工单列表。
- “资料归档”只表示前置客户资料核对完成，不等于公司最终归档。
- 当前主链路不要求先转正式 `registration_order`。
- 生成的是我方 DOCX 内部草稿，不替代公证系统、edoc、en 或 online 平台正式文件。

## API 地图

基础：

```text
GET  /api/health
```

客户邀请和资料收集：

```text
GET   /api/invitations/{token}
POST  /api/invitations/{token}/participants
PATCH /api/invitations/{token}/customer
PATCH /api/invitations/{token}/company
POST  /api/invitations/{token}/files
POST  /api/invitations/{token}/bind-wechat
```

委托书材料收集：

```text
GET  /api/invitations/{token}/materials
POST /api/invitations/{token}/materials/{material_type}/files
POST /api/invitations/{token}/materials/submit
GET  /api/public/invitations/{token}/materials
GET  /api/public/invitations/{token}/materials/{material_type}/file
```

内部邀请台账和材料审核：

```text
POST  /api/admin/invitations
GET   /api/admin/invitations
GET   /api/admin/invitations/{invitation_id}
PATCH /api/admin/invitations/{invitation_id}
GET   /api/admin/invitations/{invitation_id}/materials
POST  /api/admin/invitations/{invitation_id}/materials/start
POST  /api/admin/invitations/{invitation_id}/materials/{material_type}/review
POST  /api/admin/invitations/{invitation_id}/generate-documents
GET   /api/admin/invitations/{invitation_id}/generated-documents/{file_id}
```

历史正式工单底座仍存在，但当前主流程不继续扩展：

```text
POST /api/admin/orders
GET  /api/admin/orders
GET  /api/admin/orders/{order_id}
POST /api/admin/orders/{order_id}/change-status
POST /api/admin/orders/{order_id}/generate-documents
POST /api/admin/orders/{order_id}/archive
POST /api/admin/invitations/{invitation_id}/convert-to-order
```

企业微信/公众号占位：

```text
GET  /api/wecom/oauth/login
GET  /api/wecom/oauth/callback
POST /api/wecom/events
POST /api/wecom/sync-users
POST /api/wecom/send-message
GET  /api/wechat/oauth/login
GET  /api/wechat/oauth/callback
GET  /api/wechat/js-sdk-signature
```

## 数据和文件

核心表/模型：

```text
registration_invitations
invitation_participants
invitation_materials
files / storage
workflow_logs
audit_logs
generated_documents
registration_orders    历史正式工单底座，当前不作为主链路继续扩展
```

委托书材料类型：

```text
passport_translation
pin_code
entry_permit
```

## 验证记录

- 2026-06-10：后端 `pytest backend\tests` 通过，17 passed。
- 2026-06-10：后端 `ruff check backend` 通过。
- 2026-06-10：已推送 commit `e1b7869`，包含委托书内部草稿自动生成和项目提交脚本。
- 2026-06-12：已推送 commit `3d56a83`，将项目范围收敛到委托书模板生成。

## 运行和验证

后端：

```powershell
cd D:\openai\company
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

提交：

```powershell
cd D:\openai\company
.\scripts\codex-push.ps1 -Message "Commit message here" -Paths "AGENTS.md,memory.md"
```

## 关键链接

- Notion 项目中枢：`https://app.notion.com/p/37b688a0cb2281cfb088d084c47e6ba4`
- Notion 同步页：`https://app.notion.com/p/37d688a0cb228134bdc9ed950361f1d2`
