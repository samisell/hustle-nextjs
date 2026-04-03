import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOTP, getOTPExpiry } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({ where: { email } });

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

    // Rate limiting: prevent OTP spam (minimum 60 seconds between sends)
    if (user.otpExpiry) {
      const timeSinceLastSend = Date.now() - (new Date(user.otpExpiry).getTime() - 10 * 60 * 1000);
      if (timeSinceLastSend < 60 * 1000) {
        const waitSeconds = Math.ceil((60 * 1000 - timeSinceLastSend) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before requesting a new OTP.` },
          { status: 429 }
        );
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    await db.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiry: otpExpiry,
      },
    });

    // In production, send the OTP via email service (e.g., Resend, SendGrid, etc.)
    // For development/testing, we return the OTP in the response
    console.log(`[OTP] Verification code for ${email}: ${otp}`);

    return NextResponse.json({
      message: 'A new OTP has been sent to your email.',
      // Remove otp from response in production
      _debug_otp: otp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
