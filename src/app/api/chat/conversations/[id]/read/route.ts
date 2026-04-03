import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/chat/conversations/[id]/read - Mark all messages as read
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is a member
    const membership = await db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: payload.userId } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this conversation.' }, { status: 403 });
    }

    // Mark all unread messages (not from current user) as read
    const result = await db.chatMessage.updateMany({
      where: {
        conversationId: id,
        isRead: false,
        userId: { not: payload.userId },
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      message: 'Messages marked as read.',
      markedCount: result.count,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Chat Mark Read Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
