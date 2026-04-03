import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/courses - List all courses with enrollment count, optional category filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    const courses = await db.course.findMany({
      where: categoryId ? { skillCategoryId: categoryId } : undefined,
      include: {
        _count: {
          select: { enrollments: true, lessons: true },
        },
        skillCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If authenticated, include user enrollment and certification info per course
    const payload = authenticate(req);
    if (payload) {
      const enrollments = await db.enrollment.findMany({
        where: { userId: payload.userId, courseId: { in: courses.map(c => c.id) } },
        select: { courseId: true, progress: true },
      });

      const certifications = await db.courseCertification.findMany({
        where: { userId: payload.userId, courseId: { in: courses.map(c => c.id) } },
        select: { courseId: true },
      });

      const enrollmentMap = new Map(enrollments.map(e => [e.courseId, e.progress]));
      const certificationSet = new Set(certifications.map(c => c.courseId));

      const enrichedCourses = courses.map(course => ({
        ...course,
        userProgress: enrollmentMap.has(course.id) ? { enrolled: true, progress: enrollmentMap.get(course.id)! } : null,
        hasCertification: certificationSet.has(course.id),
      }));

      return NextResponse.json({ courses: enrichedCourses });
    }

    return NextResponse.json({ courses });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/courses - Enroll or update progress
export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'enroll') {
      return handleEnroll(payload.userId, body);
    } else if (action === 'progress') {
      return handleProgress(payload.userId, body);
    }

    return NextResponse.json({ error: 'Invalid action. Use "enroll" or "progress".' }, { status: 400 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleEnroll(userId: string, body: Record<string, unknown>) {
  const { courseId } = body;

  if (!courseId) {
    return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 });
  }

  const course = await db.course.findUnique({ where: { id: courseId as string } });
  if (!course) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  }

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: courseId as string } },
  });

  if (existing) {
    return NextResponse.json({ error: 'Already enrolled in this course.' }, { status: 400 });
  }

  const enrollment = await db.enrollment.create({
    data: {
      userId,
      courseId: courseId as string,
      progress: 0,
    },
  });

  await db.notification.create({
    data: {
      userId,
      title: 'Enrolled!',
      message: `You have been enrolled in "${course.title}". Start learning now!`,
      type: 'success',
    },
  });

  return NextResponse.json({ enrollment }, { status: 201 });
}

async function handleProgress(userId: string, body: Record<string, unknown>) {
  const { lessonId, courseId } = body;

  if (!lessonId || !courseId) {
    return NextResponse.json({ error: 'Lesson ID and Course ID are required.' }, { status: 400 });
  }

  // Check enrollment exists
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: courseId as string } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: 'You are not enrolled in this course.' }, { status: 400 });
  }

  // Check lesson belongs to course
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId as string, courseId: courseId as string },
  });
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found in this course.' }, { status: 404 });
  }

  // Upsert lesson progress
  const progress = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: lessonId as string } },
    create: {
      userId,
      lessonId: lessonId as string,
      completed: true,
    },
    update: {
      completed: true,
    },
  });

  // Recalculate enrollment progress
  const totalLessons = await db.lesson.count({ where: { courseId: courseId as string } });
  const completedLessons = await db.lessonProgress.count({
    where: {
      userId,
      lessonId: { in: (await db.lesson.findMany({ where: { courseId: courseId as string }, select: { id: true } })).map(l => l.id) },
      completed: true,
    },
  });

  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const updatedEnrollment = await db.enrollment.update({
    where: { userId_courseId: { userId, courseId: courseId as string } },
    data: { progress: progressPercent },
  });

  // Check if course completed
  if (progressPercent === 100) {
    await db.notification.create({
      data: {
        userId,
        title: 'Course Completed! 🎉',
        message: `Congratulations! You have completed all lessons in this course.`,
        type: 'success',
      },
    });

    // Award bonus for course completion
    const wallet = await db.wallet.findUnique({ where: { userId } });
    if (wallet) {
      const bonus = 5.0;
      await db.wallet.update({
        where: { userId },
        data: { balance: { increment: bonus } },
      });
      await db.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          amount: bonus,
          description: 'Course completion bonus',
        },
      });
      await db.earning.create({
        data: {
          walletId: wallet.id,
          userId,
          amount: bonus,
          source: 'bonus',
          description: 'Course completion bonus',
        },
      });
    }
  }

  return NextResponse.json({ progress, enrollment: updatedEnrollment });
}
