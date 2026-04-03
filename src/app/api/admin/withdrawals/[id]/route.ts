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

// PUT /api/admin/withdrawals/[id] - Approve or reject withdrawal
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !['approved', 'rejected', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "approved", "rejected", or "completed".' },
        { status: 400 }
      );
    }

    const withdrawal = await db.withdrawal.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found.' }, { status: 404 });
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'This withdrawal has already been processed.' }, { status: 400 });
    }

    const updatedWithdrawal = await db.withdrawal.update({
      where: { id },
      data: { status },
      include: { user: { select: { id: true, name: true, email: true } } },
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
            description: 'Withdrawal rejected - refund',
          },
        });
      }
    }

    // Notify user
    const statusMessage =
      status === 'approved'
        ? `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been approved and is being processed.`
        : status === 'rejected'
        ? `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been rejected. The amount has been refunded to your wallet.`
        : `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been completed.`;

    await db.notification.create({
      data: {
        userId: withdrawal.userId,
        title: `Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: statusMessage,
        type: status === 'rejected' ? 'warning' : 'success',
      },
    });

    return NextResponse.json({ withdrawal: updatedWithdrawal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
