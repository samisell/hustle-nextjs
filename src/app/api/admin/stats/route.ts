import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

// GET /api/admin/stats - Platform-wide analytics dashboard data
export async function GET(req: NextRequest) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Run all independent aggregate queries in parallel
    const [
      totalUsers,
      activeSubscriptions,
      totalRevenueResult,
      pendingWithdrawals,
      totalCourses,
      totalEnrollments,
      totalInvestments,
      totalInvestedResult,
      totalEscrowHeldResult,
      openDisputes,
      recentSignups,
      topCourses,
      topReferrers,
      paymentMethodBreakdownRaw,
      subscriptionDistribution,
      monthlyRevenueRaw,
      userGrowthRaw,
    ] = await Promise.all([
      // Total users
      db.user.count(),

      // Active subscriptions
      db.subscription.count({ where: { status: 'active' } }),

      // Total revenue from completed payments
      db.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'completed' },
      }),

      // Pending withdrawals
      db.withdrawal.count({ where: { status: 'pending' } }),

      // Total courses
      db.course.count(),

      // Total enrollments
      db.enrollment.count(),

      // Total investments (user investments)
      db.userInvestment.count(),

      // Total invested amount
      db.userInvestment.aggregate({
        _sum: { amount: true },
      }),

      // Total escrow held (collected amounts)
      db.escrowTransaction.aggregate({
        _sum: { collectedAmount: true },
        where: {
          status: {
            in: ['collecting', 'funded', 'active', 'disputed', 'partially_released'],
          },
        },
      }),

      // Open disputes
      db.escrowDispute.count({
        where: { status: { in: ['open', 'investigating'] } },
      }),

      // Recent signups (last 7 days)
      db.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),

      // Top 5 courses by enrollment count
      db.course.findMany({
        take: 5,
        include: { _count: { select: { enrollments: true } } },
        orderBy: { enrollments: { _count: 'desc' } },
      }),

      // Top 5 referrers by referral count
      db.user.findMany({
        take: 5,
        where: {
          referrals: { some: {} },
        },
        select: {
          id: true,
          name: true,
          referralCode: true,
          _count: { select: { referrals: true } },
        },
        orderBy: { referrals: { _count: 'desc' } },
      }),

      // Payment method breakdown
      db.payment.groupBy({
        by: ['paymentMethod'],
        where: { status: 'completed' },
        _count: { id: true },
        _sum: { amount: true },
      }),

      // Subscription distribution by plan
      db.subscription.groupBy({
        by: ['plan'],
        _count: { id: true },
      }),

      // Monthly revenue - last 12 months (completed payments with paidAt)
      db.$queryRaw<Array<{ month: string; total: number }>>`
        SELECT 
          strftime('%Y-%m', paidAt) as month,
          SUM(amount) as total
        FROM Payment
        WHERE status = 'completed' AND paidAt IS NOT NULL
          AND paidAt >= datetime('now', '-12 months')
        GROUP BY strftime('%Y-%m', paidAt)
        ORDER BY month ASC
      `,

      // User growth - last 12 months
      db.$queryRaw<Array<{ month: string; count: number }>>`
        SELECT 
          strftime('%Y-%m', createdAt) as month,
          COUNT(*) as count
        FROM User
        WHERE createdAt >= datetime('now', '-12 months')
        GROUP BY strftime('%Y-%m', createdAt)
        ORDER BY month ASC
      `,
    ]);

    // Format monthly revenue with month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyRevenue = monthlyRevenueRaw.map((row) => {
      const date = new Date(row.month + '-01');
      return {
        month: monthNames[date.getMonth()],
        revenue: Number(row.total) || 0,
      };
    });

    const userGrowth = userGrowthRaw.map((row) => {
      const date = new Date(row.month + '-01');
      return {
        month: monthNames[date.getMonth()],
        users: Number(row.count) || 0,
      };
    });

    // Format top courses
    const formattedTopCourses = topCourses.map((c) => ({
      id: c.id,
      title: c.title,
      enrollments: c._count.enrollments,
    }));

    // Format top referrers
    const formattedTopReferrers = topReferrers.map((r) => ({
      id: r.id,
      name: r.name,
      referralCount: r._count.referrals,
    }));

    // Format payment method breakdown
    const formattedPaymentMethods = paymentMethodBreakdownRaw.map((pm) => ({
      method: pm.paymentMethod,
      count: pm._count.id,
      amount: Number(pm._sum.amount) || 0,
    }));

    // Format subscription distribution
    const formattedSubscriptionDist = subscriptionDistribution.map((s) => ({
      plan: s.plan,
      count: s._count.id,
    }));

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      totalRevenue: Number(totalRevenueResult._sum.amount) || 0,
      pendingWithdrawals,
      totalCourses,
      totalEnrollments,
      totalInvestments,
      totalInvested: Number(totalInvestedResult._sum.amount) || 0,
      totalEscrowHeld: Number(totalEscrowHeldResult._sum.collectedAmount) || 0,
      openDisputes,
      recentSignups,
      monthlyRevenue,
      userGrowth,
      topCourses: formattedTopCourses,
      topReferrers: formattedTopReferrers,
      paymentMethodBreakdown: formattedPaymentMethods,
      subscriptionDistribution: formattedSubscriptionDist,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
