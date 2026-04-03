import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/investments - List opportunities and user investments
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

    return NextResponse.json({ opportunities, userInvestments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
