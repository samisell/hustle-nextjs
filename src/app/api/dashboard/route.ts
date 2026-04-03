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

    // Get wallet balance
    const wallet = await db.wallet.findUnique({
      where: { userId: payload.userId },
    });

    // Get total referrals
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { referralCode: true },
    });

    const totalReferrals = user ? await db.user.count({
      where: { referredBy: user.referralCode },
    }) : 0;

    // Get enrollments completed (progress = 100)
    const coursesCompleted = await db.enrollment.count({
      where: { userId: payload.userId, progress: 100 },
    });

    // Get active investments
    const activeInvestments = await db.userInvestment.count({
      where: { userId: payload.userId, status: 'active' },
    });

    // Get recent transactions for activity
    const recentTransactions = await db.transaction.findMany({
      where: { wallet: { userId: payload.userId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const activities = recentTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type === 'credit' ? 'credit' : 'debit',
      title: tx.description || (tx.type === 'credit' ? 'Earning' : 'Expense'),
      description: tx.description || '',
      amount: tx.amount,
      time: formatTimeAgo(tx.createdAt),
    }));

    return NextResponse.json({
      stats: {
        balance: wallet?.balance ?? 0,
        totalReferrals,
        coursesCompleted,
        activeInvestments,
      },
      activities,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
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
