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
    const { opportunityId, amount } = body;

    if (!opportunityId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Opportunity ID and amount are required.' }, { status: 400 });
    }

    const opportunity = await db.investmentOpportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) {
      return NextResponse.json({ error: 'Investment opportunity not found.' }, { status: 404 });
    }

    if (opportunity.status !== 'active') {
      return NextResponse.json({ error: 'This investment is no longer active.' }, { status: 400 });
    }

    if (amount < opportunity.minInvestment) {
      return NextResponse.json({ error: `Minimum investment is $${opportunity.minInvestment}.` }, { status: 400 });
    }

    if (amount > opportunity.maxInvestment) {
      return NextResponse.json({ error: `Maximum investment is $${opportunity.maxInvestment}.` }, { status: 400 });
    }

    const wallet = await db.wallet.findUnique({ where: { userId: payload.userId } });
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
    }

    if (wallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient wallet balance.' }, { status: 400 });
    }

    const expectedReturn = amount * (1 + opportunity.roiPercent / 100);

    const investment = await db.userInvestment.create({
      data: {
        userId: payload.userId,
        opportunityId,
        amount,
        roiPercent: opportunity.roiPercent,
        expectedReturn: Math.round(expectedReturn * 100) / 100,
        status: 'active',
      },
    });

    await db.investmentOpportunity.update({
      where: { id: opportunityId },
      data: { totalPool: { increment: amount } },
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
        description: `Investment in "${opportunity.title}"`,
      },
    });

    await db.notification.create({
      data: {
        userId: payload.userId,
        title: 'Investment Placed!',
        message: `You invested $${amount.toFixed(2)} in "${opportunity.title}". Expected return: $${expectedReturn.toFixed(2)}.`,
        type: 'success',
      },
    });

    return NextResponse.json({ investment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
