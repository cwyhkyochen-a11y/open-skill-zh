import { NextRequest, NextResponse } from 'next/server';
import { db, targetAccounts, publishTasks } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { publishRouter } from '@/lib/publish-router';
import type { ContentTypeId } from '@/lib/content-types';

// POST /api/publish - 发布内容
export async function POST(request: NextRequest) {
  try {
    console.log('[Publish API] Start');
    const body = await request.json();
    console.log('[Publish API] Body:', JSON.stringify(body, null, 2));
    const { accountIds, contentType, content } = body;

    // 验证参数
    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      console.log('[Publish API] Invalid accountIds');
      return NextResponse.json(
        { error: 'Missing or invalid accountIds' },
        { status: 400 }
      );
    }

    if (!contentType) {
      console.log('[Publish API] Missing contentType');
      return NextResponse.json(
        { error: 'Missing contentType' },
        { status: 400 }
      );
    }

    if (!content) {
      console.log('[Publish API] Missing content');
      return NextResponse.json(
        { error: 'Missing content' },
        { status: 400 }
      );
    }

    // 获取账号信息（包括平台特定字段）
    console.log('[Publish API] Fetching accounts:', accountIds);
    const accounts = await db
      .select()
      .from(targetAccounts)
      .where(inArray(targetAccounts.id, accountIds));

    console.log('[Publish API] Found accounts:', accounts.length);

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'No valid accounts found' },
        { status: 404 }
      );
    }

    // 创建发布任务
    const taskId = randomUUID();
    const publishResults: any[] = [];

    // 对每个账号执行发布
    for (const account of accounts) {
      try {
        console.log(`[Publish API] Publishing to account: ${account.accountName} (${account.platform})`);

        // 传递完整账号信息，包括平台特定字段
        const result = await publishRouter.publish(
          {
            id: account.id,
            platform: account.platform,
            accountName: account.accountName,
            authMode: account.authMode as 'composio' | 'custom',
            composioUserId: account.composioUserId || undefined,
            apiConfig: account.apiConfig,
            facebookPageIds: account.facebookPageIds,
            facebookDefaultPageId: account.facebookDefaultPageId,
            instagramUserId: account.instagramUserId,
          },
          contentType as ContentTypeId,
          content
        );

        console.log('[Publish API] Result:', JSON.stringify(result));

        publishResults.push({
          accountId: account.id,
          accountName: account.accountName,
          platform: account.platform,
          status: result.success ? 'success' : 'failed',
          postId: result.postId,
          postUrl: result.postUrl,
          error: result.error,
        });
      } catch (error: any) {
        console.error('[Publish API] Account publish error:', error);
        publishResults.push({
          accountId: account.id,
          accountName: account.accountName,
          platform: account.platform,
          status: 'failed',
          error: error.message,
        });
      }
    }

    console.log('[Publish API] All results:', JSON.stringify(publishResults));

    // 保存发布任务记录
    const taskStatus = publishResults.every((r) => r.status === 'success')
      ? 'published'
      : publishResults.some((r) => r.status === 'success')
      ? 'partial'
      : 'failed';

    await db.insert(publishTasks).values({
      id: taskId,
      taskName: `${contentType} 发布 - ${new Date().toLocaleString()}`,
      targetAccountIds: JSON.stringify(accountIds),
      contentType: contentType,
      contentData: JSON.stringify(content),
      status: taskStatus,
      publishedAt: new Date(),
      publishResults: JSON.stringify(publishResults),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      taskId,
      results: publishResults,
      success: publishResults.filter((r) => r.status === 'success').length,
      failed: publishResults.filter((r) => r.status === 'failed').length,
    });
  } catch (error: any) {
    console.error('[Publish API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish' },
      { status: 500 }
    );
  }
}
