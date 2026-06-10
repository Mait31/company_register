# 公司注册自动化 MVP 总规格与实施规范

## 1. 项目目标

本项目第一阶段只建设公司注册自动化 MVP。

目标是用一套响应式网站，把公司注册从人工问材料、手工整理文件，改造成标准化工单流程：

```text
创建定向邀请 -> 客户入口填写 -> 内部核对资料 -> 资料归档 -> 委托书材料收集 -> 材料审核 -> 生成委托书内部草稿 -> 付费确认/办理启动 -> 注册办理 -> 结果上传 -> 公司最终归档
```

系统核心对象是：公司注册工单。

系统最终产物是：结构化公司档案，后续给工作签和税务模块调用。

入口层原则：

- 微信 H5 只是客户入口前端，不是真正的工单系统。
- 后续可以增加小程序、普通网页、渠道端等入口。
- 所有入口都必须调用统一后端 API，沉淀到同一套邀请、资料、工单和公司档案模型。
- 工单状态机、报价、材料审核、文件生成、归档等核心逻辑只能在后端业务层实现，不能写死在某个入口前端里。

## 2. 第一阶段边界

第一阶段必须做：

- 响应式网站，同一个链接支持电脑、手机、平板。
- 内部管理后台。
- 定向邀请客户填写链接。
- 公司注册工单流程。
- 客户、公司、法人、股东资料收集。
- 委托书材料上传、审核、驳回、补材料。
- 前置资料和委托书材料审核通过后直接生成委托书内部草稿。
- 轻量付费确认或办理启动状态。
- 注册文件 PDF 生成。
- 注册结果文件上传。
- 公司档案归档。
- 网站后台统一管理内部业务。
- 微信卡片或邀请链接作为精准客户资料采集入口。
- 单体架构，Docker Compose 部署。

第一阶段明确不做：

- 完整税务申报平台。
- AI 自动报税。
- 手机 App。
- 微信小程序。
- 微服务。
- Kubernetes。
- 复杂审批流引擎。
- 政府网站爬虫或全自动 RPA 提交。
- 多国家复杂规则引擎。
- 会计总账系统。
- 企业微信聊天记录分析。
- 开放式散客获客池。
- 让微信 H5 直接承载正式工单逻辑。
- 复杂报价单、客户在线确认报价、报价审批流。
- 在线支付网关。

不属于第一阶段的需求，记录为后续待办，不直接混入 MVP。

## 3. 用户角色

- 客户：通过公开 token 链接填写资料、上传材料、确认报价、查看补材料要求。
- 邀请参与人：通过定向邀请链接进入，可以是客户本人、法人、股东或材料协助人。
- 业务员：创建工单、维护客户资料、跟进客户、查看自己负责的工单。
- 材料审核员：审核上传材料，标记合格或驳回并填写原因。
- 注册办理员：查看材料已齐工单，推进注册办理，上传注册结果。
- 财务/报价员：创建报价、调整报价、确认报价状态。
- 管理员：管理所有工单、用户、配置、模板和权限。

## 4. 技术栈

固定技术栈：

- 前端：React、TypeScript、Vite、Ant Design。
- 后端：FastAPI、SQLAlchemy、Pydantic。
- 数据库：PostgreSQL。
- 数据库迁移：Alembic。
- 文件存储：服务器本地挂载目录。
- PDF：HTML 模板通过 Playwright 或 Chromium 打印生成。
- 登录：网站后台统一管理；企业微信可作为后续可选集成，不作为第一阶段主链路。
- 客户入口识别：微信公众号 OAuth + 入口 token。
- 权限：简单 RBAC。
- 部署：Docker Compose。
- 反向代理：Nginx。
- HTTPS：Nginx + SSL 证书。
- 日志：Docker logs + 应用日志文件。
- 备份：PostgreSQL 定时备份 + 文件目录备份。

部署原则：少组件、单体优先、好部署、好维护。

