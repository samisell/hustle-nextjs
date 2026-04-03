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

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/users/[id]/balance - Adjust user wallet balance (credit/debit)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id: userId } = await params;
    const body = await req.json();
    const { amount, reason } = body;

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json({ error: 'A valid non-zero amount is required.' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'A reason for the adjustment is required.' }, { status: 400 });
    }

    // Check user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Ensure user has a wallet, create one if not
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await db.wallet.create({
        data: { userId, balance: 0 },
      });
    }

    // For debits, check sufficient balance
    if (amount < 0 && wallet.balance + amount < 0) {
      return NextResponse.json(
        { error: `Insufficient balance. Current balance: $${wallet.balance.toFixed(2)}.` },
        { status: 400 }
      );
    }

    const isCredit = amount > 0;
    const transactionType = isCredit ? 'credit' : 'debit';

    // Update wallet balance
    const updatedWallet = await db.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });

    // Create Transaction record
    await db.transaction.create({
      data: {
        walletId: wallet.id,
        type: transactionType,
        amount: Math.abs(amount),
        description: `Admin ${transactionType}: ${reason}`,
      },
    });

    // Create Earning record for credits
    if (isCredit) {
      await db.earning.create({
        data: {
          userId,
          walletId: wallet.id,
          amount,
          source: 'bonus',
          description: `Admin credit: ${reason}`,
        },
      });
    }

    // Create Notification to user
    await db.notification.create({
      data: {
        userId,
        title: isCredit ? 'Wallet Credited' : 'Wallet Debited',
        message: `Your wallet has been ${isCredit ? 'credited' : 'debited'} with $${Math.abs(amount).toFixed(2)}. Reason: ${reason}. New balance: $${updatedWallet.balance.toFixed(2)}.`,
        type: isCredit ? 'success' : 'warning',
      },
    });

    return NextResponse.json({
      message: `Successfully ${isCredit ? 'credited' : 'debited'} $${Math.abs(amount).toFixed(2)}`,
      balance: updatedWallet.balance,
      transactionType,
      amount: Math.abs(amount),
      reason,
    });
  } catch (error: any) {
    console.error('Balance adjustment error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
