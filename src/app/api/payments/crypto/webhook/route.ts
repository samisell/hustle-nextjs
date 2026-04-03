import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/cryptomus';

/**
 * POST /api/payments/crypto/webhook
 * Webhook endpoint called by Cryptomus when a crypto payment event occurs
 *
 * Cryptomus sends webhook callbacks for:
 * - check (payment detected but not confirmed)
 * - confirm (payment confirmed on blockchain)
 * - paid (payment fully received)
 * - paid_over (overpaid)
 * - fail (payment failed)
 * - cancel (invoice cancelled/expired)
 * - refund (payment refunded)
 */

// Map of Cryptomus statuses to our payment statuses
const STATUS_MAP: Record<string, string> = {
  check: 'pending',
  confirm: 'pending',
  paid: 'completed',
  paid_over: 'completed',
  fail: 'failed',
  cancel: 'failed',
  refund: 'failed',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('[Cryptomus Webhook] Received:', {
      event: body.status,
      order_id: body.order_id,
      amount: body.amount,
      payment_amount: body.payment_amount,
      payment_currency: body.payment_currency,
      txid: body.txid,
    });

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body);
    if (!isValid) {
      console.warn('[Cryptomus Webhook] Invalid signature — rejecting');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const orderId = body.order_id;
    const cryptoStatus = body.status;
    const isFinal = body.is_final;

    if (!orderId || !cryptoStatus) {
      console.warn('[Cryptomus Webhook] Missing order_id or status');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the payment in our database
    const payment = await db.payment.findUnique({
      where: { txRef: orderId },
    });

    if (!payment) {
      console.warn('[Cryptomus Webhook] Payment not found for order_id:', orderId);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Skip if already processed as completed
    if (payment.status === 'completed' && cryptoStatus !== 'refund') {
      console.log('[Cryptomus Webhook] Payment already completed:', orderId);
      return NextResponse.json({ status: 'already_processed' });
    }

    // Map Cryptomus status to our status
    const mappedStatus = STATUS_MAP[cryptoStatus] || payment.status;

    // Update payment status
    const updateData: Record<string, any> = { status: mappedStatus };

    if (mappedStatus === 'completed') {
      updateData.paidAt = new Date();
      updateData.flutterwaveTransactionId = body.txid || orderId;
    }

    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    // Process completed payments
    if (mappedStatus === 'completed' && payment.status !== 'completed') {
      const metadata = payment.metadata ? JSON.parse(payment.metadata as string) : {};

      if (payment.paymentType === 'subscription' && metadata.plan) {
        await activateSubscription(payment.userId, metadata.plan);
      } else if (payment.paymentType === 'wallet_funding') {
        await fundWallet(payment.userId, payment.amount);
      }

      // Success notification
      await db.notification.create({
        data: {
          userId: payment.userId,
          title: 'Crypto Payment Confirmed! 🪙',
          message: `Your crypto payment of $${payment.amount.toFixed(2)} for ${payment.description || payment.paymentType} has been confirmed on the blockchain.`,
          type: 'success',
        },
      });
    }

    // Handle failures/expirations
    if (mappedStatus === 'failed' && payment.status !== 'failed') {
      await db.notification.create({
        data: {
          userId: payment.userId,
          title: 'Crypto Payment ' + (cryptoStatus === 'refund' ? 'Refunded' : 'Failed'),
          message: cryptoStatus === 'refund'
            ? `Your crypto payment of $${payment.amount.toFixed(2)} has been refunded.`
            : `Your crypto payment of $${payment.amount.toFixed(2)} failed or expired. Please try again.`,
          type: 'warning',
        },
      });
    }

    console.log(`[Cryptomus Webhook] Payment ${payment.id} updated: ${mappedStatus} (${cryptoStatus})`);

    return NextResponse.json({ status: 'success', paymentId: updatedPayment.id });
  } catch (error: any) {
    console.error('[Cryptomus Webhook Error]', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * GET /api/payments/crypto/webhook
 * Health check for the webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    gateway: 'cryptomus',
    message: 'Hustle University Cryptomus webhook endpoint',
  });
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

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
      title: 'Subscription Activated! 🎉',
      message: `Your ${planNames[plan] || plan} plan is now active until ${endDate.toLocaleDateString()}.`,
      type: 'success',
    },
  });
}

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
        description: 'Wallet funding via Cryptomus (crypto)',
      },
    });

    await db.notification.create({
      data: {
        userId,
        title: 'Wallet Funded! 💰',
        message: `$${amount.toFixed(2)} has been added to your wallet via crypto payment.`,
        type: 'success',
      },
    });
  }
}
