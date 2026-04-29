import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/group-investments/[id]/contribute - Contribute to deal (auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const deal = await db.investmentDeal.findUnique({ where: { id } });
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    if (deal.status !== 'funding' && deal.status !== 'active') {
      return NextResponse.json(
        { error: 'This deal is not accepting contributions. Current status: ' + deal.status },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'A valid positive amount is required.' }, { status: 400 });
    }

    if (amount < deal.minContribution) {
      return NextResponse.json(
        { error: `Minimum contribution is $${deal.minContribution}.` },
        { status: 400 }
      );
    }

    if (deal.maxContribution && amount > deal.maxContribution) {
      return NextResponse.json(
        { error: `Maximum contribution is $${deal.maxContribution}.` },
        { status: 400 }
      );
    }

    // Check if pool would exceed target
    if (deal.currentPool + amount > deal.targetAmount) {
      const remaining = deal.targetAmount - deal.currentPool;
      if (remaining <= 0) {
        return NextResponse.json({ error: 'This deal has already reached its target amount.' }, { status: 400 });
      }
      return NextResponse.json(
        { error: `Only $${remaining.toFixed(2)} remaining to reach the target.` },
        { status: 400 }
      );
    }

    // Check wallet balance
    const wallet = await db.wallet.findUnique({ where: { userId: payload.userId } });
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
    }

    if (wallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient wallet balance.' }, { status: 400 });
    }

    // Check for existing contribution to enforce max
    if (deal.maxContribution) {
      const existingContribution = await db.dealContribution.findUnique({
        where: { dealId_userId: { dealId: id, userId: payload.userId } },
      });
      if (existingContribution && existingContribution.amount + amount > deal.maxContribution) {
        const remaining = deal.maxContribution - existingContribution.amount;
        return NextResponse.json(
          { error: `You already contributed $${existingContribution.amount.toFixed(2)}. You can contribute up to $${remaining.toFixed(2)} more.` },
          { status: 400 }
        );
      }
    }

    // Debit wallet
    await db.wallet.update({
      where: { userId: payload.userId },
      data: { balance: { decrement: amount } },
    });

    // Create or update contribution
    const contribution = await db.dealContribution.upsert({
      where: {
        dealId_userId: { dealId: id, userId: payload.userId },
      },
      create: {
        dealId: id,
        userId: payload.userId,
        amount,
        sharePercent: 0,
        expectedReturn: 0,
        status: 'confirmed',
      },
      update: {
        amount: { increment: amount },
        status: 'confirmed',
      },
    });

    // Update deal current pool
    const newPool = deal.currentPool + amount;
    await db.investmentDeal.update({
      where: { id },
      data: { currentPool: newPool },
    });

    // Recalculate share percentages for all contributors
    const allContributions = await db.dealContribution.findMany({
      where: { dealId: id, status: 'confirmed' },
    });

    for (const contrib of allContributions) {
      const sharePercent = newPool > 0 ? (contrib.amount / newPool) * 100 : 0;
      const expectedReturn = contrib.amount * (1 + deal.roiPercent / 100);
      await db.dealContribution.update({
        where: { id: contrib.id },
        data: {
          sharePercent: Math.round(sharePercent * 100) / 100,
          expectedReturn: Math.round(expectedReturn * 100) / 100,
        },
      });
    }

    // Create transaction record
    await db.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'debit',
        amount,
        description: `Contribution to group deal "${deal.title}"`,
      },
    });

    // Notify user
    await db.notification.create({
      data: {
        userId: payload.userId,
        title: 'Contribution Confirmed',
        message: `$${amount.toFixed(2)} has been contributed to "${deal.title}". Expected return: $${(amount * (1 + deal.roiPercent / 100)).toFixed(2)}.`,
        type: 'success',
      },
    });

    // Get updated contribution
    const updatedContribution = await db.dealContribution.findUnique({
      where: { id: contribution.id },
    });

    return NextResponse.json({ contribution: updatedContribution }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Deal Contribution Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
