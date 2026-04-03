import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// GET /api/courses - List all courses with enrollment count
export async function GET(req: NextRequest) {
  try {
    const courses = await db.course.findMany({
      include: {
        _count: {
          select: { enrollments: true, lessons: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ courses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

async function handleEnroll(userId: string, body: Record<string, any>) {
  const { courseId } = body;

  if (!courseId) {
    return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 });
  }

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  }

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (existing) {
    return NextResponse.json({ error: 'Already enrolled in this course.' }, { status: 400 });
  }

  const enrollment = await db.enrollment.create({
    data: {
      userId,
      courseId,
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

async function handleProgress(userId: string, body: Record<string, any>) {
  const { lessonId, courseId } = body;

  if (!lessonId || !courseId) {
    return NextResponse.json({ error: 'Lesson ID and Course ID are required.' }, { status: 400 });
  }

  // Check enrollment exists
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: 'You are not enrolled in this course.' }, { status: 400 });
  }

  // Check lesson belongs to course
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, courseId },
  });
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found in this course.' }, { status: 404 });
  }

  // Upsert lesson progress
  const progress = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      completed: true,
    },
    update: {
      completed: true,
    },
  });

  // Recalculate enrollment progress
  const totalLessons = await db.lesson.count({ where: { courseId } });
  const completedLessons = await db.lessonProgress.count({
    where: { userId, lessonId: { in: (await db.lesson.findMany({ where: { courseId }, select: { id: true } })).map(l => l.id) }, completed: true },
  });

  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const updatedEnrollment = await db.enrollment.update({
    where: { userId_courseId: { userId, courseId } },
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
