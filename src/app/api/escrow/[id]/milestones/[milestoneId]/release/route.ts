import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { releaseMilestone } from '@/lib/escrow';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/escrow/[id]/milestones/[milestoneId]/release - Release milestone (admin only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { milestoneId } = await params;
    const body = await req.json();
    const { releaseNotes } = body;

    try {
      const milestone = await releaseMilestone(payload.userId, milestoneId, releaseNotes);

      return NextResponse.json({
        milestone,
        message: 'Milestone funds have been released to contributors.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to release milestone.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Milestone Release Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
