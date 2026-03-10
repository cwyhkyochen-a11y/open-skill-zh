import { NextRequest, NextResponse } from 'next/server';
import { db, targetAccounts } from '@/lib/db';
import { eq } from 'drizzle-orm';

// GET /api/accounts/[id] - 获取单个账号
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const account = await db
      .select()
      .from(targetAccounts)
      .where(eq(targetAccounts.id, id))
      .limit(1);

    if (!account.length) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ account: account[0] });
  } catch (error) {
    console.error('Get account error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

// PUT /api/accounts/[id] - 更新账号
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates = {
      ...body,
      updatedAt: new Date(),
    };

    await db
      .update(targetAccounts)
      .set(updates)
      .where(eq(targetAccounts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounts/[id] - 删除账号
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(targetAccounts).where(eq(targetAccounts.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
