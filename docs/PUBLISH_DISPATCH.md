# publish-dispatch 使用说明

## 两种模式

### 1. 旧配置模式
从 `accounts.local.json` 读取账号配置：

```bash
python skills/content-ops/scripts/publish-dispatch.py \
  --platform pinterest --account main --title "Pin" --text "desc" --image /tmp/a.png
```

### 2. publish task 模式
直接从数据库里读取 `publish_tasks` 和 `target_accounts`：

```bash
python skills/content-ops/scripts/publish-dispatch.py --task-id <PUBLISH_TASK_ID>
python skills/content-ops/scripts/publish-dispatch.py --task-id <PUBLISH_TASK_ID> --execute
```

## X 平台
默认走 API 模式：

```bash
python skills/content-ops/scripts/publish-dispatch.py --task-id <TASK_ID> --execute
```

也可以显式指定：

```bash
python skills/content-ops/scripts/publish-dispatch.py --task-id <TASK_ID> --x-mode api --execute
```

如果必须走旧浏览器脚本：

```bash
python skills/content-ops/scripts/publish-dispatch.py --platform x --account main --text "hello" --x-mode browser
```

## 调度逻辑

- 若提供 `--task-id`，优先走数据库任务模式
- 从 `publish_tasks.content` 读取 `title/body/media/link/platform_specific`
- 从 `generated_images.images` 自动补充图片
- X 平台自动在长文本时加 `--thread`
- 成功发布后，平台结果回写到 `publish_tasks.content.publish_results`
