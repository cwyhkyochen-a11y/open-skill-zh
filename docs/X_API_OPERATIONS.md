# X API 日常操作说明

## 环境变量

```bash
export X_CLIENT_ID='你的 client id'
export X_CLIENT_SECRET='你的 client secret'
export X_REDIRECT_URI='https://xauth.kyochen.art/auth/x/callback'
export X_SCOPES='tweet.read tweet.write users.read offline.access'
```

## 1. 生成授权链接

```bash
cd ~/.openclaw/workspace/skills/content-ops
npx tsx scripts/x_oauth_start.ts
```

## 2. 刷新 token

```bash
cd ~/.openclaw/workspace/skills/content-ops
npx tsx scripts/x_refresh_token.ts --account-id <ACCOUNT_ID>
```

## 3. 干跑发帖

```bash
cd ~/.openclaw/workspace/skills/content-ops
npx tsx scripts/x_post_api.ts --account-id <ACCOUNT_ID> --text "test" --dry-run
```

## 4. 正式发帖

```bash
cd ~/.openclaw/workspace/skills/content-ops
npx tsx scripts/x_post_api.ts --account-id <ACCOUNT_ID> --text "test"
```

## 5. 绑定 publish task

```bash
cd ~/.openclaw/workspace/skills/content-ops
npx tsx scripts/x_post_api.ts --account-id <ACCOUNT_ID> --task-id <PUBLISH_TASK_ID> --text "test"
```

## 当前已知限制

- 当前只支持文本发帖
- 图片 / 视频 media upload 还没接
- 如 token 临近过期，会自动尝试 refresh
- 若 refresh 失败，需重新授权
