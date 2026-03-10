import { NextRequest, NextResponse } from 'next/server';
import { composioClient } from '@/lib/composio';

// POST /api/composio/authorize - 生成授权链接
export async function POST(request: NextRequest) {
  try {
    console.log('[Authorize API] Start');
    const body = await request.json();
    console.log('[Authorize API] Body:', body);
    const { entityId, platform } = body;

    if (!entityId || !platform) {
      console.log('[Authorize API] Missing fields');
      return NextResponse.json(
        { error: 'Missing entityId or platform' },
        { status: 400 }
      );
    }

    // 从请求头中获取实际的服务器地址
    const host = request.headers.get('host') || 'localhost:3005';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const callbackUrl = `${protocol}://${host}/contentops/dashboard/accounts`;
    
    console.log('[Authorize API] Callback URL:', callbackUrl);
    console.log('[Authorize API] Calling composioClient.getAuthUrl');
    const authUrl = await composioClient.getAuthUrl(entityId, platform, callbackUrl);
    console.log('[Authorize API] Auth URL:', authUrl);

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('[Authorize API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
