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

// GET /api/admin/withdrawals - List all withdrawals
export async function GET(req: NextRequest) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const withdrawals = await db.withdrawal.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        userId: w.userId,
        userName: w.user.name,
        userEmail: w.user.email,
        amount: w.amount,
        walletAddress: w.walletAddress || '',
        status: w.status,
        createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/withdrawals - Approve or reject withdrawal
export async function POST(req: NextRequest) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { withdrawalId, action: status } = body;

    if (!withdrawalId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid withdrawal ID or action.' }, { status: 400 });
    }

    const withdrawal = await db.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found.' }, { status: 404 });
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'Withdrawal has already been processed.' }, { status: 400 });
    }

    const updatedWithdrawal = await db.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: status === 'approved' ? 'completed' : 'rejected' },
    });

    // If rejected, refund the wallet
    if (status === 'rejected') {
      const wallet = await db.wallet.findUnique({ where: { userId: withdrawal.userId } });
      if (wallet) {
        await db.wallet.update({
          where: { userId: withdrawal.userId },
          data: { balance: { increment: withdrawal.amount } },
        });
        await db.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'credit',
            amount: withdrawal.amount,
            description: 'Withdrawal refund (rejected)',
          },
        });
      }

      await db.notification.create({
        data: {
          userId: withdrawal.userId,
          title: 'Withdrawal Rejected',
          message: `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been rejected. The funds have been returned to your wallet.`,
          type: 'warning',
        },
      });
    } else {
      await db.notification.create({
        data: {
          userId: withdrawal.userId,
          title: 'Withdrawal Approved!',
          message: `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been approved and is being processed.`,
          type: 'success',
        },
      });
    }

    return NextResponse.json({ withdrawal: updatedWithdrawal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
