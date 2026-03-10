import { NextRequest, NextResponse } from 'next/server';
import { db, adminUsers } from '@/lib/db';
import { randomUUID } from 'crypto';
import { hashPassword } from '@/lib/auth';

// GET /api/admin/users - 获取用户列表
export async function GET() {
  try {
    const users = await db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - 创建用户（删除旧用户，只保留最后一个）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少为 6 位' },
        { status: 400 }
      );
    }

    // 删除所有现有用户（只保留最后一个）
    await db.delete(adminUsers);

    // 创建新用户
    const passwordHash = await hashPassword(password);
    const newUser = {
      id: randomUUID(),
      username,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(adminUsers).values(newUser);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
      },
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
