import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/notifications - Get current user's notifications
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await db.notification.count({
      where: { userId: payload.userId, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications - Mark all notifications as read
export async function PUT(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'read-all') {
      const result = await db.notification.updateMany({
        where: { userId: payload.userId, read: false },
        data: { read: true },
      });

      return NextResponse.json({ updated: result.count });
    }

    return NextResponse.json({ error: 'Invalid action. Use "read-all".' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
