import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();
    
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'content-ops.db');
    const db = new Database(dbPath);
    
    // 获取账号信息
    const account = db.prepare('SELECT * FROM target_accounts WHERE id = ?').get(accountId) as any;
    
    if (!account) {
      db.close();
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // 检查 Composio 连接状态
    const composioApiKey = process.env.COMPOSIO_API_KEY;
    const response = await fetch(
      `https://backend.composio.dev/api/v3/connected_accounts?user_id=${account.composio_user_id}`,
      {
        headers: {
          'x-api-key': composioApiKey!,
        },
      }
    );

    if (!response.ok) {
      db.close();
      return NextResponse.json({ error: 'Failed to check Composio status' }, { status: 500 });
    }

    const data = await response.json();
    const connectedAccount = data.items?.find((item: any) => 
      item.toolkit?.slug === account.platform && item.status === 'ACTIVE'
    );

    // 更新状态
    const newStatus = connectedAccount ? 'active' : 'pending';
    
    db.prepare(`
      UPDATE target_accounts 
      SET status = ?, updated_at = ? 
      WHERE id = ?
    `).run(newStatus, Math.floor(Date.now() / 1000), accountId);

    // 返回更新后的账号信息
    const updatedAccount = db.prepare('SELECT * FROM target_accounts WHERE id = ?').get(accountId);
    
    db.close();

    return NextResponse.json({
      success: true,
      account: updatedAccount,
      composioStatus: connectedAccount ? 'ACTIVE' : 'NOT_FOUND',
    });
  } catch (error: any) {
    console.error('[Refresh Account] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
