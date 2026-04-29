import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken, isValidOTPFormat, isOTPExpired } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP code are required.' },
        { status: 400 }
      );
    }

    if (!isValidOTPFormat(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format. Enter a 6-digit code.' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      include: { wallet: true, subscription: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email.' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified. Please sign in.' },
        { status: 400 }
      );
    }

    // Check OTP matches
    if (!user.otpCode || user.otpCode !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP code. Please check and try again.' },
        { status: 400 }
      );
    }

    // Check OTP expiry
    if (!user.otpExpiry || isOTPExpired(user.otpExpiry)) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark email as verified and clear OTP
    const verifiedUser = await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        otpCode: null,
        otpExpiry: null,
      },
      include: { wallet: true, subscription: true },
    });

    // Welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Email Verified!',
        message: 'Your email has been verified successfully. Welcome to Hustle University! Start exploring courses and grow your hustle.',
        type: 'success',
      },
    });

    // Sign token and return
    const token = signToken({
      userId: verifiedUser.id,
      email: verifiedUser.email,
      role: verifiedUser.role,
    });

    return NextResponse.json({
      message: 'Email verified successfully!',
      user: {
        id: verifiedUser.id,
        name: verifiedUser.name,
        email: verifiedUser.email,
        role: verifiedUser.role,
        referralCode: verifiedUser.referralCode,
        emailVerified: verifiedUser.emailVerified,
        subscription: verifiedUser.subscription,
        wallet: verifiedUser.wallet,
      },
      token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
