import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cancelEscrow } from '@/lib/escrow';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/escrow/[id]/cancel - Cancel escrow (admin only)
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
    const { reason } = body;

    try {
      const escrow = await cancelEscrow(payload.userId, id, reason);

      return NextResponse.json({
        escrow,
        message: reason
          ? `Escrow cancelled. Reason: ${reason}. All contributions have been refunded.`
          : 'Escrow cancelled. All contributions have been refunded.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Cancel failed.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Escrow Cancel Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
