'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/components/auth/LoginPage';
import { useAuthStore } from '@/store/auth';

export default function LoginRoutePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  return (
    <LoginPage
      onBack={() => router.push('/')}
      onSwitchToRegister={() => router.push('/register')}
    />
  );
}
