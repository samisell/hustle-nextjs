'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  DollarSign,
  UserPlus,
  Loader2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Network,
  BarChart3,
  ArrowRight,
  Bitcoin,
  Landmark,
  Wallet,
  Clock,
  Send,
  BadgeDollarSign,
  CircleDot,
  Users2,
  UserCheck,
  Star,
  Zap,
  Crown,
  Shield,
  ChevronLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '@/components/shared/StatCard';
import PageWrapper from '@/components/shared/PageWrapper';
import EmptyState from '@/components/shared/EmptyState';
import { useAuthStore } from '@/store/auth';
import { useCurrencyStore } from '@/store/currency';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
}

interface CommissionRecord {
  id: string;
  sourceUser: string;
  sourceEmail: string;
  level: number;
  amount: number;
  percentage: number;
  description: string;
  createdAt: string;
}

interface CommissionSummary {
  totalEarnings: number;
  level1Earnings: number;
  level2Earnings: number;
  level3Earnings: number;
  commissions: CommissionRecord[];
  totalCount: number;
  page: number;
  totalPages: number;
}

interface TreeNode {
  id: string;
  name: string;
  email: string;
  plan: string;
  joinedAt: string;
  children?: TreeNode[];
}

interface GrowthData {
  totalNetwork: number;
  directReferrals: number;
  level2Count: number;
  level3Count: number;
  growthRate: number;
  recentSignups: Array<{
    id: string;
    name: string;
    email: string;
    plan: string;
    joinedAt: string;
    level: number;
  }>;
}

interface PayoutHistory {
  id: string;
  amount: number;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  address: string;
  createdAt: string;
}

// ── Fallback data ─────────────────────────────────────────────────────────────

const fallbackStats: ReferralStats = {
  totalReferrals: 12,
  activeReferrals: 9,
  totalEarnings: 485.5,
};

const fallbackCommissions: CommissionRecord[] = [
  { id: 'c1', sourceUser: 'Alice Johnson', sourceEmail: 'alice@mail.com', level: 1, amount: 9.99, percentage: 10, description: 'Pro Subscription', createdAt: '2024-12-15T10:00:00Z' },
  { id: 'c2', sourceUser: 'Bob Smith', sourceEmail: 'bob@mail.com', level: 1, amount: 2.99, percentage: 10, description: 'Basic Subscription', createdAt: '2024-12-14T14:30:00Z' },
  { id: 'c3', sourceUser: 'Carol Davis', sourceEmail: 'carol@mail.com', level: 2, amount: 4.99, percentage: 5, description: 'Pro Subscription', createdAt: '2024-12-13T09:15:00Z' },
  { id: 'c4', sourceUser: 'Dave Wilson', sourceEmail: 'dave@mail.com', level: 2, amount: 0.99, percentage: 5, description: 'Basic Subscription', createdAt: '2024-12-12T16:00:00Z' },
  { id: 'c5', sourceUser: 'Eve Martinez', sourceEmail: 'eve@mail.com', level: 1, amount: 9.99, percentage: 10, description: 'Pro Subscription', createdAt: '2024-12-11T11:45:00Z' },
  { id: 'c6', sourceUser: 'Frank Brown', sourceEmail: 'frank@mail.com', level: 3, amount: 1.99, percentage: 2, description: 'Premium Subscription', createdAt: '2024-12-10T08:30:00Z' },
  { id: 'c7', sourceUser: 'Grace Lee', sourceEmail: 'grace@mail.com', level: 1, amount: 9.99, percentage: 10, description: 'Pro Subscription', createdAt: '2024-12-09T13:00:00Z' },
  { id: 'c8', sourceUser: 'Hank Taylor', sourceEmail: 'hank@mail.com', level: 2, amount: 4.99, percentage: 5, description: 'Pro Subscription', createdAt: '2024-12-08T15:30:00Z' },
  { id: 'c9', sourceUser: 'Ivy Chen', sourceEmail: 'ivy@mail.com', level: 3, amount: 0.59, percentage: 2, description: 'Basic Subscription', createdAt: '2024-12-07T10:00:00Z' },
  { id: 'c10', sourceUser: 'Jack White', sourceEmail: 'jack@mail.com', level: 1, amount: 2.99, percentage: 10, description: 'Basic Subscription', createdAt: '2024-12-06T12:00:00Z' },
];

