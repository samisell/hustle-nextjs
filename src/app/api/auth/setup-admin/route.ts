import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SETUP_SECRET = process.env.ADMIN_SETUP_SECRET || 'hustle-admin-setup-2024';

/**
 * POST /api/auth/setup-admin
 * One-time setup endpoint to promote a user to admin.
 * Requires the ADMIN_SETUP_SECRET from .env.
 * 
 * Body: { email: string, secret: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, secret } = body;

    if (!email || !secret) {
      return NextResponse.json(
        { error: 'Email and secret are required.' },
        { status: 400 }
      );
    }

    if (secret !== SETUP_SECRET) {
      return NextResponse.json(
        { error: 'Invalid setup secret.' },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: 'No user found with this email. Please register first.' },
        { status: 404 }
      );
    }

    if (user.role === 'admin') {
      return NextResponse.json(
        { message: 'User is already an admin.', email: user.email, role: user.role }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { role: 'admin' },
    });

    return NextResponse.json({
      message: `${updatedUser.name} has been promoted to admin.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
