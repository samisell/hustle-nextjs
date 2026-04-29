'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RegisterPage from '@/components/auth/RegisterPage';
import { useAuthStore } from '@/store/auth';

export default function RegisterRoutePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  return (
    <RegisterPage
      onBack={() => router.push('/')}
      onSwitchToLogin={() => router.push('/login')}
    />
  );
}
