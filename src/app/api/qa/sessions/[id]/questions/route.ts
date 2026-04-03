import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/qa/sessions/[id]/questions - List questions for session
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

    const session = await db.qASession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    const questions = await db.qAQuestion.findMany({
      where: { sessionId: id },
      orderBy: [
        { isAnswered: 'desc' },
        { upvotes: 'desc' },
      ],
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const questionsWithVote = questions.map((q) => {
      let upvoterIds: string[] = [];
      try {
        upvoterIds = q.upvoterIds ? JSON.parse(q.upvoterIds) : [];
      } catch {
        upvoterIds = [];
      }
      return {
        id: q.id,
        sessionId: q.sessionId,
        userId: q.userId,
        content: q.content,
        upvotes: q.upvotes,
        upvoterIds,
        hasUpvoted: upvoterIds.includes(payload.userId),
        isAnswered: q.isAnswered,
        answer: q.answer,
        answeredAt: q.answeredAt?.toISOString() || null,
        createdAt: q.createdAt.toISOString(),
        author: q.author,
      };
    });

    return NextResponse.json({ questions: questionsWithVote });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[QA Questions List Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/qa/sessions/[id]/questions - Submit question
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

    const session = await db.qASession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (session.status !== 'upcoming' && session.status !== 'live') {
      return NextResponse.json({ error: 'Questions can only be submitted for upcoming or live sessions.' }, { status: 400 });
    }

    // Check if user already submitted a question
    const existingQuestion = await db.qAQuestion.findFirst({
      where: { sessionId: id, userId: payload.userId },
    });
    if (existingQuestion) {
      return NextResponse.json({ error: 'You have already submitted a question for this session.' }, { status: 400 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required.' }, { status: 400 });
    }

    const question = await db.qAQuestion.create({
      data: {
        sessionId: id,
        userId: payload.userId,
        content: content.trim(),
        upvotes: 0,
        upvoterIds: JSON.stringify([]),
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      question: {
        id: question.id,
        sessionId: question.sessionId,
        userId: question.userId,
        content: question.content,
        upvotes: question.upvotes,
        upvoterIds: [],
        hasUpvoted: false,
        isAnswered: question.isAnswered,
        answer: question.answer,
        answeredAt: question.answeredAt?.toISOString() || null,
        createdAt: question.createdAt.toISOString(),
        author: question.author,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[QA Question Create Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
