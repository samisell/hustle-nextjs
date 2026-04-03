import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getNetworkGrowth, getCommissionSummary } from '@/lib/mlm';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/referrals/growth - Network growth analytics
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [growth, commissionSummary] = await Promise.all([
      getNetworkGrowth(payload.userId),
      getCommissionSummary(payload.userId),
    ]);

    return NextResponse.json({
      totalNetwork: growth.totalNetwork,
      directReferrals: growth.directReferrals,
      level2Count: growth.level2Count,
      level3Count: growth.level3Count,
      recentSignups: growth.recentSignups,
      growthRate: growth.growthRate,
      monthlyEarnings: commissionSummary.monthlyEarnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
