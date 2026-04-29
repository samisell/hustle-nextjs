import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { verifyTransactionByRef } from '@/lib/flutterwave';
import { getInvoiceInfo, isConfigured } from '@/lib/cryptomus';
import { distributeCommissions } from '@/lib/mlm';

/**
 * GET /api/payments/verify?tx_ref=xxx&method=flutterwave|crypto
 * Universal payment verification endpoint that handles both Flutterwave and Cryptomus
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
    const method = searchParams.get('method');

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

    // Already completed
    if (payment.status === 'completed') {
      return NextResponse.json({
        status: payment.status,
        txRef: payment.txRef,
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt?.toISOString(),
      });
    }

    // Already failed
    if (payment.status === 'failed') {
      return NextResponse.json({
        status: payment.status,
        txRef: payment.txRef,
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        error: 'Payment failed or was cancelled.',
      });
    }

    // Route to correct gateway verification
    const gateway = method || payment.paymentMethod;

    if (gateway === 'cryptomus') {
      return verifyCryptoPayment(payment);
    } else {
      return verifyFlutterwavePayment(payment);
    }
  } catch (error: any) {
    console.error('[Payment Verify Error]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * Verify a Flutterwave payment
 */
async function verifyFlutterwavePayment(payment: any) {
  try {
    const fwResponse = await verifyTransactionByRef(payment.txRef);

    if (fwResponse.status === 'success' && fwResponse.data.status === 'successful') {
      const updatedPayment = await processSuccessfulPayment(payment, String(fwResponse.data.id), 'Flutterwave');

      return NextResponse.json({
        status: updatedPayment.status,
        txRef: updatedPayment.txRef,
        amount: updatedPayment.amount,
        paymentType: updatedPayment.paymentType,
        paymentMethod: 'flutterwave',
        paidAt: updatedPayment.paidAt?.toISOString(),
      });
    } else {
      const updatedStatus = fwResponse.data.status === 'failed' ? 'failed' : payment.status;
      if (updatedStatus === 'failed') {
        await db.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
      }

      return NextResponse.json({
        status: updatedStatus,
        txRef: payment.txRef,
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentMethod: 'flutterwave',
        flutterwaveStatus: fwResponse.data.status,
      });
    }
  } catch (verifyError: any) {
    console.error('[FW Verify Error]', verifyError);
    return NextResponse.json({
      status: payment.status,
      txRef: payment.txRef,
      amount: payment.amount,
      paymentType: payment.paymentType,
      paymentMethod: 'flutterwave',
      verificationError: 'Could not verify with Flutterwave. Webhook may still process.',
    });
  }
}

/**
 * Verify a Cryptomus payment
 */
async function verifyCryptoPayment(payment: any) {
  if (!isConfigured()) {
    return NextResponse.json({
      status: payment.status,
      txRef: payment.txRef,
      amount: payment.amount,
      paymentType: payment.paymentType,
      paymentMethod: 'cryptomus',
      message: 'Waiting for blockchain confirmation...',
    });
  }

  try {
    const metadata = payment.metadata ? JSON.parse(payment.metadata as string) : {};

    if (metadata.invoiceUuid) {
      const info = await getInvoiceInfo(metadata.invoiceUuid);
      const invoice = info.result;

      if (invoice.status === 'paid' || invoice.status === 'paid_over') {
        const updatedPayment = await processSuccessfulPayment(payment, invoice.uuid || invoice.order_id, 'Cryptomus');

        return NextResponse.json({
          status: updatedPayment.status,
          txRef: updatedPayment.txRef,
          amount: updatedPayment.amount,
          paymentType: updatedPayment.paymentType,
          paymentMethod: 'cryptomus',
          paidAt: updatedPayment.paidAt?.toISOString(),
        });
      } else if (invoice.status === 'expired' || invoice.status === 'cancel') {
        await db.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });

        return NextResponse.json({
          status: 'failed',
          txRef: payment.txRef,
          amount: payment.amount,
          paymentType: payment.paymentType,
          paymentMethod: 'cryptomus',
          error: `Invoice ${invoice.status}.`,
        });
      }
    }

    return NextResponse.json({
      status: 'pending',
      txRef: payment.txRef,
      amount: payment.amount,
      paymentType: payment.paymentType,
      paymentMethod: 'cryptomus',
      message: 'Waiting for crypto payment confirmation...',
    });
  } catch (verifyError: any) {
    console.error('[Crypto Verify Error]', verifyError);
    return NextResponse.json({
      status: payment.status,
      txRef: payment.txRef,
      amount: payment.amount,
      paymentType: payment.paymentType,
      paymentMethod: 'cryptomus',
      verificationError: 'Could not verify with Cryptomus. Webhook may still process.',
    });
  }
}

/**
 * Process a successful payment — activate subscription or fund wallet
 */
async function processSuccessfulPayment(payment: any, gatewayTxId: string, gatewayName: string) {
  const updatedPayment = await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'completed',
      flutterwaveTransactionId: gatewayTxId,
      paidAt: new Date(),
    },
  });

  const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};

  if (payment.paymentType === 'subscription' && metadata.plan) {
    await activateSubscription(payment.userId, metadata.plan);
    // Distribute MLM commissions up the referral chain
    try {
      await distributeCommissions(
        payment.userId,
        payment.id,
        payment.amount,
        `${metadata.plan} subscription`
      );
    } catch (mlmError) {
      console.error('[MLM Commission Error]', mlmError);
    }
  }

  if (payment.paymentType === 'wallet_funding') {
    await fundWallet(payment.userId, payment.amount, gatewayName);
  }

  await db.notification.create({
    data: {
      userId: payment.userId,
      title: 'Payment Successful!',
      message: `Your payment of $${payment.amount.toFixed(2)} for ${payment.description || payment.paymentType} has been confirmed via ${gatewayName}.`,
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
      message: `You have successfully subscribed to the ${planNames[plan] || plan} plan. Active until ${endDate.toLocaleDateString()}.`,
      type: 'success',
    },
  });
}

async function fundWallet(userId: string, amount: number, gatewayName: string) {
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
        description: `Wallet funding via ${gatewayName}`,
      },
    });
  }
}
