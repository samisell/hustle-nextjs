import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createPayoutRequest } from '@/lib/mlm';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/referrals/payout - Create payout request
export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, method, currency, walletAddress, bankName, bankAccount, bankAccountName } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required.' }, { status: 400 });
    }

    if (!method || !['bitcoin', 'usdt', 'bank_transfer'].includes(method)) {
      return NextResponse.json({ error: 'Invalid method. Must be "bitcoin", "usdt", or "bank_transfer".' }, { status: 400 });
    }

    if (!currency || !['USD', 'USDT', 'BTC'].includes(currency)) {
      return NextResponse.json({ error: 'Invalid currency. Must be "USD", "USDT", or "BTC".' }, { status: 400 });
    }

    const result = await createPayoutRequest({
      userId: payload.userId,
      amount,
      method,
      currency,
      walletAddress,
      bankName,
      bankAccount,
      bankAccountName,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ payout: result.payout }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/referrals/payout - Payout history
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: { userId: string; status?: string } = { userId: payload.userId };
    if (statusParam) {
      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'rejected'];
      if (!validStatuses.includes(statusParam)) {
        return NextResponse.json({ error: 'Invalid status filter.' }, { status: 400 });
      }
      where.status = statusParam;
    }

    const [payouts, total] = await Promise.all([
      db.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.payout.count({ where }),
    ]);

    return NextResponse.json({
      payouts: payouts.map((p) => ({
        id: p.id,
        status: p.status,
        method: p.method,
        amount: p.amount,
        currency: p.currency,
        txHash: p.txHash,
        reference: p.reference,
        createdAt: p.createdAt.toISOString(),
        processedAt: p.processedAt?.toISOString() || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
