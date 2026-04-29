'use client';

import Link from 'next/link';
import { ArrowLeft, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SectionBlock {
  title: string;
  content: string;
  bullets?: string[];
}

interface FAQItem {
  question: string;
  answer: string;
}

interface CTAConfig {
  label: string;
  href: string;
}

interface StaticInfoPageProps {
  kicker?: string;
  title: string;
  description: string;
  highlights?: string[];
  sections: SectionBlock[];
  faq?: FAQItem[];
  primaryCta?: CTAConfig;
  secondaryCta?: CTAConfig;
}

export default function StaticInfoPage({
  kicker = 'Hustle University',
  title,
  description,
  highlights = [],
  sections,
  faq = [],
  primaryCta = { label: 'Create Account', href: '/register' },
  secondaryCta = { label: 'Explore Courses', href: '/#courses' },
}: StaticInfoPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Card className="overflow-hidden border-gold/20">
          <CardHeader className="border-b border-border/60 bg-gradient-to-r from-gold/10 via-transparent to-orange/10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="border-gold/30 bg-gold/10 text-gold">
                {kicker}
              </Badge>
            </div>
            <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>

            {highlights.length > 0 && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-gold" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            {sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{section.content}</p>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {faq.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>
                <div className="grid gap-3">
                  {faq.map((item) => (
                    <div key={item.question} className="rounded-lg border border-border/60 p-4">
                      <h3 className="text-sm font-semibold text-foreground">{item.question}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/10 to-orange/10 p-5">
              <h2 className="text-lg font-semibold text-foreground">Ready for the next step?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start building skills, opportunities, and long-term financial growth with Hustle University.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={primaryCta.href}>
                  <Button className="bg-gold text-white hover:bg-gold-dark">
                    {primaryCta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href={secondaryCta.href}>
                  <Button variant="outline">{secondaryCta.label}</Button>
                </Link>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
