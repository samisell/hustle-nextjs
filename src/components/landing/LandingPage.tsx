'use client';

import { useState } from 'react';
import Image from 'next/image';
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
  Quote,
  ChevronDown,
  Award,
  Shield,
  Clock,
  Globe,
  Play,
  Trophy,
  Target,
  Banknote,
  BarChart3,
  Handshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import ThemeToggle from '@/components/shared/ThemeToggle';
import CurrencySelector from '@/components/shared/CurrencySelector';
import { useCurrencyStore } from '@/store/currency';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

/* ─── Data ─────────────────────────────────────────── */

const features = [
  {
    icon: BookOpen,
    title: 'Learn',
    description: 'Access premium financial literacy courses designed by industry experts.',
    color: 'bg-gold/10 text-gold',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&q=80',
  },
  {
    icon: DollarSign,
    title: 'Earn',
    description: 'Build multiple income streams through our referral and investment programs.',
    color: 'bg-orange/10 text-orange',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop&q=80',
  },
  {
    icon: TrendingUp,
    title: 'Invest',
    description: 'Grow your wealth with curated investment opportunities and smart strategies.',
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop&q=80',
  },
  {
    icon: Rocket,
    title: 'Grow',
    description: 'Scale your financial knowledge and achieve long-term financial freedom.',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=400&fit=crop&q=80',
  },
];

const featuredCourses = [
  {
    title: 'Personal Finance Masterclass',
    description: 'Build a solid financial foundation with budgeting, saving, and debt management strategies.',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=500&fit=crop&q=80',
    lessons: 24,
    duration: '8h 30m',
    level: 'Beginner',
    rating: 4.9,
    students: 2340,
    instructor: 'Sarah Mitchell',
    price: 49.99,
  },
  {
    title: 'Stock Market Investing 101',
    description: 'Learn to analyze stocks, build portfolios, and make informed investment decisions.',
    image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=500&fit=crop&q=80',
    lessons: 32,
    duration: '12h 15m',
    level: 'Intermediate',
    rating: 4.8,
    students: 1856,
    instructor: 'Michael Chen',
    price: 69.99,
  },
  {
    title: 'Crypto & Digital Assets',
    description: 'Navigate the world of cryptocurrency, DeFi, and blockchain technology with confidence.',
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=500&fit=crop&q=80',
    lessons: 18,
    duration: '6h 45m',
    level: 'Advanced',
    rating: 4.7,
    students: 1423,
    instructor: 'David Park',
    price: 89.99,
  },
];

const instructors = [
  {
    name: 'Sarah Mitchell',
    role: 'Personal Finance Expert',
    bio: 'Former Wall Street analyst with 15+ years of experience helping individuals build wealth.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80',
    courses: 8,
    students: '12k+',
  },
  {
    name: 'Michael Chen',
    role: 'Investment Strategist',
    bio: 'Portfolio manager turned educator. Has managed over $50M in assets for institutional clients.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80',
    courses: 12,
    students: '18k+',
  },
  {
    name: 'David Park',
    role: 'Blockchain & Crypto Specialist',
    bio: 'Early crypto adopter and blockchain developer. Teaches practical crypto investment strategies.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80',
    courses: 6,
    students: '9k+',
  },
  {
    name: 'Amara Johnson',
    role: 'Entrepreneurship Coach',
    bio: 'Founded 3 successful startups. Passionate about teaching others to build businesses that last.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&q=80',
    courses: 5,
    students: '7k+',
  },
];

