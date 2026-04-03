import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

function isAdmin(payload: { userId: string; email: string; role: string } | null) {
  return payload?.role === 'admin';
}

// GET /api/skill-categories - List active categories (public)
export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    const showAll = isAdmin(payload);

    const categories = await db.skillCategory.findMany({
      where: showAll ? {} : { isActive: true },
      include: {
        _count: {
          select: { courses: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/skill-categories - Create category (admin only)
export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload || !isAdmin(payload)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, description, icon, color, order } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const finalSlug = slug?.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existing = await db.skillCategory.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug: finalSlug }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'A category with this name or slug already exists.' }, { status: 400 });
    }

    const category = await db.skillCategory.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        icon: icon?.trim() || 'BookOpen',
        color: color?.trim() || '#D4AF37',
        order: typeof order === 'number' ? order : 0,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
