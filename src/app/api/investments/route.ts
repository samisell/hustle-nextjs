import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const opportunities = await db.investmentOpportunity.findMany({
      where: { status: 'active' },
      include: { _count: { select: { investments: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const userInvestments = await db.userInvestment.findMany({
      where: { userId: payload.userId },
      include: { opportunity: true },
      orderBy: { createdAt: 'desc' },
    });

    // Format to match frontend expectations: frontend expects "myInvestments"
    const formattedInvestments = userInvestments.map((inv) => ({
      id: inv.id,
      opportunityId: inv.opportunityId,
      opportunityTitle: inv.opportunity.title,
      amount: inv.amount,
      roiPercent: inv.roiPercent,
      expectedReturn: inv.expectedReturn,
      status: inv.status,
      startDate: inv.startDate.toISOString(),
      endDate: inv.endDate ? inv.endDate.toISOString() : null,
    }));

    return NextResponse.json({ opportunities, myInvestments: formattedInvestments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
