import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hustle-university-secret-key-2024';
const OTP_EXPIRY_MINUTES = 10;

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return otp;
}

/**
 * Get OTP expiry timestamp (N minutes from now)
 */
export function getOTPExpiry(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

/**
 * Check if an OTP has expired
 */
export function isOTPExpired(expiry: Date): boolean {
  return new Date() > expiry;
}

/**
 * Validate a 6-digit OTP string
 */
export function isValidOTPFormat(code: string): boolean {
  return /^\d{6}$/.test(code);
}
