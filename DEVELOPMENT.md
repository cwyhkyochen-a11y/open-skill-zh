# SocialHub Console - 开发文档

## 项目概述

SocialHub Console 是一个多平台社交媒体内容运营管理控制台，支持一键发布内容到 Twitter、Instagram、Facebook 等平台。

- **版本**: v1.5.0
- **技术栈**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui + SQLite + Drizzle ORM
- **API 集成**: Composio SDK（统一社交媒体 API 层）
- **部署**: PM2 + Nginx，端口 3210，basePath `/contentops`
- **线上地址**: https://kyochen.art/contentops

---

## 架构设计

### 三层发布架构

```
前端 (publish/page.tsx)
  → /api/media/upload     纯本地存储，返回 filePath + fileUrl
  → /api/publish          创建发布任务，逐账号调用 PublishRouter
  → PublishRouter          按平台分发，每个平台独立链路
```

### 平台发布链路

#### Twitter
- 纯文本: `TWITTER_CREATION_OF_A_POST` (text)
- 图文: `tools.proxy` → Twitter v2 `/2/media/upload` → `media_id` → `TWITTER_CREATION_OF_A_POST` (text + media\_\_media\_\_ids)
- 链接: `TWITTER_CREATION_OF_A_POST` (text 中拼入 URL)

#### Instagram (两步发布)
1. `INSTAGRAM_CREATE_MEDIA_CONTAINER` (ig_user_id, image_url, caption) → creation_id
2. `INSTAGRAM_CREATE_POST` (ig_user_id, creation_id)
- 图片必须是公网可访问 URL
- ig_user_id 存储在 target_accounts.instagram_user_id

#### Facebook
- 纯文本: `FACEBOOK_CREATE_POST` (page_id, message)
- 图文: `FACEBOOK_CREATE_PHOTO_POST` (page_id, message, url)
- 链接: `FACEBOOK_CREATE_POST` (page_id, message, link)
- page_id 存储在 target_accounts.facebook_default_page_id

### 授权架构（双路由，为 v1.7 预留）
- `account.authMode === 'composio'` → Composio 链路（当前）
- `account.authMode === 'custom'` → 自建 OAuth 链路（v1.7 计划）

---

## Composio 集成

### SDK 使用
- `@composio/core` (v0.6.4) — tools.execute() 执行工具
- `@composio/client` (v0.1.0-alpha.60) — tools.proxy() 代理 API 调用

### 关键注意事项

#### 1. Connected Account ID 匹配
Composio API 可能忽略 user_id 过滤参数。必须在客户端严格匹配 user_id + toolkit.slug + ACTIVE。

#### 2. Twitter Media Upload
Composio Twitter toolkit 没有 media upload 工具。通过 tools.proxy 调用 Twitter v2 API：
```typescript
const result = await client.tools.proxy({
  endpoint: 'https://api.x.com/2/media/upload',
  method: 'POST',
  connected_account_id: connectedAccountId,
  body: { media: base64, media_category: 'tweet_image', media_type: 'image/jpeg' },
});
// result.data.data.id → media_id
```

#### 3. ComposioClient 必须懒加载
@composio/client 在 Next.js 服务端构造时触发递归 stack overflow，需延迟初始化。

---

## 数据库

### target_accounts
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| platform | TEXT | twitter/instagram/facebook... |
| account_name | TEXT | 显示名称 |
| auth_mode | TEXT | composio / custom |
| composio_user_id | TEXT | Composio entity user_id |
| facebook_page_ids | TEXT(JSON) | Facebook Page IDs |
| facebook_default_page_id | TEXT | 默认 Page ID |
| instagram_user_id | TEXT | Instagram Business Account ID |

### publish_tasks
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| target_account_ids | TEXT(JSON) | 目标账号 ID 数组 |
| content_type | TEXT | text/image/video/link |
| content_data | TEXT(JSON) | 发布内容 |
| status | TEXT | published/partial/failed |
| publish_results | TEXT(JSON) | 各平台发布结果 |

---

## 关键文件
```
lib/composio.ts          Composio SDK 封装
lib/publish-router.ts    发布路由器（按平台分发）
lib/content-types.ts     内容类型定义
lib/db/schema.ts         Drizzle ORM Schema
app/api/publish/route.ts 发布入口
app/api/media/upload/route.ts 媒体上传（纯本地）
app/api/accounts/[id]/facebook-pages/route.ts  Facebook Page 管理
app/api/accounts/[id]/instagram-user-id/route.ts  Instagram UID 管理
app/dashboard/publish/page.tsx  发布页面
```

---

## 环境变量 (.env.local)
```
COMPOSIO_API_KEY=       # Composio API Key
JWT_SECRET=             # JWT 签名密钥
DATABASE_PATH=          # SQLite 数据库路径
APP_URL=                # 应用 URL
NEXT_PUBLIC_APP_URL=    # 前端可访问的应用 URL
```

---

## 部署
```bash
npm run build
pm2 restart content-ops-console
pm2 logs content-ops-console --lines 50
pm2 reset content-ops-console  # 重置重启计数
```

---

## 版本历史

### v1.5.0 (2026-03-11)
- 修复: Composio getConnectedAccountId entity mismatch bug
- 修复: Instagram 发布工具名更正
- 修复: Facebook page_id / Instagram ig_user_id 自动获取和存储
- 新增: Twitter 图文发帖（Composio proxy + Twitter v2 media upload）
- 重构: 三层发布架构（媒体上传 / 发布路由 / 任务管理）
- 重构: 媒体上传改为纯本地存储
- 清理: 移除不相关表中多余的 facebook/instagram 字段

---

## 测试规范

### 测试账号
**只使用 kyochen 相关账号进行测试**，其他账号为生产账号，禁止用于测试。

| 平台 | 测试账号 | Account ID | Composio user_id |
|------|---------|------------|-------------------|
| Twitter | @alphazu_ | 121ee7ab-36a3-4c76-9372-aeb4fa0332ae | twitter_@alphazu__1773172220557 |
| Instagram | kyochen (kyodesigner) | 14f05fff-a2ab-4aa0-808a-41f3f690b4c1 | instagram_kyochen_1773164745076 |
| Facebook | kyochen (Kyochen Page) | 61226072-fc03-49ad-8458-e119e599bbe8 | facebook_kyochen_1773164337611 |

### 生产账号（禁止测试）
- Twitter: knitnerdmeow2026, @kyochendspk
- Instagram: knitnerdmeow
- Facebook: 61587839949628

### 测试时注意
- 测试推文/帖子需要带明显标识（如"测试"、"test"、"please ignore"）
- 测试完成后如需清理，通过平台原生界面删除
