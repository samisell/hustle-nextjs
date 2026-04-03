import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getInvoiceInfo, isConfigured } from '@/lib/cryptomus';

/**
 * GET /api/payments/crypto/verify?tx_ref=xxx
 * Verify a crypto payment by transaction reference
 * Polls Cryptomus for the current invoice status
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

    // If already completed or failed, return cached result
    if (payment.status === 'completed') {
      return NextResponse.json({
        status: payment.status,
        txRef: payment.txRef,
        amount: payment.amount,
        paymentType: payment.paymentType,
        paidAt: payment.paidAt?.toISOString(),
      });
    }

    if (payment.status === 'failed') {
      return NextResponse.json({
        status: payment.status,
        txRef: payment.txRef,
        amount: payment.amount,
        paymentType: payment.paymentType,
        error: 'Payment failed or expired.',
      });
    }

    // Pending — check with Cryptomus if configured
    if (!isConfigured()) {
      return NextResponse.json({
        status: payment.status,
        txRef: payment.txRef,
        amount: payment.amount,
        paymentType: payment.paymentType,
        message: 'Crypto verification not available — waiting for webhook.',
      });
    }

    try {
      // We need the invoice UUID; check metadata for it
      const metadata = payment.metadata ? JSON.parse(payment.metadata as string) : {};

      if (metadata.invoiceUuid) {
        const info = await getInvoiceInfo(metadata.invoiceUuid);
        const invoice = info.result;

        if (invoice.status === 'paid' || invoice.status === 'paid_over') {
          // Payment confirmed — process it
          const updatedPayment = await processSuccessfulPayment(payment, invoice);

          return NextResponse.json({
            status: updatedPayment.status,
            txRef: updatedPayment.txRef,
            amount: updatedPayment.amount,
            paymentType: updatedPayment.paymentType,
            paidAt: updatedPayment.paidAt?.toISOString(),
          });
        } else if (invoice.status === 'expired' || invoice.status === 'cancel') {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: 'failed' },
          });

          return NextResponse.json({
            status: 'failed',
            txRef: payment.txRef,
            amount: payment.amount,
            paymentType: payment.paymentType,
            error: `Invoice ${invoice.status}.`,
          });
        }
      }

      // Still waiting
      return NextResponse.json({
        status: 'pending',
        txRef: payment.txRef,
        amount: payment.amount,
        paymentType: payment.paymentType,
        message: 'Waiting for crypto payment confirmation...',
      });
    } catch (verifyError: any) {
      console.error('[Crypto Verify Error]', verifyError);
      return NextResponse.json({
        status: payment.status,
        txRef: payment.txRef,
        amount: payment.amount,
        paymentType: payment.paymentType,
        verificationError: 'Could not verify with Cryptomus. Please try again later.',
      });
    }
  } catch (error: any) {
    console.error('[Crypto Verify Error]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * Process a successful crypto payment — activate subscription or fund wallet
 */
async function processSuccessfulPayment(payment: any, invoice: any) {
  const updatedPayment = await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'completed',
      flutterwaveTransactionId: invoice.txid || invoice.uuid,
      paidAt: new Date(),
    },
  });

  const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};

  if (payment.paymentType === 'subscription' && metadata.plan) {
    await activateSubscription(payment.userId, metadata.plan);
  }

  if (payment.paymentType === 'wallet_funding') {
    await fundWallet(payment.userId, payment.amount);
  }

  await db.notification.create({
    data: {
      userId: payment.userId,
      title: 'Crypto Payment Confirmed!',
      message: `Your crypto payment of $${payment.amount.toFixed(2)} for ${payment.description || payment.paymentType} has been confirmed on the blockchain.`,
      type: 'success',
    },
  });

  return updatedPayment;
}

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
  }
}
