import StaticInfoPage from '@/components/marketing/StaticInfoPage';

export default function CareersPage() {
  return (
    <StaticInfoPage
      kicker="Company"
      title="Careers"
      description="Join a mission-driven team building the future of practical financial education and opportunity."
      highlights={[
        'Remote-friendly collaboration culture',
        'Product and mission ownership',
        'Fast-paced learning environment',
        'Real impact across user growth and outcomes',
      ]}
      sections={[
        {
          title: 'Why Work With Us',
          content:
            'At Hustle University, you work on products that directly influence user confidence, decision-making, and quality of life. We care about results and healthy execution.',
        },
        {
          title: 'Core Teams',
          content:
            'We hire across product, engineering, education operations, growth, customer success, and partnerships.',
          bullets: [
            'Engineering: full-stack, data, platform reliability',
            'Product and Design: UX research, interface design, experimentation',
            'Education: curriculum, assessments, learner support',
          ],
        },
        {
          title: 'How We Work',
          content:
            'We value ownership, clear communication, and measurable impact. Teams run with high trust and ship improvements in short cycles while maintaining strong quality standards.',
        },
        {
          title: 'Application Process',
          content:
            'Applications are reviewed continuously. Strong candidates usually move through an intro call, role-specific interview, and practical challenge aligned to the team.',
        },
      ]}
      faq={[
        {
          question: 'Do I need fintech experience?',
          answer:
            'Not always. We value problem-solving, execution quality, and user empathy. Domain knowledge can be learned quickly with the right fundamentals.',
        },
        {
          question: 'Can I apply for multiple roles?',
          answer:
            'Yes. If your profile fits multiple areas, apply and clarify your strongest preference so we can route your application effectively.',
        },
      ]}
      primaryCta={{ label: 'Contact Recruiting', href: '/contact' }}
      secondaryCta={{ label: 'Learn About Us', href: '/about' }}
    />
  );
}
