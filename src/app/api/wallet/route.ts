import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/wallet - Get wallet balance and recent transactions
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallet = await db.wallet.findUnique({
      where: { userId: payload.userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        earnings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
    }

    return NextResponse.json({
      balance: wallet.balance,
      transactions: wallet.transactions,
      recentEarnings: wallet.earnings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/wallet - Withdraw
export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, amount, walletAddress } = body;

    if (action === 'withdraw') {
      return handleWithdraw(payload.userId, amount, walletAddress);
    }

    return NextResponse.json({ error: 'Invalid action. Use "withdraw".' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

async function handleWithdraw(userId: string, amount: number, walletAddress: string) {
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

  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
  }

  if (wallet.balance < amount) {
    return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 });
  }

  const withdrawal = await db.$transaction(async (tx) => {
    const createdWithdrawal = await tx.withdrawal.create({
      data: {
        userId,
        amount,
        walletAddress,
        status: 'pending',
      },
    });

    await tx.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'debit',
        amount,
        description: `Withdrawal request to ${walletAddress}`,
      },
    });

    await tx.notification.create({
      data: {
        userId,
        title: 'Withdrawal Requested',
        message: `Your withdrawal of $${amount.toFixed(2)} has been submitted and is pending approval.`,
        type: 'info',
      },
    });

    return createdWithdrawal;
  });

  return NextResponse.json({ withdrawal }, { status: 201 });
}
