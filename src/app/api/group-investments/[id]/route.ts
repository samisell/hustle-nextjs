import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/group-investments/[id] - Get deal details (auth required)
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

    const deal = await db.investmentDeal.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true, description: true },
        },
        creator: {
          select: { id: true, name: true },
        },
        contributions: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { amount: 'desc' },
        },
        votes: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    // Calculate funding percentage
    const fundingPercentage = deal.targetAmount > 0
      ? Math.round((deal.currentPool / deal.targetAmount) * 100 * 100) / 100
      : 0;

    // Check if current user has voted or contributed
    const userVote = deal.votes.find((v) => v.userId === payload.userId) || null;
    const userContribution = deal.contributions.find((c) => c.userId === payload.userId) || null;

    return NextResponse.json({
      deal: {
        ...deal,
        fundingPercentage,
        myVote: userVote ? { vote: userVote.vote, comment: userVote.comment } : null,
        myContribution: userContribution
          ? { amount: userContribution.amount, sharePercent: userContribution.sharePercent }
          : null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Deal Detail Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/group-investments/[id] - Update deal (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.investmentDeal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      longDescription,
      categoryId,
      location,
      minContribution,
      maxContribution,
      targetAmount,
      roiPercent,
      duration,
      maturityDate,
      votingDeadline,
      imageUrl,
      riskLevel,
      status,
      minVotes,
      approvalThreshold,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (longDescription !== undefined) updateData.longDescription = longDescription;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (location !== undefined) updateData.location = location;
    if (minContribution !== undefined) updateData.minContribution = minContribution;
    if (maxContribution !== undefined) updateData.maxContribution = maxContribution;
    if (targetAmount !== undefined) updateData.targetAmount = targetAmount;
    if (roiPercent !== undefined) updateData.roiPercent = roiPercent;
    if (duration !== undefined) updateData.duration = duration;
    if (maturityDate !== undefined) updateData.maturityDate = maturityDate ? new Date(maturityDate) : null;
    if (votingDeadline !== undefined) updateData.votingDeadline = votingDeadline ? new Date(votingDeadline) : null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (riskLevel !== undefined) updateData.riskLevel = riskLevel;
    if (status !== undefined) updateData.status = status;
    if (minVotes !== undefined) updateData.minVotes = minVotes;
    if (approvalThreshold !== undefined) updateData.approvalThreshold = approvalThreshold;

    const validStatuses = ['proposed', 'voting', 'funding', 'active', 'matured', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const deal = await db.investmentDeal.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
      },
    });

    return NextResponse.json({ deal });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Deal Update Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/group-investments/[id] - Cancel deal and refund (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const deal = await db.investmentDeal.findUnique({
      where: { id },
      include: {
        contributions: {
          where: { status: 'confirmed' },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    if (deal.status === 'completed' || deal.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot cancel a completed or already cancelled deal.' }, { status: 400 });
    }

    // Refund all confirmed contributions
    let totalRefunded = 0;
    for (const contribution of deal.contributions) {
      if (contribution.amount > 0) {
        // Credit wallet
        const wallet = await db.wallet.findUnique({ where: { userId: contribution.userId } });
        if (wallet) {
          await db.wallet.update({
            where: { userId: contribution.userId },
            data: { balance: { increment: contribution.amount } },
          });

          // Create transaction record
          await db.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'credit',
              amount: contribution.amount,
              description: `Refund for cancelled deal "${deal.title}"`,
            },
          });

          // Create earning record
          await db.earning.create({
            data: {
              walletId: wallet.id,
              userId: contribution.userId,
              amount: contribution.amount,
              source: 'investment',
              description: `Refund for cancelled deal "${deal.title}"`,
            },
          });

          // Notify user
          await db.notification.create({
            data: {
              userId: contribution.userId,
              title: 'Deal Cancelled - Refund Processed',
              message: `The deal "${deal.title}" has been cancelled. $${contribution.amount.toFixed(2)} has been refunded to your wallet.`,
              type: 'warning',
            },
          });

          totalRefunded += contribution.amount;
        }

        // Mark contribution as refunded
        await db.dealContribution.update({
          where: { id: contribution.id },
          data: { status: 'refunded' },
        });
      }
    }

    // Update deal status
    await db.investmentDeal.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({
      message: 'Deal cancelled successfully.',
      totalRefunded,
      contributorsRefunded: deal.contributions.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Deal Cancel Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
