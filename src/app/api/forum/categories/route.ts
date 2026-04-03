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
  { name: 'General Discussion', slug: 'general', icon: 'MessageCircle', color: '#6366F1', order: 0, description: 'General community discussion' },
  { name: 'Trading Strategies', slug: 'trading', icon: 'TrendingUp', color: '#10B981', order: 1, description: 'Share and discuss trading strategies' },
  { name: 'Investment Tips', slug: 'investments', icon: 'Lightbulb', color: '#F59E0B', order: 2, description: 'Investment tips and advice' },
  { name: 'Course Help', slug: 'courses', icon: 'BookOpen', color: '#8B5CF6', order: 3, description: 'Help with Hustle University courses' },
  { name: 'Off-Topic', slug: 'off-topic', icon: 'Coffee', color: '#EC4899', order: 4, description: 'Anything else on your mind' },
];

async function seedCategories() {
  const count = await db.forumCategory.count();
  if (count === 0) {
    await db.forumCategory.createMany({ data: DEFAULT_CATEGORIES });
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET /api/forum/categories - List active categories with topic counts (public)
export async function GET() {
  try {
    await seedCategories();

    const categories = await db.forumCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { topics: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Forum Categories List Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/forum/categories - Create category (admin only)
export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    await seedCategories();

    const body = await req.json();
    const { name, slug, description, icon, color, order } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required.' }, { status: 400 });
    }

    const finalSlug = slug || slugify(name);

    const existing = await db.forumCategory.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return NextResponse.json({ error: 'A category with this slug already exists.' }, { status: 400 });
    }

    const category = await db.forumCategory.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description || null,
        icon: icon || 'MessageSquare',
        color: color || '#D4AF37',
        order: typeof order === 'number' ? order : 0,
      },
      include: {
        _count: { select: { topics: true } },
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Forum Category Create Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
