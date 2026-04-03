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

// GET /api/forum/topics - Paginated topics with author, category, replyCount
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await seedCategories();

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;

    const [topics, total] = await Promise.all([
      db.forumTopic.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { lastReplyAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
          category: {
            select: { id: true, name: true, slug: true, icon: true, color: true },
          },
        },
      }),
      db.forumTopic.count({ where }),
    ]);

    return NextResponse.json({
      topics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Forum Topics List Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/forum/topics - Create topic
export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await seedCategories();

    const body = await req.json();
    const { title, content, categoryId, tags } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'title is required.' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required.' }, { status: 400 });
    }

    if (categoryId) {
      const category = await db.forumCategory.findUnique({ where: { id: categoryId } });
      if (!category || !category.isActive) {
        return NextResponse.json({ error: 'Invalid or inactive category.' }, { status: 400 });
      }
    }

    const topic = await db.forumTopic.create({
      data: {
        userId: payload.userId,
        title: title.trim(),
        content: content.trim(),
        categoryId: categoryId || null,
        tags: tags ? JSON.stringify(tags) : null,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
      },
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Forum Topic Create Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
