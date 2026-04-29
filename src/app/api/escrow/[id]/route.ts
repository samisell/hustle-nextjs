import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getFundingPercentage } from '@/lib/escrow';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

type MyContribution = {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  txRef: string | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
};

// GET /api/escrow/[id] - Get full escrow details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const escrow = await db.escrowTransaction.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        contributions: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        milestones: {
          orderBy: { order: 'asc' },
          include: {
            approvedByUser: { select: { id: true, name: true, email: true } },
          },
        },
        disputes: {
          include: {
            raisedBy: { select: { id: true, name: true, email: true } },
            resolver: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!escrow) {
      return NextResponse.json({ error: 'Escrow not found.' }, { status: 404 });
    }

    // Calculate funding percentage
    const fundingPercentage = getFundingPercentage(escrow.collectedAmount, escrow.targetAmount);

    // For regular users, find their specific contribution
    let myContribution: MyContribution | null = null;
    if (payload.role !== 'admin') {
      const contribution = escrow.contributions.find(
        (c) => c.userId === payload.userId
      );
      if (contribution) {
        myContribution = {
          id: contribution.id,
          amount: contribution.amount,
          status: contribution.status,
          paymentMethod: contribution.paymentMethod,
          txRef: contribution.txRef,
          paidAt: contribution.paidAt,
          refundedAt: contribution.refundedAt,
          createdAt: contribution.createdAt,
        };
      }
    }

    // Build response
    const response: Record<string, unknown> = {
      id: escrow.id,
      title: escrow.title,
      description: escrow.description,
      type: escrow.type,
      status: escrow.status,
      targetAmount: escrow.targetAmount,
      collectedAmount: escrow.collectedAmount,
      currency: escrow.currency,
      feePercent: escrow.feePercent,
      minContribution: escrow.minContribution,
      maxContribution: escrow.maxContribution,
      fundingDeadline: escrow.fundingDeadline,
      releaseDate: escrow.releaseDate,
      terms: escrow.terms,
      fundingPercentage,
      creator: escrow.creator,
      contributions: payload.role === 'admin'
        ? escrow.contributions.map((c) => ({
            id: c.id,
            amount: c.amount,
            status: c.status,
            paymentMethod: c.paymentMethod,
            txRef: c.txRef,
            paidAt: c.paidAt,
            refundedAt: c.refundedAt,
            createdAt: c.createdAt,
            user: c.user,
          }))
        : escrow.contributions.map((c) => ({
            id: c.id,
            amount: c.amount,
            status: c.status,
            paymentMethod: c.paymentMethod,
            createdAt: c.createdAt,
            user: {
              id: c.user.id,
              name: c.user.name,
            },
          })),
      milestones: escrow.milestones,
      disputes: escrow.disputes,
      createdAt: escrow.createdAt,
      updatedAt: escrow.updatedAt,
    };

    if (myContribution) {
      response.myContribution = myContribution;
    }
    response.hasContributed = !!myContribution;

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Escrow Detail Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
