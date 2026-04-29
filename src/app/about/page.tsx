import StaticInfoPage from '@/components/marketing/StaticInfoPage';

export default function AboutPage() {
  return (
    <StaticInfoPage
      kicker="Company"
      title="About Hustle University"
      description="We are building a practical ecosystem where everyday people can learn financial skills, access real opportunities, and grow with community support."
      highlights={[
        'Practical learning, not theory-only content',
        'Community-driven growth and accountability',
        'Integrated tools for earning and investing',
        'Designed for beginners and experienced users',
      ]}
      sections={[
        {
          title: 'Our Mission',
          content:
            'Hustle University exists to close the gap between financial information and financial action. We turn complex ideas into clear, repeatable systems people can apply in daily life.',
        },
        {
          title: 'What Makes Us Different',
          content:
            'Most platforms either teach, or they provide tools. We do both. Members can learn through structured pathways, then apply what they learn through investments, referrals, and community collaboration.',
          bullets: [
            'Step-by-step courses mapped to real outcomes',
            'Built-in wallet, subscription, and growth systems',
            'Community spaces for peer learning and feedback',
          ],
        },
        {
          title: 'Who We Serve',
          content:
            'We serve students, professionals, founders, and side-hustlers who want more control over their financial future. If you want clarity, skill, and momentum, this platform is built for you.',
        },
        {
          title: 'Our Long-Term Vision',
          content:
            'Our long-term vision is to become the most trusted growth platform for modern wealth literacy by combining education, transparent systems, and high-accountability community experiences.',
        },
      ]}
      faq={[
        {
          question: 'Is Hustle University only for investment experts?',
          answer:
            'No. Most members begin with foundational courses and grow from there. Content and tools are designed to support beginners as well as advanced users.',
        },
        {
          question: 'Do you provide guaranteed financial returns?',
          answer:
            'No. We provide education, tools, and structured opportunities. Outcomes depend on user decisions, market conditions, and consistent execution.',
        },
      ]}
      primaryCta={{ label: 'Join Hustle University', href: '/register' }}
      secondaryCta={{ label: 'View Platform Sections', href: '/#courses' }}
    />
  );
}
