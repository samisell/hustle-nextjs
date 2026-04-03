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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/group-investments/categories - List categories (public)
export async function GET() {
  try {
    await seedCategories();

    const categories = await db.investmentCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { deals: true },
        },
      },
    });

    const categoriesWithCounts = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
      image: cat.image,
      order: cat.order,
      dealCount: cat._count.deals,
    }));

    return NextResponse.json({ categories: categoriesWithCounts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Categories List Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/group-investments/categories - Create category (admin only)
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
    const { name, slug, description, icon, color, image, order, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
    }

    const generatedSlug = slug || slugify(name);

    // Check if slug already exists
    const existing = await db.investmentCategory.findUnique({
      where: { slug: generatedSlug },
    });
    if (existing) {
      return NextResponse.json({ error: 'A category with this slug already exists.' }, { status: 409 });
    }

    const category = await db.investmentCategory.create({
      data: {
        name,
        slug: generatedSlug,
        description,
        icon: icon ?? 'TrendingUp',
        color: color ?? '#D4AF37',
        image,
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Category Create Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
