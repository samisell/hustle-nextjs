import StaticInfoPage from '@/components/marketing/StaticInfoPage';

export default function PressKitPage() {
  return (
    <StaticInfoPage
      kicker="Media"
      title="Press Kit"
      description="Media resources for publications, podcasts, interviews, and event organizers."
      highlights={[
        'Company background and mission snapshot',
        'Brand and product positioning guidelines',
        'Approved naming and attribution format',
        'Direct route for interview coordination',
      ]}
      sections={[
        {
          title: 'About the Brand',
          content:
            'Hustle University is a growth platform focused on financial education, practical execution, and community-powered wealth development.',
        },
        {
          title: 'How to Reference Us',
          content:
            'Use the full name "Hustle University" on first mention. Avoid implying guaranteed returns or advisory promises in media coverage.',
          bullets: [
            'Preferred name: Hustle University',
            'Focus categories: learning, community, growth systems',
            'Tone: practical, transparent, outcomes-focused',
          ],
        },
        {
          title: 'Media Requests',
          content:
            'For interviews, commentary, and event participation, provide the publication, topic, audience profile, and expected timeline in your request.',
        },
      ]}
      faq={[
        {
          question: 'Can we request founder or team interviews?',
          answer:
            'Yes. Use the Contact page and choose a media request with dates, format, and preferred talking points.',
        },
        {
          question: 'Are logos and visuals publicly downloadable?',
          answer:
            'Brand asset packs are shared on request to maintain consistency and usage quality.',
        },
      ]}
      primaryCta={{ label: 'Contact Media Team', href: '/contact' }}
      secondaryCta={{ label: 'Read About Us', href: '/about' }}
    />
  );
}
