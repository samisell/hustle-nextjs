import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

// GET /api/admin/payouts - All payouts for admin
export async function GET(req: NextRequest) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
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
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.payout.count({ where }),
    ]);

    // Summary counts
    const summaryCounts = await db.payout.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const summary: Record<string, number> = {};
    for (const sc of summaryCounts) {
      summary[sc.status] = sc._count.id;
    }

    return NextResponse.json({
      payouts: payouts.map((p) => ({
        id: p.id,
        user: {
          id: p.user.id,
          name: p.user.name,
          email: p.user.email,
        },
        status: p.status,
        method: p.method,
        amount: p.amount,
        currency: p.currency,
        walletAddress: p.walletAddress,
        bankName: p.bankName,
        bankAccount: p.bankAccount,
        bankAccountName: p.bankAccountName,
        txHash: p.txHash,
        reference: p.reference,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
        processedAt: p.processedAt?.toISOString() || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
