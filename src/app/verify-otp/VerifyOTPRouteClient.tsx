'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VerifyOTPPage from '@/components/auth/VerifyOTPPage';
import { useAuthStore } from '@/store/auth';

interface VerifyOTPRouteClientProps {
  email: string;
  initialOtp: string;
}

export default function VerifyOTPRouteClient({ email, initialOtp }: VerifyOTPRouteClientProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      router.replace('/');
      return;
    }

    if (!email) {
      router.replace('/login');
    }
  }, [user, email, router]);

  if (!email) {
    return null;
  }

  return (
    <VerifyOTPPage
      email={email}
      initialOtp={initialOtp}
      onBack={() => router.push('/login')}
      onVerified={() => router.push('/')}
    />
  );
}
