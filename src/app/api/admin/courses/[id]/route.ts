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

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/courses/[id] - Get course detail with lessons and enrollments
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const course = await db.course.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
        enrollments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    return NextResponse.json({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      thumbnail: course.thumbnail,
      difficulty: course.difficulty,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      lessons: course.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        content: l.content,
        order: l.order,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
      enrollments: course.enrollments.map((e) => ({
        id: e.id,
        userId: e.userId,
        userName: e.user.name,
        userEmail: e.user.email,
        progress: e.progress,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
      totalEnrollments: course.enrollments.length,
    });
  } catch (error: any) {
    console.error('Get course detail error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/courses/[id] - Update course fields
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, description, category, difficulty } = body;

    if (!title && !description && !category && !difficulty) {
      return NextResponse.json({ error: 'At least one field is required.' }, { status: 400 });
    }

    if (difficulty && !['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty. Must be beginner, intermediate, or advanced.' },
        { status: 400 }
      );
    }

    const existingCourse = await db.course.findUnique({ where: { id } });
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    const updateData: Record<string, string> = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (difficulty) updateData.difficulty = difficulty;

    const updatedCourse = await db.course.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { enrollments: true, lessons: true } } },
    });

    return NextResponse.json({
      id: updatedCourse.id,
      title: updatedCourse.title,
      description: updatedCourse.description,
      category: updatedCourse.category,
      thumbnail: updatedCourse.thumbnail,
      difficulty: updatedCourse.difficulty,
      createdAt: updatedCourse.createdAt.toISOString(),
      updatedAt: updatedCourse.updatedAt.toISOString(),
      enrollmentsCount: updatedCourse._count.enrollments,
      lessonsCount: updatedCourse._count.lessons,
    });
  } catch (error: any) {
    console.error('Update course error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[id] - Delete course and all related data
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(req);
    if (!payload) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const existingCourse = await db.course.findUnique({ where: { id } });
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    // Delete course - cascading will handle enrollments, lessons, and lesson progresses
    await db.course.delete({ where: { id } });

    return NextResponse.json({
      message: `Course "${existingCourse.title}" and all related data have been deleted.`,
    });
  } catch (error: any) {
    console.error('Delete course error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
