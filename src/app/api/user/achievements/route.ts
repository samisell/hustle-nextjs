import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.userId;

    const [achievements, userAchievements] = await Promise.all([
      db.achievement.findMany({
        orderBy: { category: 'asc' },
      }),
      db.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true, earnedAt: true },
      }),
    ]);

    const earnedIds = new Set(userAchievements.map((ua) => ua.achievementId));
    const earnedMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua.earnedAt.toISOString()]));

    const totalPoints = achievements
      .filter((a) => earnedIds.has(a.id))
      .reduce((sum, a) => sum + a.points, 0);

    const formattedAchievements = achievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      category: a.category,
      requirement: a.requirement,
      points: a.points,
      earned: earnedIds.has(a.id),
      earnedAt: earnedMap.get(a.id) || null,
    }));

    // Seed achievements if none exist
    if (achievements.length === 0) {
      const seedData = [
        { title: 'First Steps', description: 'Complete your first course', icon: 'BookOpen', category: 'learning', requirement: 'Complete 1 course', points: 50 },
        { title: 'Knowledge Seeker', description: 'Complete 5 courses', icon: 'GraduationCap', category: 'learning', requirement: 'Complete 5 courses', points: 200 },
        { title: 'Scholar', description: 'Complete 10 courses', icon: 'Award', category: 'learning', requirement: 'Complete 10 courses', points: 500 },
        { title: 'First Referral', description: 'Refer your first friend', icon: 'Users', category: 'referral', requirement: 'Refer 1 user', points: 100 },
        { title: 'Networker', description: 'Refer 10 friends', icon: 'UserPlus', category: 'referral', requirement: 'Refer 10 users', points: 300 },
        { title: 'Influencer', description: 'Refer 50 friends', icon: 'Star', category: 'referral', requirement: 'Refer 50 users', points: 1000 },
        { title: 'First Investment', description: 'Make your first investment', icon: 'TrendingUp', category: 'investment', requirement: 'Invest 1 time', points: 100 },
        { title: 'Investor Pro', description: 'Have 5 active investments', icon: 'BarChart3', category: 'investment', requirement: 'Have 5 investments', points: 300 },
        { title: 'Big Spender', description: 'Invest a total of $1000', icon: 'DollarSign', category: 'investment', requirement: 'Invest $1000 total', points: 500 },
        { title: 'Early Adopter', description: 'Joined during the beta period', icon: 'Rocket', category: 'engagement', requirement: 'Join platform', points: 50 },
        { title: 'Active Learner', description: 'Log in for 7 consecutive days', icon: 'Flame', category: 'engagement', requirement: 'Log in 7 days straight', points: 150 },
        { title: 'Verified', description: 'Complete your profile', icon: 'CheckCircle', category: 'engagement', requirement: 'Fill out profile', points: 25 },
      ];

      const created = await db.achievement.createMany({
        data: seedData,
      });

      // Re-fetch after seeding
      const allAchievements = await db.achievement.findMany({
        orderBy: { category: 'asc' },
      });

      return NextResponse.json({
        achievements: allAchievements.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          category: a.category,
          requirement: a.requirement,
          points: a.points,
          earned: false,
          earnedAt: null,
        })),
        totalPoints: 0,
        earnedCount: 0,
        totalAchievements: allAchievements.length,
      });
    }

    return NextResponse.json({
      achievements: formattedAchievements,
      totalPoints,
      earnedCount: earnedIds.size,
      totalAchievements: achievements.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