const testimonials = [
  {
    name: 'James Wilson',
    role: 'Software Engineer',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&q=80',
    text: 'Hustle University completely transformed my relationship with money. I went from living paycheck to paycheck to building a $50k investment portfolio in just 8 months.',
    rating: 5,
    achievement: 'Built $50k portfolio',
  },
  {
    name: 'Lisa Thompson',
    role: 'Marketing Manager',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80',
    text: "The courses are incredibly practical. I applied what I learned about dividend investing and now earn passive income every month. The community support is amazing too!",
    rating: 5,
    achievement: 'Earns $2k/month passive',
  },
  {
    name: 'Omar Hassan',
    role: 'Freelance Designer',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80',
    text: "The referral program alone paid for my subscription 10x over. But the real value is the knowledge — I've never felt this confident about my finances.",
    rating: 5,
    achievement: 'Referred 45+ members',
  },
  {
    name: 'Rachel Kim',
    role: 'Medical Student',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80',
    text: "As a busy student, the flexible learning format is perfect. The crypto course helped me understand digital assets before they became mainstream. Highly recommend!",
    rating: 5,
    achievement: 'Completed 12 courses',
  },
  {
    name: 'Daniel Okafor',
    role: 'Small Business Owner',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&q=80',
    text: "The mentorship program connected me with investors who believed in my vision. I secured funding for my business through connections I made right here.",
    rating: 5,
    achievement: 'Secured $100k funding',
  },
  {
    name: 'Emily Santos',
    role: 'Stay-at-Home Mom',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80',
    text: "I started with zero financial knowledge. Now I manage our family investments, earn from referrals, and teach my kids about money. This platform changed my life.",
    rating: 5,
    achievement: 'Family wealth manager',
  },
];

