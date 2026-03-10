import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), '.env.local');

// GET /api/settings/composio - 获取当前配置
export async function GET() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return NextResponse.json({ configured: false });
    }

    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const apiKeyMatch = content.match(/COMPOSIO_API_KEY=(.+)/);
    const authConfigIdMatch = content.match(/COMPOSIO_AUTH_CONFIG_ID=(.+)/);
    
    if (apiKeyMatch && apiKeyMatch[1] && apiKeyMatch[1] !== 'your_composio_api_key_here') {
      return NextResponse.json({
        configured: true,
        apiKey: apiKeyMatch[1],
        authConfigId: authConfigIdMatch ? authConfigIdMatch[1] : '',
      });
    }

    return NextResponse.json({ configured: false });
  } catch (error) {
    console.error('Get config error:', error);
    return NextResponse.json({ configured: false });
  }
}

// POST /api/settings/composio - 保存配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, authConfigId } = body;

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        { error: 'API Key is required' },
        { status: 400 }
      );
    }

    // 读取现有配置
    let content = '';
    if (fs.existsSync(CONFIG_FILE)) {
      content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    }

    // 更新或添加 API Key
    if (content.includes('COMPOSIO_API_KEY=')) {
      content = content.replace(
        /COMPOSIO_API_KEY=.*/,
        `COMPOSIO_API_KEY=${apiKey.trim()}`
      );
    } else {
      content += `\nCOMPOSIO_API_KEY=${apiKey.trim()}\n`;
    }

    // 更新或添加 Auth Config ID
    if (authConfigId && authConfigId.trim()) {
      if (content.includes('COMPOSIO_AUTH_CONFIG_ID=')) {
        content = content.replace(
          /COMPOSIO_AUTH_CONFIG_ID=.*/,
          `COMPOSIO_AUTH_CONFIG_ID=${authConfigId.trim()}`
        );
      } else {
        content += `COMPOSIO_AUTH_CONFIG_ID=${authConfigId.trim()}\n`;
      }
    }

    // 确保有数据库路径配置
    if (!content.includes('DATABASE_PATH=')) {
      content += 'DATABASE_PATH=../../content-ops.db\n';
    }

    // 写入文件
    fs.writeFileSync(CONFIG_FILE, content, 'utf-8');

    // 更新环境变量（仅在当前进程中生效）
    process.env.COMPOSIO_API_KEY = apiKey.trim();
    if (authConfigId && authConfigId.trim()) {
      process.env.COMPOSIO_AUTH_CONFIG_ID = authConfigId.trim();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save config error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save config' },
      { status: 500 }
    );
  }
}
