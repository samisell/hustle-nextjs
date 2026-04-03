import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/qa/sessions/[id] - Full session with questions
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

    const session = await db.qASession.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, name: true, avatar: true },
        },
        questions: {
          orderBy: [
            { isAnswered: 'desc' },
            { upvotes: 'desc' },
          ],
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    // Check if current user has upvoted each question
    const questionsWithVote = session.questions.map((q) => {
      let upvoterIds: string[] = [];
      try {
        upvoterIds = q.upvoterIds ? JSON.parse(q.upvoterIds) : [];
      } catch {
        upvoterIds = [];
      }
      return {
        ...q,
        upvoterIds,
        hasUpvoted: upvoterIds.includes(payload.userId),
        createdAt: q.createdAt.toISOString(),
        answeredAt: q.answeredAt?.toISOString() || null,
      };
    });

    return NextResponse.json({
      session: {
        ...session,
        scheduledAt: session.scheduledAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
        questions: questionsWithVote,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[QA Session Detail Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/qa/sessions/[id] - Update session (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.qASession.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, status, scheduledAt, duration, expertName, expertBio, expertTitle } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) {
      const validStatuses = ['upcoming', 'live', 'ended'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
      }
      updateData.status = status;
    }
    if (scheduledAt !== undefined) {
      const date = new Date(scheduledAt);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid scheduledAt date.' }, { status: 400 });
      }
      updateData.scheduledAt = date;
    }
    if (duration !== undefined) updateData.duration = duration;
    if (expertName !== undefined) updateData.expertName = expertName.trim();
    if (expertBio !== undefined) updateData.expertBio = expertBio || null;
    if (expertTitle !== undefined) updateData.expertTitle = expertTitle || null;

    const session = await db.qASession.update({
      where: { id },
      data: updateData,
      include: {
        host: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      session: {
        ...session,
        scheduledAt: session.scheduledAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[QA Session Update Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/qa/sessions/[id] - Delete session and questions (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.qASession.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    // Delete questions (cascade) then session
    await db.qAQuestion.deleteMany({ where: { sessionId: id } });
    await db.qASession.delete({ where: { id } });

    return NextResponse.json({ message: 'Session deleted successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[QA Session Delete Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
