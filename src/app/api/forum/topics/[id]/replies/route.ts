import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/forum/topics/[id]/replies - Paginated replies
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
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const topic = await db.forumTopic.findUnique({ where: { id } });
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
    }

    const [replies, total] = await Promise.all([
      db.forumReply.findMany({
        where: { topicId: id },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      db.forumReply.count({ where: { topicId: id } }),
    ]);

    return NextResponse.json({
      replies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Forum Replies List Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/forum/topics/[id]/replies - Create reply
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

    const topic = await db.forumTopic.findUnique({ where: { id } });
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
    }

    if (topic.isLocked) {
      return NextResponse.json({ error: 'This topic is locked. No new replies allowed.' }, { status: 400 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required.' }, { status: 400 });
    }

    const reply = await db.forumReply.create({
      data: {
        topicId: id,
        userId: payload.userId,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update topic replyCount and lastReplyAt
    await db.forumTopic.update({
      where: { id },
      data: {
        replyCount: { increment: 1 },
        lastReplyAt: new Date(),
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Forum Reply Create Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
