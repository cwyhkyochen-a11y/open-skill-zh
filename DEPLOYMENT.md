# Content-Ops Console v1.4.0 部署指南

## 快速部署

### 1. 环境要求

- Node.js 18+ 或 20+
- npm 或 yarn
- PM2（推荐用于生产环境）

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，修改以下配置：

```env
# 修改为实际的服务器地址
APP_URL=http://your-server-ip:3005
NEXT_PUBLIC_APP_URL=http://your-server-ip:3005

# 修改 JWT 密钥（生产环境必须修改）
JWT_SECRET=your-random-secret-key-here
```

### 4. 初始化数据库

```bash
node scripts/init-db.mjs
```

这将创建数据库并初始化默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

### 5. 构建应用

```bash
npm run build
```

### 6. 启动服务

**开发环境：**
```bash
npm run dev
```

**生产环境（使用 PM2）：**
```bash
pm2 start npm --name "content-ops-console" -- start
pm2 save
```

应用将在 `http://localhost:3005` 启动。

## 配置 Composio

1. 登录系统（admin / admin123）
2. 进入"系统设置"
3. 输入 Composio API Key
4. 点击"测试连接"验证

## 添加社交媒体账号

1. 进入"账号管理"
2. 点击"添加账号"
3. 填写账号信息
4. 点击授权链接完成 OAuth 授权
5. 授权完成后会自动跳转回账号管理页面

## 发布内容

1. 进入"发布工作台"
2. 选择内容类型（文本、图文、视频等）
3. 填写内容
4. 选择目标账号
5. 点击"立即发布"或"定时发布"

## 常见问题

### 1. 授权后回调地址错误

确保 `.env.local` 中的 `APP_URL` 和 `NEXT_PUBLIC_APP_URL` 配置正确。

### 2. 数据库表不存在

运行初始化脚本：
```bash
node scripts/init-db.mjs
```

### 3. better-sqlite3 编译错误

在服务器上重新编译：
```bash
npm rebuild better-sqlite3
```

### 4. 登录后无法跳转

检查 JWT_SECRET 是否配置，确保 cookie 可以正常设置。

## 技术栈

- **框架**: Next.js 15
- **UI**: Tailwind CSS + shadcn/ui
- **数据库**: SQLite + Drizzle ORM
- **认证**: JWT (jose)
- **图标**: Lucide React
- **API**: Composio v3

## 端口配置

默认端口：3005

修改端口：编辑 `package.json` 中的 `start` 脚本：
```json
"start": "next start -p 3005"
```

## 安全建议

1. 修改默认管理员密码
2. 使用强随机字符串作为 JWT_SECRET
3. 在生产环境使用 HTTPS
4. 定期备份数据库文件

## 更新日志

### v1.4.0 (2026-03-10)

- ✅ 亮色主题 UI 改造
- ✅ SVG 图标替换 Emoji
- ✅ Composio v3 API 集成
- ✅ 动态回调地址支持
- ✅ Edge Runtime 兼容（jose）
- ✅ 完整的发布工作流

## 支持

如有问题，请查看日志：
```bash
pm2 logs content-ops-console
```
