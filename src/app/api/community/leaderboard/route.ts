import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

type LeaderboardEntry = {
  rank: number;
  name: string;
  email: string;
  avatar: string | null;
  totalEarnings: number;
  totalReferrals: number;
  commissionCount: number;
  badge: string | null;
};

// GET /api/community/leaderboard - Top 20 referrers by commission earnings
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'all';

    // Build date filter for monthly
    const now = new Date();
    let dateFilter: Date | undefined;
    if (period === 'monthly') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Aggregate commissions by userId
    const commissionsWhere: Record<string, unknown> = {};
    if (dateFilter) {
      commissionsWhere.createdAt = { gte: dateFilter };
    }

    const commissionAggregates = await db.commission.groupBy({
      by: ['userId'],
      where: commissionsWhere,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 20,
    });

    // Get user details for top referrers
    const userIds = commissionAggregates.map((c) => c.userId);
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, avatar: true },
    });

    const userMap: Record<string, { id: string; name: string; email: string; avatar: string | null }> = {};
    users.forEach((u) => { userMap[u.id] = u; });

    // Get referral counts for each user
    const referralCounts = await db.referral.groupBy({
      by: ['referrerId'],
      where: { referrerId: { in: userIds } },
      _count: true,
    });
    const referralMap: Record<string, number> = {};
    referralCounts.forEach((r) => { referralMap[r.referrerId] = r._count; });

    // Build leaderboard with ranks and badges
    const leaderboard = commissionAggregates.map((c, index) => {
      const user = userMap[c.userId];
      const rank = index + 1;
      let badge: string | null = null;
      if (rank === 1) badge = 'gold';
      else if (rank === 2) badge = 'silver';
      else if (rank === 3) badge = 'bronze';

      return {
        rank,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        avatar: user?.avatar || null,
        totalEarnings: c._sum.amount || 0,
        totalReferrals: referralMap[c.userId] || 0,
        commissionCount: c._count,
        badge,
      };
    });

    // Find current user's rank
    const allCommissions = await db.commission.groupBy({
      by: ['userId'],
      where: commissionsWhere,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    const currentUserEntry = allCommissions.find((c) => c.userId === payload.userId);
    let currentUserRank: number | null = null;
    let currentUserStats: LeaderboardEntry | null = null;

    if (currentUserEntry) {
      currentUserRank = allCommissions.findIndex((c) => c.userId === payload.userId) + 1;
      const currentUser = userMap[payload.userId] || await db.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, email: true, avatar: true },
      });
      const currentUserReferralCount = referralMap[payload.userId] || await db.referral.count({
        where: { referrerId: payload.userId },
      });

      let userBadge: string | null = null;
      if (currentUserRank === 1) userBadge = 'gold';
      else if (currentUserRank === 2) userBadge = 'silver';
      else if (currentUserRank === 3) userBadge = 'bronze';

      currentUserStats = {
        rank: currentUserRank,
        name: currentUser?.name || 'Unknown',
        email: currentUser?.email || '',
        avatar: currentUser?.avatar || null,
        totalEarnings: currentUserEntry._sum.amount || 0,
        totalReferrals: currentUserReferralCount,
        commissionCount: currentUserEntry._count,
        badge: userBadge,
      };
    }

    return NextResponse.json({
      leaderboard,
      currentUser: currentUserStats,
      period,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Leaderboard Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
