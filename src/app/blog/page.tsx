import StaticInfoPage from '@/components/marketing/StaticInfoPage';

export default function BlogPage() {
  return (
    <StaticInfoPage
      kicker="Resources"
      title="Blog"
      description="Actionable insights, strategy playbooks, and member stories to support your financial growth journey."
      highlights={[
        'Beginner to advanced financial learning tracks',
        'Weekly execution-focused guides',
        'Real community case studies',
        'Frameworks you can apply immediately',
      ]}
      sections={[
        {
          title: 'What You Will Find Here',
          content:
            'Our editorial focus is practical growth. Every article is designed to improve how you learn, earn, invest, or make decisions under uncertainty.',
          bullets: [
            'Money fundamentals and personal finance systems',
            'Investment frameworks and risk management basics',
            'Referral and business growth strategy breakdowns',
          ],
        },
        {
          title: 'Publishing Rhythm',
          content:
            'We publish new content regularly and prioritize depth over volume. Each post is written to be useful whether you are starting from zero or scaling existing results.',
        },
        {
          title: 'Member Stories',
          content:
            'Some of our most valuable lessons come from members. We share anonymized success journeys, strategy pivots, and mistakes to help others move faster.',
        },
      ]}
      faq={[
        {
          question: 'Is blog content free to access?',
          answer:
            'Yes. Public blog posts are free. Certain deep-dive playbooks may be tied to member learning paths inside the platform.',
        },
        {
          question: 'Can I suggest topics?',
          answer:
            'Yes. Use the Contact page and share the problem you want solved. Topic requests with clear context are prioritized.',
        },
      ]}
      primaryCta={{ label: 'Start Learning', href: '/register' }}
      secondaryCta={{ label: 'Browse Courses', href: '/#courses' }}
    />
  );
}
