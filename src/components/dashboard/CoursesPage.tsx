'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Play,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import PageWrapper from '@/components/shared/PageWrapper';
import EmptyState from '@/components/shared/EmptyState';
import { useAuthStore } from '@/store/auth';

interface Lesson {
  id: string;
  title: string;
  content: string;
  order: number;
  completed: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  thumbnail: string | null;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

interface CourseDetail extends Course {
  lessons: Lesson[];
}

export default function CoursesPage() {
  const token = useAuthStore((s) => s.token);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, [token]);

  const fetchCourses = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch {
      // fallback data
      setCourses([
        {
          id: '1', title: 'Financial Literacy 101', description: 'Master the basics of personal finance, budgeting, and saving strategies.',
          difficulty: 'beginner', category: 'Finance', thumbnail: null, progress: 60,
          totalLessons: 8, completedLessons: 5,
        },
        {
          id: '2', title: 'Investment Fundamentals', description: 'Learn about stocks, bonds, ETFs, and portfolio diversification.',
          difficulty: 'intermediate', category: 'Investing', thumbnail: null, progress: 30,
          totalLessons: 10, completedLessons: 3,
        },
        {
          id: '3', title: 'Cryptocurrency Trading', description: 'Understand blockchain technology and crypto trading strategies.',
          difficulty: 'advanced', category: 'Crypto', thumbnail: null, progress: 0,
          totalLessons: 12, completedLessons: 0,
        },
        {
          id: '4', title: 'Passive Income Strategies', description: 'Discover multiple streams of passive income for financial freedom.',
          difficulty: 'intermediate', category: 'Income', thumbnail: null, progress: 100,
          totalLessons: 6, completedLessons: 6,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openCourse = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCourse(data);
      }
    } catch {
      // fallback
      const c = courses.find((c) => c.id === courseId);
      if (c) {
        setSelectedCourse({
          ...c,
          lessons: Array.from({ length: c.totalLessons }, (_, i) => ({
            id: `lesson-${i + 1}`,
            title: `Lesson ${i + 1}: ${['Introduction', 'Core Concepts', 'Deep Dive', 'Practical Application', 'Case Study', 'Advanced Topics', 'Review', 'Final Assessment'][i % 8]}`,
            content: 'Course content would appear here...',
            order: i + 1,
            completed: i < c.completedLessons,
          })),
        });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!token || !selectedCourse) return;
    try {
      const res = await fetch('/api/courses/progress', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lessonId, courseId: selectedCourse.id }),
      });
      if (res.ok) {
        setSelectedCourse((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            lessons: prev.lessons.map((l) =>
              l.id === lessonId ? { ...l, completed: true } : l
            ),
            completedLessons: prev.completedLessons + 1,
            progress: Math.round(((prev.completedLessons + 1) / prev.totalLessons) * 100),
          };
        });
      }
    } catch {
      // fallback: update local state
      setSelectedCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lessons: prev.lessons.map((l) =>
            l.id === lessonId ? { ...l, completed: true } : l
          ),
          completedLessons: prev.completedLessons + 1,
          progress: Math.round(((prev.completedLessons + 1) / prev.totalLessons) * 100),
        };
      });
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });
      if (res.ok) {
        fetchCourses();
      }
    } catch {
      // silent fail
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'intermediate':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'advanced':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Course Detail View
  if (selectedCourse) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedCourse(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{selectedCourse.title}</h1>
                <Badge className={getDifficultyColor(selectedCourse.difficulty)} variant="outline">
                  {selectedCourse.difficulty}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{selectedCourse.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedCourse.category}</Badge>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{selectedCourse.progress}%</span>
            </div>
            <Progress value={selectedCourse.progress} />
          </div>
        </motion.div>

        {/* Lessons List */}
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-2 pr-4">
            {selectedCourse.lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={lesson.completed ? 'border-gold/20 bg-gold/5' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                          lesson.completed ? 'bg-gold text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {lesson.completed ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            lesson.completed ? 'text-gold' : 'text-foreground'
                          }`}>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Lesson {lesson.order} &bull; {lesson.content.length > 20 ? 'Content available' : 'Coming soon'}
                          </p>
                        </div>
                      </div>
                      {!lesson.completed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markLessonComplete(lesson.id)}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Courses Grid
  return (
    <PageWrapper title="Courses" description="Explore our library of financial education courses.">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses available"
          description="Check back soon for new courses."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md" onClick={() => openCourse(course.id)}>
                {/* Thumbnail placeholder */}
                <div className="relative h-36 rounded-t-xl bg-gradient-to-br from-gold/20 to-orange/10 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-gold/40" />
                  <Badge className={`absolute top-3 right-3 ${getDifficultyColor(course.difficulty)}`} variant="outline">
                    {course.difficulty}
                  </Badge>
                  {course.progress === 100 && (
                    <Badge className="absolute top-3 left-3 bg-green-500 text-white border-0">
                      Completed
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                  </div>
                  <CardTitle className="text-base mt-1 line-clamp-1">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {course.progress > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} />
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span>{course.totalLessons} lessons</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
