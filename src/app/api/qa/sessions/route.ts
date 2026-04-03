import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/qa/sessions - List QA sessions
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (statusFilter && ['upcoming', 'live', 'ended'].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const sessions = await db.qASession.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        host: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    // Check if current user has submitted a question for each session
    const sessionIds = sessions.map((s) => s.id);
    const userQuestions = await db.qAQuestion.findMany({
      where: {
        sessionId: { in: sessionIds },
        userId: payload.userId,
      },
      select: { sessionId: true },
    });
    const questionSessionIds = new Set(userQuestions.map((q) => q.sessionId));

    const result = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      expertName: s.expertName,
      expertBio: s.expertBio,
      expertTitle: s.expertTitle,
      scheduledAt: s.scheduledAt.toISOString(),
      duration: s.duration,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      host: s.host,
      questionCount: s._count.questions,
      hasUserQuestion: questionSessionIds.has(s.id),
    }));

    return NextResponse.json({ sessions: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[QA Sessions List Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/qa/sessions - Create session (admin only)
export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, expertName, expertBio, expertTitle, scheduledAt, duration } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'title is required.' }, { status: 400 });
    }
    if (!expertName || typeof expertName !== 'string' || expertName.trim().length === 0) {
      return NextResponse.json({ error: 'expertName is required.' }, { status: 400 });
    }
    if (!scheduledAt) {
      return NextResponse.json({ error: 'scheduledAt is required.' }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledAt date.' }, { status: 400 });
    }

    const session = await db.qASession.create({
      data: {
        title: title.trim(),
        description: description || null,
        expertName: expertName.trim(),
        expertBio: expertBio || null,
        expertTitle: expertTitle || null,
        scheduledAt: scheduledDate,
        duration: typeof duration === 'number' ? duration : 60,
        status: 'upcoming',
        hostId: payload.userId,
      },
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
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[QA Session Create Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
