'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  ArrowLeft,
  Mail,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { useAuthStore } from '@/store/auth';

interface VerifyOTPPageProps {
  email: string;
  initialOtp?: string;
  onBack: () => void;
  onVerified: () => void;
}

export default function VerifyOTPPage({ email, initialOtp, onBack, onVerified }: VerifyOTPPageProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [debugOtp, setDebugOtp] = useState(initialOtp || '');
  const [copied, setCopied] = useState(false);
  const login = useAuthStore((s) => s.login);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstSlot = document.querySelector<HTMLInputElement>('[data-slot="input-otp"] input');
      if (firstSlot) firstSlot.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp]);

  const handleVerify = useCallback(async () => {
    if (otp.length !== 6) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      login(data.user, data.token);

      // Brief success display before redirecting
      setTimeout(() => {
        onVerified();
      }, 1200);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }, [otp, email, login, onVerified]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setResendLoading(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to resend OTP.');
        setResendLoading(false);
        return;
      }

      // Update debug OTP from resend response
      if (data._debug_otp) {
        setDebugOtp(data._debug_otp);
      }

      setResendCooldown(60);
      setOtp('');
      setError('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const copyOtp = () => {
    if (debugOtp) {
      navigator.clipboard.writeText(debugOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Button
          variant="ghost"
          className="mb-6"
          onClick={onBack}
          disabled={success}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <motion.div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: success ? '#22c55e' : '#D4AF37' }}
              animate={success ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {success ? (
                <ShieldCheck className="h-6 w-6 text-white" />
              ) : (
                <Mail className="h-6 w-6 text-white" />
              )}
            </motion.div>
            <CardTitle className="mt-4 text-2xl">
              {success ? 'Email Verified!' : 'Verify Your Email'}
            </CardTitle>
            <CardDescription>
              {success
                ? 'Redirecting to your dashboard...'
                : <>We sent a 6-digit code to <span className="font-medium text-foreground">{maskedEmail}</span></>
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!success && (
              <div className="space-y-6">
                {/* Dev mode OTP banner */}
                {debugOtp && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border-2 border-dashed border-amber-500/50 bg-amber-500/10 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          Dev Mode — Your OTP Code
                        </p>
                        <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-amber-700 dark:text-amber-300">
                          {debugOtp}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyOtp}
                        className="h-9 w-9 shrink-0 border-amber-500/30 hover:bg-amber-500/20"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    {error}
                  </motion.div>
                )}

                {/* OTP Input */}
                <div className="flex flex-col items-center gap-4">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                    ref={inputRef as any}
                    containerClassName="justify-center"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>

                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </div>
                  )}
                </div>

                {/* Manual Verify Button (fallback) */}
                {otp.length === 6 && !loading && (
                  <Button
                    onClick={handleVerify}
                    className="w-full text-white"
                    style={{ backgroundColor: '#D4AF37' }}
                  >
                    Verify Code
                  </Button>
                )}

                {/* Resend OTP */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive the code?
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || resendLoading}
                    className="mt-1 text-sm font-medium"
                    style={{ color: '#D4AF37' }}
                  >
                    {resendLoading ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Sending...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>Resend in {resendCooldown}s</>
                    ) : (
                      <>
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Resend Code
                      </>
                    )}
                  </Button>
                </div>

                {/* Info box */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground text-center">
                    <ShieldCheck className="mr-1 inline h-3 w-3" />
                    This code expires in 10 minutes. Check your spam folder if you don&apos;t see it.
                  </p>
                </div>
              </div>
            )}

            {/* Success animation */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-6"
              >
                <motion.div
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <ShieldCheck className="h-8 w-8 text-green-500" />
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  Your account is now active. Welcome to Hustle University!
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
