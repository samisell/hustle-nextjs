import StaticInfoPage from '@/components/marketing/StaticInfoPage';

export default function ContactPage() {
  return (
    <StaticInfoPage
      kicker="Support"
      title="Contact"
      description="Reach our team for support, partnerships, media inquiries, and operational questions."
      highlights={[
        'General support: support@hustleuniversity.app',
        'Response window: typically within 24-48 hours',
        'Priority handling for account access issues',
        'Partnership and media routes available',
      ]}
      sections={[
        {
          title: 'How to Reach Us',
          content:
            'For most requests, email is the fastest way to get support. Include your account email and a clear summary of the issue so we can assist quickly.',
          bullets: [
            'Support: support@hustleuniversity.app',
            'Business and partnerships: partnerships@hustleuniversity.app',
            'Media and press: media@hustleuniversity.app',
          ],
        },
        {
          title: 'Issue Resolution Tips',
          content:
            'A strong support request should include context. Mention what happened, what you expected, and the exact steps that led to the issue.',
          bullets: [
            'Add timestamps and screenshots when possible',
            'Mention affected route or feature name',
            'Share browser/device details for UI issues',
          ],
        },
        {
          title: 'Partnerships',
          content:
            'We collaborate with educators, fintech operators, creator communities, and ecosystem partners. If you have a strategic opportunity, send details and expected outcomes.',
        },
      ]}
      faq={[
        {
          question: 'How fast do you respond?',
          answer:
            'Most requests are answered within one to two business days. Urgent account access and payment issues are prioritized.',
        },
        {
          question: 'Can I request a product demo?',
          answer:
            'Yes. Share your use case and goals, and we will coordinate a walkthrough if there is a strong fit.',
        },
      ]}
      primaryCta={{ label: 'Create Account', href: '/register' }}
      secondaryCta={{ label: 'Open Help Center', href: '/help-center' }}
    />
  );
}