第一阶段不主动引入 Redis、Celery、COS/S3、ELK、Kubernetes。

## 4.1 跨平台与生产环境约束

开发环境可以是 Windows，但最终生产环境按 Linux + Docker Compose 设计。

开发中必须遵守：

- 不在代码、配置默认值、模板中写死 Windows 路径，例如 `D:\...`。
- 容器内文件路径统一使用 Linux 风格路径，例如 `/app/storage`。
- 本地开发依赖目录不进入生产镜像，例如 `.python_packages/`、`node_modules/`、`.npm-cache/`。
- 生产镜像必须在容器构建阶段重新安装依赖。
- 文件名大小写必须严格一致，因为 Linux 区分大小写。
- Shell 脚本必须使用 LF 换行，避免 Linux 执行失败。
- 文件上传和下载逻辑必须使用跨平台路径 API，不能手工拼接路径分隔符。
- `.env.example` 只写可跨平台的默认值；生产 `.env` 由 Linux 服务器实际配置。
- Dockerfile 和 docker-compose 必须面向 Linux 容器镜像验证。

Windows 本机安装 Docker 只用于开发验证；生产部署以 Linux 服务器实际 `docker compose up -d --build` 为准。

## 5. 项目结构

```text
frontend/
backend/
templates/
deploy/
storage/
docs/
docker-compose.yml
.env.example
README.md
```

第一阶段不拆多仓库，不拆微服务。

## 6. 工单状态机

第一阶段前端主链路不要求先创建正式 `registration_order`。微信卡片、H5、未来小程序等入口只创建或补充邀请资料；内部人员完成前置资料归档并审核三项委托书材料后，直接在邀请资料台账中生成委托书内部草稿。

状态固定为：

```text
draft                       草稿
pending_quote               待报价
pending_customer_confirm    待客户确认报价
collecting_materials        待收材料
reviewing_materials         材料审核中
need_more_materials         待补材料
materials_ready             材料已齐
processing_registration     注册办理中
registered                  注册成功
archived                    已归档
cancelled                   已取消
```

状态规则：

- 第一阶段不把系统内报价和客户确认报价作为主流程；`pending_quote` 等报价状态保留为后续兼容底座。
- 生成委托书内部草稿前，邀请资料必须已归档，三项委托书材料必须审核通过。
- 材料未齐，不能进入注册办理。
- 注册结果文件未上传，不能归档。
- 每次状态变化必须写入 `workflow_logs`。
- 关键业务修改必须写入 `audit_logs`。

## 7. 数据模型

第一阶段核心表：

- `users`：内部用户。
- `wecom_users`：企业微信用户绑定。
- `wechat_users`：微信公众号用户身份。
- `customers`：客户。
- `registration_invitations`：公司注册定向邀请。
- `invitation_participants`：邀请参与人。
- `registration_orders`：公司注册工单。
- `company_drafts`：拟注册公司信息。
- `persons`：自然人资料。
- `shareholders`：股东。
- `quotations`：报价单。
- `quotation_items`：报价明细。
- `order_materials`：工单材料。
- `files`：文件记录。
- `generated_documents`：生成文件。
- `company_archives`：公司档案。
- `workflow_logs`：流程日志。
- `audit_logs`：审计日志。

数据库结构变更必须通过 Alembic 迁移完成。

## 8. API 规格

说明：

- 第一阶段当前主入口是 `/api/invitations/{token}/*` 和 `/api/admin/invitations/*`。
- `/api/admin/orders/*` 是正式工单底座，第一阶段前端主流程先不依赖转正式工单。
- 报价相关接口不进入第一阶段主流程。

客户 API：

```text
GET    /api/public/orders/{token}
PATCH  /api/public/orders/{token}/customer
PATCH  /api/public/orders/{token}/company
POST   /api/public/orders/{token}/persons
PATCH  /api/public/orders/{token}/persons/{person_id}
DELETE /api/public/orders/{token}/persons/{person_id}
POST   /api/public/orders/{token}/shareholders
GET    /api/public/orders/{token}/materials
POST   /api/public/orders/{token}/files
```

