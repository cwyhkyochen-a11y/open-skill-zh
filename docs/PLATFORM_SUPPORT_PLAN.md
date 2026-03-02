# 多平台发布支持计划

## 目标平台

| 平台 | 优先级 | 技术方案 | 现有 Skill | 状态 |
|------|--------|----------|------------|------|
| **X (Twitter)** | P0 | CDP | 自建 x_publish.py | ✅ 已完成 |
| **Instagram** | P1 | instagrapi API | 自建 instagram_publish.py | ✅ 已完成 |
| **Facebook** | P1 | facebook-sdk | 自建 facebook_publish.py | ✅ 已完成 |
| **Threads** | P2 | threads-api / CDP | 需调研 | 📝 待开发 |
| **Reddit** | P2 | PRAW / API | 规划中 | 📝 待开发 |
| **Pinterest** | P2 | Pinterest API v5 | 自建 pinterest_publish.py | ✅ 已完成 |

---

## 推荐方案

### 1. X (Twitter) - 已实现: 自建 CDP 脚本

✅ **状态**: 已完成，脚本位置: `scripts/x_publish.py`

**实现方式**: 复用 redbookskills 的技术栈
- 复用 chrome_launcher.py
- 复用 image_downloader.py
- 实现 X 的表单填写逻辑

**使用方法**:
```bash
# 添加账号
npx tsx scripts/add-x-account.ts

# 发布内容
python scripts/x_publish.py \
  --text "Hello World" \
  --images img1.jpg img2.jpg \
  --auto-publish
```

**特性**:
- ✅ 支持文本 + 图片（最多4张）
- ✅ 支持有头/无头模式
- ✅ 自动检测登录状态
- ✅ 支持多账号

### 2. Instagram - 已实现: instagrapi API

✅ **状态**: 已完成，脚本位置: `scripts/instagram_publish.py`

**实现方式**: 使用 instagrapi 库

```python
from instagrapi import Client

cl = Client()
cl.login(username, password)
cl.photo_upload("path/to/image.jpg", "Caption here")
```

**优点**:
- 不依赖浏览器
- 速度快

**缺点**:
- 账号容易被风控
- 需要处理验证码/2FA

### 3. Facebook - 已实现: facebook-sdk

✅ **状态**: 已完成，脚本位置: `scripts/facebook_publish.py`

**实现方式**: 使用官方 facebook-sdk

**使用方法**:
```bash
# 安装依赖
pip install facebook-sdk

# 添加账号
npx tsx scripts/add-facebook-account.ts

# 发布内容
python scripts/facebook_publish.py \
  --token YOUR_ACCESS_TOKEN \
  --message "Hello Facebook" \
  --photo photo.jpg
```

**获取 Access Token**:
1. 访问 https://developers.facebook.com/tools/explorer/
2. 创建应用或使用现有应用
3. 获取 User Access Token
4. 个人发布需要: `publish_posts` 权限
5. 页面发布需要: `pages_manage_posts` 权限

**特性**:
- ✅ 支持发布到个人主页或页面
- ✅ 支持文本 + 图片（最多10张）
- ✅ 支持链接分享
- ✅ 可列出管理的页面

### 4. Pinterest - 已实现: Pinterest API v5

✅ **状态**: 已完成，脚本位置: `scripts/pinterest_publish.py`

**实现方式**: 使用 Pinterest API v5

**使用方法**:
```bash
# 安装依赖
pip install requests

# 添加账号
npx tsx scripts/add-pinterest-account.ts

# 发布内容
python scripts/pinterest_publish.py \
  --token YOUR_ACCESS_TOKEN \
  --board-id BOARD_ID \
  --title "Pin Title" \
  --description "Pin description" \
  --link "https://example.com" \
  --image-url "https://example.com/image.jpg"

# 列出 Boards
python scripts/pinterest_publish.py \
  --token YOUR_ACCESS_TOKEN \
  --list-boards

# 创建 Board
python scripts/pinterest_publish.py \
  --token YOUR_ACCESS_TOKEN \
  --create-board "My New Board"

# 获取 Pin Analytics
python scripts/pinterest_publish.py \
  --token YOUR_ACCESS_TOKEN \
  --analytics PIN_ID \
  --start-date 2024-01-01 \
  --end-date 2024-01-31
```

**获取 Access Token**:
1. 访问 https://developers.pinterest.com/apps/
2. 创建应用获取 Client ID 和 Client Secret
3. OAuth 授权获取 Access Token
4. 需要权限: `boards:read`, `boards:write`, `pins:read`, `pins:write`

**特性**:
- ✅ 创建 Pin 到指定 Board
- ✅ 管理 Boards（创建、列表）
- ✅ 获取 Pin Analytics（Impressions, Saves, Clicks）
- ✅ 支持远程图片 URL
- ✅ 最佳图片比例 2:3（竖图）

### 5. Threads - 推荐方案: threads-api (非官方)

```bash
pip install threads-api
```

```python
from threads_api import ThreadsAPI

api = ThreadsAPI()
api.login(username, password)
api.publish("Hello Threads", image_path="image.jpg")
```

**注意**:
- 非官方 API，可能不稳定
- Threads 官方 API 刚开放，限制较多

---

## 现有 Skill 调研结果

### 已确认可用的 Skill

1. **baoyu-skills (jimliu/baoyu-skills)**
   - ✅ post-to-x (Twitter/X)
   - ✅ post-to-wechat (微信公众号)
   - ✅ xhs-images (小红书配图)

### 需进一步调研的 Skill

暂无发现专门支持 Instagram、Facebook、Threads 的 OpenClaw Skill。

---

## 建议实施方案

### Phase 1: X (Twitter)
**推荐**: 自建 CDP 脚本
- 技术栈与小红书一致
- 便于统一管理多账号
- 可深度定制发布逻辑

### Phase 2: Instagram
**推荐**: 使用 instagrapi
- 快速集成
- 社区成熟

### Phase 3: Facebook + Threads
**推荐**: 先用现有方案，等待更稳定的 Skill 出现

---

## 技术实现参考

### X (Twitter) 发布流程

```python
# scripts/x_publish.py

from chrome_launcher import ensure_chrome
from cdp_publish import CDPClient

class TwitterPublisher:
    COMPOSE_URL = "https://twitter.com/compose/tweet"
    
    def publish(self, text, images=None):
        # 1. 确保 Chrome 启动
        # 2. 导航到 compose 页面
        # 3. 填写文本
        # 4. 上传图片
        # 5. 点击发布
```

### X 平台特殊处理

1. **字符限制**: 280 字符（普通）/ 4000 字符（Twitter Blue）
2. **图片限制**: 最多 4 张
3. **视频限制**: 最长 2 分 20 秒
4. **反爬**: X 的反爬较强，需要模拟真实用户行为

---

## 下一步行动

1. **确认方案**: P0 X (Twitter) 使用自建 CDP 还是 baoyu-skills？
2. **调研 Instagram**: 测试 instagrapi 的稳定性
3. **等待社区**: 关注是否有新的 Threads Skill 出现