const stats = [
  { value: '10,000+', label: 'Active Students', icon: Users, image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&h=200&fit=crop&q=80' },
  { value: '50+', label: 'Expert Courses', icon: BookOpen, image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop&q=80' },
  { value: '$2.5M+', label: 'Student Earnings', icon: Banknote, image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&h=200&fit=crop&q=80' },
  { value: '98%', label: 'Success Rate', icon: Trophy, image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200&h=200&fit=crop&q=80' },
];

const plans = [
  {
    name: 'Basic',
    price: 9.99,
    period: '/month',
    description: 'Perfect for getting started on your financial journey.',
    features: ['5 Core Courses', 'Basic Investment Access', 'Community Forum', 'Email Support'],
    badge: null,
  },
  {
    name: 'Pro',
    price: 29.99,
    period: '/month',
    description: 'For serious learners ready to accelerate their growth.',
    features: ['All Courses', 'Advanced Investment Opportunities', 'Referral Program (10% commission)', 'Priority Support', 'Monthly Webinars', 'Certificate of Completion'],
    badge: 'Most Popular',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: 99.99,
    period: '/month',
    description: 'The ultimate package for maximum financial growth.',
    features: ['Everything in Pro', '1-on-1 Mentorship', 'VIP Investment Pool', 'Referral Program (20% commission)', 'Exclusive Masterclasses', 'Early Access to New Features', 'Dedicated Account Manager'],
    badge: 'Best Value',
  },
];

const steps = [
  { step: '01', title: 'Sign Up', description: 'Create your account in under 2 minutes with a simple registration process.', image: 'https://images.unsplash.com/photo-1499711942114-b6e936e1d6c0?w=400&h=300&fit=crop&q=80' },
  { step: '02', title: 'Choose Your Plan', description: 'Select the subscription plan that fits your goals and budget.', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&q=80' },
  { step: '03', title: 'Start Learning', description: 'Dive into courses, start investing, and build your referral network.', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&q=80' },
  { step: '04', title: 'Grow & Earn', description: 'Watch your knowledge and earnings grow as you advance through the program.', image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop&q=80' },
];

const successStories = [
  {
    name: 'Marcus Johnson',
    before: 'Struggling freelancer earning $2k/month with no savings.',
    after: 'Built a diversified portfolio earning $5k/month passive income.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=600&fit=crop&q=80',
    metric: '$60k',
    metricLabel: 'Portfolio Value',
    time: '8 months',
  },
  {
    name: 'Aisha Rahman',
    before: 'Recent graduate with $30k in student debt.',
    after: 'Debt-free and investing 30% of her income every month.',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop&q=80',
    metric: '$30k',
    metricLabel: 'Debt Cleared',
    time: '12 months',
  },
];

const faqData = [
  {
    question: 'What is Hustle University?',
    answer: 'Hustle University is a comprehensive financial education platform that combines premium courses, investment opportunities, and a referral program. We teach practical money skills — from budgeting and saving to stock market investing and cryptocurrency — all designed to help you build real wealth.',
  },
  {
    question: 'How does the referral program work?',
    answer: 'Our referral program lets you earn commissions by inviting friends to join. Pro members earn 10% commission on every referral subscription, while Premium members earn 20%. You also get bonus rewards when your referrals reach milestones like completing their first course.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Absolutely! There are no long-term contracts. You can cancel your subscription at any time from your account settings. You will continue to have access until the end of your current billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept payments via Flutterwave (credit/debit cards, bank transfers), Cryptomus (Bitcoin, Ethereum, USDT, and other cryptocurrencies), and our built-in wallet system. All transactions are secure and encrypted.',
  },
  {
    question: 'Do I get a certificate after completing a course?',
    answer: 'Yes! Pro and Premium members receive a verifiable certificate of completion for every course they finish. These certificates can be shared on LinkedIn and other professional platforms to showcase your financial expertise.',
  },
  {
    question: 'How does the investment pool work?',
    answer: 'Premium members get access to our curated VIP Investment Pool, where our team of experts identifies high-potential opportunities. Investments are managed through our secure escrow system, providing transparency and protection for all participants.',
  },
  {
    question: 'Is the content suitable for beginners?',
    answer: 'Definitely! We have courses for all skill levels, from complete beginners to advanced investors. Our beginner courses start with the fundamentals and gradually build up to more complex topics. Each course is clearly labeled with its difficulty level.',
  },
];

const trustLogos = [
  { name: 'Forbes', svg: 'F' },
  { name: 'TechCrunch', svg: 'TC' },
  { name: 'Bloomberg', svg: 'B' },
  { name: 'CNBC', svg: 'C' },
  { name: 'WSJ', svg: 'WS' },
];

/* ─── Animation Variants ──────────────────────────── */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

/* ─── Component ───────────────────────────────────── */

export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const formatAmount = useCurrencyStore((s) => s.formatAmount);

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ Navigation ═══ */}
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
            <CurrencySelector />
            <ThemeToggle />
            <Button variant="ghost" onClick={onLogin}>Log in</Button>
            <Button onClick={onRegister} className="bg-gold text-white hover:bg-gold-dark">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* ═══ Hero Section ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-orange/5" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-gold/5 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-orange/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Text */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-medium text-gold border-gold/20 bg-gold/5">
                <Zap className="mr-1 h-3 w-3" /> Empowering Financial Freedom
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Unlock Your{' '}
                <span className="text-gradient-gold">Financial Future</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Join thousands of learners mastering financial literacy, building investment portfolios,
                and creating sustainable income through our comprehensive education platform.
              </p>
              <div className="mt-10 flex flex-col items-start justify-center gap-3 sm:flex-row">
                <Button size="lg" onClick={onRegister} className="w-full bg-gold px-8 text-white hover:bg-gold-dark sm:w-auto">
                  Start Learning Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={onLogin} className="w-full sm:w-auto">
                  Sign In
                </Button>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-gold" />
                  <span>10k+ Students</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-gold" />
                  <span>4.9 Rating</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-gold" />
                  <span>50+ Courses</span>
                </div>
              </div>
            </motion.div>
            {/* Hero Image */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative hidden lg:block">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                <Image src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop&q=80" alt="Students learning together" width={800} height={600} className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="rounded-xl bg-background/90 backdrop-blur p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20">
                        <Play className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Featured Masterclass</p>
                        <p className="text-xs text-muted-foreground">Financial Freedom Blueprint — 2.5k enrolled</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating card */}
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-4 -right-4 rounded-xl border border-border bg-card p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">+247%</p>
                    <p className="text-[10px] text-muted-foreground">Avg. ROI</p>
                  </div>
                </div>
              </motion.div>
              {/* Floating card 2 */}
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className="absolute -bottom-4 -left-4 rounded-xl border border-border bg-card p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">2,500+</p>
                    <p className="text-[10px] text-muted-foreground">Certificates Earned</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ Trusted By / Press ═══ */}
      <section className="border-y border-border bg-muted/20 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">As Featured In</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {trustLogos.map((logo) => (
              <div key={logo.name} className="flex items-center justify-center opacity-40 hover:opacity-80 transition-opacity">
                <span className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{logo.svg}</span>
                <span className="ml-1.5 text-sm font-medium text-muted-foreground">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Features Section ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Everything You Need to Succeed</h2>
            <p className="mt-3 text-muted-foreground">Our platform combines education, community, and investment tools in one place.</p>
          </motion.div>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={item}>
                <Card className="group h-full overflow-hidden transition-all hover:shadow-lg border-border/50">
                  <div className="relative h-40 overflow-hidden">
                    <Image src={feature.image} alt={feature.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                    <div className={`absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} shadow-md`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <CardContent className="p-6 pt-2">
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ Stats Section ═══ */}
      <section className="relative overflow-hidden border-y border-border bg-muted/30 py-16">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={item}>
                <Card className="border-border/50 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center">
                      <div className="relative w-24 h-24 shrink-0">
                        <Image src={stat.image} alt={stat.label} fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card" />
                      </div>
                      <div className="pl-4 pr-4 py-3">
                        <p className="text-2xl font-bold text-gradient-gold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ Featured Courses ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Featured Courses</h2>
              <p className="mt-3 text-muted-foreground">Handpicked by our experts to fast-track your financial journey.</p>
            </div>
            <Button variant="ghost" className="text-gold hover:text-gold-dark" onClick={onRegister}>
              View All Courses <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <motion.div key={course.title} variants={item}>
                <Card className="group h-full overflow-hidden transition-all hover:shadow-lg border-border/50">
                  <div className="relative h-52 overflow-hidden">
                    <Image src={course.image} alt={course.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    <Badge className="absolute top-4 left-4 bg-gold text-white border-0 text-xs">{course.level}</Badge>
                    <div className="absolute top-4 right-4 flex items-center gap-1 rounded-lg bg-background/90 backdrop-blur px-2 py-1 text-xs font-medium">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      {course.rating}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-3 text-xs text-white/90">
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.lessons} lessons</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.students.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-xs text-muted-foreground">{course.instructor}</p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground group-hover:text-gold transition-colors">{course.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-bold text-foreground">{formatAmount(course.price)}</span>
                      <Button size="sm" variant="outline" className="hover:border-gold/30 hover:text-gold" onClick={onRegister}>Enroll Now</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ How It Works (with images) ═══ */}
      <section className="border-t border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Get started in four simple steps.</p>
          </motion.div>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div key={step.step} variants={item} className="relative group">
                <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all hover:shadow-lg">
                  <div className="relative h-44 overflow-hidden">
                    <Image src={step.image} alt={step.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                    <div className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold text-base font-bold text-white shadow-md">
                      {step.step}
                    </div>
                  </div>
                  <CardContent className="p-5 pt-1">
                    <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </div>
                {index < 3 && (
                  <div className="absolute top-1/2 -right-4 z-10 hidden lg:flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ Instructors Section ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Learn From the Best</h2>
            <p className="mt-3 text-muted-foreground">Our instructors are industry veterans with proven track records.</p>
          </motion.div>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {instructors.map((inst) => (
              <motion.div key={inst.name} variants={item}>
                <Card className="group h-full overflow-hidden border-border/50 transition-all hover:shadow-lg">
                  <div className="relative h-64 overflow-hidden">
                    <Image src={inst.image} alt={inst.name} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  </div>
                  <CardContent className="p-5 text-center -mt-12 relative">
                    <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-card overflow-hidden shadow-lg">
                      <Image src={inst.image} alt={inst.name} fill className="object-cover object-top" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{inst.name}</h3>
                    <p className="text-xs font-medium text-gold">{inst.role}</p>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{inst.bio}</p>
                    <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span>{inst.courses} courses</span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                      <span>{inst.students} students</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ Success Stories ═══ */}
      <section className="border-t border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Success Stories</h2>
            <p className="mt-3 text-muted-foreground">Real transformations from our community members.</p>
          </motion.div>
          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            {successStories.map((story, index) => (
              <motion.div key={story.name} initial={index === 0 ? fadeInLeft : fadeInRight} whileInView="show" viewport={{ once: true }}>
                <Card className="overflow-hidden border-border/50">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-5">
                      <div className="relative md:col-span-2 h-56 md:h-full min-h-[280px]">
                        <Image src={story.image} alt={story.name} fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80 hidden md:block" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent md:hidden" />
                        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                          <p className="text-lg font-bold text-foreground">{story.name}</p>
                          <p className="text-xs text-muted-foreground">Member for {story.time}</p>
                        </div>
                      </div>
                      <div className="md:col-span-3 p-6 flex flex-col justify-center">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="rounded-xl bg-gold/10 p-3">
                            <Trophy className="h-6 w-6 text-gold" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{story.metric}</p>
                            <p className="text-xs text-muted-foreground">{story.metricLabel}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 text-xs font-bold text-red-500 dark:text-red-400 shrink-0">Before</span>
                            <p className="text-sm text-muted-foreground">{story.before}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 text-xs font-bold text-green-600 dark:text-green-400 shrink-0">After</span>
                            <p className="text-sm text-muted-foreground">{story.after}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-4 text-gold hover:text-gold-dark self-start p-0">
                          Read Full Story <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-bold text-foreground">What Our Students Say</h2>
            <p className="mt-3 text-muted-foreground">Join 10,000+ satisfied learners from around the world.</p>
          </motion.div>

          {/* Large featured testimonial */}
          <motion.div initial={scaleIn} whileInView="show" viewport={{ once: true }} className="mt-12 mb-8">
            <Card className="overflow-hidden border-gold/20 bg-gradient-to-br from-gold/5 via-card to-orange/5">
              <CardContent className="p-8 md:p-12">
                <Quote className="h-10 w-10 text-gold/20 mb-4" />
                <p className="text-lg md:text-xl leading-relaxed text-foreground font-medium italic">
                  &ldquo;{testimonials[activeTestimonial].text}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-gold/30">
                    <Image src={testimonials[activeTestimonial].image} alt={testimonials[activeTestimonial].name} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonials[activeTestimonial].name}</p>
                    <p className="text-sm text-muted-foreground">{testimonials[activeTestimonial].role}</p>
                  </div>
                  <Badge className="ml-auto bg-gold/10 text-gold border-gold/20 hidden sm:flex">{testimonials[activeTestimonial].achievement}</Badge>
                </div>
                {/* Dots */}
                <div className="mt-8 flex items-center gap-2">
                  {testimonials.map((_, i) => (
                    <button key={i} onClick={() => setActiveTestimonial(i)} className={`h-2 rounded-full transition-all ${i === activeTestimonial ? 'w-8 bg-gold' : 'w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40'}`} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Grid testimonials */}
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.filter((_, i) => i !== activeTestimonial).slice(0, 6).map((t) => (
              <motion.div key={t.name} variants={item} onClick={() => setActiveTestimonial(testimonials.indexOf(t))} className="cursor-pointer">
                <Card className="h-full transition-all hover:shadow-md hover:border-gold/20 border-border/50">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">&ldquo;{t.text}&rdquo;</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden">
                        <Image src={t.image} alt={t.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ Platform Features Showcase ═══ */}
      <section className="border-t border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Why Hustle University?</h2>
            <p className="mt-3 text-muted-foreground">Platform features designed to accelerate your growth.</p>
          </motion.div>
          <div className="mt-12 space-y-16">
            {/* Feature 1 */}
            <motion.div initial={fadeInLeft} whileInView="show" viewport={{ once: true }} className="grid items-center gap-10 lg:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl shadow-lg">
                <Image src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop&q=80" alt="Analytics Dashboard" width={800} height={500} className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent" />
              </div>
              <div className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                  <BarChart3 className="h-6 w-6 text-gold" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Real-Time Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">Track your earnings, course progress, investments, and referral commissions all from a single intuitive dashboard. Make data-driven decisions about your financial future.</p>
                <ul className="space-y-2">
                  {['Live earnings tracking', 'Investment performance graphs', 'Referral commission breakdown'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-gold shrink-0" /> {f}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
            {/* Feature 2 */}
            <motion.div initial={fadeInRight} whileInView="show" viewport={{ once: true }} className="grid items-center gap-10 lg:grid-cols-2">
              <div className="space-y-4 order-2 lg:order-1">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange/10">
                  <Shield className="h-6 w-6 text-orange" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Secure Escrow System</h3>
                <p className="text-muted-foreground leading-relaxed">Every transaction on our platform is protected by our built-in escrow system. Your investments, deals, and payments are safe until all conditions are met.</p>
                <ul className="space-y-2">
                  {['Multi-party transaction protection', 'Automated milestone releases', 'Dispute resolution system'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-orange shrink-0" /> {f}</li>
                  ))}
                </ul>
              </div>
              <div className="relative overflow-hidden rounded-2xl shadow-lg order-1 lg:order-2">
                <Image src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop&q=80" alt="Security" width={800} height={500} className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-l from-orange/10 to-transparent" />
              </div>
            </motion.div>
            {/* Feature 3 */}
            <motion.div initial={fadeInLeft} whileInView="show" viewport={{ once: true }} className="grid items-center gap-10 lg:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl shadow-lg">
                <Image src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=500&fit=crop&q=80" alt="Community" width={800} height={500} className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent" />
              </div>
              <div className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                  <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Global Community</h3>
                <p className="text-muted-foreground leading-relaxed">Connect with like-minded learners, share strategies, and grow together. Our community spans over 50 countries with active forums, live events, and networking opportunities.</p>
                <ul className="space-y-2">
                  {['50+ country community', 'Live monthly webinars', 'Peer-to-peer networking'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" /> {f}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ Pricing Section ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Choose Your Plan</h2>
            <p className="mt-3 text-muted-foreground">Invest in your future with the right plan for your goals.</p>
          </motion.div>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <motion.div key={plan.name} variants={item}>
                <Card className={`relative h-full transition-shadow hover:shadow-lg ${(plan as any).highlighted ? 'border-gold shadow-md ring-1 ring-gold/20' : ''}`}>
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
                      <span className="text-4xl font-bold text-foreground">{formatAmount(plan.price)}</span>
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
                      className={`w-full ${(plan as any).highlighted ? 'bg-gold text-white hover:bg-gold-dark' : ''}`}
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

      {/* ═══ FAQ Section ═══ */}
      <section className="border-t border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
            <p className="mt-3 text-muted-foreground">Got questions? We&apos;ve got answers.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-12">
            <Accordion type="single" collapsible className="space-y-3">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border border-border/50 rounded-xl px-6 bg-card data-[state=open]:shadow-sm transition-shadow">
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={scaleIn} whileInView="show" viewport={{ once: true }} className="relative overflow-hidden rounded-2xl border border-gold/20">
            <div className="absolute inset-0">
              <Image src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1400&h=600&fit=crop&q=80" alt="CTA background" fill className="object-cover opacity-10" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-orange/5 to-gold/10" />
            <div className="relative p-8 text-center sm:p-16">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/20 mb-6">
                <Target className="h-8 w-8 text-gold" />
              </div>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Ready to Start Your Journey?</h2>
              <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
                Join thousands of students who are already building their financial future with Hustle University. Your first step toward financial freedom starts here.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" onClick={onRegister} className="bg-gold px-10 text-white hover:bg-gold-dark">
                  Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={onLogin} className="border-gold/30 text-gold hover:bg-gold/5">
                  Sign In to Dashboard
                </Button>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">No credit card required to explore. Cancel anytime.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-border bg-muted/30 pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-foreground">Hustle<span className="text-gold"> University</span></span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Empowering financial literacy and wealth creation through education, community, and smart investing.</p>
            </div>
            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">Platform</h4>
              <ul className="space-y-2.5">
                {['Courses', 'Investments', 'Referral Program', 'Escrow System', 'Community Forum'].map((link) => (
                  <li key={link}><button onClick={onRegister} className="text-sm text-muted-foreground hover:text-gold transition-colors">{link}</button></li>
                ))}
              </ul>
            </div>
            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2.5">
                {['About Us', 'Careers', 'Blog', 'Contact', 'Press Kit'].map((link) => (
                  <li key={link}><button className="text-sm text-muted-foreground hover:text-gold transition-colors">{link}</button></li>
                ))}
              </ul>
            </div>
            {/* Support */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2.5">
                {['Help Center', 'Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Status Page'].map((link) => (
                  <li key={link}><button className="text-sm text-muted-foreground hover:text-gold transition-colors">{link}</button></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Hustle University. All rights reserved.</p>
            <div className="flex items-center gap-3">
              {['Twitter', 'LinkedIn', 'Instagram', 'YouTube'].map((social) => (
                <button key={social} className="text-xs text-muted-foreground hover:text-gold transition-colors px-3 py-1.5 rounded-md border border-border/50 hover:border-gold/20">
                  {social}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