内部 API：

```text
GET    /api/admin/orders
POST   /api/admin/orders
GET    /api/admin/orders/{id}
PATCH  /api/admin/orders/{id}
POST   /api/admin/orders/{id}/change-status
POST   /api/admin/orders/{id}/assign
POST   /api/admin/materials/{material_id}/review
POST   /api/admin/orders/{id}/generate-documents
POST   /api/admin/orders/{id}/archive
GET    /api/admin/companies
GET    /api/admin/companies/{id}
```

企业微信 API：

```text
企业微信 API 第一阶段不作为主链路；如保留接口，只作为后续可选登录、通知或消息集成。
```

微信公众号/客户入口 API：

```text
GET    /api/wechat/oauth/login
GET    /api/wechat/oauth/callback
GET    /api/invitations/{token}
POST   /api/invitations/{token}/bind-wechat
PATCH  /api/invitations/{token}/customer
PATCH  /api/invitations/{token}/company
POST   /api/invitations/{token}/participants
POST   /api/invitations/{token}/files
POST   /api/admin/invitations
POST   /api/admin/invitations/{id}/generate-documents
```

API 规则：

- 请求和响应必须使用明确 schema。
- 权限必须在后端校验。
- 不能暴露文件真实路径。
- 文件下载必须走鉴权接口或短期有效链接。
- 客户公开链接必须使用不可猜测 token。

## 9. 企业微信接入

企业微信使用自建应用，不做第三方应用。

第一版只允许企业微信登录，不提供普通账号密码登录。

必需环境变量：

```text
WECOM_CORP_ID
WECOM_AGENT_ID
WECOM_APP_SECRET
WECOM_CONTACTS_SECRET
WECOM_TOKEN
WECOM_AES_KEY
WECOM_CALLBACK_BASE_URL
SUPER_ADMIN_WECOM_USERIDS
```

第一版企业微信能力：

- OAuth 登录。
- 内部用户绑定。
- 通讯录同步。
- 工单通知。
- 状态变更提醒。
- 消息点击进入工单详情。

企业微信是辅助通道，不是数据库、文件系统或工作流引擎。

## 9.1 微信公众号 H5 定向邀请入口

微信公众号 H5 是精准客户资料采集入口，不是开放获客池。

当前第一版使用 `token_only` 模式：

- 不强制微信公众号网页授权。
- 不依赖 `openid` / `unionid`。
- 使用不可猜测 invitation token 作为入口凭证。
- 使用填写人姓名、手机号和内部确认来识别精准客户。
- 公众号只负责承载文章、菜单、二维码或链接传播。

后续具备认证服务号能力后，可升级为 `oauth` 模式：

- 微信网页授权获取 `openid` / `unionid`。
- 绑定 `wechat_users` 和 `registration_invitations`。
- JS-SDK 分享用于定向协作。

第一版使用方式：

```text
内部创建注册邀请 -> 生成邀请链接/二维码/微信卡片 -> 指定客户打开 -> 填写基础资料 -> 内部核对并标记资料归档 -> 发起委托书材料收集 -> 客户上传材料 -> 内部审核材料 -> 转为正式注册工单
```

规则：

- 每个邀请必须绑定业务员。
- 邀请可以预绑定客户，也可以由客户首次填写时创建客户草稿。
- 邀请链接必须使用不可猜测 token。
- 邀请必须有有效期和状态。
- 邀请可绑定微信公众号 `openid` / `unionid`。
- 可允许客户转发给法人、股东或材料协助人，但必须记录参与人身份。
- 邀请参与人只能补充资料，不能直接改变内部办理状态。
- 内部人员确认基础资料并审核委托书材料通过后，邀请资料可直接生成委托书内部草稿。
- 后续小程序入口必须复用同一套 invitation API 和后端业务逻辑。

