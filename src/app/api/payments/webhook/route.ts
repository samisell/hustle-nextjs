import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhookSignature, verifyTransaction } from '@/lib/flutterwave';

const PLANS: Record<string, { price: number; name: string }> = {
  basic: { price: 9.99, name: 'Basic' },
  pro: { price: 29.99, name: 'Pro' },
  premium: { price: 99.99, name: 'Premium' },
};

/**
 * POST /api/payments/webhook
 * Webhook endpoint called by Flutterwave when a payment event occurs
 *
 * This endpoint:
 * 1. Verifies the webhook signature
 * 2. Verifies the transaction with Flutterwave API
 * 3. Updates the payment status in our database
 * 4. Activates subscription or funds wallet accordingly
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('[Flutterwave Webhook] Received event:', body.event, 'tx_ref:', body.data?.tx_ref);

    // Verify webhook signature (skip if not configured for dev)
    const isValid = verifyWebhookSignature(body);
    if (!isValid) {
      console.warn('[Flutterwave Webhook] Invalid signature — rejecting');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Only process completed charge events
    if (body.event !== 'charge.completed') {
      console.log('[Flutterwave Webhook] Ignoring event:', body.event);
      return NextResponse.json({ status: 'ignored' });
    }

    const { data } = body;
    const txRef = data.tx_ref;

    if (!txRef) {
      console.warn('[Flutterwave Webhook] No tx_ref in payload');
      return NextResponse.json({ error: 'Missing tx_ref' }, { status: 400 });
    }

    // Double-verify the transaction with Flutterwave API
    let verificationData;
    try {
      verificationData = await verifyTransaction(data.id);
    } catch (err) {
      console.error('[Flutterwave Webhook] Verification failed:', err);
      return NextResponse.json({ error: 'Verification failed' }, { status: 502 });
    }

    if (verificationData.data.status !== 'successful') {
      console.log('[Flutterwave Webhook] Transaction not successful:', verificationData.data.status);
      return NextResponse.json({ status: 'not_successful' });
    }

    // Find the payment in our database
    const payment = await db.payment.findUnique({
      where: { txRef },
    });

    if (!payment) {
      console.warn('[Flutterwave Webhook] Payment not found for tx_ref:', txRef);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Skip if already processed
    if (payment.status === 'completed') {
      console.log('[Flutterwave Webhook] Payment already processed:', txRef);
      return NextResponse.json({ status: 'already_processed' });
    }

    // Update payment as completed
    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        flutterwaveTransactionId: String(verificationData.data.id),
        paidAt: new Date(),
      },
    });

    // Process based on payment type
    const metadata = payment.metadata ? JSON.parse(payment.metadata as string) : {};

    if (payment.paymentType === 'subscription' && metadata.plan) {
      await activateSubscription(payment.userId, metadata.plan);
    } else if (payment.paymentType === 'wallet_funding') {
      await fundWallet(payment.userId, payment.amount);
    }

    // Send success notification
    await db.notification.create({
      data: {
        userId: payment.userId,
        title: 'Payment Confirmed! 💰',
        message: `Your payment of $${payment.amount.toFixed(2)} for ${payment.description || payment.paymentType} has been confirmed.`,
        type: 'success',
      },
    });

    console.log('[Flutterwave Webhook] Payment processed successfully:', txRef);

    return NextResponse.json({ status: 'success', paymentId: updatedPayment.id });
  } catch (error: any) {
    console.error('[Flutterwave Webhook Error]', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * GET /api/payments/webhook
 * Used by Flutterwave to verify the webhook endpoint during setup
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Hustle University Flutterwave webhook endpoint',
  });
}

/**
 * Activate subscription after successful payment
 */
async function activateSubscription(userId: string, plan: string) {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const planNames: Record<string, string> = {
    basic: 'Basic',
    pro: 'Pro',
    premium: 'Premium',
  };

  await db.subscription.upsert({
    where: { userId },
    create: { userId, plan, status: 'active', startDate, endDate },
    update: { plan, status: 'active', startDate, endDate },
  });

  await db.notification.create({
    data: {
      userId,
      title: 'Subscription Activated!',
      message: `Your ${planNames[plan] || plan} plan is now active until ${endDate.toLocaleDateString()}. Enjoy your premium features!`,
      type: 'success',
    },
  });
}

/**
 * Fund user wallet after successful payment
 */
async function fundWallet(userId: string, amount: number) {
  const wallet = await db.wallet.findUnique({ where: { userId } });

  if (wallet) {
    await db.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });

    await db.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'credit',
        amount,
        description: 'Wallet funding via Flutterwave',
      },
    });

    await db.notification.create({
      data: {
        userId,
        title: 'Wallet Funded!',
        message: `$${amount.toFixed(2)} has been added to your wallet successfully.`,
        type: 'success',
      },
    });
  }
}
