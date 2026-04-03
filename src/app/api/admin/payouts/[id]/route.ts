import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { processPayout } from '@/lib/mlm';

function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/payouts/[id] - Process a payout (admin only)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const body = await req.json();
    const { action, txHash, reference, notes } = body;

    if (!action || !['complete', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "complete" or "reject".' }, { status: 400 });
    }

    await processPayout(id, action, txHash, reference, notes);

    const updatedPayout = await db.payout.findUnique({ where: { id } });

    return NextResponse.json({ payout: updatedPayout });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
