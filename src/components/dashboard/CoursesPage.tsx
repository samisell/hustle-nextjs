'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Play,
  Lock,
  Award,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Filter,
  Shield,
  Star,
  Zap,
  Trophy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import PageWrapper from '@/components/shared/PageWrapper';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  _count: { courses: number };
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  order: number;
  completed: boolean;
  estimatedMinutes?: number;
}

interface CourseSkillCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  category: string | null;
  thumbnail: string | null;
  estimatedHours: number;
  skillCategory: CourseSkillCategory | null;
  _count: { enrollments: number; lessons: number };
  userProgress: { enrolled: boolean; progress: number } | null;
  hasCertification?: boolean;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  category: string | null;
  estimatedHours: number;
  skillCategory: CourseSkillCategory | null;
  lessons: Lesson[];
  userProgress: { enrolled: boolean; enrollment: { progress: number }; completedLessonIds: string[] } | null;
  certification: { id: string; badgeName: string; earnedAt: string } | null;
  _count: { enrollments: number };
}

interface Certification {
  id: string;
  badgeName: string;
  earnedAt: string;
  course: {
    id: string;
    title: string;
    skillCategory: { id: string; name: string; color: string } | null;
  };
}

/* ═══════════════════════════════════════════════════════════════
   FALLBACK DATA
   ═══════════════════════════════════════════════════════════════ */

const FALLBACK_CATEGORIES: SkillCategory[] = [
  { id: 'cat-1', name: 'Finance', slug: 'finance', description: 'Financial literacy and money management', icon: 'DollarSign', color: '#10B981', _count: { courses: 3 } },
  { id: 'cat-2', name: 'Investing', slug: 'investing', description: 'Investment strategies and portfolio management', icon: 'TrendingUp', color: '#3B82F6', _count: { courses: 2 } },
  { id: 'cat-3', name: 'Crypto', slug: 'crypto', description: 'Cryptocurrency and blockchain technology', icon: 'Bitcoin', color: '#F59E0B', _count: { courses: 1 } },
  { id: 'cat-4', name: 'Business', slug: 'business', description: 'Entrepreneurship and business strategy', icon: 'Briefcase', color: '#8B5CF6', _count: { courses: 2 } },
];

const FALLBACK_COURSES: Course[] = [
  { id: '1', title: 'Financial Literacy 101', description: 'Master the basics of personal finance, budgeting, and saving strategies to build a strong financial foundation.', difficulty: 'beginner', category: 'Finance', thumbnail: null, estimatedHours: 4, skillCategory: { id: 'cat-1', name: 'Finance', slug: 'finance', icon: 'DollarSign', color: '#10B981' }, _count: { enrollments: 245, lessons: 8 }, userProgress: { enrolled: true, progress: 60 }, hasCertification: false },
  { id: '2', title: 'Investment Fundamentals', description: 'Learn about stocks, bonds, ETFs, and portfolio diversification to grow your wealth steadily.', difficulty: 'intermediate', category: 'Investing', thumbnail: null, estimatedHours: 6, skillCategory: { id: 'cat-2', name: 'Investing', slug: 'investing', icon: 'TrendingUp', color: '#3B82F6' }, _count: { enrollments: 167, lessons: 10 }, userProgress: { enrolled: true, progress: 30 }, hasCertification: false },
  { id: '3', title: 'Cryptocurrency Trading', description: 'Understand blockchain technology and crypto trading strategies for the digital economy.', difficulty: 'advanced', category: 'Crypto', thumbnail: null, estimatedHours: 8, skillCategory: { id: 'cat-3', name: 'Crypto', slug: 'crypto', icon: 'Bitcoin', color: '#F59E0B' }, _count: { enrollments: 198, lessons: 12 }, userProgress: null, hasCertification: false },
  { id: '4', title: 'Passive Income Strategies', description: 'Discover multiple streams of passive income for financial freedom and independence.', difficulty: 'intermediate', category: 'Finance', thumbnail: null, estimatedHours: 3, skillCategory: { id: 'cat-1', name: 'Finance', slug: 'finance', icon: 'DollarSign', color: '#10B981' }, _count: { enrollments: 134, lessons: 6 }, userProgress: { enrolled: true, progress: 100 }, hasCertification: true },
  { id: '5', title: 'Business Strategy Masterclass', description: 'Build and scale your business with proven strategies from top entrepreneurs.', difficulty: 'advanced', category: 'Business', thumbnail: null, estimatedHours: 10, skillCategory: { id: 'cat-4', name: 'Business', slug: 'business', icon: 'Briefcase', color: '#8B5CF6' }, _count: { enrollments: 89, lessons: 14 }, userProgress: null, hasCertification: false },
  { id: '6', title: 'Real Estate Investing', description: 'Introduction to real estate investment strategies and property management basics.', difficulty: 'beginner', category: 'Investing', thumbnail: null, estimatedHours: 5, skillCategory: { id: 'cat-2', name: 'Investing', slug: 'investing', icon: 'TrendingUp', color: '#3B82F6' }, _count: { enrollments: 156, lessons: 8 }, userProgress: null, hasCertification: false },
];

