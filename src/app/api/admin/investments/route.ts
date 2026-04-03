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
    const { title, description, minInvestment, maxInvestment, roiPercent, duration } = body;

    if (!title || !minInvestment || !maxInvestment || !roiPercent || !duration) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (minInvestment <= 0 || maxInvestment <= 0 || roiPercent <= 0) {
      return NextResponse.json({ error: 'Values must be positive.' }, { status: 400 });
    }

    if (minInvestment > maxInvestment) {
      return NextResponse.json({ error: 'Min investment cannot exceed max investment.' }, { status: 400 });
    }

    const opportunity = await db.investmentOpportunity.create({
      data: { title, description: description || '', minInvestment, maxInvestment, roiPercent, duration },
    });

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
