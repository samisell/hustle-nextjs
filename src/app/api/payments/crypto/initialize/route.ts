import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, generateReferralCode } from '@/lib/auth';
import { createInvoice, isConfigured } from '@/lib/cryptomus';
import { generateTxRef } from '@/lib/flutterwave';

const PLANS: Record<string, { price: number; name: string }> = {
  basic: { price: 9.99, name: 'Basic' },
  pro: { price: 29.99, name: 'Pro' },
  premium: { price: 99.99, name: 'Premium' },
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    // Check if Cryptomus is configured
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'Crypto payments are not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

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
    const { type, plan, amount, currency } = body;

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

    // Generate unique order ID for Cryptomus
    const txRef = generateTxRef(type === 'subscription' ? 'CRC-SUB' : 'CRC-WLT');

    // Create pending payment record in database
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount: paymentAmount,
        currency: 'USD',
        status: 'pending',
        paymentMethod: 'cryptomus',
        paymentType: type,
        txRef,
        description,
        metadata: JSON.stringify({ ...metadata, paymentMethod: 'cryptomus' }),
      },
    });

    // Create Cryptomus invoice
    try {
      const invoiceResponse = await createInvoice({
        amount: String(paymentAmount),
        currency: currency || 'usd',
        order_id: txRef,
        url_callback: `${APP_URL}/api/payments/crypto/webhook`,
        url_return: `${APP_URL}/?payment_callback=true&tx_ref=${txRef}&method=crypto`,
        url_success: `${APP_URL}/?payment_callback=true&tx_ref=${txRef}&method=crypto`,
        lifetime: 3600, // 1 hour expiration
        name: type === 'subscription' ? `Hustle University - ${PLANS[plan]?.name || ''} Plan` : 'Hustle University - Fund Wallet',
        description,
      });

      const invoice = invoiceResponse.result;

      // Store the invoice UUID in metadata for later verification
      await db.payment.update({
        where: { id: payment.id },
        data: {
          metadata: JSON.stringify({
            ...metadata,
            paymentMethod: 'cryptomus',
            invoiceUuid: invoice.uuid,
          }),
        },
      });

      return NextResponse.json({
        paymentId: payment.id,
        txRef,
        amount: paymentAmount,
        checkoutUrl: invoice.url,
        // Payment details for in-app display
        cryptoDetails: {
          address: invoice.address,
          network: invoice.network,
          paymentAmount: invoice.payment_amount,
          paymentCurrency: invoice.payment_currency,
          qrCode: invoice.qr_code,
          currency: invoice.currency,
          amount: invoice.amount,
          status: invoice.status,
          uuid: invoice.uuid,
          expiresAt: invoice.expired_at,
        },
      }, { status: 201 });
    } catch (cryptoError: any) {
      // Mark payment as failed if Cryptomus initialization fails
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });

      return NextResponse.json(
        { error: `Crypto payment initialization failed: ${cryptoError.message}` },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('[Crypto Payment Initialize Error]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