const FALLBACK_CERTIFICATIONS: Certification[] = [
  { id: 'cert-1', badgeName: 'Passive Income Pro', earnedAt: '2024-03-10T12:00:00Z', course: { id: '4', title: 'Passive Income Strategies', skillCategory: { id: 'cat-1', name: 'Finance', color: '#10B981' } } },
];

const FALLBACK_LESSONS: Lesson[] = [
  { id: 'l1', title: 'Introduction to the Course', content: '## Welcome to the Course\n\nThis is the beginning of your learning journey. In this lesson, we will cover the fundamentals and set you up for success.\n\n**Key Takeaways:**\n- Understanding the core concepts\n- Setting realistic expectations\n- Building a learning routine\n\nLet\'s dive in and start building your knowledge step by step.', order: 1, completed: true, estimatedMinutes: 5 },
  { id: 'l2', title: 'Core Concepts Explained', content: '## Core Concepts\n\nIn this lesson, we break down the essential concepts you need to understand.\n\n### Concept 1: Foundation\nBuilding a strong foundation is crucial. Every expert started as a beginner, and mastering the basics is what separates successful practitioners from the rest.\n\n### Concept 2: Strategy\nDeveloping a clear strategy helps you stay focused and make informed decisions. Here are the key elements:\n- Define your goals clearly\n- Assess your current position\n- Create an actionable plan\n- Track your progress regularly\n\n### Concept 3: Execution\n**Execution is everything.** Without taking action, even the best strategy is worthless. Start small, be consistent, and iterate based on results.', order: 2, completed: true, estimatedMinutes: 10 },
  { id: 'l3', title: 'Deep Dive: Advanced Techniques', content: '## Advanced Techniques\n\nNow that you understand the basics, let\'s explore more advanced techniques.\n\n**Important:** These techniques require practice and patience.\n\n- Technique A: Focus on compound growth\n- Technique B: Diversify your approach\n- Technique C: Leverage technology and automation\n\n> Remember: The goal is progress, not perfection. Each small step forward is a victory.', order: 3, completed: false, estimatedMinutes: 15 },
  { id: 'l4', title: 'Practical Application', content: '## Putting It Into Practice\n\nThis lesson focuses on real-world application of everything you\'ve learned so far.\n\n### Step-by-Step Guide:\n1. Review your notes from previous lessons\n2. Identify one area to focus on\n3. Take action immediately\n4. Document your results\n5. Adjust and optimize\n\n**Pro Tip:** The best time to start was yesterday. The second best time is now.', order: 4, completed: false, estimatedMinutes: 12 },
  { id: 'l5', title: 'Case Study Analysis', content: '## Case Study: Real-World Example\n\nLet\'s analyze a real-world case study that demonstrates these principles in action.\n\n### Background\nA beginner started with no prior knowledge and applied the strategies systematically over 6 months.\n\n### Results\n- Month 1: Established foundation\n- Month 2-3: Started seeing results\n- Month 4-5: Scaled the approach\n- Month 6: Achieved significant milestone\n\n**The key lesson:** Consistency beats intensity every time.', order: 5, completed: false, estimatedMinutes: 8 },
  { id: 'l6', title: 'Final Review & Next Steps', content: '## Course Wrap-Up\n\nCongratulations on making it this far! Let\'s review what we\'ve covered and plan your next steps.\n\n### Summary\n- You\'ve learned the fundamentals\n- You\'ve explored advanced techniques\n- You\'ve seen real-world applications\n\n### Next Steps\n- Continue practicing daily\n- Join the community for support\n- Explore advanced courses\n- Share your knowledge with others\n\n**Final Thought:** Your journey doesn\'t end here. This is just the beginning of something great. Keep learning, keep growing, and keep pushing forward.', order: 6, completed: false, estimatedMinutes: 6 },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
    case 'intermediate': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    case 'advanced': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
}

