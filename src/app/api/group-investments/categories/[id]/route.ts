import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// PATCH /api/group-investments/categories/[id] - Update category (admin only)
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

    const existing = await db.investmentCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { name, slug, description, icon, color, image, order, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (image !== undefined) updateData.image = image;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If slug is being changed, check uniqueness
    if (slug && slug !== existing.slug) {
      const slugExists = await db.investmentCategory.findUnique({ where: { slug } });
      if (slugExists) {
        return NextResponse.json({ error: 'A category with this slug already exists.' }, { status: 409 });
      }
    }

    const category = await db.investmentCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ category });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Category Update Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/group-investments/categories/[id] - Delete category (admin only)
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

    const existing = await db.investmentCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { deals: true },
        },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    // Check for active deals in this category
    const activeDeals = await db.investmentDeal.count({
      where: {
        categoryId: id,
        status: { in: ['proposed', 'voting', 'funding', 'active'] },
      },
    });
    if (activeDeals > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${activeDeals} active deal(s).` },
        { status: 400 }
      );
    }

    await db.investmentCategory.delete({ where: { id } });

    return NextResponse.json({ message: 'Category deleted successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Category Delete Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
