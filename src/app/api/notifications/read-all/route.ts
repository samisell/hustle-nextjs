import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Support both PUT and POST for mark-all-read (frontend sends POST)
export async function PUT(req: NextRequest) {
  return handleMarkAllRead(req);
}

export async function POST(req: NextRequest) {
  return handleMarkAllRead(req);
}

async function handleMarkAllRead(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.notification.updateMany({
      where: { userId: payload.userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
