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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const chartData = [
  { month: 'Jan', earnings: 0 },
  { month: 'Feb', earnings: 120 },
  { month: 'Mar', earnings: 280 },
  { month: 'Apr', earnings: 190 },
  { month: 'May', earnings: 420 },
  { month: 'Jun', earnings: 350 },
  { month: 'Jul', earnings: 560 },
];

export default function DashboardOverview() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<DashboardStats>({
    balance: 0,
    totalReferrals: 0,
    coursesCompleted: 0,
    activeInvestments: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats || stats);
          setActivities(data.activities || []);
        }
      } catch {
        // Use fallback data
        setActivities([
          {
            id: '1', type: 'credit', title: 'Referral Bonus',
            description: 'Earned from inviting a friend', amount: 15, time: '2 hours ago',
          },
          {
            id: '2', type: 'enrollment', title: 'Course Enrolled',
            description: 'Financial Literacy 101', time: '1 day ago',
          },
          {
            id: '3', type: 'investment', title: 'Investment Return',
            description: 'Stable Growth Fund', amount: 45.5, time: '3 days ago',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'credit':
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case 'debit':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'enrollment':
        return <BookCheck className="h-4 w-4 text-blue-500" />;
      case 'referral':
        return <Gift className="h-4 w-4 text-gold" />;
      case 'investment':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <PageWrapper title="Dashboard" description="Welcome back! Here's your financial overview.">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Balance"
          value={`$${stats.balance.toFixed(2)}`}
          icon={Wallet}
          trend={{ value: 12.5, label: 'vs last month' }}
        />
        <StatCard
          title="Active Referrals"
          value={stats.totalReferrals}
          icon={Users}
          description="Total people you've referred"
        />
        <StatCard
          title="Courses Completed"
          value={stats.coursesCompleted}
          icon={BookOpen}
          description="Out of 5 enrolled"
        />
        <StatCard
          title="Active Investments"
          value={stats.activeInvestments}
          icon={TrendingUp}
          description="Running investments"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Earnings Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Earnings Overview</CardTitle>
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
                    dataKey="month"
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
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`$${value}`, 'Earnings']}
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
          </CardHeader>
          <CardContent>
            {activities.length === 0 && !loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No recent activity
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
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
                            {activity.type === 'credit' || activity.type === 'investment' ? '+' : '-'}$
                            {activity.amount}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Browse Courses', icon: BookOpen, color: 'bg-gold/10 text-gold' },
              { label: 'Refer a Friend', icon: Users, color: 'bg-orange/10 text-orange' },
              { label: 'Invest Now', icon: TrendingUp, color: 'bg-green-500/10 text-green-600' },
              { label: 'Withdraw Funds', icon: DollarSign, color: 'bg-purple-500/10 text-purple-600' },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto flex-col gap-2 py-4 hover:border-gold/30 hover:bg-gold/5"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
