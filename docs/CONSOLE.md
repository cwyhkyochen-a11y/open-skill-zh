# content-ops 控制台

## 目标

提供一个默认本地运行的控制台，用于：

- 主动选择平台/账号创建发帖任务
- 上传图片/视频并写入本地媒体目录
- 查看代运营账号列表（只读）
- 查看账号详情（授权、配置摘要、最近发布记录）
- 查看发帖记录（成功 / 失败 / 待执行）
- 登录后访问，避免裸奔在本地或公网

## 启动

```bash
cd /root/.openclaw/workspace/skills/content-ops
npm run console
```

默认监听：

- Host: `127.0.0.1`
- Port: `3210`

默认登录账号：

- 用户名：`kyochen`
- 密码：`kyochen28`

可通过环境变量覆盖：

- `CONTENT_OPS_CONSOLE_HOST`
- `CONTENT_OPS_CONSOLE_PORT`
- `CONTENT_OPS_CONSOLE_USER`
- `CONTENT_OPS_CONSOLE_PASSWORD`
- `CONTENT_OPS_CONSOLE_SESSION_SECRET`

## 登录与权限

当前为单用户登录：

- 通过 cookie session 维持登录态
- 未登录不能访问账号、发布、上传、执行接口
- 适合作为本地控制台或经反代后的小范围使用

## 页面能力

### 1. 代运营账号列表 + 账号详情页

只读展示：

- 名称
- 平台
- 主页地址
- 授权时间（从 `api_config.authorized_at/created_at` 推断）
- 当前是否可用

并支持：

- 平台筛选
- 可用性筛选
- 关键字搜索
- 点击名称打开账号详情页

账号详情页展示：

- 账号摘要
- apiConfig
- platformConfig
- 最近 20 条发布记录

### 2. 手动发帖

表单支持：

- 平台过滤后选择目标账号
- 输入标题/任务名
- 输入正文
- 输入链接
- 上传图片/视频（多选）

控制台不会直接绕过调度层发帖，而是：

- 在 `publish_tasks` 新建一条任务
- 状态默认置为 `approved`
- 后续仍由 `publish-dispatch.py --task-id ... --execute` 执行发布

### 3. 按平台动态校验

任务创建时会按账号平台动态提示并校验：

- X：默认 280 字、最多 4 图、支持视频、不支持 link 字段、长文提示线程
- Threads：默认 500 字、最多 10 图、支持视频、不支持 link 字段
- Pinterest：必须且只能 1 张图片、支持 link、不支持视频
- Facebook：支持 link、支持多图、支持视频
- Instagram：预留摘要规则（便于后续接入）

前端和后端都会做约束校验，避免提交出一堆注定失败的任务。

### 4. 发布记录 + 任务详情页

展示：

- 任务名 / 标题
- 平台 / 账号
- 当前状态
- 正文预览
- 创建/发布时间
- 发布结果链接
- 平台原生 post id
- 失败说明 / 备注

并支持：

- 平台筛选
- 状态筛选
- 关键字搜索
- 默认每 15 秒自动刷新
- 手动点击“执行发布”
- 查看任务详情
- 重新执行

任务详情页展示：

- 正文全文
- 媒体列表
- `content` 完整结构
- `publish_results` 全量数组
- 最后一次 `raw` 回执

## 媒体上传

上传的文件默认保存到：

```text
/root/.openclaw/workspace/content-ops-workspace/console-uploads/
```

前端会先把文件转成 base64 上传，再由后端落盘，最终将本地路径写入 `publish_tasks.content.media`。
