import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/group-investments/[id]/distribute - Distribute profits (admin only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const deal = await db.investmentDeal.findUnique({
      where: { id },
      include: {
        contributions: {
          where: { status: 'confirmed' },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    if (deal.status !== 'matured' && deal.status !== 'active') {
      return NextResponse.json(
        { error: 'Deal must be in "matured" or "active" status to distribute.' },
        { status: 400 }
      );
    }

    if (deal.contributions.length === 0) {
      return NextResponse.json({ error: 'No confirmed contributions to distribute.' }, { status: 400 });
    }

    const body = await req.json();
    const actualRoiPercent = body.actualRoiPercent ?? deal.roiPercent;

    if (typeof actualRoiPercent !== 'number' || actualRoiPercent < 0) {
      return NextResponse.json({ error: 'actualRoiPercent must be a non-negative number.' }, { status: 400 });
    }

    const payouts: Array<{
      userId: string;
      userName: string;
      principal: number;
      profit: number;
      totalPayout: number;
    }> = [];

    let totalPrincipal = 0;
    let totalProfit = 0;
    let totalPayoutAmount = 0;

    for (const contribution of deal.contributions) {
      const principal = contribution.amount;
      const expectedReturn = principal * (1 + actualRoiPercent / 100);
      const profit = expectedReturn - principal;
      const totalPayout = principal + profit;

      totalPrincipal += principal;
      totalProfit += profit;
      totalPayoutAmount += totalPayout;

      // Create payout record
      await db.dealPayout.create({
        data: {
          dealId: id,
          userId: contribution.userId,
          amount: Math.round(totalPayout * 100) / 100,
          principal: Math.round(principal * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          status: 'completed',
          processedAt: new Date(),
        },
      });

      // Credit user wallet
      const wallet = await db.wallet.findUnique({ where: { userId: contribution.userId } });
      if (wallet) {
        await db.wallet.update({
          where: { userId: contribution.userId },
          data: { balance: { increment: totalPayout } },
        });

        // Create transaction record
        await db.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'credit',
            amount: Math.round(totalPayout * 100) / 100,
            description: `Payout from matured deal "${deal.title}" (${actualRoiPercent}% ROI)`,
          },
        });

        // Create earning record
        await db.earning.create({
          data: {
            walletId: wallet.id,
            userId: contribution.userId,
            amount: Math.round(profit * 100) / 100,
            source: 'investment',
            description: `Profit from deal "${deal.title}" - ${actualRoiPercent}% ROI`,
          },
        });
      }

      payouts.push({
        userId: contribution.userId,
        userName: contribution.user.name,
        principal: Math.round(principal * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        totalPayout: Math.round(totalPayout * 100) / 100,
      });
    }

    // Update deal status to completed
    await db.investmentDeal.update({
      where: { id },
      data: { status: 'completed' },
    });

    // Notify all contributors
    for (const payout of payouts) {
      await db.notification.create({
        data: {
          userId: payout.userId,
          title: 'Investment Payout Received!',
          message: `Your payout of $${payout.totalPayout.toFixed(2)} from "${deal.title}" has been processed. Principal: $${payout.principal.toFixed(2)}, Profit: $${payout.profit.toFixed(2)} (${actualRoiPercent}% ROI).`,
          type: 'success',
        },
      });
    }

    return NextResponse.json({
      message: 'Distribution completed successfully.',
      dealId: id,
      dealTitle: deal.title,
      roiPercent: actualRoiPercent,
      totalContributors: payouts.length,
      totalPrincipal: Math.round(totalPrincipal * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalPayoutAmount: Math.round(totalPayoutAmount * 100) / 100,
      payouts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Deal Distribute Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
