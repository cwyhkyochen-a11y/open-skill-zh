import { NextRequest, NextResponse } from 'next/server';
import { composioClient } from '@/lib/composio';

// POST /api/settings/composio/test - 测试 API Key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { apiKey } = body;

    // 如果没有提供 apiKey，使用环境变量中的
    const keyToTest = apiKey || process.env.COMPOSIO_API_KEY;

    if (!keyToTest) {
      return NextResponse.json(
        { error: '请先保存 API Key' },
        { status: 400 }
      );
    }

    console.log('[Test API] Testing Composio API Key...');
    
    // 创建临时客户端使用用户提供的 API Key
    const { ComposioClient } = await import('@/lib/composio');
    const testClient = new ComposioClient(keyToTest);
    
    try {
      // 尝试获取 auth configs 来验证 API Key
      const authConfigs = await testClient.getAuthConfigs();
      
      console.log('[Test API] API Key valid, found', authConfigs.length, 'auth configs');
      
      return NextResponse.json({
        success: true,
        message: 'API Key 有效',
        authConfigsCount: authConfigs.length,
      });
    } catch (error: any) {
      console.error('[Test API] API Key test failed:', error.message);
      
      // 如果是认证错误，说明 API Key 无效
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized') || error.message.includes('Invalid API key')) {
        return NextResponse.json(
          { error: 'API Key 无效或已过期' },
          { status: 401 }
        );
      }
      
      // 其他错误可能是网络问题或 API 限制
      return NextResponse.json(
        { error: error.message || 'API 调用失败' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Test API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to test API Key' },
      { status: 500 }
    );
  }
}
