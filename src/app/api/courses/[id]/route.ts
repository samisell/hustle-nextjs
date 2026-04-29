import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

type UserProgress = {
  enrolled: true;
  enrollment: NonNullable<Awaited<ReturnType<typeof db.enrollment.findUnique>>>;
  completedLessonIds: string[];
};

// GET /api/courses/[id] - Get single course with lessons, skill category, and user certifications
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
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    // If user is authenticated, include their progress and certification status
    const authHeader = req.headers.get('authorization');
    let userProgress: UserProgress | null = null;
    let certification: Awaited<ReturnType<typeof db.courseCertification.findUnique>> = null;

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

        // Check if user has a certification for this course
        certification = await db.courseCertification.findUnique({
          where: { userId_courseId: { userId: payload.userId, courseId: id } },
        });
      }
    }

    return NextResponse.json({ course, userProgress, certification });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
