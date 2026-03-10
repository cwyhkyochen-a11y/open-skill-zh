import { NextRequest, NextResponse } from 'next/server';
import { db, publishTasks } from '@/lib/db';
import { desc } from 'drizzle-orm';

// GET /api/publish/records - 获取发布记录
export async function GET(request: NextRequest) {
  try {
    const tasks = await db
      .select()
      .from(publishTasks)
      .orderBy(desc(publishTasks.createdAt))
      .limit(100);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Get records error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    );
  }
}
