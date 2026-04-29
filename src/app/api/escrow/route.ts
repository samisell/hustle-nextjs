import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createEscrow, getFundingPercentage } from '@/lib/escrow';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/escrow - List escrows
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const typeFilter = searchParams.get('type');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (statusFilter) where.status = statusFilter;
    if (typeFilter) where.type = typeFilter;

    if (payload.role === 'admin') {
      // Admin: return all escrows with contributor counts
      const escrows = await db.escrowTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          _count: {
            select: {
              contributions: true,
              milestones: true,
              disputes: true,
            },
          },
        },
      });

      const escrowsWithStats = escrows.map((escrow) => ({
        id: escrow.id,
        title: escrow.title,
        description: escrow.description,
        type: escrow.type,
        status: escrow.status,
        targetAmount: escrow.targetAmount,
        collectedAmount: escrow.collectedAmount,
        currency: escrow.currency,
        feePercent: escrow.feePercent,
        fundingDeadline: escrow.fundingDeadline,
        releaseDate: escrow.releaseDate,
        createdAt: escrow.createdAt,
        updatedAt: escrow.updatedAt,
        fundingPercentage: getFundingPercentage(escrow.collectedAmount, escrow.targetAmount),
        creator: escrow.creator,
        contributorCount: escrow._count.contributions,
        milestoneCount: escrow._count.milestones,
        disputeCount: escrow._count.disputes,
      }));

      return NextResponse.json({ escrows: escrowsWithStats });
    }

    // Regular user: return escrows with their contribution status
    const escrows = await db.escrowTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        contributions: {
          where: { userId: payload.userId },
          select: { id: true, amount: true, status: true, paymentMethod: true },
        },
      },
    });

    const escrowsWithContribution = escrows.map((escrow) => ({
      id: escrow.id,
      title: escrow.title,
      description: escrow.description,
      type: escrow.type,
      status: escrow.status,
      targetAmount: escrow.targetAmount,
      collectedAmount: escrow.collectedAmount,
      currency: escrow.currency,
      feePercent: escrow.feePercent,
      fundingDeadline: escrow.fundingDeadline,
      releaseDate: escrow.releaseDate,
      createdAt: escrow.createdAt,
      updatedAt: escrow.updatedAt,
      fundingPercentage: getFundingPercentage(escrow.collectedAmount, escrow.targetAmount),
      creator: escrow.creator,
      myContribution: escrow.contributions[0] || null,
      hasContributed: escrow.contributions.length > 0,
    }));

    return NextResponse.json({ escrows: escrowsWithContribution });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Escrow List Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/escrow - Create escrow (admin only)
export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      type,
      targetAmount,
      feePercent,
      minContribution,
      maxContribution,
      fundingDeadline,
      releaseDate,
      terms,
      milestones,
    } = body;

    if (!title || !targetAmount) {
      return NextResponse.json(
        { error: 'Title and targetAmount are required.' },
        { status: 400 }
      );
    }

    if (typeof targetAmount !== 'number' || targetAmount <= 0) {
      return NextResponse.json(
        { error: 'Target amount must be a positive number.' },
        { status: 400 }
      );
    }

    const escrow = await createEscrow(payload.userId, {
      title,
      description,
      type,
      targetAmount,
      feePercent,
      minContribution,
      maxContribution,
      fundingDeadline,
      releaseDate,
      terms,
      milestones,
    });

    return NextResponse.json({ escrow }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Escrow Create Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
