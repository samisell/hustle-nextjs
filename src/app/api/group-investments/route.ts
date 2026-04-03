import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

const DEFAULT_CATEGORIES = [
  { name: 'Real Estate', slug: 'real-estate', icon: 'Building2', color: '#10B981', order: 0, description: 'Real estate investment opportunities' },
  { name: 'Startups & Angel Investing', slug: 'startups', icon: 'Rocket', color: '#8B5CF6', order: 1, description: 'Early-stage startup and angel investments' },
  { name: 'Crypto & NFTs', slug: 'crypto-nfts', icon: 'Bitcoin', color: '#F59E0B', order: 2, description: 'Cryptocurrency and NFT investment opportunities' },
  { name: 'Agriculture & Commodities', slug: 'agriculture', icon: 'Wheat', color: '#22C55E', order: 3, description: 'Agricultural and commodity investments' },
  { name: 'Crowdfunding', slug: 'crowdfunding', icon: 'Users', color: '#EC4899', order: 4, description: 'Community crowdfunding opportunities' },
];

async function seedCategories() {
  const count = await db.investmentCategory.count();
  if (count === 0) {
    await db.investmentCategory.createMany({ data: DEFAULT_CATEGORIES });
  }
}

// GET /api/group-investments - List all deals
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const categoryFilter = searchParams.get('category');

    const where: Record<string, unknown> = {};
    if (statusFilter) where.status = statusFilter;
    if (categoryFilter) {
      const category = await db.investmentCategory.findUnique({
        where: { slug: categoryFilter },
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    const deals = await db.investmentDeal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
        creator: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            votes: true,
            contributions: true,
          },
        },
      },
    });

    // Get user's votes and contributions for these deals
    const dealIds = deals.map((d) => d.id);
    const userVotes = await db.dealVote.findMany({
      where: { dealId: { in: dealIds }, userId: payload.userId },
      select: { dealId: true, vote: true },
    });
    const userContributions = await db.dealContribution.findMany({
      where: { dealId: { in: dealIds }, userId: payload.userId },
      select: { dealId: true, amount: true },
    });

    const myVotes: Record<string, string> = {};
    userVotes.forEach((v) => { myVotes[v.dealId] = v.vote; });
    const myContributions: Record<string, number> = {};
    userContributions.forEach((c) => { myContributions[c.dealId] = c.amount; });

    return NextResponse.json({ deals, myVotes, myContributions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Group Investments List Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/group-investments - Create deal (admin only)
export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    // Seed categories if none exist
    await seedCategories();

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
      minVotes,
      approvalThreshold,
    } = body;

    if (!title || !description || !targetAmount || !roiPercent || !duration) {
      return NextResponse.json(
        { error: 'title, description, targetAmount, roiPercent, and duration are required.' },
        { status: 400 }
      );
    }

    if (typeof targetAmount !== 'number' || targetAmount <= 0) {
      return NextResponse.json({ error: 'targetAmount must be a positive number.' }, { status: 400 });
    }

    if (typeof roiPercent !== 'number' || roiPercent < 0) {
      return NextResponse.json({ error: 'roiPercent must be a non-negative number.' }, { status: 400 });
    }

    const deal = await db.investmentDeal.create({
      data: {
        title,
        description,
        longDescription,
        categoryId,
        location,
        minContribution: minContribution ?? 10,
        maxContribution,
        targetAmount,
        roiPercent,
        duration,
        maturityDate: maturityDate ? new Date(maturityDate) : undefined,
        votingDeadline: votingDeadline ? new Date(votingDeadline) : undefined,
        imageUrl,
        riskLevel: riskLevel ?? 'medium',
        minVotes: minVotes ?? 10,
        approvalThreshold: approvalThreshold ?? 0.6,
        createdBy: payload.userId,
        status: 'proposed',
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
      },
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Group Investment Create Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
