# Baoyu Skills 集成计划

## 集成目标
将 jimliu/baoyu-skills 的配图生成能力集成到 social-content-ops 的发布流程中。

## 集成范围

### Phase 1: 基础集成（本周）
1. **添加 baoyu-skills 依赖**
   - 在 _meta.json 中声明依赖
   - 添加安装说明到 README

2. **新增配图生成脚本**
   - `scripts/generate-xhs-images.ts` - 小红书多图生成
   - `scripts/generate-infographic.ts` - 信息图生成
   - `scripts/generate-cover.ts` - 封面图生成

3. **数据库表结构扩展**
   - `target_accounts` 表添加字段：
     - `visual_style` - 视觉风格 (cute, fresh, notion 等)
     - `layout_preference` - 布局偏好 (sparse, balanced, dense 等)
     - `image_aspect_ratio` - 图片比例 (16:9, 9:16, 1:1)

4. **发布流程增强**
   - 在 `create-publish-task.ts` 中添加配图生成选项
   - 在 `generate-content.ts` 中集成配图生成

### Phase 2: 风格模板系统（下周）
1. **风格配置管理**
   - `scripts/configure-account-style.ts` - 配置账号视觉风格
   - `scripts/list-styles.ts` - 列出可用风格

2. **批量配图生成**
   - 支持为多个发布任务批量生成配图
   - 支持 A/B 测试（同一内容生成不同风格配图）

### Phase 3: 平台扩展（后续）
1. 支持 X (Twitter) 配图生成
2. 支持微信公众号封面生成

## 技术方案

### 调用方式
通过 `npx skills run` 或直接在 Node.js 中调用 baoyu-skills 的 API。

### 文件存储结构
```
content-ops-workspace/
├── generated-images/
│   ├── xhs-images/          # 小红书多图
│   ├── infographics/        # 信息图
│   └── covers/              # 封面图
└── ...
```

### 数据库关联
- `publish_tasks` 表添加 `generated_images` JSON 字段，存储生成的图片路径
- `crawl_results` 表添加 `suggested_style` 字段，AI 推荐的风格

## 使用流程

```bash
# 1. 创建发布任务时指定需要配图
npx tsx scripts/create-publish-task.ts \
  --source-ids <note-id> \
  --target-platform xiaohongshu \
  --generate-images

# 2. 生成内容和配图
npx tsx scripts/generate-content.ts --task-id <task-id>

# 3. 查看生成的配图并确认
npx tsx scripts/review-publish-content.ts --task-id <task-id>

# 4. 发布（配图会自动上传）
npx tsx scripts/execute-publish.ts --task-id <task-id>
```

## 依赖安装

```bash
# 安装 baoyu-skills
npx skills add jimliu/baoyu-skills
```

## 注意事项

1. baoyu-skills 需要 Node.js 环境和 bun 支持
2. 图片生成依赖 AI 服务，需要配置 API key
3. 生成图片需要一定时间，考虑异步处理