JS SDK 分享只用于定向协作传播，例如客户转给法人或股东补资料；不用于无归属的公开散客线索池。

## 10. 前端规格

只做一套响应式网站。

内部后台页面：

- 登录页。
- 工单列表。
- 创建工单。
- 工单详情。
- 客户资料。
- 公司资料。
- 股东/法人资料。
- 委托书材料审核。
- 付费确认或办理启动。
- 文件生成。
- 注册结果归档。
- 公司档案列表。
- 公司档案详情。

客户页面：

- 定向邀请入口。
- 公司信息填写。
- 股东/法人填写。
- 委托书材料上传。
- 进度和补材料提醒。

客户页面优先手机体验；内部后台优先电脑处理效率。

## 11. 文件和文档

文件类型：

- 护照首页。
- 签证页或入境章。
- 翻译件。
- 公证件。
- 签名样本。
- 授权书。
- 注册地址材料。
- 租房合同。
- 系统生成 PDF。
- 注册结果文件。

文件规则：

- 元数据存在数据库。
- 文件内容存在 `storage/`。
- 不信任用户上传的原始文件名。
- 校验文件类型和大小。
- 记录上传人、上传时间、审核人、审核结果。
- 生成文件必须基于模板。

## 12. 质量和测试

测试是质量核心手段，开发过程中同步编写。

后端测试：

- 工单状态机合法和非法流转。
- 股东比例必须等于 100%。
- 材料审核状态。
- 归档前置条件。
- 权限、非法状态、缺字段、重复提交。

API 测试：

- 创建工单。
- 客户填写。
- 上传材料。
- 审核材料。
- 切换状态。
- 上传注册结果。
- 归档公司档案。

前端检查：

```text
npm run lint
npm run typecheck
npm run build
```

后端检查：

```text
ruff check
pytest
alembic upgrade head
```

部署检查：

```text
docker compose build
docker compose up -d
```

系统必须提供：

```text
/api/health
```

## 13. 实施里程碑

第一阶段按以下顺序实施：

1. 规范文档和 Skill 对齐。
2. 项目骨架和 Docker Compose。
3. 后端基础配置、数据库、迁移、健康检查。
4. 企业微信登录、用户绑定、通讯录同步、通知接口。
5. 微信公众号 H5 定向邀请入口、微信用户绑定、邀请参与人记录。
6. 邀请资料归档后发起委托书材料收集。
7. 工单、客户、公司、人员、股东模型和 API。
8. 前置资料和委托书材料审核通过后生成委托书内部草稿。
9. 付费确认或办理启动。
10. 注册文件模板和文件生成。
11. 注册结果上传和公司档案归档。
12. 前端内部后台和客户邀请填写页。
13. 完整链路测试、部署验证、备份验证。

## 14. 第一阶段验收链路

第一阶段完成后，必须能跑通：

```text
1. 内部人员在网站后台创建公司注册定向邀请。
2. 系统生成邀请链接、二维码或微信卡片入口。
3. 指定客户打开链接并填写公司、法人、股东等基础信息。
4. 客户可转给法人或股东补充资料，系统记录参与人。
5. 内部人员核对客户基础资料并标记资料归档。
6. 内部人员发起三项委托书材料收集：护照翻译件、PIN 码、落地签。
7. 客户上传委托书材料。
8. 内部人员审核材料并标记通过或驳回。
9. 三项材料审核通过后，内部人员直接生成委托书内部草稿。
10. 系统保存生成文件记录，并提示缺失字段。
11. 内部人员根据内部草稿进入线下公证或正式办理准备。
12. 内部人员完成付费确认或办理启动。
13. 注册办理员推进注册办理。
14. 注册完成后上传注册结果文件。
15. 系统生成结构化公司档案并完成公司最终归档。
```

这条链路稳定跑通，第一阶段才算完成。
