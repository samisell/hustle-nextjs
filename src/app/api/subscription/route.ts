import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: payload.userId },
    });

    const payments = await db.payment.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const formattedPayments = payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      description: p.description || '',
      createdAt: p.createdAt.toISOString(),
    }));

    const formattedSubscription = subscription ? {
      plan: subscription.plan,
      status: subscription.status,
      startDate: subscription.startDate ? subscription.startDate.toISOString() : null,
      endDate: subscription.endDate ? subscription.endDate.toISOString() : null,
    } : {
      plan: 'none',
      status: 'inactive',
      startDate: null,
      endDate: null,
    };

    return NextResponse.json({
      subscription: formattedSubscription,
      payments: formattedPayments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
