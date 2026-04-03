import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

// POST /api/admin/notifications/broadcast - Send notification to all users or specific users
export async function POST(req: NextRequest) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, message, type, userIds } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const validTypes = ['info', 'success', 'warning', 'error'];
    const notificationType = validTypes.includes(type) ? type : 'info';

    let targetUserIds: string[] = [];

    if (Array.isArray(userIds) && userIds.length > 0) {
      // Validate that all provided user IDs exist
      const existingUsers = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
      });
      targetUserIds = existingUsers.map((u) => u.id);
    } else {
      // Send to ALL users
      const allUsers = await db.user.findMany({
        select: { id: true },
      });
      targetUserIds = allUsers.map((u) => u.id);
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ error: 'No valid target users found.' }, { status: 400 });
    }

    // Create notifications for all target users
    const result = await db.notification.createMany({
      data: targetUserIds.map((userId) => ({
        userId,
        title: title.trim(),
        message: message.trim(),
        type: notificationType,
      })),
    });

    return NextResponse.json(
      {
        message: `Notification sent to ${result.count} user(s).`,
        count: result.count,
        type: notificationType,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Broadcast notification error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
