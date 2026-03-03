# 账号闭环（无 UI / ECS）: 档案 → 同步 → secrets → 发布

目标：在 **无 UI 的 ECS** 上实现 content-ops 的账号配置与发布闭环。

## 一、目录约定

工作区：
- 账号档案（Markdown）目录：
  - `~/.openclaw/workspace/content-ops-workspace/accounts/`
- secrets 目录（仅存放 token/password/session 等敏感信息文件）：
  - `~/.openclaw/workspace/content-ops-workspace/secrets/`
- 数据库：
  - `~/.openclaw/workspace/content-ops-workspace/data/content-ops.db`

> 约定：
> - 档案文件 **不写明文密码/token**
> - DB 的 `api_config` 只写入 `*_file` 路径（引用），发布脚本运行时再读文件。

## 二、账号档案格式（Front Matter）

每个平台一个 `.md` 文件，必须包含 front matter：

```yaml
---
platform: pinterest|facebook|threads|instagram|x
account_name: knitnerdmeow
account_id: null
homepage_url: https://...
status: active
positioning: 
target_audience: 
content_direction: 
visual_style: fresh
layout_preference: balanced
image_aspect_ratio: 2:3

# platform-specific secret refs
access_token_file: ~/.openclaw/workspace/content-ops-workspace/secrets/pinterest/knitnerdmeow.token
session_file: ~/.openclaw/workspace/content-ops-workspace/secrets/instagram/knitnerdmeow.session.json
password_file: ~/.openclaw/workspace/content-ops-workspace/secrets/instagram/knitnerdmeow.password
chrome_profile_dir: ~/.openclaw/workspace/content-ops-workspace/secrets/x/chrome-profile-knitnerdmeow
---
```

字段说明：
- `platform`：平台标识（必须）
- `account_name`：用于在 DB 内唯一定位账号（platform + account_name 作为 upsert key）
- `access_token_file`：token 文件路径（Pinterest/Facebook/Threads）
- `password_file`：IG 密码文件路径（instagrapi 登录需要）
- `session_file`：IG session 文件路径（用于复用登录态）
- `chrome_profile_dir`：X 使用 CDP，需要 Chrome profile 目录持久化登录态

## 三、同步命令（把档案写入 DB）

在 skill 目录执行：

```bash
cd ~/.openclaw/workspace/skills/content-ops
npx tsx scripts/sync-target-accounts-from-profiles.ts
```

可指定档案目录：
```bash
npx tsx scripts/sync-target-accounts-from-profiles.ts --dir /your/accounts/dir
```

## 四、secrets 文件的写入（建议方式）

创建 secrets 目录（一次性）：
```bash
mkdir -p ~/.openclaw/workspace/content-ops-workspace/secrets/{pinterest,facebook,threads,instagram,x}
chmod 700 ~/.openclaw/workspace/content-ops-workspace/secrets
```

写入 token（避免进入 shell history，可用 heredoc）：
```bash
cat > ~/.openclaw/workspace/content-ops-workspace/secrets/threads/knitnerdmeow.token <<'EOF'
PASTE_TOKEN_HERE
EOF
chmod 600 ~/.openclaw/workspace/content-ops-workspace/secrets/threads/knitnerdmeow.token
```

写入 IG 密码（同理）：
```bash
cat > ~/.openclaw/workspace/content-ops-workspace/secrets/instagram/knitnerdmeow.password <<'EOF'
PASTE_PASSWORD_HERE
EOF
chmod 600 ~/.openclaw/workspace/content-ops-workspace/secrets/instagram/knitnerdmeow.password
```

## 五、发布脚本：支持从文件读取 token/password

### Pinterest
```bash
python3 scripts/pinterest_publish.py \
  --token-file ~/.openclaw/workspace/content-ops-workspace/secrets/pinterest/knitnerdmeow.token \
  --list-boards
```

### Facebook
```bash
python3 scripts/facebook_publish.py \
  --token-file ~/.openclaw/workspace/content-ops-workspace/secrets/facebook/knitnerdmeow.token \
  --info
```

### Threads
```bash
python3 scripts/threads_publish.py \
  --token-file ~/.openclaw/workspace/content-ops-workspace/secrets/threads/knitnerdmeow.token \
  --info
```

### Instagram
```bash
python3 scripts/instagram_publish.py \
  -u knitnerdmeow \
  --password-file ~/.openclaw/workspace/content-ops-workspace/secrets/instagram/knitnerdmeow.password \
  --session-file ~/.openclaw/workspace/content-ops-workspace/secrets/instagram/knitnerdmeow.session.json \
  --info
```

### X (Playwright)
首次（需要能看到浏览器才能登录；若完全无 UI，请走 cookies 导入到 profile_dir）：
```bash
python3 scripts/x_publish_pw.py \
  --profile-dir ~/.openclaw/workspace/content-ops-workspace/secrets/x/chrome-profile-knitnerdmeow \
  --login
```

发布（有登录态后可 headless）：
```bash
python3 scripts/x_publish_pw.py \
  --profile-dir ~/.openclaw/workspace/content-ops-workspace/secrets/x/chrome-profile-knitnerdmeow \
  --headless \
  --text "Hello X"
```

## 六、注意事项（闭环的现实边界）

- Pinterest/Facebook/Threads：token 会过期，过期后需要刷新并覆盖 token 文件。
- Instagram：instagrapi 即使有 session 文件，登录仍需要密码；并且可能触发 Challenge/2FA，需要你在手机端处理一次。
- X：已提供 Playwright 版本 `scripts/x_publish_pw.py`，使用 `--profile-dir` 持久化登录态；首次需要完成一次登录或导入 cookies。
