# Social Content Ops - 社交媒体内容运营自动化

<p align="center">
  <strong>🤖 AI驱动的内容抓取、策划、发布与数据分析系统</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenClaw-Skill-blue" alt="OpenClaw Skill">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Platform-X%20%7C%20Instagram%20%7C%20Facebook%20%7C%20Threads%20%7C%20Pinterest-orange" alt="Platform">
  <img src="https://img.shields.io/badge/Storage-SQLite%20%2B%20Drizzle-purple" alt="Storage">
</p>

---

## 🎯 项目简介

**Social Content Ops** 是一个社交媒体内容运营自动化系统，作为 [OpenClaw](https://openclaw.ai) 的 Skill 运行。支持内容抓取、语料审核、发布任务创建、多平台发布与数据分析。当前已经把 **X API 发布链路** 打通到可长期使用的程度，并开始接入 content-ops 的统一调度层。

---

## ✨ 当前重点能力

| 能力 | 当前状态 | 说明 |
|------|----------|------|
| 小红书抓取 | ✅ 可用 | 搜索列表抓取 + 审核 + 人工补充详情 |
| 发布任务管理 | ✅ 可用 | `publish_tasks` 驱动内容发布 |
| X API OAuth | ✅ 可用 | 域名回调 + token 落库 + refresh |
| X 文本发帖 | ✅ 可用 | 已实测成功 |
| X 自动 Thread | ✅ 可用 | 长文自动拆分 |
| X 图片发帖 | ✅ 可用 | 支持多图上传 |
| X 视频发帖 | 🚧 占位 | 接口结构已留，上传未完成 |
| 通用发布日志 | ✅ 可用 | 写入 `publish_tasks.content.publish_results` |
| 统一调度入口 | ✅ 可用 | `publish-dispatch.py` 支持 task 模式 |

---

## 🧭 推荐使用方式

现在推荐两种主要用法：

### 1. 直接使用 X API 发布
适合临时发帖、快速测试。

```bash
cd /root/.openclaw/workspace/skills/content-ops
./scripts/x_post_api.sh \
  --account-id 0db12439-06fe-438a-968c-028471d74401 \
  --text "你的内容"
```

#### 常见变体

**dry-run：**
```bash
./scripts/x_post_api.sh \
  --account-id 0db12439-06fe-438a-968c-028471d74401 \
  --text "测试内容" \
  --dry-run
```

**自动 thread：**
```bash
./scripts/x_post_api.sh \
  --account-id 0db12439-06fe-438a-968c-028471d74401 \
  --text "长内容" \
  --thread
```

**图片发帖：**
```bash
./scripts/x_post_api.sh \
  --account-id 0db12439-06fe-438a-968c-028471d74401 \
  --text "配图内容" \
  --images /tmp/a.png /tmp/b.jpg
```

### 2. 通过 content-ops 调度层发布
适合正式运营流程。

```bash
python skills/content-ops/scripts/publish-dispatch.py --task-id <PUBLISH_TASK_ID>
python skills/content-ops/scripts/publish-dispatch.py --task-id <PUBLISH_TASK_ID> --execute
```

这个模式会：
- 从 `publish_tasks` 读取内容
- 从 `target_accounts` 读取目标账号
- 自动选择平台发布器
- 成功后回写通用发布日志

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- SQLite 3
- Python 3.10+
- （可选）小红书 MCP 服务

### 1. 安装依赖

```bash
cd /root/.openclaw/workspace/skills/content-ops
npm install
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 2. （可选）配置小红书 MCP 服务

```bash
cd ~/.openclaw/workspace/bin
wget https://github.com/xpzouying/xiaohongshu-mcp/releases/download/v2026.02.28.1720-8a7fe21/xiaohongshu-mcp-linux-amd64.tar.gz
tar -xzf xiaohongshu-mcp-linux-amd64.tar.gz
./xiaohongshu-login
./xiaohongshu-mcp -headless=true
```

### 3. 验证数据库

```bash
npx tsx scripts/show-overview.ts
```

---

## 🐦 X API 发布链路

### 已完成

- HTTPS 回调域名：`xauth.kyochen.art`
- OAuth 2.0 授权
- access token / refresh token 落库
- token 自动 refresh
- 文本发帖
- 自动 thread 拆分
- 图片上传
- 通用发布日志回写

### 当前账号记录

详见：
- `docs/X_ACCOUNT_KYO.md`

### 相关文档

- `docs/X_API_SETUP.md`
- `docs/X_API_OPERATIONS.md`
- `docs/PUBLISH_DISPATCH.md`
- `docs/PUBLISH_LOGS.md`

---

## 📦 统一调度入口

### `publish-dispatch.py`

当前已经支持两种模式：

#### A. 配置模式（legacy）
从 `accounts.local.json` 读取账号配置：

```bash
python skills/content-ops/scripts/publish-dispatch.py \
  --platform pinterest \
  --account main \
  --title "Pin Title" \
  --text "desc" \
  --image /tmp/a.png
```

#### B. 任务模式（推荐）
直接从数据库读取 `publish_tasks` + `target_accounts`：

```bash
python skills/content-ops/scripts/publish-dispatch.py --task-id <TASK_ID>
python skills/content-ops/scripts/publish-dispatch.py --task-id <TASK_ID> --execute
```

#### X 平台
默认走 API 模式：

```bash
python skills/content-ops/scripts/publish-dispatch.py --task-id <TASK_ID> --x-mode api --execute
```

如确实需要旧浏览器方案：

```bash
python skills/content-ops/scripts/publish-dispatch.py \
  --platform x --account main --text "hello" --x-mode browser
```

---

## 🗄️ 发布日志结构

统一写入：

- `publish_tasks.content.publish_results`

设计目标：
- 多平台复用
- 保留发布历史
- 可用于看板、审计、排查

详细说明见：
- `docs/PUBLISH_LOGS.md`

---

## 📚 文档索引

| 文档 | 说明 |
|------|------|
| [SKILL.md](./SKILL.md) | OpenClaw 使用说明 |
| [QUICKSTART.md](./QUICKSTART.md) | 快速上手 |
| [USER_WORKFLOW.md](./USER_WORKFLOW.md) | 完整操作流程 |
| [docs/X_API_SETUP.md](./docs/X_API_SETUP.md) | X API 接入与后台配置 |
| [docs/X_API_OPERATIONS.md](./docs/X_API_OPERATIONS.md) | X API 日常操作 |
| [docs/X_ACCOUNT_KYO.md](./docs/X_ACCOUNT_KYO.md) | 当前 X 账号绑定记录 |
| [docs/PUBLISH_DISPATCH.md](./docs/PUBLISH_DISPATCH.md) | 调度入口说明 |
| [docs/PUBLISH_LOGS.md](./docs/PUBLISH_LOGS.md) | 通用发布日志结构 |
| [references/database-schema.md](./references/database-schema.md) | 数据库结构 |

---

## ⚠️ 当前限制

- X 视频上传尚未完成
- 其他平台尚未全部升级到与 X 同等级的任务驱动发布模式
- 小红书详情抓取仍受网页端限制

---

## 📄 开源协议

[MIT License](./LICENSE)
