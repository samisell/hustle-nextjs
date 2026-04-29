import StaticInfoPage from '@/components/marketing/StaticInfoPage';

export default function HelpCenterPage() {
  return (
    <StaticInfoPage
      kicker="Support"
      title="Help Center"
      description="Everything you need to get unstuck quickly, from onboarding to payments and account recovery."
      highlights={[
        'Onboarding and account verification guidance',
        'Subscription and billing issue support',
        'Wallet, payment, and withdrawal troubleshooting',
        'Security and account recovery assistance',
      ]}
      sections={[
        {
          title: 'Getting Started',
          content:
            'Create your account, verify your email, and complete your profile to unlock full dashboard access. New users should begin with foundational learning tracks.',
          bullets: [
            'Register and confirm email OTP',
            'Set your password and profile details',
            'Choose a plan and begin course progression',
          ],
        },
        {
          title: 'Billing and Payments',
          content:
            'If payment confirmations are delayed, verify transaction status from your dashboard and check your payment provider reference. Escalate unresolved cases to support.',
        },
        {
          title: 'Wallet and Withdrawals',
          content:
            'Ensure your withdrawal details are complete and accurate. Pending requests are processed by status workflow and can be tracked from wallet history.',
        },
        {
          title: 'Account Security',
          content:
            'If you suspect unauthorized access, reset your password immediately and contact support with a brief incident timeline.',
        },
      ]}
      faq={[
        {
          question: 'I cannot log in. What should I do first?',
          answer:
            'Confirm your email and password, then try password reset. If issue persists, contact support with your registered email and last successful login time.',
        },
        {
          question: 'My payment was successful but not reflected yet.',
          answer:
            'Wait a short processing window, then share transaction reference and payment timestamp with support for verification.',
        },
      ]}
      primaryCta={{ label: 'Contact Support', href: '/contact' }}
      secondaryCta={{ label: 'Go to Login', href: '/login' }}
    />
  );
}
