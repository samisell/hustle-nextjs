import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/courses/[id] - Get single course with lessons
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const course = await db.course.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    // If user is authenticated, include their progress
    const authHeader = req.headers.get('authorization');
    let userProgress = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      if (payload) {
        const enrollment = await db.enrollment.findUnique({
          where: { userId_courseId: { userId: payload.userId, courseId: id } },
        });

        if (enrollment) {
          const completedLessons = await db.lessonProgress.findMany({
            where: { userId: payload.userId, completed: true },
            select: { lessonId: true },
          });

          userProgress = {
            enrolled: true,
            enrollment,
            completedLessonIds: completedLessons.map(lp => lp.lessonId),
          };
        }
      }
    }

    return NextResponse.json({ course, userProgress });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
