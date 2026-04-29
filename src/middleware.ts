import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/resend-otp',
  '/api/auth/verify-otp',
  '/api/auth/setup-admin',
  '/api/payments/webhook',
  '/api/payments/crypto/webhook',
  '/api',
];

function isPublicApiPath(pathname: string): boolean {
  if (pathname === '/api') return true;
  return PUBLIC_API_PREFIXES.some((prefix) => pathname === prefix);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/api') || isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
