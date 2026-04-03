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

// GET /api/admin - Returns all admin data at once
export async function GET(req: NextRequest) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const [users, withdrawals, courses] = await Promise.all([
      db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          referralCode: true,
          createdAt: true,
          wallet: { select: { balance: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.withdrawal.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.course.findMany({
        include: { _count: { select: { enrollments: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Format data to match frontend expectations
    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      referralCode: u.referralCode,
      createdAt: u.createdAt.toISOString(),
      balance: u.wallet?.balance ?? 0,
    }));

    const formattedWithdrawals = withdrawals.map((w) => ({
      id: w.id,
      userId: w.userId,
      userName: w.user.name,
      userEmail: w.user.email,
      amount: w.amount,
      walletAddress: w.walletAddress || '',
      status: w.status,
      createdAt: w.createdAt.toISOString(),
    }));

    const formattedCourses = courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description || '',
      difficulty: c.difficulty,
      category: c.category || '',
      enrollmentsCount: c._count.enrollments,
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({
      users: formattedUsers,
      withdrawals: formattedWithdrawals,
      courses: formattedCourses,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
