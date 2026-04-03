import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { contributeToEscrow } from '@/lib/escrow';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// POST /api/escrow/[id]/contribute - Contribute to escrow
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { amount, paymentMethod } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'A valid positive amount is required.' }, { status: 400 });
    }

    if (!paymentMethod || !['wallet', 'flutterwave', 'crypto'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method. Choose from: wallet, flutterwave, crypto.' },
        { status: 400 }
      );
    }

    // For wallet payments, use the escrow lib directly
    if (paymentMethod === 'wallet') {
      try {
        const contribution = await contributeToEscrow(payload.userId, id, {
          amount,
          paymentMethod: 'wallet',
        });

        return NextResponse.json({
          contribution,
          message: 'Contribution confirmed via wallet.',
        }, { status: 201 });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Contribution failed.';
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    // For flutterwave or crypto: create a pending contribution, then return payment link
    // Verify escrow exists and can accept contributions first
    const escrow = await db.escrowTransaction.findUnique({
      where: { id },
    });

    if (!escrow) {
      return NextResponse.json({ error: 'Escrow not found.' }, { status: 404 });
    }

    // Check if user already has a confirmed contribution (they'd be adding to it)
    const existingContribution = await db.escrowContribution.findUnique({
      where: { escrowId_userId: { escrowId: id, userId: payload.userId } },
    });

    if (existingContribution && existingContribution.status === 'confirmed') {
      // For flutterwave/crypto, don't allow adding to existing confirmed via external payment
      return NextResponse.json(
        { error: 'You already have a confirmed contribution. Use wallet to add more.' },
        { status: 400 }
      );
    }

    // Generate a transaction reference
    const txRef = `ESC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create or update pending contribution
    let contribution;
    if (existingContribution && existingContribution.status === 'pending') {
      contribution = await db.escrowContribution.update({
        where: { id: existingContribution.id },
        data: {
          amount: existingContribution.amount + amount,
          paymentMethod,
          txRef,
        },
      });
    } else {
      contribution = await db.escrowContribution.create({
        data: {
          escrowId: id,
          userId: payload.userId,
          amount,
          paymentMethod,
          status: 'pending',
          txRef,
        },
      });
    }

    // Return mock payment response (actual payment integration would be done here)
    if (paymentMethod === 'flutterwave') {
      return NextResponse.json({
        contributionId: contribution.id,
        txRef,
        amount,
        paymentMethod: 'flutterwave',
        paymentUrl: `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${txRef}&amount=${amount}`,
        message: 'Complete payment via Flutterwave to confirm your contribution.',
      }, { status: 201 });
    }

    // Crypto payment
    return NextResponse.json({
      contributionId: contribution.id,
      txRef,
      amount,
      paymentMethod: 'crypto',
      paymentUrl: `https://pay.cryptomus.com/pay/${txRef}`,
      cryptoAddress: '0x0000000000000000000000000000000000000000',
      network: 'USDT (TRC-20)',
      message: 'Send the exact amount to the crypto address to confirm your contribution.',
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Escrow Contribute Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
