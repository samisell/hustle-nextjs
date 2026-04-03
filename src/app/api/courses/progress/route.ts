import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { lessonId, courseId } = body;

    if (!lessonId || !courseId) {
      return NextResponse.json({ error: 'Lesson ID and Course ID are required.' }, { status: 400 });
    }

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: payload.userId, courseId } },
    });
    if (!enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in this course.' }, { status: 400 });
    }

    const lesson = await db.lesson.findFirst({
      where: { id: lessonId, courseId },
    });
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found in this course.' }, { status: 404 });
    }

    await db.lessonProgress.upsert({
      where: { userId_lessonId: { userId: payload.userId, lessonId } },
      create: { userId: payload.userId, lessonId, completed: true },
      update: { completed: true },
    });

    const totalLessons = await db.lesson.count({ where: { courseId } });
    const allLessons = await db.lesson.findMany({ where: { courseId }, select: { id: true } });
    const completedLessons = await db.lessonProgress.count({
      where: { userId: payload.userId, lessonId: { in: allLessons.map(l => l.id) }, completed: true },
    });

    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Build enrollment update data
    const updateData: Record<string, unknown> = { progress: progressPercent };

    // Set completedAt when reaching 100% for the first time
    if (progressPercent === 100 && !enrollment.completedAt) {
      updateData.completedAt = new Date();
    }

    const updatedEnrollment = await db.enrollment.update({
      where: { userId_courseId: { userId: payload.userId, courseId } },
      data: updateData,
    });

    if (progressPercent === 100) {
      await db.notification.create({
        data: {
          userId: payload.userId,
          title: 'Course Completed!',
          message: 'Congratulations! You have completed all lessons in this course. You earned a $5 bonus!',
          type: 'success',
        },
      });

      const wallet = await db.wallet.findUnique({ where: { userId: payload.userId } });
      if (wallet) {
        const bonus = 5.0;
        await db.wallet.update({
          where: { userId: payload.userId },
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
            userId: payload.userId,
            amount: bonus,
            source: 'bonus',
            description: 'Course completion bonus',
          },
        });
      }

      // Award certification badge if not already earned
      const existingCert = await db.courseCertification.findUnique({
        where: { userId_courseId: { userId: payload.userId, courseId } },
      });

      let certification = existingCert || null;

      if (!existingCert) {
        const course = await db.course.findUnique({ where: { id: courseId } });
        const badgeName = course ? `${course.title} Certified` : 'Course Certified';

        certification = await db.courseCertification.create({
          data: {
            userId: payload.userId,
            courseId,
            badgeName,
            badgeIcon: 'Award',
          },
        });
      }

      return NextResponse.json({
        success: true,
        progress: progressPercent,
        enrollment: updatedEnrollment,
        certification,
      });
    }

    return NextResponse.json({ success: true, progress: progressPercent, enrollment: updatedEnrollment });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
