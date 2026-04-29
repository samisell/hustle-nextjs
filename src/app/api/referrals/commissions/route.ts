import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getCommissionSummary } from '@/lib/mlm';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/referrals/commissions - Paginated commissions with summary
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const levelParam = searchParams.get('level');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: { userId: string; level?: number } = { userId: payload.userId };
    if (levelParam) {
      const level = parseInt(levelParam, 10);
      if (![1, 2, 3].includes(level)) {
        return NextResponse.json({ error: 'Invalid level. Must be 1, 2, or 3.' }, { status: 400 });
      }
      where.level = level;
    }

    const [commissions, total] = await Promise.all([
      db.commission.findMany({
        where,
        include: {
          sourceUser: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.commission.count({ where }),
    ]);

    const summary = await getCommissionSummary(payload.userId);

    return NextResponse.json({
      commissions: commissions.map((c) => ({
        id: c.id,
        sourceUser: c.sourceUser.name,
        sourceEmail: c.sourceUser.email,
        level: c.level,
        amount: c.amount,
        percentage: c.percentage,
        description: c.description,
        createdAt: c.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalEarned: summary.totalEarned,
        level1Earnings: summary.level1Earnings,
        level2Earnings: summary.level2Earnings,
        level3Earnings: summary.level3Earnings,
        level1Count: summary.level1Count,
        level2Count: summary.level2Count,
        level3Count: summary.level3Count,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
