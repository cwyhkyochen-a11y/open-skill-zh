# Release Notes - v0.3.0

## 版本定位

这是从线上 `v0.2.0` 继续迭代出来的下一版本。

## 新增

- content-ops 控制台
- 登录模块
- 账号详情页
- 任务详情页
- 任务重新执行
- 按平台动态校验
- Caddy 子路径部署能力
- systemd 常驻运行方式

## 发布能力增强

- `publish-dispatch.py` 扩展到 Threads / Facebook / Pinterest
- Threads 成为第二个 task-driven publishing 样板平台
- Facebook / Pinterest 接入统一 JSON 输出与结果回写

## 控制台能力

- 账号列表只读展示
- 账号详情页：摘要 / apiConfig / platformConfig / 最近发布记录
- 任务详情页：正文 / 媒体 / content / publish_results / raw 回执
- 平台筛选 / 状态筛选 / 关键字搜索
- 自动刷新
- 手动执行发布
- 重新执行

## 部署

- 默认本地运行于 `127.0.0.1:3210`
- 支持通过 Caddy 挂到子路径，例如 `/contentops/`
- 可通过 systemd 做常驻服务
- 默认控制台密码更新为 `kyochen28`
