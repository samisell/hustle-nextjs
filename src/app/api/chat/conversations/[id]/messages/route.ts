import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/chat/conversations/[id]/messages - Paginated messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is a member of the conversation
    const membership = await db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: payload.userId } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this conversation.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const before = searchParams.get('before');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { conversationId: id };
    if (before) {
      const beforeMessage = await db.chatMessage.findUnique({ where: { id: before } });
      if (beforeMessage) {
        where.createdAt = { lt: beforeMessage.createdAt };
      }
    }

    const [messages, total] = await Promise.all([
      db.chatMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      db.chatMessage.count({ where: { conversationId: id } }),
    ]);

    // Mark fetched messages as read (messages not from current user)
    const messageIdsToMark = messages
      .filter((m) => m.userId !== payload.userId && !m.isRead)
      .map((m) => m.id);

    if (messageIdsToMark.length > 0) {
      await db.chatMessage.updateMany({
        where: { id: { in: messageIdsToMark } },
        data: { isRead: true },
      });
    }

    // Reverse for display (oldest first)
    const orderedMessages = messages.reverse().map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      userId: m.userId,
      content: m.content,
      isRead: m.userId === payload.userId ? true : m.isRead,
      createdAt: m.createdAt.toISOString(),
      author: m.author,
    }));

    return NextResponse.json({
      messages: orderedMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Chat Messages List Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/chat/conversations/[id]/messages - Send message
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

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required.' }, { status: 400 });
    }

    const message = await db.chatMessage.create({
      data: {
        conversationId: id,
        userId: payload.userId,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update conversation lastMessageAt
    await db.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        conversationId: message.conversationId,
        userId: message.userId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
        author: message.author,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Chat Message Create Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
