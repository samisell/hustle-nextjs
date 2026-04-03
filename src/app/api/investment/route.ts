import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/investment - List all active investment opportunities
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const opportunities = await db.investmentOpportunity.findMany({
      where: { status: 'active' },
      include: {
        _count: {
          select: { investments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Include user's investments if any
    const userInvestments = await db.userInvestment.findMany({
      where: { userId: payload.userId },
      include: {
        opportunity: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ opportunities, userInvestments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/investment - Invest in an opportunity
export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'invest') {
      return handleInvest(payload.userId, body);
    }

    return NextResponse.json({ error: 'Invalid action. Use "invest".' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

async function handleInvest(userId: string, body: Record<string, any>) {
  const { opportunityId, amount } = body;

  if (!opportunityId || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Opportunity ID and amount are required.' }, { status: 400 });
  }

  const opportunity = await db.investmentOpportunity.findUnique({
    where: { id: opportunityId },
  });

  if (!opportunity) {
    return NextResponse.json({ error: 'Investment opportunity not found.' }, { status: 404 });
  }

  if (opportunity.status !== 'active') {
    return NextResponse.json({ error: 'This investment opportunity is no longer active.' }, { status: 400 });
  }

  if (amount < opportunity.minInvestment) {
    return NextResponse.json(
      { error: `Minimum investment is $${opportunity.minInvestment}.` },
      { status: 400 }
    );
  }

  if (amount > opportunity.maxInvestment) {
    return NextResponse.json(
      { error: `Maximum investment is $${opportunity.maxInvestment}.` },
      { status: 400 }
    );
  }

  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
  }

  if (wallet.balance < amount) {
    return NextResponse.json({ error: 'Insufficient wallet balance.' }, { status: 400 });
  }

  const expectedReturn = amount * (1 + opportunity.roiPercent / 100);

  // Create user investment
  const investment = await db.userInvestment.create({
    data: {
      userId,
      opportunityId,
      amount,
      roiPercent: opportunity.roiPercent,
      expectedReturn: Math.round(expectedReturn * 100) / 100,
      status: 'active',
    },
  });

  // Update opportunity total pool
  await db.investmentOpportunity.update({
    where: { id: opportunityId },
    data: { totalPool: { increment: amount } },
  });

  // Debit from wallet
  await db.wallet.update({
    where: { userId },
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
      userId,
      title: 'Investment Placed!',
      message: `You have invested $${amount.toFixed(2)} in "${opportunity.title}". Expected return: $${expectedReturn.toFixed(2)}.`,
      type: 'success',
    },
  });

  return NextResponse.json({ investment }, { status: 201 });
}
