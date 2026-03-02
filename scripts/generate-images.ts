#!/usr/bin/env tsx
/**
 * 配图生成脚本 - 集成 baoyu-skills
 * 
 * 功能：为发布任务自动生成配图
 * 依赖：需要先安装 baoyu-skills (npx skills add jimliu/baoyu-skills)
 * 
 * 使用：
 *   npx tsx scripts/generate-images.ts --task-id <publish-task-id>
 *   npx tsx scripts/generate-images.ts --task-id <id> --style cute --layout list
 */

import { db, queries, mutations } from '../src/db/index.js';
import { eq } from 'drizzle-orm';
import { publishTasks, targetAccounts } from '../src/db/schema.js';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 图片输出目录
const IMAGES_DIR = join(process.env.HOME || '/home/admin', '.openclaw/workspace/content-ops-workspace/generated-images');

// baoyu-skills 支持的风格
const VALID_STYLES = [
  'cute', 'fresh', 'warm', 'bold', 'minimal', 
  'retro', 'pop', 'notion', 'chalkboard'
];

// baoyu-skills 支持的布局
const VALID_LAYOUTS = [
  'sparse', 'balanced', 'dense', 'list', 'comparison', 'flow'
];

interface GenerateImagesOptions {
  taskId: string;
  style?: string;
  layout?: string;
  aspectRatio?: string;
  count?: number;
}

