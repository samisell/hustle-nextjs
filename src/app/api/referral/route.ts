import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/referral - Get referral stats
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { referralCode: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Total referrals
    const totalReferrals = await db.user.count({
      where: { referredBy: user.referralCode },
    });

    // Active referrals (users who have enrolled in at least one course)
    const activeReferrals = await db.user.count({
      where: {
        referredBy: user.referralCode,
        enrollments: { some: {} },
      },
    });

    // Total earnings from referrals
    const referralEarnings = await db.referral.aggregate({
      where: { referrerId: payload.userId },
      _sum: { earnings: true },
    });

    // List of referred users
    const referredUsers = await db.user.findMany({
      where: { referredBy: user.referralCode },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        enrollments: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      referralCode: user.referralCode,
      totalReferrals,
      activeReferrals,
      totalEarnings: referralEarnings._sum.earnings || 0,
      referredUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
