#!/usr/bin/env tsx
/**
 * 添加 Pinterest 目标账号
 * 
 * 使用：
 *   npx tsx scripts/add-pinterest-account.ts
 *   npx tsx scripts/add-pinterest-account.ts --name "My Account" --token YOUR_TOKEN
 */

import { db } from '../src/db/index.js';
import { targetAccounts } from '../src/db/schema.js';
import { randomUUID } from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

interface AddPinterestOptions {
  name?: string;
  token?: string;
  boardId?: string;
  positioning?: string;
  targetAudience?: string;
  contentDirection?: string;
  visualStyle?: string;
}

async function addPinterestAccount(options: AddPinterestOptions = {}) {
  console.log('\n📌 添加 Pinterest 账号\n');
  
  // 检查依赖
  console.log('⚠️  提醒: 使用 Pinterest 发布需要先安装依赖:');
  console.log('   pip install requests\n');
  
  console.log('📋 获取 Access Token:');
  console.log('   1. 访问 https://developers.pinterest.com/apps/');
  console.log('   2. 创建应用获取 Client ID 和 Client Secret');
  console.log('   3. OAuth 授权流程获取 Access Token');
  console.log('   4. 需要权限: boards:read, boards:write, pins:read, pins:write\n');
  
  // 获取信息
  const name = options.name || await ask('Pinterest 账号名称: ');
  const username = await ask('Pinterest 用户名: ');
  const token = options.token || await ask('Access Token: ');
  const defaultBoardId = options.boardId || await ask('默认发布 Board ID (可选): ') || null;
  
  const positioning = options.positioning || await ask('账号定位: ');
  const targetAudience = options.targetAudience || await ask('目标受众: ');
  const contentDirection = options.contentDirection || await ask('内容方向: ');
  
  // 选择视觉风格
  const styles = ['cute', 'fresh', 'warm', 'bold', 'minimal', 'retro', 'pop', 'notion', 'chalkboard'];
  console.log('\n可选视觉风格:');
  styles.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  const styleIndex = parseInt(await ask('\n选择风格 (1-9，默认 2): ') || '2') - 1;
  const visualStyle = styles[styleIndex] || 'fresh';
  
  // 选择布局
  const layouts = ['sparse', 'balanced', 'dense', 'list', 'comparison', 'flow'];
  console.log('\n可选布局:');
  layouts.forEach((l, i) => console.log(`  ${i + 1}. ${l}`));
  const layoutIndex = parseInt(await ask('\n选择布局 (1-6，默认 2): ') || '2') - 1;
  const layoutPreference = layouts[layoutIndex] || 'balanced';
  
  // 创建账号
  const accountId = randomUUID();
  
  await db.insert(targetAccounts).values({
    id: accountId,
    accountType: 'target',
    platform: 'pinterest',
    accountName: name,
    accountId: username,
    homepageUrl: `https://pinterest.com/${username}`,
    status: 'active',
    apiConfig: JSON.stringify({ 
      access_token: token,
      default_board_id: defaultBoardId
    }),
    positioning,
    targetAudience,
    contentDirection,
    visualStyle,
    layoutPreference,
    imageAspectRatio: '2:3', // Pinterest 最适合竖图 2:3
    platformConfig: JSON.stringify({
      supports_boards: true,
      supports_sections: true,
      supports_analytics: true,
      max_image_size_mb: 10,
      aspect_ratios: ['2:3', '1:1', '9:16'],
      optimal_ratio: '2:3',
      rich_pins: true
    })
  });
  
  console.log('\n✅ Pinterest 账号添加成功!');
  console.log(`   ID: ${accountId}`);
  console.log(`   名称: ${name}`);
  console.log(`   风格: ${visualStyle}`);
  console.log(`   布局: ${layoutPreference}`);
  console.log(`   最佳图片比例: 2:3 (竖图)`);
  console.log('\n💡 提示:');
  console.log('   1. Token 有效期 30 天，过期后需要刷新');
  console.log('   2. 运行 pinterest_publish.py 进行发布');
  console.log('   3. 使用 --list-boards 查看可用的 Boards');
  console.log('   4. Pinterest 最适合竖图 (2:3 比例)');
  console.log(`   5. 修改风格: npx tsx scripts/configure-account-style.ts --account-id ${accountId}\n`);
  
  rl.close();
}

// 解析命令行参数
function parseArgs(): AddPinterestOptions {
  const args = process.argv.slice(2);
  const options: AddPinterestOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--name':
      case '-n':
        options.name = args[++i];
        break;
      case '--token':
      case '-t':
        options.token = args[++i];
        break;
      case '--board-id':
      case '-b':
        options.boardId = args[++i];
        break;
      case '--positioning':
        options.positioning = args[++i];
        break;
      case '--target-audience':
        options.targetAudience = args[++i];
        break;
      case '--content-direction':
        options.contentDirection = args[++i];
        break;
      case '--style':
        options.visualStyle = args[++i];
        break;
      case '--help':
        console.log(`
用法: npx tsx scripts/add-pinterest-account.ts [选项]

选项:
  -n, --name <name>              账号名称
  -t, --token <token>            Pinterest Access Token
  -b, --board-id <id>            默认发布的 Board ID
      --positioning <text>       账号定位
      --target-audience <text>   目标受众
      --content-direction <text> 内容方向
      --style <style>            视觉风格
      --help                     显示帮助

依赖安装:
  pip install requests

获取 Token:
  1. 访问 https://developers.pinterest.com/apps/
  2. 创建应用获取 Client ID 和 Client Secret
  3. OAuth 授权获取 Access Token
  4. 需要权限: boards:read, boards:write, pins:read, pins:write

最佳实践:
  - Pinterest 最适合竖图 (2:3 比例，1000x1500px)
  - 图片大小不超过 10MB
  - 使用高质量、清晰的图片
  - 添加详细的描述和关键词

示例:
  npx tsx scripts/add-pinterest-account.ts
  npx tsx scripts/add-pinterest-account.ts -n "My Account" -t YOUR_TOKEN
  npx tsx scripts/add-pinterest-account.ts -n "My Account" -t YOUR_TOKEN -b BOARD_ID
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
  await addPinterestAccount(options);
}

main().catch(console.error);