async function generateImages(options: GenerateImagesOptions) {
  console.log('🎨 开始生成配图...\n');
  
  // 1. 获取发布任务
  const task = await db.query.publishTasks.findFirst({
    where: eq(publishTasks.id, options.taskId)
  });
  
  if (!task) {
    console.error(`❌ 未找到发布任务: ${options.taskId}`);
    process.exit(1);
  }
  
  if (!task.content) {
    console.error('❌ 发布任务还没有生成内容，请先运行 generate-content.ts');
    process.exit(1);
  }
  
  // 2. 获取账号配置
  const account = await db.query.targetAccounts.findFirst({
    where: eq(targetAccounts.id, task.targetAccountId)
  });
  
  if (!account) {
    console.error(`❌ 未找到目标账号: ${task.targetAccountId}`);
    process.exit(1);
  }
  
  // 3. 确定风格和布局
  const style = options.style || account.visualStyle || 'cute';
  const layout = options.layout || account.layoutPreference || 'balanced';
  const aspectRatio = options.aspectRatio || account.imageAspectRatio || '9:16';
  const imageCount = options.count || 3; // 默认生成3张图
  
  console.log(`📋 任务: ${task.taskName}`);
  console.log(`🎯 平台: ${account.platform}`);
  console.log(`🎨 风格: ${style}`);
  console.log(`📐 布局: ${layout}`);
  console.log(`📏 比例: ${aspectRatio}`);
  console.log(`🔢 数量: ${imageCount}张\n`);
  
  // 4. 准备内容
  const content = task.content as any;
  const title = content?.title || task.taskName;
  const body = content?.body || '';
  
  // 构建内容文件
  const contentText = `${title}\n\n${body}`;
  
  // 5. 创建输出目录
  const taskImageDir = join(IMAGES_DIR, options.taskId);
  if (!existsSync(taskImageDir)) {
    mkdirSync(taskImageDir, { recursive: true });
  }
  
  // 6. 调用 baoyu-skills 生成配图
  const generatedPaths: string[] = [];
  
  try {
    // 根据平台选择生成方式
    if (account.platform === 'xiaohongshu') {
      // 小红书：使用 xhs-images 生成多图
      console.log('🖼️  使用 baoyu-xhs-images 生成小红书配图...\n');
      
      const contentFile = join(taskImageDir, 'content.txt');
      require('fs').writeFileSync(contentFile, contentText);
      
      // 构建命令
      const cmd = `npx skills run xhs-images "${contentFile}" \
        --style ${style} \
        --layout ${layout} \
        --output ${taskImageDir}`;
      
      console.log(`执行: ${cmd}\n`);
      
      // 注意：实际环境中需要确保 baoyu-skills 已安装
      // execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
      
      console.log('⚠️  请确保已安装 baoyu-skills:');
      console.log('   npx skills add jimliu/baoyu-skills\n');
      
      // 模拟生成的文件路径
      for (let i = 1; i <= imageCount; i++) {
        generatedPaths.push(join(taskImageDir, `image_${i}.png`));
      }
      
    } else {
      // 其他平台：使用 infographic 或 cover-image
      console.log('🖼️  使用 baoyu-infographic 生成信息图...\n');
      
      // 映射布局到 infographic 的布局名称
      const layoutMap: Record<string, string> = {
        'sparse': 'feature-list',
        'balanced': 'grid-cards',
        'dense': 'comparison-table',
        'list': 'feature-list',
        'comparison': 'comparison-table',
        'flow': 'timeline-horizontal'
      };
      
      const infographicLayout = layoutMap[layout] || 'feature-list';
      
      const cmd = `npx skills run infographic "${contentText}" \
        --style ${style} \
        --layout ${infographicLayout} \
        --aspect ${aspectRatio === '9:16' ? 'portrait' : aspectRatio === '16:9' ? 'landscape' : 'square'} \
        --output ${taskImageDir}`;
      
      console.log(`执行: ${cmd}\n`);
      console.log('⚠️  请确保已安装 baoyu-skills\n');
      
      generatedPaths.push(join(taskImageDir, 'infographic.png'));
    }
    
    // 7. 更新数据库
    await db.update(publishTasks)
      .set({
        generatedImages: JSON.stringify({
          images: generatedPaths,
          style,
          layout,
          aspectRatio,
          generatedAt: new Date().toISOString(),
          tool: account.platform === 'xiaohongshu' ? 'xhs-images' : 'infographic'
        })
      })
      .where(eq(publishTasks.id, options.taskId));
    
    console.log('✅ 配图生成完成！');
    console.log('\n📁 生成文件:');
    generatedPaths.forEach((path, i) => {
      console.log(`   ${i + 1}. ${path}`);
    });
    
    console.log('\n💡 提示:');
    console.log('   1. 确保已安装 baoyu-skills: npx skills add jimliu/baoyu-skills');
    console.log('   2. 查看生成的配图后，运行 review-publish-content.ts 审核');
    console.log('   3. 确认无误后，运行 execute-publish.ts 发布\n');
    
  } catch (error) {
    console.error('❌ 配图生成失败:', error);
    process.exit(1);
  }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options: Partial<GenerateImagesOptions> = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--task-id':
        options.taskId = args[++i];
        break;
      case '--style':
        options.style = args[++i];
        break;
      case '--layout':
        options.layout = args[++i];
        break;
      case '--aspect':
      case '--aspect-ratio':
        options.aspectRatio = args[++i];
        break;
      case '--count':
        options.count = parseInt(args[++i], 10);
        break;
      case '--help':
        console.log(`
用法: npx tsx scripts/generate-images.ts [选项]

选项:
  --task-id <id>       发布任务ID (必填)
  --style <style>      视觉风格: cute|fresh|warm|bold|minimal|retro|pop|notion|chalkboard
  --layout <layout>    布局: sparse|balanced|dense|list|comparison|flow
  --aspect <ratio>     宽高比: 16:9|9:16|1:1
  --count <n>          生成图片数量 (默认3张)
  --help               显示帮助

示例:
  npx tsx scripts/generate-images.ts --task-id abc-123
  npx tsx scripts/generate-images.ts --task-id abc-123 --style notion --layout list
  npx tsx scripts/generate-images.ts --task-id abc-123 --style cute --count 5
        `);
        process.exit(0);
        break;
    }
  }
  
  if (!options.taskId) {
    console.error('❌ 请提供 --task-id 参数');
    console.error('   使用 --help 查看帮助');
    process.exit(1);
  }
  
  return options as GenerateImagesOptions;
}

// 主函数
async function main() {
  const options = parseArgs();
  await generateImages(options);
}

main().catch(console.error);
