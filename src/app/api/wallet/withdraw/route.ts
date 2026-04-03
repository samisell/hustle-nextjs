import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, walletAddress } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid withdrawal amount.' }, { status: 400 });
    }

    const MIN_WITHDRAWAL = 10;
    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}.` }, { status: 400 });
    }

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required.' }, { status: 400 });
    }

    const wallet = await db.wallet.findUnique({ where: { userId: payload.userId } });
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
    }

    if (wallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 });
    }

    const withdrawal = await db.withdrawal.create({
      data: {
        userId: payload.userId,
        amount,
        walletAddress,
        status: 'pending',
      },
    });

    await db.wallet.update({
      where: { userId: payload.userId },
      data: { balance: { decrement: amount } },
    });

    await db.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'debit',
        amount,
        description: `Withdrawal request to ${walletAddress}`,
      },
    });

    await db.notification.create({
      data: {
        userId: payload.userId,
        title: 'Withdrawal Requested',
        message: `Your withdrawal of $${amount.toFixed(2)} has been submitted and is pending approval.`,
        type: 'info',
      },
    });

    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
