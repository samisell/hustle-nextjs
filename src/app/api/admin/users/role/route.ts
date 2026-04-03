import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  return handleRoleUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleRoleUpdate(req);
}

async function handleRoleUpdate(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role || !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid user ID or role.' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
