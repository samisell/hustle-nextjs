import VerifyOTPRouteClient from './VerifyOTPRouteClient';

interface VerifyOTPRoutePageProps {
  searchParams?: Promise<{
    email?: string;
    otp?: string;
  }>;
}

export default async function VerifyOTPRoutePage({ searchParams }: VerifyOTPRoutePageProps) {
  const params = await searchParams;

  return (
    <VerifyOTPRouteClient
      email={params?.email || ''}
      initialOtp={params?.otp || ''}
    />
  );
}