const fallbackTree: TreeNode[] = [
  {
    id: '1', name: 'Alice Johnson', email: 'alice@mail.com', plan: 'pro', joinedAt: '2024-10-15T10:00:00Z',
    children: [
      { id: '1a', name: 'Carol Davis', email: 'carol@mail.com', plan: 'basic', joinedAt: '2024-11-02T08:00:00Z',
        children: [
          { id: '1a1', name: 'Frank Brown', email: 'frank@mail.com', plan: 'premium', joinedAt: '2024-12-01T09:00:00Z' },
          { id: '1a2', name: 'Grace Lee', email: 'grace@mail.com', plan: 'pro', joinedAt: '2024-12-05T14:00:00Z' },
        ],
      },
      { id: '1b', name: 'Dave Wilson', email: 'dave@mail.com', plan: 'pro', joinedAt: '2024-11-10T11:00:00Z' },
    ],
  },
  {
    id: '2', name: 'Bob Smith', email: 'bob@mail.com', plan: 'basic', joinedAt: '2024-10-20T12:00:00Z',
    children: [
      { id: '2a', name: 'Eve Martinez', email: 'eve@mail.com', plan: 'pro', joinedAt: '2024-11-15T16:00:00Z',
        children: [
          { id: '2a1', name: 'Hank Taylor', email: 'hank@mail.com', plan: 'basic', joinedAt: '2024-12-08T10:00:00Z' },
        ],
      },
    ],
  },
  {
    id: '3', name: 'Ivy Chen', email: 'ivy@mail.com', plan: 'premium', joinedAt: '2024-11-01T09:00:00Z',
    children: [
      { id: '3a', name: 'Jack White', email: 'jack@mail.com', plan: 'basic', joinedAt: '2024-12-06T12:00:00Z' },
    ],
  },
  {
    id: '4', name: 'Karen Lopez', email: 'karen@mail.com', plan: 'pro', joinedAt: '2024-11-25T15:00:00Z',
  },
];

const fallbackGrowth: GrowthData = {
  totalNetwork: 24,
  directReferrals: 8,
  level2Count: 10,
  level3Count: 6,
  growthRate: 32.5,
  recentSignups: [
    { id: 's1', name: 'Jack White', email: 'jack@mail.com', plan: 'basic', joinedAt: '2024-12-15T12:00:00Z', level: 2 },
    { id: 's2', name: 'Grace Lee', email: 'grace@mail.com', plan: 'pro', joinedAt: '2024-12-14T09:00:00Z', level: 3 },
    { id: 's3', name: 'Frank Brown', email: 'frank@mail.com', plan: 'premium', joinedAt: '2024-12-12T16:00:00Z', level: 3 },
    { id: 's4', name: 'Hank Taylor', email: 'hank@mail.com', plan: 'basic', joinedAt: '2024-12-10T11:00:00Z', level: 3 },
    { id: 's5', name: 'Karen Lopez', email: 'karen@mail.com', plan: 'pro', joinedAt: '2024-12-08T14:00:00Z', level: 1 },
  ],
};

const fallbackPayouts: PayoutHistory[] = [
  { id: 'p1', amount: 150, method: 'usdt', status: 'completed', address: '0x1234...abcd', createdAt: '2024-12-01T10:00:00Z' },
  { id: 'p2', amount: 200, method: 'bitcoin', status: 'completed', address: 'bc1q...xyz', createdAt: '2024-11-15T14:00:00Z' },
  { id: 'p3', amount: 100, method: 'bank', status: 'pending', address: 'GTBank ****1234', createdAt: '2024-12-10T09:00:00Z' },
];

const fallbackChartData = [
  { month: 'Jan', earnings: 45 },
  { month: 'Feb', earnings: 62 },
  { month: 'Mar', earnings: 38 },
  { month: 'Apr', earnings: 85 },
  { month: 'May', earnings: 110 },
  { month: 'Jun', earnings: 72 },
  { month: 'Jul', earnings: 95 },
  { month: 'Aug', earnings: 130 },
  { month: 'Sep', earnings: 88 },
  { month: 'Oct', earnings: 142 },
  { month: 'Nov', earnings: 115 },
  { month: 'Dec', earnings: 168 },
];

const PAYOUT_QUICK_AMOUNTS = [50, 100, 500, 1000];

// ── Helpers ───────────────────────────────────────────────────────────────────

