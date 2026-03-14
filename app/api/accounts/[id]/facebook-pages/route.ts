import { NextRequest, NextResponse } from 'next/server';
import { db, targetAccounts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { composioClient } from '@/lib/composio';

// GET /api/accounts/[id]/facebook-pages - 获取 Facebook Page IDs
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const accountId = params.id;

    const account = await db
      .select()
      .from(targetAccounts)
      .where(eq(targetAccounts.id, accountId))
      .limit(1);

    if (account.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const acc = account[0];

    // 如果已有 page ID，直接返回
    let pageIds = acc.facebookPageIds;
    if (typeof pageIds === 'string') {
      try { pageIds = JSON.parse(pageIds as string); } catch { pageIds = []; }
    }
    
    if (Array.isArray(pageIds) && pageIds.length > 0) {
      return NextResponse.json({
        pageIds,
        defaultPageId: acc.facebookDefaultPageId,
      });
    }

    // 否则尝试从 Composio 获取
    if (acc.platform !== 'facebook' || !acc.composioUserId) {
      return NextResponse.json({
        pageIds: [],
        defaultPageId: null,
      });
    }

    const connectedAccountId = await composioClient.getConnectedAccountId(
      acc.composioUserId,
      'facebook'
    );

    if (!connectedAccountId) {
      return NextResponse.json({
        pageIds: [],
        defaultPageId: null,
        error: 'No active Facebook connection',
      });
    }

    // 调用 FACEBOOK_GET_USER_PAGES
    const result = await composioClient.executeAction(
      connectedAccountId,
      acc.composioUserId,
      'FACEBOOK_GET_USER_PAGES',
      {}
    );

    console.log('[Facebook Pages] GET_USER_PAGES result:', JSON.stringify(result));

    if (!result.successful) {
      return NextResponse.json(
        { error: result.error || 'Failed to get user pages', pageIds: [], defaultPageId: null },
        { status: 500 }
      );
    }

    const pages = result.data?.data || [];
    const fetchedPageIds = pages.map((p: any) => p.id);
    const defaultPageId = fetchedPageIds[0] || null;

    // 保存到数据库
    if (fetchedPageIds.length > 0) {
      await db
        .update(targetAccounts)
        .set({
          facebookPageIds: fetchedPageIds,
          facebookDefaultPageId: defaultPageId,
          updatedAt: new Date(),
        })
        .where(eq(targetAccounts.id, accountId));
    }

    return NextResponse.json({
      success: true,
      pageIds: fetchedPageIds,
      pages: pages.map((p: any) => ({ id: p.id, name: p.name })),
      defaultPageId,
    });
  } catch (error: any) {
    console.error('[Facebook Pages] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/accounts/[id]/facebook-pages - 更新 Facebook Page IDs
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const accountId = params.id;
    const body = await request.json();
    const { pageIds, defaultPageId } = body;

    if (!Array.isArray(pageIds)) {
      return NextResponse.json({ error: 'pageIds must be an array' }, { status: 400 });
    }

    // 验证 defaultPageId 在 pageIds 中
    if (defaultPageId && !pageIds.includes(defaultPageId)) {
      return NextResponse.json(
        { error: 'defaultPageId must be in pageIds' },
        { status: 400 }
      );
    }

    // 更新数据库
    await db
      .update(targetAccounts)
      .set({
        facebookPageIds: pageIds,
        facebookDefaultPageId: defaultPageId || null,
        updatedAt: new Date(),
      })
      .where(eq(targetAccounts.id, accountId));

    return NextResponse.json({
      success: true,
      pageIds,
      defaultPageId,
    });
  } catch (error: any) {
    console.error('[Facebook Pages] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
