import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { raiseDispute } from '@/lib/escrow';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/escrow/[id]/disputes - Raise dispute (contributor only)
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
    const body = await req.json();
    const { reason, evidence } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'A reason for the dispute is required.' }, { status: 400 });
    }

    try {
      const dispute = await raiseDispute(payload.userId, id, reason.trim(), evidence);

      return NextResponse.json({
        dispute,
        message: 'Dispute has been raised and will be reviewed by an admin.',
      }, { status: 201 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to raise dispute.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Escrow Dispute Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
