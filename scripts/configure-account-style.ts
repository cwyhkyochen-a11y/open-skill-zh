#!/usr/bin/env tsx
/**
 * 账号视觉风格配置脚本
 * 
 * 功能：配置 target_account 的视觉风格、布局偏好和图片比例
 * 
 * 使用：
 *   npx tsx scripts/configure-account-style.ts --account-id <id>
 *   npx tsx scripts/configure-account-style.ts --account-id <id> --style cute --layout list
 *   npx tsx scripts/configure-account-style.ts --list-styles
 */

import { db } from '../src/db/index.js';
import { eq } from 'drizzle-orm';
import { targetAccounts } from '../src/db/schema.js';

// baoyu-skills 支持的风格及其说明
const STYLES = {
  cute: { name: '可爱', desc: '卡通风格，适合萌系内容', emoji: '🎀' },
  fresh: { name: '清新', desc: '明亮清爽，适合生活方式', emoji: '🌿' },
  warm: { name: '温暖', desc: '柔和色调，适合情感内容', emoji: '🌅' },
  bold: { name: '大胆', desc: '高对比度，适合潮流时尚', emoji: '🔥' },
  minimal: { name: '极简', desc: '简洁干净，适合知识分享', emoji: '⬜' },
  retro: { name: '复古', desc: '怀旧风格，适合文化历史', emoji: '📻' },
  pop: { name: '流行', desc: '鲜艳活泼，适合年轻群体', emoji: '🎨' },
  notion: { name: 'Notion', desc: '简洁文档风，适合笔记类', emoji: '📝' },
  chalkboard: { name: '黑板', desc: '粉笔字风格，适合教育', emoji: '📚' }
};

// 布局选项
const LAYOUTS = {
  sparse: { name: '稀疏', desc: '1-2个要点，适合封面/金句', emoji: '1️⃣' },
  balanced: { name: '平衡', desc: '3-4个要点，常规内容', emoji: '3️⃣' },
  dense: { name: '密集', desc: '5-8个要点，知识卡片', emoji: '5️⃣' },
  list: { name: '列表', desc: '4-7项，清单/排行', emoji: '📋' },
  comparison: { name: '对比', desc: '双栏对比，优劣分析', emoji: '⚖️' },
  flow: { name: '流程', desc: '3-6步，流程/时间线', emoji: '🔄' }
};

// 图片比例
const ASPECT_RATIOS = {
  '9:16': { name: '竖屏', desc: '小红书/抖音/Instagram Stories', emoji: '📱' },
  '16:9': { name: '横屏', desc: 'YouTube/B站/微博', emoji: '💻' },
  '1:1': { name: '方形', desc: 'Instagram Feed/微信朋友圈', emoji: '⬜' },
  '2.35:1': { name: '宽屏', desc: '电影感封面', emoji: '🎬' }
};

interface ConfigureOptions {
  accountId?: string;
  style?: string;
  layout?: string;
  aspectRatio?: string;
  listStyles?: boolean;
  listAll?: boolean;
}

async function listStyles() {
  console.log('\n🎨 可用视觉风格:\n');
  Object.entries(STYLES).forEach(([key, info]) => {
    console.log(`  ${info.emoji} ${key.padEnd(12)} - ${info.name.padEnd(8)} | ${info.desc}`);
  });
  
  console.log('\n📐 可用布局:\n');
  Object.entries(LAYOUTS).forEach(([key, info]) => {
    console.log(`  ${info.emoji} ${key.padEnd(12)} - ${info.name.padEnd(8)} | ${info.desc}`);
  });
  
  console.log('\n📏 可用图片比例:\n');
  Object.entries(ASPECT_RATIOS).forEach(([key, info]) => {
    console.log(`  ${info.emoji} ${key.padEnd(12)} - ${info.name.padEnd(8)} | ${info.desc}`);
  });
  
  console.log('');
}

async function listAllAccounts() {
  console.log('\n📋 所有被运营账号:\n');
  
  const accounts = await db.query.targetAccounts.findMany({
    orderBy: (accounts, { asc }) => [asc(accounts.platform), asc(accounts.accountName)]
  });
  
  if (accounts.length === 0) {
    console.log('  暂无账号，请先运行 add-reddit-account.ts 或 add-xhs-account.ts 添加账号\n');
    return;
  }
  
  console.log('ID                                   | 平台      | 账号名称        | 风格    | 布局     | 比例');
  console.log('-'.repeat(100));
  
  accounts.forEach(acc => {
    const style = acc.visualStyle || 'cute';
    const layout = acc.layoutPreference || 'balanced';
    const ratio = acc.imageAspectRatio || '9:16';
    
    console.log(
      `${acc.id.substring(0, 36)} | ${acc.platform.padEnd(9)} | ${acc.accountName.padEnd(15)} | ` +
      `${style.padEnd(7)} | ${layout.padEnd(8)} | ${ratio}`
    );
  });
  
  console.log('');
}

