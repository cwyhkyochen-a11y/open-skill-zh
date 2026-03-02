# social-content-ops - 社交媒体内容运营自动化

<p align="center">
  <strong>🤖 AI驱动的内容抓取、策划、发布与数据分析系统</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenClaw-Skill-blue" alt="OpenClaw Skill">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Platform-Xiaohongshu%20%7C%20Reddit%20%7C%20Pinterest-orange" alt="Platform">
</p>

---

## 🎯 项目简介

**social-content-ops** 是一个专为中文用户设计的社交媒体内容运营自动化系统，作为 [OpenClaw](https://openclaw.ai) 的 Skill 运行。支持从小红书抓取优质内容，经过 AI 改编后发布到 Reddit、Pinterest、Discord 等平台，并提供完整的数据分析功能。

### 核心特性

| 特性 | 说明 |
|------|------|
| 📥 **智能抓取** | 支持小红书搜索抓取，自动评估内容质量 |
| 🤖 **AI 改编** | 基于语料生成适配目标平台的内容 |
| 👥 **人机协作** | 关键节点需人工确认，确保内容质量 |
| 📊 **数据分析** | 自动追踪发布内容的互动数据，生成复盘报告 |
| 🗄️ **本地存储** | SQLite + Drizzle ORM，无需外部数据库 |
| 🔧 **易于扩展** | 模块化设计，支持添加新平台 |

---

## 📁 项目结构

```
open-skill-zh/
├── 📄 SKILL.md                    # 主技能文档（OpenClaw 使用）
├── 📄 README.md                   # 本文件
├── 📂 src/
│   └── db/                        # 数据库相关
│       ├── index.ts               # 数据库连接与查询
│       ├── schema.ts              # Drizzle ORM 表结构定义
│       └── migrations/            # 数据库迁移文件
├── 📂 scripts/                    # 操作脚本
│   ├── create-crawl-task.ts       # 创建抓取任务
│   ├── show-crawl-results.ts      # 查看抓取结果
│   ├── approve-all.ts             # 批量审核通过
│   └── ...                        # 更多脚本
├── 📂 redbookskills/              # 小红书发布子技能
│   ├── SKILL.md                   # 子技能文档
│   └── scripts/                   # 发布相关脚本
├── 📂 xiaohongshutools/           # 小红书工具子技能
│   └── scripts/                   # 加密、请求工具
├── 📂 references/                 # 参考文档
│   ├── database-schema.md         # 数据库表结构详解
│   ├── detailed-workflow.md       # 完整工序设计
│   └── sop-workflows.md           # SOP 流程文档
├── 📄 QUICKSTART.md               # 10分钟快速上手指南
├── 📄 USER_WORKFLOW.md            # 完整用户操作手册
├── 📄 package.json                # Node.js 依赖
└── 📄 drizzle.config.ts           # Drizzle 配置
```

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- SQLite 3
- Python 3.10+（可选，用于增强功能）

### 1. 安装依赖

```bash
# 克隆仓库
git clone https://github.com/cwyhkyochen-a11y/open-skill-zh.git
cd open-skill-zh

# 安装 Node.js 依赖
npm install

# 生成并执行数据库迁移
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 2. 配置 MCP 服务（小红书抓取）

```bash
# 下载小红书 MCP 服务
mkdir -p ~/.openclaw/workspace/bin
cd ~/.openclaw/workspace/bin

wget https://github.com/xpzouying/xiaohongshu-mcp/releases/download/v2026.02.28.1720-8a7fe21/xiaohongshu-mcp-linux-amd64.tar.gz
tar -xzf xiaohongshu-mcp-linux-amd64.tar.gz

# 首次登录（扫码）
./xiaohongshu-login

# 启动服务
./xiaohongshu-mcp -headless=true
```

### 3. 验证安装

```bash
# 检查 MCP 服务状态
curl http://localhost:18060/api/v1/login/status

# 测试数据库连接
npx tsx scripts/show-overview.ts
```

---

## 📖 使用流程

### 第一步：内容抓取

```bash
# 创建抓取任务
npx tsx scripts/create-crawl-task.ts \
  --platform xiaohongshu \
  --keywords "AI人工智能,ChatGPT教程" \
  --target-count 20

# 查看结果并审核
npx tsx scripts/show-crawl-results.ts --task-id <task-id>

# 通过审核
npx tsx scripts/approve-all.ts --task-id <task-id>
```

### 第二步：内容发布

```bash
# 创建发布任务
npx tsx scripts/create-publish-task.ts \
  --source-ids <note-id-1>,<note-id-2> \
  --target-platform reddit

# 生成内容（AI 改编）
npx tsx scripts/generate-content.ts --task-id <publish-task-id>

# 执行发布
npx tsx scripts/execute-publish.ts --task-id <publish-task-id>
```

### 第三步：数据复盘

```bash
# 抓取昨日数据
npx tsx scripts/fetch-metrics.ts --date yesterday

# 生成数据报告
npx tsx scripts/generate-report.ts --period 7d
```

---

## 🗄️ 数据库表结构

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `source_accounts` | 信息源账号（小红书等） | platform, login_status, daily_quota |
| `target_accounts` | 被运营账号（Reddit等） | platform, api_config, positioning |
| `crawl_tasks` | 抓取任务 | status, query_list, target_count |
| `crawl_results` | 抓取结果 | source_url, content, quality_score, curation_status |
| `publish_tasks` | 发布任务 | status, content, scheduled_at |
| `publish_metrics_daily` | 内容每日数据 | metric_date, reddit_score, engagement_rate |
| `target_accounts_metrics_daily` | 账号整体每日数据 | followers_change, engagement_rate |

---

## 🔧 OpenClaw 集成

本项目作为 OpenClaw Skill 运行，支持自然语言交互：

**用户说**: "抓一批春季穿搭的语料"  
**Agent 执行**: 创建抓取任务 → 执行搜索 → 质量评估 → 返回候选列表 → 等待确认

**用户说**: "把第1和第3条发布到 Reddit"  
**Agent 执行**: 创建发布任务 → AI 生成内容 → 等待样稿确认 → 执行发布

---

## 📚 文档索引

| 文档 | 说明 | 适合读者 |
|------|------|----------|
| [SKILL.md](./SKILL.md) | OpenClaw 技能主文档 | OpenClaw Agent |
| [QUICKSTART.md](./QUICKSTART.md) | 10分钟快速上手指南 | 新用户 |
| [USER_WORKFLOW.md](./USER_WORKFLOW.md) | 完整操作流程手册 | 日常使用者 |
| [references/database-schema.md](./references/database-schema.md) | 数据库表结构详解 | 开发者 |
| [references/detailed-workflow.md](./references/detailed-workflow.md) | 多 Agent 协作工序设计 | 开发者 |
| [references/sop-workflows.md](./references/sop-workflows.md) | 7个标准操作流程 | 运营人员 |

---

## ⚠️ 注意事项

### 小红书抓取限制

小红书网页端有严格的反爬机制：

- ✅ **搜索列表** - 可获取标题、作者、互动数据、封面图
- ❌ **详情接口** - 多数笔记返回 "笔记不可访问"，无法获取完整正文

**解决方案**: 对于无法自动获取详情的笔记，支持人工补充后导入系统。

### 账号安全

- 请妥善保管 cookies 和 API 密钥
- 建议定期更换登录凭据
- 遵守各平台的使用条款

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发规范

1. 使用 TypeScript 编写脚本
2. 数据库变更需生成迁移文件
3. 新功能需更新 SKILL.md 文档

### 提交 Issue

- 描述清楚问题现象
- 提供复现步骤
- 附上错误日志

---

## 📄 开源协议

[MIT License](./LICENSE)

---

## 🔗 相关项目

- [OpenClaw](https://openclaw.ai) - 开源 AI Agent 框架
- [xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) - 小红书 MCP 服务

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/cwyhkyochen-a11y">cwyhkyochen-a11y</a>
</p>
