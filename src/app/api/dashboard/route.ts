import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.userId;

    // First fetch user for referralCode
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        subscription: {
          select: { plan: true, status: true, endDate: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate dates for weekly earnings (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Parallel fetch all data
    const [
      wallet,
      investments,
      enrollments,
      referrals,
      userAchievements,
      unreadNotifications,
      recentTransactions,
      weeklyCreditTransactions,
      lessonProgresses,
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

      // Recent achievements (last 3 earned)
      db.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: {
            select: { id: true, title: true, description: true, icon: true, category: true, points: true },
          },
        },
        orderBy: { earnedAt: 'desc' },
        take: 3,
      }),

      // Unread notifications count
      db.notification.count({
        where: { userId, read: false },
      }),

      // Recent transactions for activity
      db.transaction.findMany({
        where: { wallet: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Weekly credit transactions (last 7 days)
      db.transaction.findMany({
        where: {
          wallet: { userId },
          type: 'credit',
          createdAt: { gte: sevenDaysAgo },
        },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),

      // Total lessons completed across all courses
      db.lessonProgress.count({
        where: { userId, completed: true },
      }),
    ]);

    // Calculate original stats
    const totalReferrals = referrals;
    const coursesCompleted = enrollments.filter((e) => e.progress === 100).length;
    const activeInvestments = investments.filter((inv) => inv.status === 'active').length;

    // Build activities
    const activities = recentTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type === 'credit' ? 'credit' : 'debit',
      title: tx.description || (tx.type === 'credit' ? 'Earning' : 'Expense'),
      description: tx.description || '',
      amount: tx.amount,
      time: formatTimeAgo(tx.createdAt),
    }));

    // Build recent achievements response
    const recentAchievements = userAchievements.map((ua) => ({
      id: ua.achievement.id,
      title: ua.achievement.title,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      category: ua.achievement.category,
      points: ua.achievement.points,
      earnedAt: ua.earnedAt,
    }));

    // Build learning progress
    const learningProgress = {
      totalEnrolled: enrollments.length,
      completed: coursesCompleted,
      totalLessonsCompleted: lessonProgresses,
    };

    // Build investment summary
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalReturns = investments.reduce((sum, inv) => sum + inv.expectedReturn, 0);
    const investmentSummary = {
      totalInvested,
      activeCount: activeInvestments,
      totalReturns,
    };

    // Build weekly earnings array (last 7 days)
    const weeklyEarnings: { date: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now);
      dayDate.setDate(dayDate.getDate() - i);
      const dayStr = dayDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayEarnings = weeklyCreditTransactions
        .filter((tx) => {
          const txDate = new Date(tx.createdAt);
          return txDate >= dayStart && txDate <= dayEnd;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      weeklyEarnings.push({
        date: dayStr,
        amount: dayEarnings,
      });
    }

    // Subscription info
    const subscription = user.subscription
      ? { plan: user.subscription.plan, status: user.subscription.status, endDate: user.subscription.endDate }
      : null;

    return NextResponse.json({
      // Original stats
      stats: {
        balance: wallet?.balance ?? 0,
        totalReferrals,
        coursesCompleted,
        activeInvestments,
      },
      activities,

      // Enhanced data
      subscription,
      unreadNotifications,
      recentAchievements,
      learningProgress,
      investmentSummary,
      weeklyEarnings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