async function configureAccount(options: ConfigureOptions) {
  if (options.listStyles) {
    await listStyles();
    return;
  }
  
  if (options.listAll || !options.accountId) {
    await listAllAccounts();
    return;
  }
  
  // 获取账号
  const account = await db.query.targetAccounts.findFirst({
    where: eq(targetAccounts.id, options.accountId)
  });
  
  if (!account) {
    console.error(`\n❌ 未找到账号: ${options.accountId}`);
    console.error('   使用 --list-all 查看所有账号\n');
    process.exit(1);
  }
  
  console.log('\n📋 账号信息:');
  console.log(`   名称: ${account.accountName}`);
  console.log(`   平台: ${account.platform}`);
  console.log(`   当前风格: ${account.visualStyle || 'cute (默认)'}`);
  console.log(`   当前布局: ${account.layoutPreference || 'balanced (默认)'}`);
  console.log(`   当前比例: ${account.imageAspectRatio || '9:16 (默认)'}\n`);
  
  // 验证并设置新值
  const updates: Partial<typeof account> = {};
  
  if (options.style) {
    if (!STYLES[options.style as keyof typeof STYLES]) {
      console.error(`❌ 无效的风格: ${options.style}`);
      console.error('   使用 --list-styles 查看可用风格\n');
      process.exit(1);
    }
    updates.visualStyle = options.style;
    console.log(`✅ 风格设置为: ${STYLES[options.style as keyof typeof STYLES].emoji} ${options.style}`);
  }
  
  if (options.layout) {
    if (!LAYOUTS[options.layout as keyof typeof LAYOUTS]) {
      console.error(`❌ 无效的布局: ${options.layout}`);
      console.error('   使用 --list-styles 查看可用布局\n');
      process.exit(1);
    }
    updates.layoutPreference = options.layout;
    console.log(`✅ 布局设置为: ${LAYOUTS[options.layout as keyof typeof LAYOUTS].emoji} ${options.layout}`);
  }
  
  if (options.aspectRatio) {
    if (!ASPECT_RATIOS[options.aspectRatio as keyof typeof ASPECT_RATIOS]) {
      console.error(`❌ 无效的比例: ${options.aspectRatio}`);
      console.error('   使用 --list-styles 查看可用比例\n');
      process.exit(1);
    }
    updates.imageAspectRatio = options.aspectRatio;
    console.log(`✅ 比例设置为: ${ASPECT_RATIOS[options.aspectRatio as keyof typeof ASPECT_RATIOS].emoji} ${options.aspectRatio}`);
  }
  
  if (Object.keys(updates).length === 0) {
    console.log('ℹ️  未提供任何更新参数，使用 --help 查看帮助\n');
    return;
  }
  
  // 更新数据库
  await db.update(targetAccounts)
    .set(updates)
    .where(eq(targetAccounts.id, options.accountId));
  
  console.log('\n💾 配置已保存！\n');
  
  // 显示配置建议
  console.log('💡 建议:');
  console.log('   1. 创建发布任务时，配图将自动使用这些风格设置');
  console.log('   2. 也可以在 generate-images.ts 中临时覆盖风格');
  console.log(`   3. 测试生成: npx tsx scripts/generate-images.ts --task-id <任务ID>\n`);
}

// 解析命令行参数
function parseArgs(): ConfigureOptions {
  const args = process.argv.slice(2);
  const options: ConfigureOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--account-id':
        options.accountId = args[++i];
        break;
      case '--style':
        options.style = args[++i];
        break;
      case '--layout':
        options.layout = args[++i];
        break;
      case '--aspect-ratio':
      case '--aspect':
        options.aspectRatio = args[++i];
        break;
      case '--list-styles':
        options.listStyles = true;
        break;
      case '--list-all':
        options.listAll = true;
        break;
      case '--help':
        console.log(`
用法: npx tsx scripts/configure-account-style.ts [选项]

功能: 配置被运营账号的视觉风格、布局偏好和图片比例

选项:
  --account-id <id>      账号ID (必填，除非使用 --list-*)
  --style <style>        设置视觉风格
  --layout <layout>      设置布局偏好
  --aspect-ratio <ratio> 设置图片比例 (9:16|16:9|1:1|2.35:1)
  --list-styles          列出所有可用的风格、布局和比例
  --list-all             列出所有账号及其当前配置
  --help                 显示帮助

示例:
  # 查看所有可用风格
  npx tsx scripts/configure-account-style.ts --list-styles

  # 查看所有账号配置
  npx tsx scripts/configure-account-style.ts --list-all

  # 配置单个账号
  npx tsx scripts/configure-account-style.ts --account-id abc-123 --style cute --layout list

  # 只修改风格
  npx tsx scripts/configure-account-style.ts --account-id abc-123 --style notion
        `);
        process.exit(0);
        break;
    }
  }
  
  return options;
}

// 主函数
async function main() {
  const options = parseArgs();
  await configureAccount(options);
}

main().catch(console.error);
