import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

// POST /api/admin/courses/[id]/lessons - Add lesson to a course
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, content, order } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 });
    }

    const course = await db.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    // Get the next order if not provided
    let lessonOrder = order;
    if (lessonOrder === undefined) {
      const maxOrder = await db.lesson.aggregate({
        where: { courseId: id },
        _max: { order: true },
      });
      lessonOrder = (maxOrder._max.order || 0) + 1;
    }

    const lesson = await db.lesson.create({
      data: {
        courseId: id,
        title,
        content,
        order: lessonOrder,
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
