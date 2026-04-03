import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { resolveDispute } from '@/lib/escrow';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/escrow/[id]/disputes/[disputeId]/resolve - Resolve dispute (admin only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; disputeId: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { disputeId } = await params;
    const body = await req.json();
    const { resolution, action } = body;

    if (!resolution || typeof resolution !== 'string' || resolution.trim().length === 0) {
      return NextResponse.json({ error: 'A resolution description is required.' }, { status: 400 });
    }

    const validActions = ['dismiss', 'refund', 'release'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Choose from: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    try {
      const dispute = await resolveDispute(
        payload.userId,
        disputeId,
        resolution.trim(),
        action as 'dismiss' | 'refund' | 'release'
      );

      const actionMessages: Record<string, string> = {
        dismiss: 'Dispute has been dismissed. Escrow status reverted.',
        refund: 'Dispute resolved. All contributions have been refunded.',
        release: 'Dispute resolved. All funds have been released to contributors.',
      };

      return NextResponse.json({
        dispute,
        message: actionMessages[action],
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to resolve dispute.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Dispute Resolve Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
