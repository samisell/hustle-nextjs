import StaticInfoPage from '@/components/marketing/StaticInfoPage';

export default function CookiesPage() {
  return (
    <StaticInfoPage
      kicker="Legal"
      title="Cookie Policy"
      description="How cookies and related technologies support functionality, security, and user experience."
      highlights={[
        'Session continuity and login state management',
        'Preference storage for smoother navigation',
        'Security and abuse detection support',
        'Browser-level control by users',
      ]}
      sections={[
        {
          title: 'What Cookies Do Here',
          content:
            'Cookies help maintain active sessions, remember user preferences, and support secure operation of key platform features.',
        },
        {
          title: 'Types of Cookies Used',
          content:
            'We use essential cookies for authentication and functionality, and may use performance cookies to improve reliability and user experience.',
          bullets: [
            'Essential cookies for login and navigation',
            'Preference cookies for theme and settings',
            'Operational analytics for platform stability',
          ],
        },
        {
          title: 'Managing Cookie Preferences',
          content:
            'You can manage cookie behavior through your browser settings. Disabling essential cookies may impact platform functionality.',
        },
      ]}
      faq={[
        {
          question: 'Will disabling cookies break features?',
          answer:
            'Some core features like authentication and preferences may not function correctly if essential cookies are blocked.',
        },
        {
          question: 'Do cookies store payment details?',
          answer:
            'No. Payment-sensitive data is not stored in browser cookies for checkout processing.',
        },
      ]}
      primaryCta={{ label: 'Back to Platform', href: '/' }}
      secondaryCta={{ label: 'Privacy Policy', href: '/privacy' }}
    />
  );
}
