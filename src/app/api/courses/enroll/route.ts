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
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 });
    }

    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: payload.userId, courseId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already enrolled in this course.' }, { status: 400 });
    }

    const enrollment = await db.enrollment.create({
      data: { userId: payload.userId, courseId, progress: 0 },
    });

    await db.notification.create({
      data: {
        userId: payload.userId,
        title: 'Enrolled!',
        message: `You have been enrolled in "${course.title}". Start learning now!`,
        type: 'success',
      },
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
