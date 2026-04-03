import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/qa/sessions/[id]/questions/[questionId]/answer - Answer question (admin or host)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, questionId } = await params;

    const session = await db.qASession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    // Only admin or session host can answer
    if (payload.role !== 'admin' && session.hostId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden. Only admin or session host can answer questions.' }, { status: 403 });
    }

    const question = await db.qAQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question || question.sessionId !== id) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
    }

    if (question.isAnswered) {
      return NextResponse.json({ error: 'This question has already been answered.' }, { status: 400 });
    }

    const body = await req.json();
    const { answer } = body;

    if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
      return NextResponse.json({ error: 'answer is required.' }, { status: 400 });
    }

    const updatedQuestion = await db.qAQuestion.update({
      where: { id: questionId },
      data: {
        isAnswered: true,
        answer: answer.trim(),
        answeredAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    let upvoterIds: string[] = [];
    try {
      upvoterIds = updatedQuestion.upvoterIds ? JSON.parse(updatedQuestion.upvoterIds) : [];
    } catch {
      upvoterIds = [];
    }

    return NextResponse.json({
      question: {
        id: updatedQuestion.id,
        sessionId: updatedQuestion.sessionId,
        userId: updatedQuestion.userId,
        content: updatedQuestion.content,
        upvotes: updatedQuestion.upvotes,
        upvoterIds,
        isAnswered: updatedQuestion.isAnswered,
        answer: updatedQuestion.answer,
        answeredAt: updatedQuestion.answeredAt?.toISOString() || null,
        createdAt: updatedQuestion.createdAt.toISOString(),
        author: updatedQuestion.author,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[QA Question Answer Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
