import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/forum/topics/[id] - Full topic with replies
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

    const topic = await db.forumTopic.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
    }

    return NextResponse.json({ topic });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Forum Topic Detail Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/forum/topics/[id] - Update topic (author or admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.forumTopic.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
    }

    if (existing.userId !== payload.userId && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Only the author or admin can update this topic.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, tags, isLocked } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null;
    if (isLocked !== undefined && payload.role === 'admin') updateData.isLocked = isLocked;

    const topic = await db.forumTopic.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
      },
    });

    return NextResponse.json({ topic });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Forum Topic Update Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/forum/topics/[id] - Delete topic and replies (author or admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.forumTopic.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
    }

    if (existing.userId !== payload.userId && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Only the author or admin can delete this topic.' }, { status: 403 });
    }

    await db.forumReply.deleteMany({ where: { topicId: id } });
    await db.forumTopic.delete({ where: { id } });

    return NextResponse.json({ message: 'Topic deleted successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Forum Topic Delete Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
