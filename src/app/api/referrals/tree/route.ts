import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getReferralTree, getNetworkGrowth } from '@/lib/mlm';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/referrals/tree - Referral network tree
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const depth = Math.min(5, Math.max(1, parseInt(searchParams.get('depth') || '3', 10)));

    const tree = await getReferralTree(payload.userId, depth);
    const growth = await getNetworkGrowth(payload.userId);

    return NextResponse.json({
      tree,
      stats: {
        totalNetwork: growth.totalNetwork,
        directReferrals: growth.directReferrals,
        level2Count: growth.level2Count,
        level3Count: growth.level3Count,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
