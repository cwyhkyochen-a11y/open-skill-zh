# Content-Ops Console v1.4.0 - 图片上传功能测试指南

## 当前状态

### ✅ 已完成
1. 媒体上传 API (`/api/media/upload`)
2. Composio Proxy 集成
3. Twitter Media Upload API 调用
4. 前端上传流程
5. 参数验证和错误处理

### ⚠️ 已知问题
1. **前端文件对象序列化问题**
   - 问题：FileList 被序列化为 `{"0":{}}`
   - 原因：React state 序列化导致 File 对象丢失
   - 影响：无法读取文件内容

## 解决方案

### 方案 1：直接在 onChange 时上传（推荐）
在文件选择时立即上传，不存储 FileList 到 state。

### 方案 2：使用 ref 存储 FileList
使用 useRef 存储 FileList，避免序列化问题。

### 方案 3：立即转换为 base64
在 onChange 时将文件转换为 base64 字符串存储。

## 测试步骤

### 1. 纯文本发布（已验证 ✅）
```
1. 选择"文本"类型
2. 输入文字
3. 选择账号
4. 点击发布
预期：成功发布到 Twitter
```

### 2. 图文发布（待修复 ⚠️）
```
1. 选择"图文"类型
2. 上传图片
3. 输入文字
4. 选择账号
5. 点击发布
当前：图片上传失败（FileList 序列化问题）
```

## API 端点

### POST /api/media/upload
上传媒体文件到平台

**请求：**
```
Content-Type: multipart/form-data

file: File
platform: string (twitter, instagram, etc.)
userId: string (Composio User ID)
```

**响应：**
```json
{
  "mediaId": "1234567890",
  "platform": "twitter",
  "fileName": "image.png",
  "fileSize": 123456,
  "fileType": "image/png"
}
```

### POST /api/publish
发布内容到多个平台

**请求：**
```json
{
  "accountIds": ["account-id-1", "account-id-2"],
  "contentType": "text" | "image" | "video" | "link",
  "content": {
    "text": "内容文本",
    "images": ["media_id_1", "media_id_2"],  // 注意：这里应该是 media_id 数组
    "url": "https://example.com"
  }
}
```

## Composio API 调用

### Twitter Media Upload
```
Endpoint: https://upload.twitter.com/1.1/media/upload.json
Method: POST
Body: {
  "media_data": "base64_encoded_image"
}
Response: {
  "media_id_string": "1234567890"
}
```

### Twitter Create Post
```
Tool: TWITTER_CREATION_OF_A_POST
Arguments: {
  "text": "推文内容",
  "media__media__ids": ["media_id_1", "media_id_2"]
}
```

## 下一步

1. 修复前端 FileList 序列化问题
2. 实现方案 1（onChange 时立即上传）
3. 添加上传进度显示
4. 支持多图片上传
5. 添加图片预览功能

## 部署信息

- 服务器：http://14.103.210.113:3005
- 进程：PM2 管理
- 日志：`pm2 logs content-ops-console`
