import StaticInfoPage from '@/components/marketing/StaticInfoPage';

export default function PrivacyPage() {
  return (
    <StaticInfoPage
      kicker="Legal"
      title="Privacy Policy"
      description="Overview of how we collect, use, and protect personal information on Hustle University."
      highlights={[
        'Data minimization by default',
        'Security-focused access controls',
        'Operational and support use only',
        'Continuous review of data handling practices',
      ]}
      sections={[
        {
          title: 'Information We Collect',
          content:
            'We collect account details, usage activity, transaction metadata, and support communications required to deliver platform services and improve reliability.',
        },
        {
          title: 'How Information Is Used',
          content:
            'Data supports onboarding, authentication, payments, analytics, abuse prevention, and support resolution.',
          bullets: [
            'Deliver and personalize platform features',
            'Protect accounts and detect misuse',
            'Improve product quality and user experience',
          ],
        },
        {
          title: 'Data Security',
          content:
            'We apply technical and operational safeguards to reduce unauthorized access risk. Security practices are reviewed as product scope evolves.',
        },
        {
          title: 'Retention and Requests',
          content:
            'Data is retained according to legal, security, and operational requirements. Users can contact support for policy questions or request handling.',
        },
      ]}
      faq={[
        {
          question: 'Do you sell user data?',
          answer:
            'No. User data is handled for service delivery, support, and security operations, not for direct sale.',
        },
        {
          question: 'How can I ask privacy-related questions?',
          answer:
            'Use the Contact page and include "Privacy Request" in the subject for faster routing.',
        },
      ]}
      primaryCta={{ label: 'Contact Privacy Team', href: '/contact' }}
      secondaryCta={{ label: 'View Cookie Policy', href: '/cookies' }}
    />
  );
}
