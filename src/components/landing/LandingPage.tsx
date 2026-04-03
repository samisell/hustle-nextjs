'use client';

import { motion } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowRight,
  Star,
  Zap,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from '@/components/shared/ThemeToggle';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const features = [
  {
    icon: BookOpen,
    title: 'Learn',
    description: 'Access premium financial literacy courses designed by industry experts.',
    color: 'bg-gold/10 text-gold',
  },
  {
    icon: DollarSign,
    title: 'Earn',
    description: 'Build multiple income streams through our referral and investment programs.',
    color: 'bg-orange/10 text-orange',
  },
  {
    icon: TrendingUp,
    title: 'Invest',
    description: 'Grow your wealth with curated investment opportunities and smart strategies.',
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  {
    icon: Rocket,
    title: 'Grow',
    description: 'Scale your financial knowledge and achieve long-term financial freedom.',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
];

const plans = [
  {
    name: 'Basic',
    price: '$9.99',
    period: '/month',
    description: 'Perfect for getting started on your financial journey.',
    features: [
      '5 Core Courses',
      'Basic Investment Access',
      'Community Forum',
      'Email Support',
    ],
    badge: null,
  },
  {
    name: 'Pro',
    price: '$29.99',
    period: '/month',
    description: 'For serious learners ready to accelerate their growth.',
    features: [
      'All Courses',
      'Advanced Investment Opportunities',
      'Referral Program (10% commission)',
      'Priority Support',
      'Monthly Webinars',
      'Certificate of Completion',
    ],
    badge: 'Most Popular',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '$99.99',
    period: '/month',
    description: 'The ultimate package for maximum financial growth.',
    features: [
      'Everything in Pro',
      '1-on-1 Mentorship',
      'VIP Investment Pool',
      'Referral Program (20% commission)',
      'Exclusive Masterclasses',
      'Early Access to New Features',
      'Dedicated Account Manager',
    ],
    badge: 'Best Value',
  },
];

const steps = [
  { step: '01', title: 'Sign Up', description: 'Create your account in under 2 minutes with a simple registration process.' },
  { step: '02', title: 'Choose Your Plan', description: 'Select the subscription plan that fits your goals and budget.' },
  { step: '03', title: 'Start Learning', description: 'Dive into courses, start investing, and build your referral network.' },
  { step: '04', title: 'Grow & Earn', description: 'Watch your knowledge and earnings grow as you advance through the program.' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">
              Hustle<span className="text-gold"> University</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={onLogin}>
              Log in
            </Button>
            <Button onClick={onRegister} className="bg-gold text-white hover:bg-gold-dark">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-orange/5" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-gold/5 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-orange/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-medium text-gold border-gold/20 bg-gold/5">
              <Zap className="mr-1 h-3 w-3" />
              Empowering Financial Freedom
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Unlock Your{' '}
              <span className="text-gradient-gold">Financial Future</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Join thousands of learners mastering financial literacy, building investment portfolios,
              and creating sustainable income through our comprehensive education platform.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={onRegister}
                className="w-full bg-gold px-8 text-white hover:bg-gold-dark sm:w-auto"
              >
                Start Learning Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onLogin}
                className="w-full sm:w-auto"
              >
                Sign In
              </Button>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>10k+ Students</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-gold" />
                <span>4.9 Rating</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>50+ Courses</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground">Everything You Need to Succeed</h2>
            <p className="mt-3 text-muted-foreground">
              Our platform combines education, community, and investment tools in one place.
            </p>
          </motion.div>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={item}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Get started in four simple steps.</p>
          </motion.div>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {steps.map((step) => (
              <motion.div key={step.step} variants={item} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-xl font-bold text-gold">
                  {step.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground">Choose Your Plan</h2>
            <p className="mt-3 text-muted-foreground">
              Invest in your future with the right plan for your goals.
            </p>
          </motion.div>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-12 grid gap-6 lg:grid-cols-3"
          >
            {plans.map((plan) => (
              <motion.div key={plan.name} variants={item}>
                <Card
                  className={`relative h-full transition-shadow hover:shadow-lg ${
                    (plan as any).highlighted
                      ? 'border-gold shadow-md ring-1 ring-gold/20'
                      : ''
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gold text-white border-0">{plan.badge}</Badge>
                    </div>
                  )}
                  <CardHeader className="pt-8">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-gold" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${
                        (plan as any).highlighted
                          ? 'bg-gold text-white hover:bg-gold-dark'
                          : ''
                      }`}
                      variant={(plan as any).highlighted ? 'default' : 'outline'}
                      onClick={onRegister}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-r from-gold/10 via-orange/5 to-gold/10 border border-gold/20 p-8 text-center sm:p-12"
          >
            <h2 className="text-3xl font-bold text-foreground">Ready to Start Your Journey?</h2>
            <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
              Join thousands of students who are already building their financial future with Hustle University.
            </p>
            <Button
              size="lg"
              onClick={onRegister}
              className="mt-8 bg-gold px-8 text-white hover:bg-gold-dark"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-foreground">
                Hustle<span className="text-gold"> University</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Hustle University. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
