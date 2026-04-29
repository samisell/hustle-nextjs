import StaticInfoPage from '@/components/marketing/StaticInfoPage';

export default function StatusPage() {
  return (
    <StaticInfoPage
      kicker="Operations"
      title="System Status"
      description="Current service health and reliability notes for core Hustle University systems."
      highlights={[
        'Core authentication: operational',
        'Learning and dashboard services: operational',
        'Payment workflows: operational',
        'Support ticket handling: operational',
      ]}
      sections={[
        {
          title: 'Live Status Snapshot',
          content:
            'At this time, core systems are operational. Intermittent issues can still occur, and affected components are investigated as soon as they are detected.',
        },
        {
          title: 'What We Monitor',
          content:
            'We monitor availability, response times, and error rates across critical user flows to detect degradation early.',
          bullets: [
            'Login and registration endpoints',
            'Dashboard and course delivery flows',
            'Wallet, payment, and notification systems',
          ],
        },
        {
          title: 'Incident Response',
          content:
            'When incidents occur, we prioritize impact mitigation first, then follow with root-cause analysis and preventive action planning.',
        },
      ]}
      faq={[
        {
          question: 'How do I report a service issue?',
          answer:
            'Use the Contact page and include timestamp, account email, and exact reproduction steps to speed up triage.',
        },
        {
          question: 'Where are incident updates shared?',
          answer:
            'Major disruptions are communicated through support channels and status page updates as information becomes available.',
        },
      ]}
      primaryCta={{ label: 'Report an Issue', href: '/contact' }}
      secondaryCta={{ label: 'Open Help Center', href: '/help-center' }}
    />
  );
}
