import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createMilestone } from '@/lib/escrow';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/escrow/[id]/milestones - Add milestone (admin only)
export async function POST(
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
    const body = await req.json();
    const { title, description, percentage, order } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Milestone title is required.' }, { status: 400 });
    }

    if (percentage === undefined || percentage === null || typeof percentage !== 'number' || percentage <= 0) {
      return NextResponse.json({ error: 'A positive percentage is required.' }, { status: 400 });
    }

    try {
      const milestone = await createMilestone(id, title.trim(), description, percentage, order ?? 0);

      return NextResponse.json({
        milestone,
        message: 'Milestone added successfully.',
      }, { status: 201 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create milestone.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Escrow Milestone Create Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