const levelBadge = (level: number) => {
  const styles: Record<number, string> = {
    1: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    2: 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
    3: 'bg-zinc-100 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-500/20',
  };
  return styles[level] || styles[1];
};

const planBadge = (plan: string) => {
  const styles: Record<string, string> = {
    basic: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    pro: 'bg-gold/10 text-gold border-gold/20',
    premium: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20',
  };
  return styles[plan] || styles.basic;
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    processing: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    completed: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
    rejected: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
  };
  return map[status] || map.pending;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReferralsPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const formatAmount = useCurrencyStore((s) => s.formatAmount);

  // State
  const [stats, setStats] = useState<ReferralStats>(fallbackStats);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary>({
    totalEarnings: 485.5,
    level1Earnings: 259.5,
    level2Earnings: 159.6,
    level3Earnings: 66.4,
    commissions: fallbackCommissions,
    totalCount: fallbackCommissions.length,
    page: 1,
    totalPages: 1,
  });
  const [tree, setTree] = useState<TreeNode[]>(fallbackTree);
  const [growth, setGrowth] = useState<GrowthData>(fallbackGrowth);
  const [chartData, setChartData] = useState(fallbackChartData);
  const [payouts, setPayouts] = useState<PayoutHistory[]>(fallbackPayouts);

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('network');

  // Commission pagination
  const [commissionPage, setCommissionPage] = useState(1);
  const commissionsPerPage = 8;

  // Payout state
  const [payoutMethod, setPayoutMethod] = useState<'bitcoin' | 'usdt' | 'bank'>('usdt');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Tree expand state
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '2']));

  const referralCode = user?.referralCode || '';
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${referralCode}`
    : '';

  // ── Data fetching ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchReferralStats(),
        fetchCommissions(),
        fetchTree(),
        fetchGrowth(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralStats = async () => {
    try {
      const res = await fetch('/api/referrals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || fallbackStats);
      }
    } catch {
      setStats(fallbackStats);
    }
  };

  const fetchCommissions = async (page = 1) => {
    try {
      const res = await fetch(`/api/referrals/commissions?page=${page}&limit=${commissionsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCommissionSummary(data);
        return;
      }
    } catch { /* fallback */ }
    // Fallback: paginate locally
    const start = (page - 1) * commissionsPerPage;
    const pageItems = fallbackCommissions.slice(start, start + commissionsPerPage);
    setCommissionSummary((prev) => ({
      ...prev,
      commissions: pageItems,
      page,
      totalPages: Math.ceil(prev.totalCount / commissionsPerPage),
    }));
  };

  const fetchTree = async () => {
    try {
      const res = await fetch('/api/referrals/tree?depth=3', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tree && data.tree.length > 0) {
          setTree(data.tree);
          return;
        }
      }
    } catch { /* fallback */ }
    setTree(fallbackTree);
  };

  const fetchGrowth = async () => {
    try {
      const res = await fetch('/api/referrals/growth', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Only update recentSignups if the API returns user objects with id field
        // (API may return chart format { date, count } which lacks id)
        const hasUserSignups = data.recentSignups?.length > 0 && data.recentSignups[0].id;
        setGrowth((prev) => ({
          totalNetwork: data.totalNetwork ?? prev.totalNetwork,
          directReferrals: data.directReferrals ?? prev.directReferrals,
          level2Count: data.level2Count ?? prev.level2Count,
          level3Count: data.level3Count ?? prev.level3Count,
          growthRate: data.growthRate ?? prev.growthRate,
          recentSignups: hasUserSignups ? data.recentSignups : prev.recentSignups,
        }));
        if (data.monthlyEarnings && data.monthlyEarnings.length > 0) {
          setChartData(data.monthlyEarnings);
          return;
        }
      }
    } catch { /* fallback */ }
    setGrowth(fallbackGrowth);
    setChartData(fallbackChartData);
  };

  const handleCommissionPage = useCallback((newPage: number) => {
    setCommissionPage(newPage);
    fetchCommissions(newPage);
  }, [token]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Hustle University',
          text: `Join me on Hustle University and start earning! Use my referral code: ${referralCode}`,
          url: referralLink,
        });
      } catch { /* User cancelled */ }
    } else {
      copyToClipboard();
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleSubmitPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (payoutMethod === 'bank') {
      if (!bankName.trim() || !bankAccount.trim() || !bankAccountName.trim()) {
        toast.error('Please fill in all bank details.');
        return;
      }
    } else {
      if (!payoutAddress.trim()) {
        toast.error('Please enter a wallet address.');
        return;
      }
    }

    setSubmittingPayout(true);
    try {
      const body: Record<string, unknown> = { amount, method: payoutMethod };
      if (payoutMethod === 'bank') {
        body.bankName = bankName.trim();
        body.bankAccount = bankAccount.trim();
        body.bankAccountName = bankAccountName.trim();
      } else {
        body.walletAddress = payoutAddress.trim();
      }

      const res = await fetch('/api/referrals/payout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('Payout request submitted successfully!');
        setPayoutAmount('');
        setPayoutAddress('');
        setBankName('');
        setBankAccount('');
        setBankAccountName('');
        fetchAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to submit payout request.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmittingPayout(false);
    }
  };

  // ── Tree node renderer ─────────────────────────────────────────────────────

  const renderTreeNode = (node: TreeNode, level: number, isLast: boolean) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const levelNum = level + 1;

    return (
      <div key={node.id}>
        <div className="flex items-center gap-2 py-2">
          {/* Tree connector lines */}
          <div className="flex items-center" style={{ marginLeft: level * 24 }}>
            {!isLast && (
              <div className="absolute w-px h-full bg-border" style={{ left: level * 24 + 11, marginTop: -8 }} />
            )}
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted transition-colors shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center shrink-0">
                <CircleDot className="h-3 w-3 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Node content */}
          <div className="flex-1 flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-gold/30 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 shrink-0">
              <Users className="h-4 w-4 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground truncate">{node.name}</span>
                <Badge variant="outline" className={levelBadge(levelNum)}>L{levelNum}</Badge>
                <Badge variant="outline" className={planBadge(node.plan)}>{node.plan}</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{node.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Joined {new Date(node.joinedAt).toLocaleDateString()}
              </p>
            </div>
            {hasChildren && (
              <div className="flex items-center gap-1 shrink-0">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{node.children!.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children!.map((child, idx) =>
                renderTreeNode(child, level + 1, idx === node.children!.length - 1)
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
  };

  // ── Payout method icons ────────────────────────────────────────────────────

  const payoutMethods = [
    {
      id: 'bitcoin' as const,
      icon: Bitcoin,
      label: 'Bitcoin',
      desc: 'Receive payout in BTC',
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-500/10',
    },
    {
      id: 'usdt' as const,
      icon: Wallet,
      label: 'USDT',
      desc: 'Receive payout in USDT',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-500/10',
    },
    {
      id: 'bank' as const,
      icon: Landmark,
      label: 'Bank Transfer',
      desc: 'Direct to your bank',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-500/10',
    },
  ];

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageWrapper title="Passive Income" description="Track your referral earnings and grow your network.">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </PageWrapper>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <PageWrapper title="Passive Income" description="Track your referral earnings, manage your network, and withdraw commissions.">

        {/* ═══ Section 1: Referral Code Card ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-gold/20 bg-gradient-to-br from-gold/5 via-transparent to-orange/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange/5 rounded-full translate-y-1/2 -translate-x-1/3" />
            <CardContent className="p-6 sm:p-8 relative">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">Your Referral Code</h3>
                    <Badge className="bg-gold/10 text-gold border-gold/20">
                      <Zap className="h-3 w-3 mr-1" />Passive Income
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share this code to earn commissions on 3 levels
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg border-2 border-gold/30 bg-background px-4 py-2.5">
                    <code className="text-xl font-bold text-gold tracking-widest">{referralCode || 'LOADING...'}</code>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" className="border-gold/30 hover:bg-gold/10" onClick={copyToClipboard}>
                        {copied ? <Check className="h-4 w-4 text-green-500 dark:text-green-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy link</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" className="border-gold/30 hover:bg-gold/10" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Share</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-border bg-background/80 p-3">
                <p className="text-xs text-muted-foreground mb-1">Full Referral Link</p>
                <p className="text-sm text-foreground break-all font-mono">{referralLink}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ Section 2: Earnings Overview Stats ═══ */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Earnings"
            value={formatAmount(commissionSummary.totalEarnings)}
            icon={BadgeDollarSign}
            description="All 3 levels combined"
            trend={{ value: 18.2, label: 'vs last month' }}
          />
          <StatCard
            title="Level 1 Earnings"
            value={formatAmount(commissionSummary.level1Earnings)}
            icon={Star}
            description="Direct referrals (10%)"
          />
          <StatCard
            title="Level 2 Earnings"
            value={formatAmount(commissionSummary.level2Earnings)}
            icon={Users2}
            description="Indirect referrals (5%)"
          />
          <StatCard
            title="Level 3 Earnings"
            value={formatAmount(commissionSummary.level3Earnings)}
            icon={Network}
            description="Extended network (2%)"
          />
        </div>

        {/* ═══ Section 3: MLM Commission Structure Info Card ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-gold/20 bg-gradient-to-br from-gold/5 via-transparent to-orange/5 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10">
                  <Crown className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <CardTitle className="text-base">3-Level MLM Commission Structure</CardTitle>
                  <CardDescription>Earn passive income from your entire referral network</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Level 1 */}
                <div className="rounded-xl border-2 border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 p-4 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-400 dark:bg-amber-500" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20 mx-auto mb-3">
                    <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <Badge className="bg-amber-200 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30 mb-2">Level 1</Badge>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">10%</p>
                  <p className="text-xs text-muted-foreground mt-1">Direct Referrals</p>
                  <Separator className="my-3 bg-amber-200 dark:bg-amber-500/20" />
                  <p className="text-xs text-muted-foreground">
                    Example: 10 friends on Pro plan
                  </p>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mt-1">
                    {formatAmount(9.99 * 10)}/mo
                  </p>
                </div>

                {/* Level 2 */}
                <div className="rounded-xl border-2 border-orange-300 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/5 p-4 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-orange-400 dark:bg-orange-500" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/20 mx-auto mb-3">
                    <Users2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <Badge className="bg-orange-200 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-500/30 mb-2">Level 2</Badge>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">5%</p>
                  <p className="text-xs text-muted-foreground mt-1">Indirect Referrals</p>
                  <Separator className="my-3 bg-orange-200 dark:bg-orange-500/20" />
                  <p className="text-xs text-muted-foreground">
                    Example: 30 friends of friends on Pro
                  </p>
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mt-1">
                    {formatAmount(9.99 * 30 * 0.05)}/mo
                  </p>
                </div>

                {/* Level 3 */}
                <div className="rounded-xl border-2 border-zinc-300 dark:border-zinc-500/30 bg-zinc-50 dark:bg-zinc-500/5 p-4 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-zinc-400 dark:bg-zinc-500" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-500/20 mx-auto mb-3">
                    <Network className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <Badge className="bg-zinc-200 dark:bg-zinc-500/20 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-500/30 mb-2">Level 3</Badge>
                  <p className="text-3xl font-bold text-zinc-600 dark:text-zinc-400">2%</p>
                  <p className="text-xs text-muted-foreground mt-1">Extended Network</p>
                  <Separator className="my-3 bg-zinc-200 dark:bg-zinc-500/20" />
                  <p className="text-xs text-muted-foreground">
                    Example: 100 extended network on Pro
                  </p>
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mt-1">
                    {formatAmount(9.99 * 100 * 0.02)}/mo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ Section 4: Tabs Section ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="network" className="text-xs sm:text-sm">
                <Network className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
                Network
              </TabsTrigger>
              <TabsTrigger value="commissions" className="text-xs sm:text-sm">
                <DollarSign className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
                Commissions
              </TabsTrigger>
              <TabsTrigger value="chart" className="text-xs sm:text-sm">
                <BarChart3 className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
                Earnings
              </TabsTrigger>
              <TabsTrigger value="growth" className="text-xs sm:text-sm">
                <TrendingUp className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
                Growth
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Network ── */}
            <TabsContent value="network">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Referral Network</CardTitle>
                      <CardDescription>Your multi-level referral tree</CardDescription>
                    </div>
                    <Badge className="bg-gold/10 text-gold border-gold/20">
                      <Users className="h-3 w-3 mr-1" />
                      {growth.totalNetwork} total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {tree.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="No referrals yet"
                      description="Share your referral code to start building your network."
                      action={{ label: 'Copy Referral Link', onClick: copyToClipboard }}
                    />
                  ) : (
                    <ScrollArea className="max-h-[600px] custom-scrollbar">
                      <div className="space-y-0.5">
                        {tree.map((node, idx) => renderTreeNode(node, 0, idx === tree.length - 1))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab 2: Commissions ── */}
            <TabsContent value="commissions">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-base">Commission History</CardTitle>
                      <CardDescription>All earnings from your referral network</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {commissionSummary.totalCount} total commissions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {commissionSummary.commissions.length === 0 ? (
                    <EmptyState
                      icon={Gift}
                      title="No commissions yet"
                      description="Start referring people to earn commissions on subscriptions."
                    />
                  ) : (
                    <>
                      <ScrollArea className="max-h-96">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Source User</TableHead>
                              <TableHead>Level</TableHead>
                              <TableHead className="hidden sm:table-cell">Description</TableHead>
                              <TableHead className="text-right">Percentage</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead className="hidden md:table-cell text-right">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {commissionSummary.commissions.map((c) => (
                              <TableRow key={c.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/10 shrink-0">
                                      <UserCheck className="h-3.5 w-3.5 text-gold" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-foreground truncate max-w-[120px]">{c.sourceUser}</p>
                                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">{c.sourceEmail}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={levelBadge(c.level)}>
                                    L{c.level}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{c.description}</TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">{c.percentage}%</TableCell>
                                <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                                  +{formatAmount(c.amount)}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-right text-muted-foreground text-sm">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>

                      {/* Pagination */}
                      {commissionSummary.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground">
                            Page {commissionSummary.page} of {commissionSummary.totalPages}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={commissionPage <= 1}
                              onClick={() => handleCommissionPage(commissionPage - 1)}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />Prev
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={commissionPage >= commissionSummary.totalPages}
                              onClick={() => handleCommissionPage(commissionPage + 1)}
                            >
                              Next<ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab 3: Earnings Chart ── */}
            <TabsContent value="chart">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Monthly Earnings</CardTitle>
                      <CardDescription>Commission earnings over the last 12 months</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">12 months</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-72 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="referralGoldGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                            <stop offset="50%" stopColor="#FF8C00" stopOpacity={0.1} />
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
                          tickFormatter={(value) => formatAmount(value, false, true)}
                        />
                        <RechartsTooltip
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
                          strokeWidth={2.5}
                          fill="url(#referralGoldGradient)"
                          dot={{ fill: '#D4AF37', r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: '#FF8C00', stroke: '#D4AF37', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab 4: Growth ── */}
            <TabsContent value="growth">
              <div className="space-y-6">
                {/* Growth Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Network</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{growth.totalNetwork}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                        <Users className="h-5 w-5 text-gold" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      {growth.growthRate >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                      )}
                      <span className={`text-xs font-semibold ${growth.growthRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {growth.growthRate >= 0 ? '+' : ''}{growth.growthRate}%
                      </span>
                      <span className="text-xs text-muted-foreground">growth rate</span>
                    </div>
                  </motion.div>

                  <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Direct Referrals</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{growth.directReferrals}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/10">
                        <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Level 1 — 10% commission</p>
                  </motion.div>

                  <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Level 2</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{growth.level2Count}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/10">
                        <Users2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Indirect — 5% commission</p>
                  </motion.div>

                  <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Level 3</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{growth.level3Count}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-500/10">
                        <Network className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Extended — 2% commission</p>
                  </motion.div>
                </div>

                {/* Recent Signups */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Recent Signups</CardTitle>
                        <CardDescription>Newest members in your network</CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Last {growth.recentSignups.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {growth.recentSignups.length === 0 ? (
                      <EmptyState
                        icon={UserPlus}
                        title="No recent signups"
                        description="New referrals will appear here when they join."
                      />
                    ) : (
                      <ScrollArea className="max-h-80">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead className="hidden sm:table-cell">Email</TableHead>
                              <TableHead>Level</TableHead>
                              <TableHead className="hidden md:table-cell">Plan</TableHead>
                              <TableHead className="text-right">Joined</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {growth.recentSignups.map((signup, idx) => (
                              <TableRow key={signup.id || `signup-${idx}-${signup.name}`}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10 shrink-0">
                                      <UserPlus className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-sm font-medium">{signup.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{signup.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={levelBadge(signup.level)}>
                                    L{signup.level}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <Badge variant="outline" className={planBadge(signup.plan)}>
                                    {signup.plan}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">
                                  {new Date(signup.joinedAt).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* ═══ Section 5: Request Payout ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card className="border-gold/20 bg-gradient-to-br from-gold/5 via-transparent to-orange/5 overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10">
                  <Send className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <CardTitle className="text-base">Request Payout</CardTitle>
                  <CardDescription>Withdraw your referral commissions</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground">Available:</span>
                <span className="text-lg font-bold text-gold">{formatAmount(commissionSummary.totalEarnings)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payout Method Selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payout Method</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {payoutMethods.map((method) => (
                    <motion.button
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setPayoutMethod(method.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                        payoutMethod === method.id
                          ? 'border-gold bg-gold/5 ring-2 ring-gold/20 shadow-md'
                          : 'border-border hover:border-gold/30 bg-card'
                      }`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${method.bgColor}`}>
                        <method.icon className={`h-6 w-6 ${method.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.desc}</p>
                      </div>
                      {payoutMethod === method.id && (
                        <Badge className="bg-gold/10 text-gold border-gold/20 text-xs">
                          <Check className="h-3 w-3 mr-1" />Selected
                        </Badge>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="payoutAmount" className="text-sm font-medium">Amount (USD)</Label>
                <Input
                  id="payoutAmount"
                  type="number"
                  placeholder="0.00"
                  min="10"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">Minimum withdrawal: $10.00</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PAYOUT_QUICK_AMOUNTS.map((amt) => (
                    <Button
                      key={amt}
                      variant={payoutAmount === String(amt) ? 'default' : 'outline'}
                      size="sm"
                      className={
                        payoutAmount === String(amt)
                          ? 'bg-gold text-white hover:bg-gold-dark'
                          : 'hover:border-gold/30 hover:bg-gold/5'
                      }
                      onClick={() => setPayoutAmount(String(amt))}
                    >
                      ${amt}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Wallet Address / Bank Details */}
              {payoutMethod === 'bank' ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      placeholder="e.g. GTBank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountName">Account Name</Label>
                    <Input
                      id="bankAccountName"
                      placeholder="Name on account"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Account Number</Label>
                    <Input
                      id="bankAccount"
                      placeholder="Account number"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="walletAddress" className="text-sm font-medium">
                    {payoutMethod === 'bitcoin' ? 'Bitcoin Address' : 'USDT Wallet Address'}
                  </Label>
                  <Input
                    id="walletAddress"
                    placeholder={payoutMethod === 'bitcoin' ? 'Enter BTC wallet address' : 'Enter USDT wallet address (TRC20/ERC20)'}
                    value={payoutAddress}
                    onChange={(e) => setPayoutAddress(e.target.value)}
                  />
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  className="bg-gold text-white hover:bg-gold-dark"
                  onClick={handleSubmitPayout}
                  disabled={submittingPayout || !payoutAmount}
                >
                  {submittingPayout ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Payout Request
                      {payoutAmount ? ` (${formatAmount(parseFloat(payoutAmount) || 0)})` : ''}
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPayoutAmount('');
                    setPayoutAddress('');
                    setBankName('');
                    setBankAccount('');
                    setBankAccountName('');
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payout History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Payout History</CardTitle>
                  <CardDescription>Your past withdrawal requests</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {payouts.length} payouts
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="No payout history"
                  description="Your payout requests will appear here."
                />
              ) : (
                <ScrollArea className="max-h-72">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Method</TableHead>
                        <TableHead className="hidden sm:table-cell">Address</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {p.method === 'bitcoin' ? (
                                <Bitcoin className="h-4 w-4 text-orange-500" />
                              ) : p.method === 'usdt' ? (
                                <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <Landmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              )}
                              <span className="text-sm font-medium capitalize">{p.method === 'usdt' ? 'USDT' : p.method}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-sm font-mono max-w-[180px] truncate">
                            {p.address}
                          </TableCell>
                          <TableCell className="text-right font-medium text-foreground">
                            {formatAmount(p.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusBadge(p.status)}>
                              <span className="flex items-center gap-1">
                                {p.status === 'pending' && <Clock className="h-3 w-3" />}
                                {p.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
                                {p.status === 'completed' && <Check className="h-3 w-3" />}
                                <span className="capitalize">{p.status}</span>
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-right text-muted-foreground text-sm">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </PageWrapper>
    </TooltipProvider>
  );
}
