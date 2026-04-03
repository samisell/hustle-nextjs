import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { verifyTransactionByRef } from '@/lib/flutterwave';

/**
 * GET /api/payments/verify?tx_ref=xxx
 * Verify a payment by transaction reference
 * Called by the frontend after a payment redirect to check status
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const txRef = searchParams.get('tx_ref');

    if (!txRef) {
      return NextResponse.json({ error: 'Transaction reference (tx_ref) is required.' }, { status: 400 });
    }

    // Find the payment in our database
    const payment = await db.payment.findUnique({
      where: { txRef },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    }

    // Verify ownership
    if (payment.userId !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized to view this payment.' }, { status: 403 });
    }

    // If already completed, return cached result
    if (payment.status === 'completed') {
      return NextResponse.json({
        status: payment.status,
        txRef: payment.txRef,
        amount: payment.amount,
        paymentType: payment.paymentType,
        paidAt: payment.paidAt?.toISOString(),
      });
    }

    // If already failed, return cached result
    if (payment.status === 'failed') {
      return NextResponse.json({
        status: payment.status,
        txRef: payment.txRef,
        amount: payment.amount,
        paymentType: payment.paymentType,
        error: 'Payment failed or was cancelled.',
      });
    }

    // Pending payment — verify with Flutterwave
    try {
      const fwResponse = await verifyTransactionByRef(txRef);

      if (fwResponse.status === 'success' && fwResponse.data.status === 'successful') {
        // Payment is successful — process it
        const updatedPayment = await processSuccessfulPayment(payment, fwResponse);

        return NextResponse.json({
          status: updatedPayment.status,
          txRef: updatedPayment.txRef,
          amount: updatedPayment.amount,
          paymentType: updatedPayment.paymentType,
          paidAt: updatedPayment.paidAt?.toISOString(),
        });
      } else {
        // Payment not yet completed or failed
        const updatedStatus = fwResponse.data.status === 'failed' ? 'failed' : payment.status;

        if (updatedStatus === 'failed') {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: 'failed' },
          });
        }

        return NextResponse.json({
          status: updatedStatus,
          txRef: payment.txRef,
          amount: payment.amount,
          paymentType: payment.paymentType,
          flutterwaveStatus: fwResponse.data.status,
        });
      }
    } catch (verifyError: any) {
      // If Flutterwave verification fails, return the current DB status
      console.error('[Payment Verify Error]', verifyError);
      return NextResponse.json({
        status: payment.status,
        txRef: payment.txRef,
        amount: payment.amount,
        paymentType: payment.paymentType,
        verificationError: 'Could not verify with Flutterwave. Please try again later.',
      });
    }
  } catch (error: any) {
    console.error('[Payment Verify Error]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * Process a successful payment — activate subscription or fund wallet
 */
async function processSuccessfulPayment(
  payment: any,
  fwResponse: any
) {
  // Update payment record
  const updatedPayment = await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'completed',
      flutterwaveTransactionId: String(fwResponse.data.id),
      paidAt: new Date(),
    },
  });

  const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};

  // Handle subscription activation
  if (payment.paymentType === 'subscription' && metadata.plan) {
    await activateSubscription(payment.userId, metadata.plan);
  }

  // Handle wallet funding
  if (payment.paymentType === 'wallet_funding') {
    await fundWallet(payment.userId, payment.amount);
  }

  // Send notification
  await db.notification.create({
    data: {
      userId: payment.userId,
      title: 'Payment Successful!',
      message: `Your payment of $${payment.amount.toFixed(2)} for ${payment.description || payment.paymentType} has been confirmed.`,
      type: 'success',
    },
  });

  return updatedPayment;
}

/**
 * Activate a subscription after successful payment
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
      message: `You have successfully subscribed to the ${planNames[plan] || plan} plan. Your subscription is active until ${endDate.toLocaleDateString()}.`,
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
  }
}
