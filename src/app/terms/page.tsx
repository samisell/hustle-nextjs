import StaticInfoPage from '@/components/marketing/StaticInfoPage';

export default function TermsPage() {
  return (
    <StaticInfoPage
      kicker="Legal"
      title="Terms of Service"
      description="Summary of the core terms that govern use of Hustle University services."
      highlights={[
        'Account holders are responsible for account security',
        'Payments and subscriptions follow platform billing rules',
        'Abuse, fraud, and misuse can lead to suspension',
        'Policy updates may occur as products evolve',
      ]}
      sections={[
        {
          title: 'Acceptance of Terms',
          content:
            'By creating an account or using the platform, you agree to comply with current policies, user responsibilities, and applicable laws in your jurisdiction.',
        },
        {
          title: 'Account Responsibilities',
          content:
            'Users are responsible for the confidentiality of login credentials and for activity performed through their accounts.',
          bullets: [
            'Provide accurate registration details',
            'Do not share credentials with unauthorized parties',
            'Report suspicious activity immediately',
          ],
        },
        {
          title: 'Payments and Subscriptions',
          content:
            'Subscription access, wallet actions, and payment workflows follow posted platform rules. Chargebacks or fraudulent usage may trigger account review.',
        },
        {
          title: 'Limitations and Disclaimers',
          content:
            'Platform content is educational and operational in nature. It does not constitute guaranteed outcome promises or individualized financial advice.',
        },
      ]}
      faq={[
        {
          question: 'Can terms change over time?',
          answer:
            'Yes. Terms may be updated as services expand. Continued use after updates indicates acceptance of revised terms.',
        },
        {
          question: 'What happens if terms are violated?',
          answer:
            'Depending on severity, actions may include warnings, feature restrictions, temporary suspension, or permanent account termination.',
        },
      ]}
      primaryCta={{ label: 'Need Clarification?', href: '/contact' }}
      secondaryCta={{ label: 'View Privacy Policy', href: '/privacy' }}
    />
  );
}
