import { NextRequest, NextResponse } from 'next/server';
import { composioClient } from '@/lib/composio';
import { db, targetAccounts } from '@/lib/db';
import { eq } from 'drizzle-orm';

// POST /api/composio/check - 检查授权状态
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityId, platform, accountId } = body;

    if (!entityId || !platform) {
      return NextResponse.json(
        { error: 'Missing entityId or platform' },
        { status: 400 }
      );
    }

    const connected = await composioClient.checkConnection(entityId, platform);

    // 如果提供了 accountId，更新数据库状态
    if (accountId && connected) {
      await db
        .update(targetAccounts)
        .set({
          status: 'active',
          updatedAt: new Date(),
        })
        .where(eq(targetAccounts.id, accountId));
    }

    return NextResponse.json({
      connected,
      status: connected ? 'active' : 'pending',
    });
  } catch (error: any) {
    console.error('Check connection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check connection' },
      { status: 500 }
    );
  }
}
