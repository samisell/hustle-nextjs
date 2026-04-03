import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { releaseFunds } from '@/lib/escrow';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/escrow/[id]/release - Release all funds (admin only)
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
    const { notes } = body;

    try {
      const escrow = await releaseFunds(payload.userId, id, notes);

      return NextResponse.json({
        escrow,
        message: 'All funds have been released to contributors.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Release failed.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Escrow Release Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
