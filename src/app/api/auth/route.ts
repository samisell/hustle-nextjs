import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken, generateReferralCode } from '@/lib/auth';

const REFERRAL_BONUS = 10.0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'register') {
      return handleRegister(body);
    } else if (action === 'login') {
      return handleLogin(body);
    }

    return NextResponse.json({ error: 'Invalid action. Use "register" or "login".' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

async function handleRegister(body: Record<string, any>) {
  const { name, email, password, referralCode } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: 'Email already in use.' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newReferralCode = generateReferralCode();

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      referralCode: newReferralCode,
      referredBy: referralCode || null,
    },
  });

  // Create wallet for the user
  const wallet = await db.wallet.create({
    data: {
      userId: user.id,
    },
  });

  // Handle referral
  if (referralCode) {
    const referrer = await db.user.findUnique({ where: { referralCode } });
    if (referrer) {
      await db.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: user.id,
          earnings: REFERRAL_BONUS,
        },
      });

      // Credit referrer's wallet
      const referrerWallet = await db.wallet.findUnique({ where: { userId: referrer.id } });
      if (referrerWallet) {
        await db.wallet.update({
          where: { userId: referrer.id },
          data: { balance: { increment: REFERRAL_BONUS } },
        });

        await db.transaction.create({
          data: {
            walletId: referrerWallet.id,
            type: 'credit',
            amount: REFERRAL_BONUS,
            description: `Referral bonus for inviting ${user.name}`,
          },
        });

        await db.earning.create({
          data: {
            walletId: referrerWallet.id,
            userId: referrer.id,
            amount: REFERRAL_BONUS,
            source: 'referral',
            description: `Referral bonus for inviting ${user.name}`,
          },
        });

        // Notify referrer
        await db.notification.create({
          data: {
            userId: referrer.id,
            title: 'New Referral!',
            message: `You earned $${REFERRAL_BONUS} for referring ${user.name}!`,
            type: 'success',
          },
        });
      }
    }
  }

  // Welcome notification
  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Welcome to Hustle University!',
      message: 'Your account has been created successfully. Start exploring courses and grow your hustle!',
      type: 'info',
    },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
      },
      token,
    },
    { status: 201 }
  );
}

async function handleLogin(body: Record<string, any>) {
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email },
    include: { subscription: true, wallet: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      subscription: user.subscription,
      wallet: user.wallet,
    },
    token,
  });
}
