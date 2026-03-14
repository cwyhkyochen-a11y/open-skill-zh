import { NextRequest, NextResponse } from 'next/server';
import { db, targetAccounts } from '@/lib/db';
import { eq } from 'drizzle-orm';

// GET /api/accounts/[id] - 获取账号详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const accountId = params.id;
    
    console.log('[Account Detail API] Request for account:', accountId);

    const account = await db
      .select()
      .from(targetAccounts)
      .where(eq(targetAccounts.id, accountId))
      .limit(1);

    console.log('[Account Detail API] Query result:', account);

    if (account.length === 0) {
      console.log('[Account Detail API] Account not found');
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const acc = account[0];
    
    // 手动序列化，确保所有字段都可以 JSON 化
    const result = {
      id: acc.id,
      accountType: acc.accountType,
      platform: acc.platform,
      accountName: acc.accountName,
      accountId: acc.accountId,
      homepageUrl: acc.homepageUrl,
      status: acc.status,
      authMode: acc.authMode,
      composioUserId: acc.composioUserId,
      apiConfig: acc.apiConfig,
      positioning: acc.positioning,
      targetAudience: acc.targetAudience,
      contentDirection: acc.contentDirection,
      platformConfig: acc.platformConfig,
      createdAt: acc.createdAt ? new Date(acc.createdAt).toISOString() : null,
      updatedAt: acc.updatedAt ? new Date(acc.updatedAt).toISOString() : null,
      facebookPageIds: acc.facebookPageIds || [],
      facebookDefaultPageId: acc.facebookDefaultPageId || null,
      instagramUserId: acc.instagramUserId || null,
    };

    console.log('[Account Detail API] Returning result:', result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Account Detail API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
