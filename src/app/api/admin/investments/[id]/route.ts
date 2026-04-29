import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/investments/[id] - Get investment detail with investors list
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const opportunity = await db.investmentOpportunity.findUnique({
      where: { id },
      include: {
        investments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Investment opportunity not found.' }, { status: 404 });
    }

    return NextResponse.json({
      id: opportunity.id,
      title: opportunity.title,
      description: opportunity.description,
      status: opportunity.status,
      minInvestment: opportunity.minInvestment,
      maxInvestment: opportunity.maxInvestment,
      roiPercent: opportunity.roiPercent,
      duration: opportunity.duration,
      totalPool: opportunity.totalPool,
      createdAt: opportunity.createdAt.toISOString(),
      updatedAt: opportunity.updatedAt.toISOString(),
      investorCount: opportunity.investments.length,
      investors: opportunity.investments.map((inv) => ({
        id: inv.id,
        userId: inv.userId,
        userName: inv.user.name,
        userEmail: inv.user.email,
        amount: inv.amount,
        roiPercent: inv.roiPercent,
        expectedReturn: inv.expectedReturn,
        status: inv.status,
        startDate: inv.startDate.toISOString(),
        endDate: inv.endDate?.toISOString() || null,
        createdAt: inv.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Get investment detail error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/investments/[id] - Update investment opportunity
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, description, status, minInvestment, maxInvestment, roiPercent, duration } = body;

    if (!title && !description && !status && !minInvestment && !maxInvestment && !roiPercent && !duration) {
      return NextResponse.json({ error: 'At least one field is required.' }, { status: 400 });
    }

    if (status && !['active', 'closed', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be active, closed, or completed.' },
        { status: 400 }
      );
    }

    if (minInvestment !== undefined && (minInvestment <= 0)) {
      return NextResponse.json({ error: 'Min investment must be positive.' }, { status: 400 });
    }

    if (maxInvestment !== undefined && (maxInvestment <= 0)) {
      return NextResponse.json({ error: 'Max investment must be positive.' }, { status: 400 });
    }

    if (roiPercent !== undefined && roiPercent <= 0) {
      return NextResponse.json({ error: 'ROI percent must be positive.' }, { status: 400 });
    }

    const existingOpportunity = await db.investmentOpportunity.findUnique({ where: { id } });
    if (!existingOpportunity) {
      return NextResponse.json({ error: 'Investment opportunity not found.' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (minInvestment !== undefined) updateData.minInvestment = minInvestment;
    if (maxInvestment !== undefined) updateData.maxInvestment = maxInvestment;
    if (roiPercent !== undefined) updateData.roiPercent = roiPercent;
    if (duration) updateData.duration = duration;

    const updatedOpportunity = await db.investmentOpportunity.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedOpportunity.id,
      title: updatedOpportunity.title,
      description: updatedOpportunity.description,
      status: updatedOpportunity.status,
      minInvestment: updatedOpportunity.minInvestment,
      maxInvestment: updatedOpportunity.maxInvestment,
      roiPercent: updatedOpportunity.roiPercent,
      duration: updatedOpportunity.duration,
      totalPool: updatedOpportunity.totalPool,
      createdAt: updatedOpportunity.createdAt.toISOString(),
      updatedAt: updatedOpportunity.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Update investment error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/investments/[id] - Delete investment opportunity
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const existingOpportunity = await db.investmentOpportunity.findUnique({
      where: { id },
      include: { _count: { select: { investments: true } } },
    });

    if (!existingOpportunity) {
      return NextResponse.json({ error: 'Investment opportunity not found.' }, { status: 404 });
    }

    if (existingOpportunity._count.investments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete investment opportunity with active investors.' },
        { status: 400 }
      );
    }

    await db.investmentOpportunity.delete({ where: { id } });

    return NextResponse.json({
      message: `Investment opportunity "${existingOpportunity.title}" has been deleted.`,
    });
  } catch (error: any) {
    console.error('Delete investment error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
