import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

const PLANS: Record<string, { price: number; name: string }> = {
  basic: { price: 9.99, name: 'Basic' },
  pro: { price: 29.99, name: 'Pro' },
  premium: { price: 99.99, name: 'Premium' },
};

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

    return NextResponse.json({ subscription });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        { error: `Invalid plan. Choose from: ${Object.keys(PLANS).join(', ')}` },
        { status: 400 }
      );
    }

    const planDetails = PLANS[plan];
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Create mock payment
    const payment = await db.payment.create({
      data: {
        userId: payload.userId,
        amount: planDetails.price,
        status: 'completed',
        paymentMethod: 'mock',
        description: `${planDetails.name} plan subscription`,
      },
    });

    // Create or update subscription
    const subscription = await db.subscription.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        plan,
        status: 'active',
        startDate,
        endDate,
      },
      update: {
        plan,
        status: 'active',
        startDate,
        endDate,
      },
    });

    // Notify user
    await db.notification.create({
      data: {
        userId: payload.userId,
        title: 'Subscription Activated!',
        message: `You have successfully subscribed to the ${planDetails.name} plan for $${planDetails.price}/mo.`,
        type: 'success',
      },
    });

    return NextResponse.json({ subscription, payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
