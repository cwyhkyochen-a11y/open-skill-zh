import { NextRequest, NextResponse } from 'next/server';
import { db, targetAccounts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// GET /api/accounts - 获取所有账号
export async function GET() {
  try {
    const accounts = await db.select().from(targetAccounts);
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// POST /api/accounts - 创建新账号
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountName, platform, authMode, composioUserId } = body;

    if (!accountName || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newAccount = {
      id: randomUUID(),
      accountName,
      platform,
      authMode: authMode || 'composio',
      composioUserId: composioUserId || `${platform}_${accountName}_${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(targetAccounts).values(newAccount);

    return NextResponse.json({ account: newAccount }, { status: 201 });
  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
