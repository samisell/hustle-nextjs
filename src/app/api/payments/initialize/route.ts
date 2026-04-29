import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { initializePayment, generateTxRef, getPublicKey } from '@/lib/flutterwave';

const PLANS: Record<string, { price: number; name: string }> = {
  basic: { price: 9.99, name: 'Basic' },
  pro: { price: 29.99, name: 'Pro' },
  premium: { price: 99.99, name: 'Premium' },
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, plan, amount } = body;

    // Determine payment type and amount
    let paymentAmount = amount;
    let description = '';
    let metadata: Record<string, any> = {};

    if (type === 'subscription') {
      if (!plan || !PLANS[plan]) {
        return NextResponse.json(
          { error: `Invalid plan. Choose from: ${Object.keys(PLANS).join(', ')}` },
          { status: 400 }
        );
      }
      paymentAmount = PLANS[plan].price;
      description = `${PLANS[plan].name} plan subscription`;
      metadata.plan = plan;
    } else if (type === 'wallet_funding') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Invalid funding amount.' }, { status: 400 });
      }
      if (amount < 5) {
        return NextResponse.json({ error: 'Minimum funding amount is $5.' }, { status: 400 });
      }
      if (amount > 10000) {
        return NextResponse.json({ error: 'Maximum funding amount is $10,000.' }, { status: 400 });
      }
      description = 'Wallet funding';
    } else {
      return NextResponse.json(
        { error: 'Invalid payment type. Use "subscription" or "wallet_funding".' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Generate unique transaction reference
    const txRef = generateTxRef(type === 'subscription' ? 'SUB' : 'WLT');

    // Create pending payment record in database
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount: paymentAmount,
        currency: 'USD',
        status: 'pending',
        paymentMethod: 'flutterwave',
        paymentType: type,
        txRef,
        description,
        metadata: JSON.stringify(metadata),
      },
    });

    // Initialize Flutterwave payment
    try {
      const fwResponse = await initializePayment({
        tx_ref: txRef,
        amount: paymentAmount,
        currency: 'USD',
        redirect_url: `${APP_URL}/?payment_callback=true&tx_ref=${txRef}`,
        customer: {
          email: user.email,
          name: user.name,
        },
        customizations: {
          title: type === 'subscription' ? `Hustle University - ${PLANS[plan]?.name || ''} Plan` : 'Hustle University - Fund Wallet',
          description,
          logo: `${APP_URL}/logo.png`,
        },
        payment_options: 'card,banktransfer,ussd,mobilemoneyghana',
      });

      return NextResponse.json({
        paymentId: payment.id,
        txRef,
        amount: paymentAmount,
        paymentLink: fwResponse.data.link,
        publicKey: getPublicKey(),
      }, { status: 201 });
    } catch (fwError: any) {
      // Mark payment as failed if Flutterwave initialization fails
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });

      return NextResponse.json(
        { error: `Payment initialization failed: ${fwError.message}` },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('[Payment Initialize Error]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
