'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Users,
  BookOpen,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Gift,
  BookCheck,
  Wallet,
  Trophy,
  CreditCard,
  Star,
  Target,
  Zap,
  ChevronRight,
  Loader2,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '@/components/shared/StatCard';
import PageWrapper from '@/components/shared/PageWrapper';
import { useAuthStore } from '@/store/auth';
import { useCurrencyStore } from '@/store/currency';

interface DashboardStats {
  balance: number;
  totalReferrals: number;
  coursesCompleted: number;
  activeInvestments: number;
}

interface Activity {
  id: string;
  type: 'credit' | 'debit' | 'enrollment' | 'referral' | 'investment';
  title: string;
  description: string;
  amount?: number;
  time: string;
}

interface EnhancedDashboardData {
  stats: DashboardStats;
  activities: Activity[];
  subscription: { plan: string; status: string; endDate: string | null } | null;
  unreadNotifications: number;
  recentAchievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    points: number;
    earnedAt: string;
  }>;
  learningProgress: {
    totalEnrolled: number;
    completed: number;
    totalLessonsCompleted: number;
  };
  investmentSummary: {
    totalInvested: number;
    activeCount: number;
    totalReturns: number;
  };
  weeklyEarnings: Array<{ date: string; amount: number }>;
}

export default function DashboardOverview({ onNavigate }: { onNavigate?: (page: 'courses' | 'referrals' | 'wallet' | 'investments' | 'notifications' | 'subscription' | 'escrow' | 'profile' | 'settings' | 'admin' | 'dashboard') => void }) {
  const token = useAuthStore((s) => s.token);
  const formatAmount = useCurrencyStore((s) => s.formatAmount);
  const [data, setData] = useState<EnhancedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  const stats = data?.stats ?? { balance: 0, totalReferrals: 0, coursesCompleted: 0, activeInvestments: 0 };
  const activities = data?.activities ?? [];
  const subscription = data?.subscription ?? null;
  const learningProgress = data?.learningProgress ?? { totalEnrolled: 0, completed: 0, totalLessonsCompleted: 0 };
  const investmentSummary = data?.investmentSummary ?? { totalInvested: 0, activeCount: 0, totalReturns: 0 };
  const recentAchievements = data?.recentAchievements ?? [];
  const weeklyEarnings = data?.weeklyEarnings ?? [];

  const chartData = weeklyEarnings.length > 0
    ? weeklyEarnings.map((d) => ({
        day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
        earnings: d.amount,
      }))
    : [
        { day: 'Mon', earnings: 0 },
        { day: 'Tue', earnings: 120 },
        { day: 'Wed', earnings: 280 },
        { day: 'Thu', earnings: 190 },
        { day: 'Fri', earnings: 420 },
        { day: 'Sat', earnings: 350 },
        { day: 'Sun', earnings: 560 },
      ];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'credit':
        return <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'debit':
        return <ArrowUpRight className="h-4 w-4 text-red-500 dark:text-red-400" />;
      case 'enrollment':
        return <BookCheck className="h-4 w-4 text-gold" />;
      case 'referral':
        return <Gift className="h-4 w-4 text-orange" />;
      case 'investment':
        return <TrendingUp className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
    }
  };

  const planColors: Record<string, string> = {
    basic: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    pro: 'bg-gold/10 text-gold border-gold/20',
    premium: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20',
  };

  const planIcons: Record<string, React.ElementType> = {
    basic: Zap,
    pro: Star,
    premium: Trophy,
  };

  if (loading) {
    return (
      <PageWrapper title="Dashboard" description="Welcome back! Here's your financial overview.">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Dashboard" description="Welcome back! Here's your financial overview.">
      {/* Welcome + Subscription Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-gold/20 bg-gradient-to-br from-gold/5 via-transparent to-orange/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <CardContent className="p-6 sm:p-8 relative">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">Welcome back!</h2>
                  {subscription && (
                    <Badge className={planColors[subscription.plan] || planColors.basic} variant="outline">
                      {planIcons[subscription.plan] ? (
                        <span className="flex items-center gap-1">
                          {(() => { const Icon = planIcons[subscription.plan]; return <Icon className="h-3 w-3" /> })()}
                          {subscription.plan}
                        </span>
                      ) : subscription.plan}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription?.status === 'active'
                    ? `Your ${subscription.plan} plan is active. Renews ${subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'soon'}.`
                    : 'Upgrade your plan to unlock premium features and maximize your earnings.'}
                </p>
                {!subscription || subscription.status !== 'active' ? (
                  <Button className="bg-gold text-white hover:bg-gold-dark mt-2" onClick={() => onNavigate?.('subscription')}>
                    <CreditCard className="mr-2 h-4 w-4" />Upgrade Plan
                  </Button>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{formatAmount(stats.balance)}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 justify-end">
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><TrendingUp className="h-3 w-3" />+$0 today</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Balance"
          value={formatAmount(stats.balance)}
          icon={Wallet}
          trend={{ value: 12.5, label: 'vs last week' }}
        />
        <StatCard
          title="Active Referrals"
          value={stats.totalReferrals}
          icon={Users}
          description="People you've referred"
        />
        <StatCard
          title="Courses Completed"
          value={learningProgress.completed}
          icon={BookOpen}
          description={`${learningProgress.totalLessonsCompleted} lessons completed`}
        />
        <StatCard
          title="Active Investments"
          value={stats.activeInvestments}
          icon={TrendingUp}
          description={`${formatAmount(investmentSummary.totalInvested)} invested`}
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Earnings Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Earnings Overview</CardTitle>
              <Badge variant="secondary" className="text-xs">Last 7 days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="day"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatAmount(value, false, true)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [formatAmount(value), 'Earnings']}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    fill="url(#goldGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Your latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No recent activity
              </div>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {activity.amount !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            {activity.type === 'credit' || activity.type === 'investment' ? '+' : '-'}{formatAmount(activity.amount)}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress + Investment Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Learning Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Learning Progress</CardTitle>
                <CardDescription>Your course completion journey</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-gold hover:text-gold-dark" onClick={() => onNavigate?.('courses')}>
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-gold/5 border border-gold/10 p-4 text-center">
                <BookOpen className="h-5 w-5 text-gold mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{learningProgress.totalEnrolled}</p>
                <p className="text-xs text-muted-foreground">Enrolled</p>
              </div>
              <div className="rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 p-4 text-center">
                <BookCheck className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{learningProgress.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="rounded-lg bg-orange/5 border border-orange/10 p-4 text-center">
                <Target className="h-5 w-5 text-orange mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{learningProgress.totalLessonsCompleted}</p>
                <p className="text-xs text-muted-foreground">Lessons</p>
              </div>
            </div>
            {learningProgress.totalEnrolled > 0 && (
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Overall Completion</span>
                  <span className="font-semibold text-gold">
                    {learningProgress.totalEnrolled > 0
                      ? Math.round((learningProgress.completed / learningProgress.totalEnrolled) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress value={learningProgress.totalEnrolled > 0 ? (learningProgress.completed / learningProgress.totalEnrolled) * 100 : 0} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Investment Summary</CardTitle>
                <CardDescription>Your portfolio at a glance</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-gold hover:text-gold-dark" onClick={() => onNavigate?.('investments')}>
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <DollarSign className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{formatAmount(investmentSummary.totalInvested, true, true)}</p>
                <p className="text-xs text-muted-foreground">Invested</p>
              </div>
              <div className="rounded-lg bg-gold/5 border border-gold/10 p-4 text-center">
                <TrendingUp className="h-5 w-5 text-gold mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{formatAmount(investmentSummary.totalReturns, true, true)}</p>
                <p className="text-xs text-muted-foreground">Expected</p>
              </div>
              <div className="rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 p-4 text-center">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{investmentSummary.activeCount}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
            {investmentSummary.totalInvested > 0 && (
              <div className="rounded-lg bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expected ROI</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    +{formatAmount(investmentSummary.totalReturns - investmentSummary.totalInvested)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Achievements</CardTitle>
                <CardDescription>Your latest accomplishments</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-gold hover:text-gold-dark" onClick={() => onNavigate?.('settings')}>
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {recentAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 rounded-lg border border-gold/10 bg-gold/5 p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 shrink-0">
                    <Award className="h-5 w-5 text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.points} points</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Get started with one click</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Browse Courses', icon: BookOpen, color: 'bg-gold/10 text-gold', page: 'courses' as const },
              { label: 'Refer a Friend', icon: Users, color: 'bg-orange/10 text-orange', page: 'referrals' as const },
              { label: 'Invest Now', icon: TrendingUp, color: 'bg-green-500/10 text-green-600 dark:text-green-400', page: 'investments' as const },
              { label: 'Withdraw Funds', icon: DollarSign, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', page: 'wallet' as const },
            ].map((action) => (
              <motion.div key={action.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full h-auto flex-col gap-2 py-4 hover:border-gold/30 hover:bg-gold/5"
                  onClick={() => onNavigate?.(action.page)}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
