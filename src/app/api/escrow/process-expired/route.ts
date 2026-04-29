import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { processExpiredEscrows } from '@/lib/escrow';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/escrow/process-expired - Process expired escrows (admin only)
export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const processed = await processExpiredEscrows();

    return NextResponse.json({
      processedCount: processed.length,
      processedIds: processed,
      message: processed.length > 0
        ? `Processed ${processed.length} expired escrow(s).`
        : 'No expired escrows found to process.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Process Expired Escrows Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
