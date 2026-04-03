import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/qa/sessions/[id]/questions/[questionId]/upvote - Toggle upvote
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

    const question = await db.qAQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question || question.sessionId !== id) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
    }

    let upvoterIds: string[] = [];
    try {
      upvoterIds = question.upvoterIds ? JSON.parse(question.upvoterIds) : [];
    } catch {
      upvoterIds = [];
    }

    const hasUpvoted = upvoterIds.includes(payload.userId);
    let newUpvotes: number;
    let newUpvoterIds: string[];

    if (hasUpvoted) {
      // Remove upvote (downvote)
      newUpvoterIds = upvoterIds.filter((uid: string) => uid !== payload.userId);
      newUpvotes = Math.max(0, question.upvotes - 1);
    } else {
      // Add upvote
      newUpvoterIds = [...upvoterIds, payload.userId];
      newUpvotes = question.upvotes + 1;
    }

    const updatedQuestion = await db.qAQuestion.update({
      where: { id: questionId },
      data: {
        upvotes: newUpvotes,
        upvoterIds: JSON.stringify(newUpvoterIds),
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      question: {
        id: updatedQuestion.id,
        sessionId: updatedQuestion.sessionId,
        userId: updatedQuestion.userId,
        content: updatedQuestion.content,
        upvotes: updatedQuestion.upvotes,
        upvoterIds: newUpvoterIds,
        hasUpvoted: !hasUpvoted,
        isAnswered: updatedQuestion.isAnswered,
        answer: updatedQuestion.answer,
        answeredAt: updatedQuestion.answeredAt?.toISOString() || null,
        createdAt: updatedQuestion.createdAt.toISOString(),
        author: updatedQuestion.author,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[QA Question Upvote Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
