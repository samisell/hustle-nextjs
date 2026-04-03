import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// PUT /api/notifications/[id] - Mark single notification as read
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
    }

    if (notification.userId !== payload.userId) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const updated = await db.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ notification: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
