# Social Content Ops - 社交媒体内容运营自动化

<p align="center">
  <strong>🤖 AI驱动的内容抓取、策划、发布与数据分析系统</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenClaw-Skill-blue" alt="OpenClaw Skill">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Platform-Xiaohongshu%20%7C%20Reddit%20%7C%20Pinterest-orange" alt="Platform">
  <img src="https://img.shields.io/badge/Integration-Baoyu%20Skills-purple" alt="Baoyu Skills">
</p>

---

## 🎯 项目简介

**Social Content Ops** 是一个社交媒体内容运营自动化系统，作为 [OpenClaw](https://openclaw.ai) 的 Skill 运行。支持从小红书抓取优质内容，经过 AI 改编后发布到 Reddit、Pinterest、Discord 等平台，并提供完整的数据分析功能。

**核心亮点：** 集成 [baoyu-skills](https://github.com/JimLiu/baoyu-skills) 的 AI 配图生成能力，支持自动生成小红书风格的多图系列和信息图。

---

## ✨ 核心特性

| 特性 | 说明 |
|------|------|
| 📥 **智能抓取** | 支持小红书搜索抓取，自动评估内容质量 |
| 🤖 **AI 改编** | 基于语料生成适配目标平台的内容 |
| 🎨 **AI 配图** | 集成 baoyu-skills，自动生成小红书风格配图 |
| 👥 **人机协作** | 关键节点需人工确认，确保内容质量 |
| 📊 **数据分析** | 自动追踪发布内容的互动数据，生成复盘报告 |
| 🗄️ **本地存储** | SQLite + Drizzle ORM，无需外部数据库 |
| 🔧 **易于扩展** | 模块化设计，支持添加新平台 |

---

## 🎨 AI 配图生成

本项目集成 [baoyu-skills](https://github.com/JimLiu/baoyu-skills) 的配图生成能力：

### 支持的生成方式

| 工具 | 适用平台 | 特点 |
|------|----------|------|
| **xhs-images** | 小红书 | 1-10张系列图，9种风格 × 6种布局 |
| **infographic** | Reddit/Pinterest | 专业信息图，20种布局 × 17种风格 |
| **cover-image** | 通用 | 封面图，5维定制系统 |

### 视觉风格

- **cute** (可爱) | **fresh** (清新) | **warm** (温暖)
- **bold** (大胆) | **minimal** (极简) | **retro** (复古)
- **pop** (流行) | **notion** | **chalkboard** (黑板)

### 布局类型

- **sparse** (稀疏1-2点) - 封面、金句
- **balanced** (平衡3-4点) - 常规内容
- **dense** (密集5-8点) - 知识卡片
- **list** (列表) - 清单、排行
- **comparison** (对比) - 优劣分析
- **flow** (流程) - 步骤、时间线

---

## 📁 项目结构

```
social-content-ops/
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
│   ├── generate-images.ts         # AI 配图生成（新增）
│   ├── configure-account-style.ts # 配置账号视觉风格（新增）
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
├── 📂 docs/                       # 新增文档
│   └── BAOYU_INTEGRATION_PLAN.md  # baoyu-skills 集成计划
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
git clone https://github.com/cwyhkyochen-a11y/social-content-ops.git
cd social-content-ops

# 安装 Node.js 依赖
npm install

# 安装 baoyu-skills (AI 配图生成)
npx skills add jimliu/baoyu-skills

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

# 生成配图（AI 生成 - 集成 baoyu-skills）
npx tsx scripts/generate-images.ts --task-id <publish-task-id>

# 查看生成的内容和配图
npx tsx scripts/review-publish-content.ts --task-id <publish-task-id>

# 执行发布
npx tsx scripts/execute-publish.ts --task-id <publish-task-id>
```

### 第三步：配置视觉风格

```bash
# 查看所有可用风格
npx tsx scripts/configure-account-style.ts --list-styles

# 查看所有账号
npx tsx scripts/configure-account-style.ts --list-all

# 配置账号视觉风格
npx tsx scripts/configure-account-style.ts \
  --account-id <account-id> \
  --style cute \
  --layout list \
  --aspect-ratio 9:16
```

### 第四步：数据复盘

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
| `target_accounts` | 被运营账号（Reddit等） | platform, api_config, positioning, **visual_style**, **layout_preference** |
| `crawl_tasks` | 抓取任务 | status, query_list, target_count |
| `crawl_results` | 抓取结果 | source_url, content, quality_score, curation_status |
| `publish_tasks` | 发布任务 | status, content, **generated_images**, scheduled_at |
| `publish_metrics_daily` | 内容每日数据 | metric_date, reddit_score, engagement_rate |
| `target_accounts_metrics_daily` | 账号整体每日数据 | followers_change, engagement_rate |

---

## 🔧 OpenClaw 集成

本项目作为 OpenClaw Skill 运行，支持自然语言交互：

**用户说**: "抓一批春季穿搭的语料"  
**Agent 执行**: 创建抓取任务 → 执行搜索 → 质量评估 → 返回候选列表 → 等待确认

**用户说**: "把第1和第3条发布到 Reddit，配信息图"  
**Agent 执行**: 创建发布任务 → AI 生成内容 → **AI 生成配图** → 等待样稿确认 → 执行发布

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
| [docs/BAOYU_INTEGRATION_PLAN.md](./docs/BAOYU_INTEGRATION_PLAN.md) | baoyu-skills 集成计划 | 开发者 |

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

### baoyu-skills 依赖

- 需要先安装 baoyu-skills: `npx skills add jimliu/baoyu-skills`
- 需要配置 AI 服务的 API key
- 图片生成需要一定时间，请耐心等待

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
- [baoyu-skills](https://github.com/JimLiu/baoyu-skills) - AI 内容生成技能集
- [xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) - 小红书 MCP 服务

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/cwyhkyochen-a11y">cwyhkyochen-a11y</a>
</p>
