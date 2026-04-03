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

// GET /api/admin/users/[id] - Get full user detail
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
        updatedAt: true,
        wallet: { select: { id: true, balance: true } },
        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            investments: true,
            referrals: true,
            payments: true,
            withdrawals: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Fetch recent transactions (last 10)
    const recentTransactions = user.wallet
      ? await db.transaction.findMany({
          where: { walletId: user.wallet.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
      : [];

    // Fetch recent payments (last 10)
    const recentPayments = await db.payment.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      ...user,
      balance: user.wallet?.balance ?? 0,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        paymentType: p.paymentType,
        txRef: p.txRef,
        description: p.description,
        paidAt: p.paidAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Get user detail error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Update user fields (name, role)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, role } = body;

    if (!name && !role) {
      return NextResponse.json({ error: 'At least one field (name or role) is required.' }, { status: 400 });
    }

    if (role && !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be "user" or "admin".' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const updateData: { name?: string; role?: string } = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        referralCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Soft-disable user (set role to 'suspended')
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Prevent disabling the last admin
    if (existingUser.role === 'admin') {
      const adminCount = await db.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot suspend the last admin.' }, { status: 400 });
      }
    }

    const suspendedUser = await db.user.update({
      where: { id },
      data: { role: 'suspended' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        referralCode: true,
        createdAt: true,
      },
    });

    // Notify the user
    await db.notification.create({
      data: {
        userId: id,
        title: 'Account Suspended',
        message: 'Your account has been suspended by an administrator. Please contact support for assistance.',
        type: 'error',
      },
    });

    return NextResponse.json({ user: suspendedUser });
  } catch (error: any) {
    console.error('Suspend user error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
