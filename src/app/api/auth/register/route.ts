import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken, generateReferralCode } from '@/lib/auth';

const REFERRAL_BONUS = 10.0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    const user = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          referralCode: newReferralCode,
          referredBy: referralCode || null,
          emailVerified: new Date(),
        },
      });

      await tx.wallet.create({
        data: {
          userId: createdUser.id,
        },
      });

      if (referralCode) {
        const referrer = await tx.user.findUnique({ where: { referralCode } });
        if (referrer) {
          await tx.referral.create({
            data: {
              referrerId: referrer.id,
              referredId: createdUser.id,
              earnings: REFERRAL_BONUS,
            },
          });

          const referrerWallet = await tx.wallet.findUnique({ where: { userId: referrer.id } });
          if (referrerWallet) {
            await tx.wallet.update({
              where: { userId: referrer.id },
              data: { balance: { increment: REFERRAL_BONUS } },
            });

            await tx.transaction.create({
              data: {
                walletId: referrerWallet.id,
                type: 'credit',
                amount: REFERRAL_BONUS,
                description: `Referral bonus for inviting ${createdUser.name}`,
              },
            });

            await tx.earning.create({
              data: {
                walletId: referrerWallet.id,
                userId: referrer.id,
                amount: REFERRAL_BONUS,
                source: 'referral',
                description: `Referral bonus for inviting ${createdUser.name}`,
              },
            });

            await tx.notification.create({
              data: {
                userId: referrer.id,
                title: 'New Referral!',
                message: `You earned $${REFERRAL_BONUS} for referring ${createdUser.name}!`,
                type: 'success',
              },
            });
          }
        }
      }

      await tx.notification.create({
        data: {
          userId: createdUser.id,
          title: 'Welcome to Hustle University!',
          message: 'Your account has been created successfully. Start exploring courses and grow your hustle!',
          type: 'info',
        },
      });

      return createdUser;
    });

    // Auto-login: return token immediately
    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          referralCode: user.referralCode,
          emailVerified: user.emailVerified,
        },
        token,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
