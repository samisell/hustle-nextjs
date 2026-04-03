import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET - Return comprehensive user stats
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.userId;

    // First fetch user to get referralCode for referral count
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        subscription: { select: { plan: true, status: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parallel fetch of all remaining data
    const [
      wallet,
      investments,
      enrollments,
      referrals,
      userAchievements,
      unreadNotifications,
      withdrawals,
    ] = await Promise.all([
      // Wallet balance
      db.wallet.findUnique({
        where: { userId },
        select: { balance: true },
      }),

      // Investments
      db.userInvestment.findMany({
        where: { userId },
        select: { amount: true, status: true, expectedReturn: true },
      }),

      // Enrollments
      db.enrollment.findMany({
        where: { userId },
        select: { progress: true, id: true },
      }),

      // Referral count
      db.user.count({
        where: { referredBy: user.referralCode },
      }),

      // User achievements with points
      db.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: {
            select: { points: true },
          },
        },
      }),

      // Unread notifications count
      db.notification.count({
        where: { userId, read: false },
      }),

      // Recent withdrawals for status summary
      db.withdrawal.findMany({
        where: { userId },
        select: { status: true },
      }),
    ]);

    // Calculate stats
    const totalInvestments = investments.length;
    const totalInvestedAmount = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const activeInvestments = investments.filter((inv) => inv.status === 'active').length;

    const totalCoursesEnrolled = enrollments.length;
    const coursesCompleted = enrollments.filter((e) => e.progress === 100).length;

    const totalAchievementsEarned = userAchievements.length;
    const totalPoints = userAchievements.reduce(
      (sum, ua) => sum + (ua.achievement?.points ?? 0),
      0
    );

    const totalWithdrawals = withdrawals.length;
    const withdrawalSummary: Record<string, number> = {
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
    };
    for (const w of withdrawals) {
      if (w.status in withdrawalSummary) {
        withdrawalSummary[w.status]++;
      }
    }

    return NextResponse.json({
      walletBalance: wallet?.balance ?? 0,
      investments: {
        total: totalInvestments,
        totalAmount: totalInvestedAmount,
        active: activeInvestments,
      },
      referrals: {
        total: referrals,
      },
      courses: {
        enrolled: totalCoursesEnrolled,
        completed: coursesCompleted,
      },
      achievements: {
        earned: totalAchievementsEarned,
        totalPoints,
      },
      subscription: user.subscription
        ? { plan: user.subscription.plan, status: user.subscription.status }
        : null,
      unreadNotifications,
      withdrawals: {
        total: totalWithdrawals,
        statusSummary: withdrawalSummary,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
