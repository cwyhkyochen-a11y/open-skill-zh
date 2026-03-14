# SocialHub Console

> 多平台社交媒体内容运营管理控制台 — Multi-platform social media content operations console

[![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)](https://github.com/cwyhkyochen-a11y/social-content-ops)

## Overview

SocialHub Console 是一个自托管的社交媒体内容发布管理平台，支持一键将内容同步发布到 Twitter、Instagram、Facebook 等多个平台。

**Tech Stack**: Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · SQLite · Drizzle ORM

**API Layer**: [Composio](https://composio.dev/) — 统一社交媒体 OAuth 与 API 集成

## Features

### 📤 Multi-Platform Publishing
- **一次编辑，多平台发布** — 选择多个账号，一键发布
- **内容类型** — 文本、图片、视频、链接
- **平台适配** — 自动处理各平台格式要求（字数限制、图片规格等）
- **实时进度** — PublishProgressDialog 展示每个账号的发布状态

### 🔐 Account Management
- **Composio OAuth 托管** — 无需手动管理 token 刷新
- **10+ 平台支持** — Twitter/X, Facebook, Instagram, YouTube, Reddit, Discord, Slack, LinkedIn, TikTok, Pinterest
- **连接状态检查** — 实时验证授权状态

### 🏗️ Publishing Architecture

```
Frontend (publish/page.tsx)
  → /api/media/upload       Local storage, returns public URL
  → /api/publish            Creates tasks, routes per account
  → PublishRouter            Platform-specific pipelines
```

**Platform Pipelines:**
| Platform | Text | Image | Link |
|----------|------|-------|------|
| Twitter | Composio `TWITTER_CREATION_OF_A_POST` | `tools.proxy` → Twitter v2 media upload → post | Text + URL |
| Instagram | — | Two-step: `CREATE_MEDIA_CONTAINER` → `CREATE_POST` | — |
| Facebook | `FACEBOOK_CREATE_POST` | `FACEBOOK_CREATE_PHOTO_POST` | `CREATE_POST` + link |

### 📊 Records & History
- 发布记录查看
- 按平台/状态筛选
- 错误详情与重试

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your COMPOSIO_API_KEY, JWT_SECRET, etc.

# Initialize database
npx drizzle-kit migrate

# Development
npm run dev

# Production build
npm run build
npm start
```

## Deployment

```bash
# Build
npm run build

# PM2 (recommended)
pm2 start start.sh --name content-ops-console
pm2 save

# With reverse proxy (Caddy example)
# See DEPLOYMENT.md for full Caddy/Nginx config
```

**Note**: Image publishing requires the `/uploads/` directory to be publicly accessible. Configure your reverse proxy to serve static files from `public/uploads/` before proxying to Next.js.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `COMPOSIO_API_KEY` | ✅ | Composio API key |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `DATABASE_PATH` | ✅ | SQLite database file path |
| `APP_URL` | ✅ | Public application URL |
| `NEXT_PUBLIC_APP_URL` | ✅ | Frontend-accessible URL |

## Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) — Architecture, Composio integration details, database schema
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Production deployment guide
- [CHANGELOG.md](./CHANGELOG.md) — Version history

## License

MIT
