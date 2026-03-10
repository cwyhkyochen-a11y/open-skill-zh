# Composio 平台工具配置验证

## 已验证的平台

### ✅ Twitter
- **工具名称**: `TWITTER_CREATION_OF_A_POST`
- **主要参数**:
  - `text` (string): 推文内容，最多 280 字符
  - `media__media__ids` (array): 媒体 ID 数组（最多 4 个）
  - `reply__in__reply__to__tweet__id` (string): 回复的推文 ID
  - `quote_tweet_id` (string): 引用的推文 ID
- **当前实现**: ✅ 正确
  ```typescript
  {
    text: content.text,
    media: content.images || content.video,
  }
  ```

### ⚠️ Instagram
- **工具名称**: 
  - 图片: `INSTAGRAM_CREATE_POST`
  - 视频: `INSTAGRAM_CREATE_REEL`
- **需要验证**: 参数格式
- **当前实现**:
  ```typescript
  {
    caption: content.text,
    image: content.images?.[0],
    video: content.video,
  }
  ```

### ⚠️ YouTube
- **工具名称**: `YOUTUBE_UPLOAD_VIDEO`
- **需要验证**: 参数格式
- **当前实现**:
  ```typescript
  {
    title: content.title,
    description: content.description,
    video: content.video,
    tags: content.tags,
  }
  ```

### ⚠️ Facebook
- **工具名称**: `FACEBOOK_CREATE_POST`
- **需要验证**: 参数格式
- **当前实现**:
  ```typescript
  {
    message: content.text,
    media: content.images || content.video,
    link: content.url,
  }
  ```

### ⚠️ LinkedIn
- **工具名称**: 
  - 文本/图片/视频: `LINKEDIN_CREATE_POST`
  - 链接: `LINKEDIN_SHARE_LINK`
- **需要验证**: 参数格式
- **当前实现**:
  ```typescript
  {
    text: content.text,
    media: content.images || content.video,
    url: content.url,
    title: content.title,
  }
  ```

### ⚠️ Reddit
- **工具名称**: 
  - 文本: `REDDIT_SUBMIT_POST`
  - 链接: `REDDIT_SUBMIT_LINK`
- **需要验证**: 参数格式
- **当前实现**:
  ```typescript
  {
    title: content.title || content.text,
    text: content.text,
    url: content.url,
    subreddit: content.subreddit,
  }
  ```

### ⚠️ Discord
- **工具名称**: `DISCORD_SEND_MESSAGE`
- **需要验证**: 参数格式
- **当前实现**:
  ```typescript
  {
    content: content.text,
    channel_id: content.channel_id,
  }
  ```

## 验证步骤

1. 查询工具列表：
   ```bash
   curl "https://backend.composio.dev/api/v3/tools?toolkit_slug=PLATFORM" \
     -H "x-api-key: YOUR_API_KEY"
   ```

2. 查询工具详情：
   ```bash
   curl "https://backend.composio.dev/api/v3/tools/TOOL_SLUG" \
     -H "x-api-key: YOUR_API_KEY"
   ```

3. 检查参数：
   - `input_parameters.properties`: 所有可用参数
   - `input_parameters.required`: 必需参数

## 注意事项

1. **参数命名**: Composio 使用双下划线 `__` 表示嵌套对象
   - 例如：`media__media__ids` 表示 `media.media_ids`

2. **必需参数**: 
   - Twitter: `text` 是可选的（如果提供了媒体或其他内容）
   - 其他平台需要验证

3. **执行工具时必需**:
   - `connected_account_id`: 连接账号 ID
   - `user_id`: 用户 ID
   - `arguments`: 工具参数对象

## 下一步

- [ ] 验证 Instagram 工具参数
- [ ] 验证 YouTube 工具参数
- [ ] 验证 Facebook 工具参数
- [ ] 验证 LinkedIn 工具参数
- [ ] 验证 Reddit 工具参数
- [ ] 验证 Discord 工具参数
- [ ] 更新 `formatContentForComposio` 方法以匹配实际参数
