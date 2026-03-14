import { NextRequest, NextResponse } from 'next/server';
import { db, targetAccounts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { composioClient } from '@/lib/composio';

// GET /api/accounts/[id]/instagram-user-id - 获取 Instagram User ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const accountId = params.id;

    // 获取账号信息
    const account = await db
      .select()
      .from(targetAccounts)
      .where(eq(targetAccounts.id, accountId))
      .limit(1);

    if (account.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const acc = account[0];

    if (acc.platform !== 'instagram') {
      return NextResponse.json({ error: 'Not an Instagram account' }, { status: 400 });
    }

    if (!acc.composioUserId) {
      return NextResponse.json({ error: 'No Composio User ID' }, { status: 400 });
    }

    // 获取 connected account ID
    const connectedAccountId = await composioClient.getConnectedAccountId(
      acc.composioUserId,
      'instagram'
    );

    if (!connectedAccountId) {
      return NextResponse.json({ error: 'No active connection' }, { status: 400 });
    }

    // 调用 INSTAGRAM_GET_USER_INFO
    const result = await composioClient.executeAction(
      connectedAccountId,
      acc.composioUserId,
      'INSTAGRAM_GET_USER_INFO',
      {}
    );

    console.log('[Instagram User ID] Result:', result);

    if (!result.successful) {
      return NextResponse.json(
        { error: result.error || 'Failed to get user info' },
        { status: 500 }
      );
    }

    const userId = result.data?.id || result.data?.instagram_business_account?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'No user ID in response' },
        { status: 500 }
      );
    }

    // 更新数据库
    await db
      .update(targetAccounts)
      .set({
        instagramUserId: userId,
        updatedAt: new Date(),
      })
      .where(eq(targetAccounts.id, accountId));

    return NextResponse.json({
      success: true,
      userId: userId,
    });
  } catch (error: any) {
    console.error('[Instagram User ID] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
