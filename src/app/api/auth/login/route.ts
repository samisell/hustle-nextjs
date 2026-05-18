import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateOTP, getOTPExpiry, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { subscription: true, wallet: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (!user.emailVerified) {
      let otp = user.otpCode;
      let otpExpiry = user.otpExpiry;

      if (!otp || !otpExpiry || new Date(otpExpiry).getTime() <= Date.now()) {
        otp = generateOTP();
        otpExpiry = getOTPExpiry();

        await db.user.update({
          where: { id: user.id },
          data: { otpCode: otp, otpExpiry },
        });
      }

      console.log(`[OTP] Verification code for ${email}: ${otp}`);

      return NextResponse.json(
        {
          error: 'Email not verified. Please verify your email to sign in.',
          requiresVerification: true,
          email: user.email,
          _debug_otp: otp,
        },
        { status: 403 }
      );
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        emailVerified: user.emailVerified,
        subscription: user.subscription,
        wallet: user.wallet,
      },
      token,
    });
  } catch (error: any) {
    console.error('[AUTH LOGIN ERROR]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
