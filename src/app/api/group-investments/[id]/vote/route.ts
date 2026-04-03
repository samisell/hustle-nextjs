import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/group-investments/[id]/vote - Vote on deal (auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const deal = await db.investmentDeal.findUnique({ where: { id } });
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    if (deal.status !== 'voting') {
      return NextResponse.json(
        { error: 'Voting is not open for this deal. Current status: ' + deal.status },
        { status: 400 }
      );
    }

    // Check voting deadline
    if (deal.votingDeadline && new Date(deal.votingDeadline) < new Date()) {
      return NextResponse.json({ error: 'Voting deadline has passed.' }, { status: 400 });
    }

    const body = await req.json();
    const { vote, comment } = body;

    if (!vote || (vote !== 'for' && vote !== 'against')) {
      return NextResponse.json({ error: 'Vote must be "for" or "against".' }, { status: 400 });
    }

    // Upsert vote
    await db.dealVote.upsert({
      where: {
        dealId_userId: { dealId: id, userId: payload.userId },
      },
      create: {
        dealId: id,
        userId: payload.userId,
        vote,
        comment: comment || null,
      },
      update: {
        vote,
        comment: comment || null,
      },
    });

    // Recalculate vote counts
    const votesFor = await db.dealVote.count({
      where: { dealId: id, vote: 'for' },
    });
    const votesAgainst = await db.dealVote.count({
      where: { dealId: id, vote: 'against' },
    });

    const totalVotes = votesFor + votesAgainst;
    const approvalRate = totalVotes > 0 ? votesFor / totalVotes : 0;

    // Check if voting threshold is met
    let newStatus = deal.status;
    let autoTransitioned = false;

    if (totalVotes >= deal.minVotes && approvalRate >= deal.approvalThreshold) {
      newStatus = 'funding';
      autoTransitioned = true;
    }

    const updatedDeal = await db.investmentDeal.update({
      where: { id },
      data: {
        votesFor,
        votesAgainst,
        status: newStatus,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
      },
    });

    // Notify user
    await db.notification.create({
      data: {
        userId: payload.userId,
        title: 'Vote Recorded',
        message: `Your vote "${vote}" on "${deal.title}" has been recorded. Current tally: ${votesFor} for, ${votesAgainst} against.${autoTransitioned ? ' The deal has been approved and moved to funding!' : ''}`,
        type: autoTransitioned ? 'success' : 'info',
      },
    });

    // If auto-transitioned, notify all voters
    if (autoTransitioned) {
      const allVoters = await db.dealVote.findMany({
        where: { dealId: id, userId: { not: payload.userId } },
        select: { userId: true },
        distinct: ['userId'],
      });

      for (const voter of allVoters) {
        await db.notification.create({
          data: {
            userId: voter.userId,
            title: 'Deal Approved!',
            message: `"${deal.title}" has received enough votes (${votesFor}/${totalVotes}) and is now open for funding!`,
            type: 'success',
          },
        });
      }
    }

    return NextResponse.json({
      deal: updatedDeal,
      vote: { vote, comment: comment || null },
      autoTransitioned,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Deal Vote Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