function renderFormattedContent(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="my-2 ml-4 space-y-1 list-disc text-muted-foreground">
          {currentList.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed === '') {
      flushList();
      elements.push(<br key={`br-${idx}`} />);
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h2-${idx}`} className="mt-4 mb-2 text-base font-semibold text-foreground">
          {trimmed.slice(3)}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h3-${idx}`} className="mt-3 mb-1 text-sm font-semibold text-foreground">
          {trimmed.slice(4)}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '$1'));
      return;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      currentList.push(trimmed.replace(/^\d+\.\s/, ''));
      return;
    }

    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={`quote-${idx}`} className="my-2 border-l-2 border-gold/40 pl-3 italic text-muted-foreground">
          {trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}
        </blockquote>
      );
      return;
    }

    flushList();
    const boldFormatted = trimmed.replace(/\*\*(.*?)\*\*/g, (_, match) => `<strong class="font-semibold text-foreground">${match}</strong>`);
    elements.push(
      <p key={`p-${idx}`} className="my-1 text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: boldFormatted }} />
    );
  });

  flushList();
  return elements;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function CoursesPage() {
  const token = useAuthStore((s) => s.token);

  /* ──────── State ──────── */
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'courses' | 'certifications'>('courses');
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ──────── Data Fetching ──────── */
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/skill-categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        return;
      }
    } catch { /* fallback */ }
    setCategories(FALLBACK_CATEGORIES);
  }, []);

  const fetchCourses = useCallback(async (categoryId?: string | null) => {
    setLoading(true);
    try {
      const url = categoryId ? `/api/courses?categoryId=${categoryId}` : '/api/courses';
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        return;
      }
    } catch { /* fallback */ }
    const filtered = categoryId
      ? FALLBACK_COURSES.filter(c => c.skillCategory?.id === categoryId)
      : FALLBACK_COURSES;
    setCourses(filtered);
  }, [token]);

  const fetchCertifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/certifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCertifications(data.certifications || []);
        return;
      }
    } catch { /* fallback */ }
    setCertifications(FALLBACK_CERTIFICATIONS);
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchCourses(selectedCategory);
  }, [fetchCourses, selectedCategory]);

  useEffect(() => {
    fetchCertifications();
  }, [fetchCertifications]);

  /* ──────── Stats ──────── */
  const stats = {
    totalCourses: courses.length + (selectedCategory
      ? Math.max(0, FALLBACK_COURSES.length - FALLBACK_COURSES.filter(c => c.skillCategory?.id === selectedCategory).length + FALLBACK_COURSES.filter(c => c.skillCategory?.id === selectedCategory).length)
      : 0),
    enrolled: courses.filter(c => c.userProgress?.enrolled).length,
    completed: courses.filter(c => c.userProgress?.progress === 100 || c.hasCertification).length,
  };

  // For fallback, always show the full counts
  const displayStats = courses.length > 0 ? {
    total: courses.length,
    enrolled: courses.filter(c => c.userProgress?.enrolled).length,
    completed: courses.filter(c => c.hasCertification || c.userProgress?.progress === 100).length,
  } : {
    total: FALLBACK_COURSES.length,
    enrolled: FALLBACK_COURSES.filter(c => c.userProgress?.enrolled).length,
    completed: FALLBACK_COURSES.filter(c => c.hasCertification).length,
  };

  /* ──────── Actions ──────── */
  const openCourse = async (courseId: string) => {
    setCourseLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/courses/${courseId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedCourse(data.course);
        setCourseLoading(false);
        return;
      }
    } catch { /* fallback */ }

    // Fallback: use the fallback course data
    const c = FALLBACK_COURSES.find(x => x.id === courseId);
    if (c) {
      const fallbackProgress = c.userProgress?.progress ?? 0;
      setSelectedCourse({
        id: c.id,
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        category: c.category,
        estimatedHours: c.estimatedHours,
        skillCategory: c.skillCategory,
        lessons: FALLBACK_LESSONS,
        userProgress: c.userProgress?.enrolled ? {
          enrolled: true,
          enrollment: { progress: fallbackProgress },
          completedLessonIds: FALLBACK_LESSONS.filter((_, i) => i < Math.floor((fallbackProgress / 100) * FALLBACK_LESSONS.length)).map(l => l.id),
        } : null,
        certification: c.hasCertification ? { id: 'cert-1', badgeName: 'Passive Income Pro', earnedAt: '2024-03-10T12:00:00Z' } : null,
        _count: { enrollments: c._count.enrollments },
      });
    }
    setCourseLoading(false);
  };

  const enrollInCourse = async (courseId: string) => {
    if (!token) return;
    setActionLoading(`enroll-${courseId}`);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'enroll', courseId }),
      });
      if (res.ok) {
        toast.success('Enrolled successfully! Start learning now.');
        fetchCourses(selectedCategory);
        // Refresh course detail if open
        if (selectedCourse?.id === courseId) {
          openCourse(courseId);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to enroll.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!token || !selectedCourse) return;
    setActionLoading(`lesson-${lessonId}`);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'progress', lessonId, courseId: selectedCourse.id }),
      });
      if (res.ok) {
        toast.success('Lesson completed! 🎉');

        // Update local state
        setSelectedCourse(prev => {
          if (!prev) return prev;
          const newCompletedIds = new Set([...(prev.userProgress?.completedLessonIds || []), lessonId]);
          const newCompletedCount = newCompletedIds.size;
          const totalLessons = prev.lessons.length;
          const newProgress = Math.round((newCompletedCount / totalLessons) * 100);

          return {
            ...prev,
            lessons: prev.lessons.map(l => l.id === lessonId ? { ...l, completed: true } : l),
            userProgress: prev.userProgress ? {
              ...prev.userProgress,
              enrollment: { ...prev.userProgress.enrollment, progress: newProgress },
              completedLessonIds: Array.from(newCompletedIds),
            } : prev.userProgress,
            certification: newProgress === 100 && !prev.certification
              ? { id: `cert-${Date.now()}`, badgeName: `${prev.title} Master`, earnedAt: new Date().toISOString() }
              : prev.certification,
          };
        });
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to mark complete.');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleLessonExpand = (lessonId: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  /* ═══════════════════════════════════════════════════════════════
     COURSE DETAIL VIEW
     ═══════════════════════════════════════════════════════════════ */

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (selectedCourse) {
    const progress = selectedCourse.userProgress?.enrollment?.progress || 0;
    const completedCount = selectedCourse.userProgress?.completedLessonIds?.length || 0;
    const totalLessons = selectedCourse.lessons.length;
    const isCertified = !!selectedCourse.certification || progress === 100;

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => { setSelectedCourse(null); setExpandedLessons(new Set()); }}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Learning Hub
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Certification Banner */}
          {isCertified && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border-2 border-gold/30 bg-gradient-to-r from-gold/5 to-orange/5 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
                  <Award className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-gold">Course Completed! 🎉</h3>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve earned your certification: <span className="font-medium text-foreground">{selectedCourse.certification?.badgeName || `${selectedCourse.title} Master`}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Course Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedCourse.skillCategory && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: selectedCourse.skillCategory.color, color: selectedCourse.skillCategory.color, backgroundColor: `${selectedCourse.skillCategory.color}10` }}
                      >
                        <span className="mr-1">{selectedCourse.skillCategory.icon}</span>
                        {selectedCourse.skillCategory.name}
                      </Badge>
                    )}
                    <Badge variant="outline" className={getDifficultyColor(selectedCourse.difficulty)}>
                      {selectedCourse.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl md:text-2xl">{selectedCourse.title}</CardTitle>
                  <CardDescription className="text-sm">{selectedCourse.description}</CardDescription>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {selectedCourse.estimatedHours || 'N/A'}h estimated
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    {totalLessons} lessons
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Progress Section */}
          {selectedCourse.userProgress?.enrolled && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Progress: {completedCount}/{totalLessons} lessons
                  </span>
                  <span className="text-sm font-bold text-gold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* Enroll Button */}
          {!selectedCourse.userProgress?.enrolled && (
            <Card>
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                    <Play className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium">Ready to start learning?</p>
                    <p className="text-sm text-muted-foreground">Enroll to track your progress and earn a certification.</p>
                  </div>
                </div>
                <Button
                  className="bg-gold text-white hover:bg-gold-dark whitespace-nowrap"
                  onClick={() => enrollInCourse(selectedCourse.id)}
                  disabled={actionLoading?.startsWith('enroll-')}
                >
                  {actionLoading?.startsWith('enroll-') ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enrolling...</>
                  ) : (
                    <><GraduationCap className="mr-2 h-4 w-4" />Enroll Now</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lessons List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gold" />
                Course Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[calc(100vh-420px)]">
                <div className="divide-y">
                  {selectedCourse.lessons.map((lesson, index) => {
                    const isExpanded = expandedLessons.has(lesson.id);
                    const isCompleted = lesson.completed;
                    const estimatedReadingTime = lesson.estimatedMinutes
                      || Math.max(1, Math.ceil((lesson.content?.length || 100) / 150));

                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        {/* Lesson Header - Clickable */}
                        <button
                          onClick={() => toggleLessonExpand(lesson.id)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 transition-colors ${
                            isCompleted
                              ? 'bg-gold text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-bold">{index + 1}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              isCompleted ? 'text-gold' : 'text-foreground'
                            }`}>
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                Lesson {lesson.order}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {estimatedReadingTime} min read
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!isCompleted && selectedCourse.userProgress?.enrolled && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs bg-gold/10 border-gold/20 text-gold hover:bg-gold/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markLessonComplete(lesson.id);
                                }}
                                disabled={actionLoading === `lesson-${lesson.id}`}
                              >
                                {actionLoading === `lesson-${lesson.id}` ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                )}
                                Complete
                              </Button>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pl-15 ml-8 border-l-2 border-gold/20">
                                {lesson.content ? (
                                  <div className="prose-sm max-w-none">
                                    {renderFormattedContent(lesson.content)}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">No content available for this lesson yet.</p>
                                )}

                                {!isCompleted && selectedCourse.userProgress?.enrolled && (
                                  <div className="mt-4 pt-3 border-t">
                                    <Button
                                      size="sm"
                                      className="bg-gold text-white hover:bg-gold-dark"
                                      onClick={() => markLessonComplete(lesson.id)}
                                      disabled={actionLoading === `lesson-${lesson.id}`}
                                    >
                                      {actionLoading === `lesson-${lesson.id}` ? (
                                        <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Marking...</>
                                      ) : (
                                        <><CheckCircle2 className="mr-2 h-3.5 w-3.5" />Mark as Complete</>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     MAIN GRID VIEW
     ═══════════════════════════════════════════════════════════════ */

  return (
    <PageWrapper title="Learning Hub" description="Master high-income skills through actionable text-based courses">
      {/* ──────── Stats Row ──────── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Courses"
          value={displayStats.total}
          icon={BookOpen}
          description="Available courses"
        />
        <StatCard
          title="Enrolled"
          value={displayStats.enrolled}
          icon={GraduationCap}
          description="Active enrollments"
        />
        <StatCard
          title="Completed"
          value={displayStats.completed}
          icon={Award}
          description="Courses finished"
        />
      </div>

      {/* ──────── Tabs ──────── */}
      <div className="flex items-center gap-2 border-b pb-1">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'courses'
              ? 'text-gold border-b-2 border-gold bg-gold/5'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            Courses
          </span>
        </button>
        <button
          onClick={() => setActiveTab('certifications')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'certifications'
              ? 'text-gold border-b-2 border-gold bg-gold/5'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Award className="h-4 w-4" />
            Certifications
            {certifications.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{certifications.length}</Badge>
            )}
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════
         COURSES TAB
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'courses' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* ──────── Category Filter Bar ──────── */}
          <div className="relative">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border shrink-0 ${
                    selectedCategory === null
                      ? 'bg-gold text-white border-gold shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:border-gold/30 hover:text-foreground'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border shrink-0 ${
                      selectedCategory === cat.id
                        ? 'text-white shadow-sm'
                        : 'bg-card text-muted-foreground border-border hover:border-opacity-50 hover:text-foreground'
                    }`}
                    style={selectedCategory === cat.id ? {
                      backgroundColor: cat.color,
                      borderColor: cat.color,
                    } : {
                      borderColor: undefined,
                    }}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.icon.slice(0, 2).toUpperCase()}
                    </span>
                    {cat.name}
                    <span className={`text-xs ${
                      selectedCategory === cat.id ? 'text-white/70' : 'text-muted-foreground'
                    }`}>
                      {cat._count.courses}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* ──────── Course Grid ──────── */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses found"
              description={selectedCategory
                ? "No courses in this category yet. Try browsing other categories."
                : "No courses available yet. Check back soon for new content."
              }
              action={selectedCategory ? {
                label: 'View All Courses',
                onClick: () => setSelectedCategory(null),
              } : undefined}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => {
                const catColor = course.skillCategory?.color || '#D4AF37';
                const progress = course.userProgress?.progress || 0;
                const isEnrolled = course.userProgress?.enrolled;
                const hasCert = course.hasCertification;

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.08, 0.4) }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      className="h-full cursor-pointer transition-shadow hover:shadow-lg overflow-hidden group"
                      onClick={() => openCourse(course.id)}
                    >
                      {/* Color Bar */}
                      <div className="h-1.5" style={{ backgroundColor: catColor }} />

                      <CardHeader className="pb-2 pt-4">
                        <div className="flex items-center justify-between gap-2">
                          {course.skillCategory && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: catColor,
                                color: catColor,
                                backgroundColor: `${catColor}10`,
                              }}
                            >
                              <span className="mr-1">{course.skillCategory.icon}</span>
                              {course.skillCategory.name}
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${getDifficultyColor(course.difficulty)}`}>
                            {course.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="text-base mt-2 line-clamp-1 group-hover:text-gold transition-colors">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-xs">
                          {course.description || 'No description available.'}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0 pb-4 space-y-3">
                        {/* Meta Info */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.estimatedHours || 'N/A'}h
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {course._count.lessons} lessons
                          </span>
                        </div>

                        {/* Progress or Lesson Count */}
                        {isEnrolled ? (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{progress}% complete</span>
                              {hasCert && (
                                <span className="flex items-center gap-1 text-gold font-medium">
                                  <Award className="h-3 w-3" />
                                  Certified
                                </span>
                              )}
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            <span>{course._count.lessons} lessons • Click to enroll</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════
         CERTIFICATIONS TAB
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'certifications' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {certifications.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No certifications yet"
              description="Complete courses to earn certifications and showcase your expertise."
              action={{
                label: 'Browse Courses',
                onClick: () => setActiveTab('courses'),
              }}
            />
          ) : (
            <>
              {/* Summary */}
              <div className="flex items-center gap-3 rounded-lg border border-gold/20 bg-gold/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20">
                  <Trophy className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {certifications.length} Certification{certifications.length !== 1 ? 's' : ''} Earned
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Keep learning to add more to your collection.
                  </p>
                </div>
              </div>

              {/* Certifications Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {certifications.map((cert, index) => {
                  const catColor = cert.course.skillCategory?.color || '#D4AF37';

                  return (
                    <motion.div
                      key={cert.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.08 }}
                    >
                      <Card className="h-full overflow-hidden" style={{ borderColor: `${catColor}30` }}>
                        <div className="h-1" style={{ backgroundColor: catColor }} />
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div
                              className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0"
                              style={{ backgroundColor: `${catColor}15` }}
                            >
                              <Award className="h-7 w-7" style={{ color: catColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm">
                                {cert.badgeName}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {cert.course.title}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {cert.course.skillCategory && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0"
                                    style={{
                                      borderColor: catColor,
                                      color: catColor,
                                    }}
                                  >
                                    {cert.course.skillCategory.name}
                                  </Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  Earned {new Date(cert.earnedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      )}
    </PageWrapper>
  );
}
