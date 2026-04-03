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

// GET /api/admin/investments/list - List all investment opportunities with investor counts and pool totals
export async function GET(req: NextRequest) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const opportunities = await db.investmentOpportunity.findMany({
      include: {
        _count: {
          select: { investments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      opportunities.map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        status: o.status,
        minInvestment: o.minInvestment,
        maxInvestment: o.maxInvestment,
        roiPercent: o.roiPercent,
        duration: o.duration,
        totalPool: o.totalPool,
        investorCount: o._count.investments,
        createdAt: o.createdAt.toISOString(),
      }))
    );
  } catch (error: any) {
    console.error('List investment opportunities error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
