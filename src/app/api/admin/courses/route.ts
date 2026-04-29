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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, category, difficulty } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    const validDifficulty = ['beginner', 'intermediate', 'advanced'];
    const courseDifficulty = validDifficulty.includes(difficulty) ? difficulty : 'beginner';

    const course = await db.course.create({
      data: {
        title,
        description: description || '',
        category: category || 'general',
        difficulty: courseDifficulty,
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
