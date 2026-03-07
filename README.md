# Social Content Ops - 社交媒体内容运营自动化

<p align="center">
  <strong>🤖 AI 驱动的内容抓取、策划、发布与数据分析系统</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenClaw-Skill-blue" alt="OpenClaw Skill">
  <img src="https://img.shields.io/badge/Version-0.3.0-green" alt="Version">
  <img src="https://img.shields.io/badge/Platform-X%20%7C%20Instagram%20%7C%20Facebook%20%7C%20Threads%20%7C%20Pinterest-orange" alt="Platform">
  <img src="https://img.shields.io/badge/Storage-SQLite%20%2B%20Drizzle-purple" alt="Storage">
</p>

---

## 项目简介

**Social Content Ops** 是一个运行在 OpenClaw 里的社交媒体内容运营自动化系统。

当前版本重点完成了两条主线：

1. **task-driven publishing** 已从 X 扩展到 Threads / Facebook / Pinterest 等平台
2. 新增了一个 **可本地运行、可公网部署的 content-ops 控制台**

控制台支持：

- 登录访问
- 选择平台 / 账号手动创建发布任务
- 上传图片 / 视频
- 查看代运营账号列表
- 查看账号详情
- 查看发布记录（成功 / 失败 / 待执行）
- 查看任务详情和 `publish_results.raw`
- 手动执行发布 / 重新执行
- 按平台动态做前后端校验

---

## 当前版本亮点（v0.3.0）

### 1. Task-driven publishing 扩展

统一调度入口：

- `scripts/publish-dispatch.py`

已经接入统一 task 模式 / 结果回写链路的平台：

- X
- Threads
- Facebook
- Pinterest

其中：

- **Threads** 已按 X 的模式做成第二个样板平台
- Facebook / Pinterest 已接入统一 JSON 结果输出与 `publish_results` 回写

### 2. 控制台（content-ops console）

控制台默认本地运行，也支持通过 Caddy / Nginx 反代挂到公网子路径。

本次已落地：

- 登录模块
- 账号列表只读展示
- 账号详情页
- 平台筛选 / 状态筛选 / 搜索
- 任务创建表单
- 按平台动态限制提示
- 前端 + 后端双重校验
- 任务详情页
- 重新执行
- 自动刷新
- 支持子路径公网部署（例如 `/contentops/`）

---

## 快速开始

### 环境要求

- Node.js 18+
- SQLite 3
- Python 3.10+

### 安装依赖

```bash
cd /root/.openclaw/workspace/skills/content-ops
npm install
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 启动控制台

```bash
npm run console
```

默认监听：

- Host: `127.0.0.1`
- Port: `3210`

默认登录账号：

- 用户名：`kyochen`
- 密码：`kyochen28`

可通过环境变量覆盖：

```bash
CONTENT_OPS_CONSOLE_HOST=127.0.0.1
CONTENT_OPS_CONSOLE_PORT=3210
CONTENT_OPS_CONSOLE_USER=kyochen
CONTENT_OPS_CONSOLE_PASSWORD=kyochen28
CONTENT_OPS_CONSOLE_SESSION_SECRET=change-me
```

---

## 使用说明

### 1. 手动创建发布任务

在控制台中：

- 先选择平台过滤（可选）
- 再选择目标账号
- 输入正文 / 链接 / 标题
- 上传图片或视频
- 提交任务

### 2. 执行发布

你可以：

- 在记录列表里点“执行发布”
- 或在任务详情页点“重新执行”

底层仍然走：

```bash
python skills/content-ops/scripts/publish-dispatch.py --task-id <TASK_ID> --execute
```

### 3. 任务详情

任务详情页可以看到：

- 正文全文
- 媒体列表
- `content` 完整结构
- `publish_results` 全量数组
- 最后一次 `raw` 原始回执

### 4. 账号详情

账号详情页可以看到：

- 账号摘要
- `apiConfig`
- `platformConfig`
- 最近 20 条发布记录

---

## 按平台校验规则

当前控制台内置了平台级限制提示和提交校验：

### X
- 默认 280 字
- 最多 4 图
- 支持视频
- 不支持 link 字段
- 长文提示线程

### Threads
- 默认 500 字
- 最多 10 图
- 支持视频
- 不支持 link 字段

### Pinterest
- 必须且只能 1 张图片
- 支持 link
- 不支持视频

### Facebook
- 支持 link
- 支持多图
- 支持视频

### Instagram
- 已预留摘要规则，便于后续接入

---

## 公网部署示例

如果使用 Caddy 反代到子路径（例如 `/contentops/`）：

```caddy
your-domain.com {
    redir /contentops /contentops/ 308

    handle_path /contentops/* {
        reverse_proxy 127.0.0.1:3210
    }
}
```

systemd 服务示例：

```ini
[Unit]
Description=content-ops console
After=network.target

[Service]
Type=simple
WorkingDirectory=/root/.openclaw/workspace/skills/content-ops
Environment=CONTENT_OPS_CONSOLE_HOST=127.0.0.1
Environment=CONTENT_OPS_CONSOLE_PORT=3210
ExecStart=/root/.nvm/versions/node/v22.22.0/bin/node src/console-server.mjs
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=multi-user.target
```

---

## 核心文档

- `docs/CONSOLE.md` — 控制台说明
- `docs/PUBLISH_DISPATCH.md` — 统一调度入口说明
- `docs/PUBLISH_LOGS.md` — 发布日志结构
- `docs/X_API_SETUP.md` — X API 接入说明
- `docs/X_API_OPERATIONS.md` — X API 日常操作

---

## 版本记录

### v0.3.0

- 扩展 task-driven publishing 到 Threads / Facebook / Pinterest
- 给 Threads 做成第二个样板平台
- 新增本地 / 公网可用控制台
- 新增登录模块
- 新增账号详情页
- 新增任务详情页
- 新增按平台动态校验
- 支持 Caddy 子路径部署
- 支持 systemd 常驻运行

### v1.0.0

- 内容运营基础数据库和脚本
- X API 发布链路
- publish-dispatch 初版

---

## 注意事项

- 当前默认账号密码适合初始部署验证，不适合长期公网裸用
- 上公网后建议尽快修改密码
- 建议后续再加一层访问限制或更强认证
