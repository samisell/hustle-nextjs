'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Wallet,
  DollarSign,
  Loader2,
  MapPin,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Building2,
  Rocket,
  Bitcoin,
  Wheat,
  UserCircle,
  BarChart3,
  Vote,
  Eye,
  CheckCircle2,
  CircleDot,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import PageWrapper from '@/components/shared/PageWrapper';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';
import { useAuthStore } from '@/store/auth';
import { useCurrencyStore } from '@/store/currency';
import { toast } from 'sonner';

/* ─────────────── Types ─────────────── */

type DealStatus = 'proposed' | 'voting' | 'funding' | 'active' | 'matured' | 'completed' | 'cancelled';
type RiskLevel = 'low' | 'medium' | 'high';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  dealCount: number;
}

interface Deal {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  category: { id: string; name: string; icon: string; color: string };
  location: string | null;
  riskLevel: RiskLevel;
  status: DealStatus;
  roiPercent: number;
  duration: string;
  minContribution: number;
  maxContribution: number;
  targetAmount: number;
  currentPool: number;
  votesFor: number;
  votesAgainst: number;
  _count: { contributions: number; votes: number };
  createdAt: string;
  votingDeadline?: string;
  topContributors?: { name: string; amount: number; sharePercent: number }[];
}

interface MyVote {
  dealId: string;
  dealTitle: string;
  vote: string;
  comment?: string;
  createdAt: string;
}

/* ─────────────── Helpers ─────────────── */

const STATUS_BADGE: Record<DealStatus, string> = {
  proposed: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20',
  voting: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  funding: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  active: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
  matured: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
};

const RISK_BADGE: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
  medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  high: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
};

const ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Rocket,
  Bitcoin,
  Wheat,
  Users,
};

function getCategoryIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || CircleDot;
}

function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/* ─────────────── Fallback Data ─────────────── */

const fallbackCategories: Category[] = [
  { id: '1', name: 'Real Estate', slug: 'real-estate', icon: 'Building2', color: '#10B981', dealCount: 2 },
  { id: '2', name: 'Startups & Angel Investing', slug: 'startups', icon: 'Rocket', color: '#8B5CF6', dealCount: 1 },
  { id: '3', name: 'Crypto & NFTs', slug: 'crypto-nfts', icon: 'Bitcoin', color: '#F59E0B', dealCount: 1 },
  { id: '4', name: 'Agriculture & Commodities', slug: 'agriculture', icon: 'Wheat', color: '#22C55E', dealCount: 1 },
  { id: '5', name: 'Crowdfunding', slug: 'crowdfunding', icon: 'Users', color: '#EC4899', dealCount: 0 },
];

const fallbackDeals: Deal[] = [
  {
    id: '1', title: 'Dubai Luxury Real Estate Fund', description: 'Invest in premium properties across Dubai Marina and Downtown. High-value rental yields with capital appreciation potential.',
    longDescription: 'This fund targets premium residential and commercial properties in Dubai\'s most sought-after districts. With the city\'s Expo 2020 legacy infrastructure and growing tourism, properties are expected to yield 8-12% rental returns plus significant capital appreciation over the 12-month horizon.',
    category: { id: '1', name: 'Real Estate', icon: 'Building2', color: '#10B981' },
    location: 'Dubai, UAE', riskLevel: 'medium', status: 'funding',
    roiPercent: 18, duration: '12 months', minContribution: 50, maxContribution: 50000,
    targetAmount: 500000, currentPool: 285000, votesFor: 45, votesAgainst: 3,
    _count: { contributions: 28, votes: 48 }, createdAt: new Date().toISOString(),
    topContributors: [
      { name: 'Alice M.', amount: 25000, sharePercent: 8.8 },
      { name: 'James K.', amount: 15000, sharePercent: 5.3 },
      { name: 'Sarah O.', amount: 10000, sharePercent: 3.5 },
    ],
  },
  {
    id: '2', title: 'Lagos Tech Hub Development', description: 'Fund the construction of a co-working and tech incubation space in Lagos mainland. Targeting emerging startups.',
    longDescription: 'The Lagos Tech Hub will provide state-of-the-art co-working spaces, high-speed internet, mentorship programs, and investor access to emerging African startups. The fund covers construction, equipment, and first-year operational costs. Expected to become profitable by month 14.',
    category: { id: '1', name: 'Real Estate', icon: 'Building2', color: '#10B981' },
    location: 'Lagos, Nigeria', riskLevel: 'high', status: 'voting',
    roiPercent: 25, duration: '18 months', minContribution: 25, maxContribution: 25000,
    targetAmount: 200000, currentPool: 0, votesFor: 32, votesAgainst: 5,
    _count: { contributions: 0, votes: 37 }, createdAt: new Date().toISOString(),
    votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3', title: 'DeFi Yield Aggregator Protocol', description: 'Pool funds into a diversified DeFi yield farming strategy across Ethereum and Solana ecosystems.',
    longDescription: 'This DeFi yield aggregator diversifies across 15+ battle-tested protocols on Ethereum (Aave, Compound, Curve) and Solana (Marinade, Raydium). The strategy auto-compounds yields and rebalances weekly. A 2% management fee applies. Past performance has shown 30-40% APY.',
    category: { id: '3', name: 'Crypto & NFTs', icon: 'Bitcoin', color: '#F59E0B' },
    location: null, riskLevel: 'high', status: 'active',
    roiPercent: 35, duration: '6 months', minContribution: 10, maxContribution: 10000,
    targetAmount: 100000, currentPool: 87500, votesFor: 67, votesAgainst: 2,
    _count: { contributions: 52, votes: 69 }, createdAt: new Date().toISOString(),
    topContributors: [
      { name: 'CryptoKing', amount: 8000, sharePercent: 9.1 },
      { name: 'DefiWhale', amount: 5000, sharePercent: 5.7 },
      { name: 'SolMaxi', amount: 3000, sharePercent: 3.4 },
    ],
  },
  {
    id: '4', title: 'Savanna Grain Export Initiative', description: 'Invest in large-scale grain farming and export operations in East Africa. Stable returns from agricultural commodities.',
    longDescription: 'This initiative partners with established farming cooperatives in Kenya\'s Rift Valley to scale grain production for export markets. Investment covers seed, fertilizer, equipment leasing, and logistics. With guaranteed government purchase agreements, returns are stable and low-risk.',
    category: { id: '4', name: 'Agriculture & Commodities', icon: 'Wheat', color: '#22C55E' },
    location: 'Nairobi, Kenya', riskLevel: 'low', status: 'funding',
    roiPercent: 12, duration: '9 months', minContribution: 20, maxContribution: 30000,
    targetAmount: 150000, currentPool: 42000, votesFor: 28, votesAgainst: 1,
    _count: { contributions: 15, votes: 29 }, createdAt: new Date().toISOString(),
    topContributors: [
      { name: 'GreenFund', amount: 12000, sharePercent: 8.0 },
      { name: 'AgriInvest', amount: 8000, sharePercent: 5.3 },
    ],
  },
];

/* ─────────────── Component ─────────────── */

export default function GroupInvestmentsPage() {
  const token = useAuthStore((s) => s.token);
  const formatAmount = useCurrencyStore((s) => s.formatAmount);

  /* ─── Data State ─── */
  const [deals, setDeals] = useState<Deal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [myContributions, setMyContributions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  /* ─── Filter State ─── */
  const [activeCategory, setActiveCategory] = useState('all');

  /* ─── Deal Detail Dialog ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  /* ─── Vote Dialog ─── */
  const [voteOpen, setVoteOpen] = useState(false);
  const [voteDeal, setVoteDeal] = useState<Deal | null>(null);
  const [selectedVote, setSelectedVote] = useState<'for' | 'against' | ''>('');
  const [voteComment, setVoteComment] = useState('');
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [voteSuccess, setVoteSuccess] = useState(false);

  /* ─── Contribute Dialog ─── */
  const [contributeOpen, setContributeOpen] = useState(false);
  const [contributeDeal, setContributeDeal] = useState<Deal | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const [contributeError, setContributeError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  /* ─── Fetch Data ─── */
  useEffect(() => {
    fetchCategories();
    fetchDeals();
  }, [token]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch('/api/group-investments/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setLoadingCategories(false);
        return;
      }
    } catch {
      // fall through to fallback
    }
    setCategories(fallbackCategories);
    setLoadingCategories(false);
  };

  const fetchDeals = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/group-investments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
        setMyVotes(data.myVotes || {});
        setMyContributions(data.myContributions || {});
        setLoading(false);
        return;
      }
    } catch {
      // fall through to fallback
    }
    setDeals(fallbackDeals);
    setMyVotes({ '2': 'for' });
    setMyContributions({ '1': 500, '4': 200 });
    setWalletBalance(1250);
    setLoading(false);
  };

  /* ─── Computed Values ─── */
  const filteredDeals = useMemo(() => {
    if (activeCategory === 'all') return deals;
    return deals.filter((d) => d.category?.slug === activeCategory);
  }, [deals, activeCategory]);

  const stats = useMemo(() => {
    const activeDeals = deals.filter((d) => d.status === 'funding' || d.status === 'active');
    const totalPooled = activeDeals.reduce((sum, d) => sum + d.currentPool, 0);
    const activeCount = activeDeals.length;
    const myContribTotal = Object.values(myContributions).reduce((sum, v) => sum + v, 0);
    return { totalPooled, activeCount, myContribTotal, myEarnings: myContribTotal * 0.15 };
  }, [deals, myContributions]);

  const myVotesList = useMemo<MyVote[]>(() => {
    return Object.entries(myVotes).map(([dealId, vote]) => {
      const deal = deals.find((d) => d.id === dealId);
      return {
        dealId,
        dealTitle: deal?.title || 'Unknown Deal',
        vote,
        createdAt: deal?.createdAt || new Date().toISOString(),
      };
    });
  }, [myVotes, deals]);

  const myContributionsList = useMemo(() => {
    return Object.entries(myContributions).map(([dealId, amount]) => {
      const deal = deals.find((d) => d.id === dealId);
      if (!deal) return null;
      const sharePercent = deal.currentPool > 0 ? (amount / deal.currentPool) * 100 : 0;
      const expectedReturn = amount * (1 + deal.roiPercent / 100);
      return {
        dealId,
        dealTitle: deal.title,
        amount,
        sharePercent,
        expectedReturn,
        status: deal.status,
        createdAt: deal.createdAt,
      };
    }).filter(Boolean) as { dealId: string; dealTitle: string; amount: number; sharePercent: number; expectedReturn: number; status: string; createdAt: string }[];
  }, [myContributions, deals]);

  const myContribTotal = useMemo(() => {
    return myContributionsList.reduce((sum, c) => sum + c.amount, 0);
  }, [myContributionsList]);

  const quickAmounts = [10, 50, 100, 500, 1000];

  const expectedReturn = useMemo(() => {
    if (!contributeAmount || !contributeDeal) return null;
    const amt = parseFloat(contributeAmount);
    if (!amt || amt <= 0) return null;
    return amt * (1 + contributeDeal.roiPercent / 100);
  }, [contributeAmount, contributeDeal]);

  /* ─── Deal Detail ─── */
  const openDealDetail = useCallback((deal: Deal) => {
    setSelectedDeal(deal);
    setDetailOpen(true);
  }, []);

  /* ─── Vote ─── */
  const openVoteDialog = useCallback((deal: Deal) => {
    setVoteDeal(deal);
    setSelectedVote('');
    setVoteComment('');
    setVoteError('');
    setVoteSuccess(false);
    setVoteOpen(true);
  }, []);

  const handleVote = async () => {
    if (!selectedVote) {
      setVoteError('Please select your vote.');
      return;
    }
    setSubmittingVote(true);
    setVoteError('');
    try {
      const res = await fetch(`/api/group-investments/${voteDeal?.id}/vote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote: selectedVote, comment: voteComment || undefined }),
      });
      if (res.ok) {
        setVoteSuccess(true);
        toast.success('Vote recorded!', {
          description: `You voted ${selectedVote === 'for' ? '👍 For' : '👎 Against'} "${voteDeal?.title}".`,
        });
        // Refresh data after short delay
        setTimeout(() => {
          fetchDeals();
          setVoteOpen(false);
        }, 1500);
      } else {
        const data = await res.json();
        setVoteError(data.error || 'Failed to record vote.');
      }
    } catch {
      setVoteError('Something went wrong. Please try again.');
    } finally {
      setSubmittingVote(false);
    }
  };

  /* ─── Contribute ─── */
  const openContributeDialog = useCallback((deal: Deal) => {
    setContributeDeal(deal);
    setContributeAmount('');
    setContributeError('');
    setContributeOpen(true);
  }, []);

  const handleContribute = async () => {
    const amount = parseFloat(contributeAmount);
    if (!amount || amount <= 0) {
      setContributeError('Please enter a valid amount.');
      return;
    }
    if (contributeDeal && amount < contributeDeal.minContribution) {
      setContributeError(`Minimum contribution is ${formatAmount(contributeDeal.minContribution)}.`);
      return;
    }
    if (contributeDeal && amount > contributeDeal.maxContribution) {
      setContributeError(`Maximum contribution is ${formatAmount(contributeDeal.maxContribution)}.`);
      return;
    }
    if (walletBalance > 0 && amount > walletBalance) {
      setContributeError('Insufficient wallet balance.');
      return;
    }

    setContributing(true);
    setContributeError('');
    try {
      const res = await fetch(`/api/group-investments/${contributeDeal?.id}/contribute`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        setContributeOpen(false);
        toast.success('Contribution successful!', {
          description: `You contributed ${formatAmount(amount)} to "${contributeDeal?.title}".`,
        });
        fetchDeals();
      } else {
        const data = await res.json();
        setContributeError(data.error || 'Contribution failed.');
      }
    } catch {
      setContributeError('Something went wrong. Please try again.');
    } finally {
      setContributing(false);
    }
  };

  /* ─── Action Button Renderer ─── */
  const getActionButtons = (deal: Deal) => {
    switch (deal.status) {
      case 'voting':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 text-white hover:bg-green-700"
              onClick={(e) => { e.stopPropagation(); openVoteDialog(deal); }}
            >
              <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
              {myVotes[deal.id] ? 'Vote Again' : 'Vote Now'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); openDealDetail(deal); }}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Details
            </Button>
          </div>
        );
      case 'funding':
      case 'active':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-gold text-white hover:bg-gold-dark"
              onClick={(e) => { e.stopPropagation(); openContributeDialog(deal); }}
            >
              <DollarSign className="mr-1.5 h-3.5 w-3.5" />
              Contribute
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); openDealDetail(deal); }}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Details
            </Button>
          </div>
        );
      case 'matured':
        return (
          <Button size="sm" variant="outline" disabled className="w-full">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Pending Payout
          </Button>
        );
      case 'completed':
        return (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={(e) => { e.stopPropagation(); openDealDetail(deal); }}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View Results
          </Button>
        );
      case 'proposed':
        return (
          <Button size="sm" variant="outline" disabled className="w-full">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Coming Soon
          </Button>
        );
      default:
        return null;
    }
  };

  /* ─────────── Render ─────────── */
  return (
    <PageWrapper
      title="Group Investment Pool"
      description="Pool funds with the community for curated investment opportunities. Vote, contribute, and share profits."
    >
      {/* ────── Stats Row ────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pooled"
          value={formatAmount(stats.totalPooled, true, true)}
          description="Across all active deals"
          icon={Wallet}
        />
        <StatCard
          title="Active Deals"
          value={stats.activeCount}
          description="Funding & live deals"
          icon={TrendingUp}
        />
        <StatCard
          title="My Contributions"
          value={formatAmount(stats.myContribTotal)}
          description="Total invested"
          icon={DollarSign}
        />
        <StatCard
          title="My Earnings"
          value={formatAmount(stats.myEarnings)}
          description="Expected returns"
          icon={BarChart3}
        />
      </div>

      {/* ────── Category Filter Bar ────── */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-gold text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </motion.button>
          {loadingCategories ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 h-9 w-28 rounded-full bg-muted animate-pulse" />
            ))
          ) : (
            categories.filter((c) => c.dealCount > 0).map((cat) => {
              const CatIcon = getCategoryIcon(cat.icon);
              const isActive = activeCategory === cat.slug;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveCategory(isActive ? 'all' : cat.slug)}
                  className={`shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  style={isActive ? { backgroundColor: cat.color } : undefined}
                >
                  <CatIcon className="h-4 w-4" />
                  {cat.name}
                  <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                    {cat.dealCount}
                  </span>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* ────── Tabs ────── */}
      <Tabs defaultValue="deals" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="deals">
            <TrendingUp className="mr-1.5 h-4 w-4" />
            Investment Deals
          </TabsTrigger>
          <TabsTrigger value="contributions">
            <DollarSign className="mr-1.5 h-4 w-4" />
            My Contributions
          </TabsTrigger>
          <TabsTrigger value="votes">
            <Vote className="mr-1.5 h-4 w-4" />
            My Votes
          </TabsTrigger>
        </TabsList>

        {/* ═══════ Tab 1: Investment Deals ═══════ */}
        <TabsContent value="deals">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : filteredDeals.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No investment deals found"
              description={
                activeCategory !== 'all'
                  ? 'No deals in this category. Try a different filter.'
                  : 'Check back later for new investment opportunities.'
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredDeals.map((deal, index) => {
                  const fundingPercent = deal.targetAmount > 0
                    ? Math.min(100, (deal.currentPool / deal.targetAmount) * 100)
                    : 0;
                  const approvalPercent = (deal.votesFor + deal.votesAgainst) > 0
                    ? (deal.votesFor / (deal.votesFor + deal.votesAgainst)) * 100
                    : 0;
                  const CatIcon = getCategoryIcon(deal.category?.icon || 'CircleDot');
                  const alreadyVoted = !!myVotes[deal.id];

                  return (
                    <motion.div
                      key={deal.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.07 }}
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    >
                      <Card
                        className="h-full cursor-pointer border-border/80 hover:border-gold/30 transition-colors overflow-hidden"
                        onClick={() => openDealDetail(deal)}
                      >
                        <CardHeader className="pb-3">
                          {/* Badges row */}
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge
                              className="text-white border-0 text-[11px]"
                              style={{ backgroundColor: deal.category?.color || '#666' }}
                            >
                              <CatIcon className="mr-1 h-3 w-3" />
                              {deal.category?.name || 'Uncategorized'}
                            </Badge>
                            <Badge className={RISK_BADGE[deal.riskLevel]} variant="outline">
                              {deal.riskLevel.toUpperCase()} RISK
                            </Badge>
                            <Badge className={STATUS_BADGE[deal.status]} variant="outline">
                              {formatStatusLabel(deal.status)}
                            </Badge>
                          </div>

                          {/* Title & description */}
                          <CardTitle className="text-base leading-tight">{deal.title}</CardTitle>
                          <CardDescription className="mt-1.5 line-clamp-2 text-xs">
                            {deal.description}
                          </CardDescription>

                          {/* Location */}
                          {deal.location && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {deal.location}
                            </div>
                          )}
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* ROI & Duration */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-muted/50 p-3 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ROI</p>
                              <p className="text-xl font-bold text-gold">{deal.roiPercent}%</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
                              <p className="text-sm font-semibold mt-0.5">{deal.duration}</p>
                            </div>
                          </div>

                          {/* Funding Progress */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{formatAmount(deal.currentPool)}</span>
                              <span className="text-muted-foreground">/ {formatAmount(deal.targetAmount)}</span>
                            </div>
                            <div className="relative">
                              <Progress value={fundingPercent} className="h-2" />
                              <span className="absolute -top-4 right-0 text-[10px] font-semibold text-gold">
                                {fundingPercent.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          {/* Voting progress (for voting deals) */}
                          {deal.status === 'voting' && (
                            <div className="space-y-2 rounded-lg bg-blue-50/50 p-3 dark:bg-blue-500/5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <ThumbsUp className="h-3 w-3" /> {deal.votesFor}
                                </span>
                                <span className="text-muted-foreground">vs</span>
                                <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                                  <ThumbsDown className="h-3 w-3" /> {deal.votesAgainst}
                                </span>
                              </div>
                              <div className="relative">
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-red-200 dark:bg-red-500/20">
                                  <motion.div
                                    className="h-full rounded-full bg-green-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${approvalPercent}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.07 }}
                                  />
                                </div>
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-muted-foreground">
                                  {approvalPercent.toFixed(0)}% approval
                                </span>
                              </div>
                              {deal.votingDeadline && (
                                <p className="text-[10px] text-muted-foreground text-center">
                                  <Clock className="inline h-3 w-3 mr-1" />
                                  {Math.max(0, Math.ceil((new Date(deal.votingDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left to vote
                                </p>
                              )}
                            </div>
                          )}

                          {/* Contributor count */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {deal._count?.contributions || 0} contributors
                            </span>
                            {alreadyVoted && (
                              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                                <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                                Voted
                              </Badge>
                            )}
                          </div>

                          {/* Action buttons */}
                          {getActionButtons(deal)}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* ═══════ Tab 2: My Contributions ═══════ */}
        <TabsContent value="contributions">
          {myContributionsList.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No contributions yet"
              description="Start contributing to group deals to earn returns."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Deal</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Share %</TableHead>
                        <TableHead>Expected Return</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myContributionsList.map((c) => (
                        <TableRow key={c.dealId}>
                          <TableCell className="font-medium">{c.dealTitle}</TableCell>
                          <TableCell className="font-medium">{formatAmount(c.amount)}</TableCell>
                          <TableCell className="text-gold font-medium">{c.sharePercent.toFixed(2)}%</TableCell>
                          <TableCell className="text-green-600 dark:text-green-400 font-medium">
                            {formatAmount(c.expectedReturn)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={STATUS_BADGE[c.status as DealStatus] || 'bg-muted text-muted-foreground'}
                              variant="outline"
                            >
                              {formatStatusLabel(c.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <tfoot>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Total</TableCell>
                        <TableCell>{formatAmount(myContribTotal)}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-green-600 dark:text-green-400">
                          {formatAmount(
                            myContributionsList.reduce((s, c) => s + c.expectedReturn, 0)
                          )}
                        </TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="hidden sm:table-cell">-</TableCell>
                      </TableRow>
                    </tfoot>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════ Tab 3: My Votes ═══════ */}
        <TabsContent value="votes">
          {myVotesList.length === 0 ? (
            <EmptyState
              icon={Vote}
              title="No votes cast"
              description="Vote on proposed deals to help the community make investment decisions."
            />
          ) : (
            <div className="space-y-4">
              {myVotesList.map((v, index) => (
                <motion.div
                  key={v.dealId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{v.dealTitle}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Voted on {new Date(v.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            v.vote === 'for'
                              ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                              : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                          }
                          variant="outline"
                        >
                          {v.vote === 'for' ? (
                            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> For</span>
                          ) : (
                            <span className="flex items-center gap-1"><ThumbsDown className="h-3 w-3" /> Against</span>
                          )}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ══════════ Deal Detail Dialog ══════════ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedDeal?.category && (
                <Badge
                  className="text-white border-0 text-[11px]"
                  style={{ backgroundColor: selectedDeal.category.color }}
                >
                  {getCategoryIcon(selectedDeal.category.icon) && (
                    (() => { const I = getCategoryIcon(selectedDeal.category.icon); return <I className="mr-1 h-3 w-3" />; })()
                  )}
                  {selectedDeal.category.name}
                </Badge>
              )}
              <Badge className={RISK_BADGE[selectedDeal?.riskLevel || 'medium']} variant="outline">
                {(selectedDeal?.riskLevel || 'medium').toUpperCase()} RISK
              </Badge>
              <Badge className={STATUS_BADGE[selectedDeal?.status || 'proposed']} variant="outline">
                {formatStatusLabel(selectedDeal?.status || 'proposed')}
              </Badge>
            </div>
            <DialogTitle className="text-xl">{selectedDeal?.title}</DialogTitle>
            <DialogDescription className="sr-only">
              Details for {selectedDeal?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedDeal && (
            <div className="space-y-5">
              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">About this Deal</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedDeal.longDescription || selectedDeal.description}
                </p>
              </div>

              {/* Location */}
              {selectedDeal.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {selectedDeal.location}
                </div>
              )}

              <Separator />

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ROI</p>
                  <p className="text-lg font-bold text-gold">{selectedDeal.roiPercent}%</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
                  <p className="text-sm font-semibold">{selectedDeal.duration}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Min Contribution</p>
                  <p className="text-sm font-semibold">{formatAmount(selectedDeal.minContribution)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Max Contribution</p>
                  <p className="text-sm font-semibold">{formatAmount(selectedDeal.maxContribution)}</p>
                </div>
              </div>

              {/* Funding Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{formatAmount(selectedDeal.currentPool)}</span>
                  <span className="text-muted-foreground">of {formatAmount(selectedDeal.targetAmount)} target</span>
                </div>
                <Progress
                  value={selectedDeal.targetAmount > 0
                    ? (selectedDeal.currentPool / selectedDeal.targetAmount) * 100
                    : 0
                  }
                  className="h-3"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{selectedDeal._count?.contributions || 0} contributors</span>
                  <span>
                    {selectedDeal.targetAmount > 0
                      ? ((selectedDeal.currentPool / selectedDeal.targetAmount) * 100).toFixed(1)
                      : 0
                    }% funded
                  </span>
                </div>
              </div>

              {/* Voting Results */}
              {(selectedDeal.votesFor > 0 || selectedDeal.votesAgainst > 0) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Voting Results</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                      <ThumbsUp className="h-4 w-4" /> {selectedDeal.votesFor} For
                    </span>
                    <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                      <ThumbsDown className="h-4 w-4" /> {selectedDeal.votesAgainst} Against
                    </span>
                  </div>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-red-200 dark:bg-red-500/20">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{
                        width: `${(selectedDeal.votesFor + selectedDeal.votesAgainst) > 0
                          ? (selectedDeal.votesFor / (selectedDeal.votesFor + selectedDeal.votesAgainst)) * 100
                          : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {(selectedDeal.votesFor + selectedDeal.votesAgainst) > 0
                      ? ((selectedDeal.votesFor / (selectedDeal.votesFor + selectedDeal.votesAgainst)) * 100).toFixed(1)
                      : 0
                    }% approval rate
                  </p>
                </div>
              )}

              {/* Top Contributors */}
              {selectedDeal.topContributors && selectedDeal.topContributors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Contributors</p>
                  <div className="space-y-2">
                    {selectedDeal.topContributors.map((contributor, i) => (
                      <div key={i} className="flex items-center justify-between text-sm rounded-lg bg-muted/50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-gold text-xs font-bold">
                            {i + 1}
                          </div>
                          <span className="font-medium">{contributor.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatAmount(contributor.amount)}</p>
                          <p className="text-[10px] text-muted-foreground">{contributor.sharePercent}% share</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action button in dialog */}
              <div className="pt-2">
                {(selectedDeal.status === 'funding' || selectedDeal.status === 'active') && (
                  <Button
                    className="w-full bg-gold text-white hover:bg-gold-dark"
                    onClick={() => {
                      setDetailOpen(false);
                      setTimeout(() => openContributeDialog(selectedDeal), 200);
                    }}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Contribute to this Deal
                  </Button>
                )}
                {selectedDeal.status === 'voting' && (
                  <Button
                    className="w-full bg-green-600 text-white hover:bg-green-700"
                    onClick={() => {
                      setDetailOpen(false);
                      setTimeout(() => openVoteDialog(selectedDeal), 200);
                    }}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Vote on this Deal
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════ Vote Dialog ══════════ */}
      <Dialog open={voteOpen} onOpenChange={setVoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cast Your Vote</DialogTitle>
            <DialogDescription>
              {voteDeal?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {voteError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {voteError}
              </div>
            )}

            {voteSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10 mb-3">
                  <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-semibold text-foreground">Vote Recorded!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your {selectedVote === 'for' ? '👍 For' : '👎 Against'} vote has been submitted.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Deal summary */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">{voteDeal?.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-gold" />
                      {voteDeal?.roiPercent}% ROI
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {voteDeal?.duration}
                    </span>
                    <Badge className={RISK_BADGE[voteDeal?.riskLevel || 'medium']} variant="outline">
                      {voteDeal?.riskLevel}
                    </Badge>
                  </div>
                </div>

                {/* Vote buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedVote('for')}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all ${
                      selectedVote === 'for'
                        ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
                        : 'border-border hover:border-green-300 dark:hover:border-green-500/30'
                    }`}
                  >
                    <ThumbsUp className={`h-8 w-8 ${selectedVote === 'for' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-semibold ${selectedVote === 'for' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      Vote For
                    </span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedVote('against')}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all ${
                      selectedVote === 'against'
                        ? 'border-red-500 bg-red-50 dark:bg-red-500/10'
                        : 'border-border hover:border-red-300 dark:hover:border-red-500/30'
                    }`}
                  >
                    <ThumbsDown className={`h-8 w-8 ${selectedVote === 'against' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-semibold ${selectedVote === 'against' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                      Vote Against
                    </span>
                  </motion.button>
                </div>

                {/* Optional comment */}
                <div className="space-y-2">
                  <Label htmlFor="voteComment">Comment (optional)</Label>
                  <Textarea
                    id="voteComment"
                    placeholder="Share your thoughts on this deal..."
                    value={voteComment}
                    onChange={(e) => setVoteComment(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          {!voteSuccess && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setVoteOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-gold text-white hover:bg-gold-dark"
                onClick={handleVote}
                disabled={submittingVote || !selectedVote}
              >
                {submittingVote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submittingVote ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════ Contribute Dialog ══════════ */}
      <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contribute to Deal</DialogTitle>
            <DialogDescription>{contributeDeal?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {contributeError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {contributeError}
              </div>
            )}

            {/* Deal info summary */}
            {contributeDeal && (
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">ROI</p>
                    <p className="font-bold text-gold">{contributeDeal.roiPercent}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold">{contributeDeal.duration}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Funding Progress</span>
                    <span className="font-semibold text-gold">
                      {contributeDeal.targetAmount > 0
                        ? ((contributeDeal.currentPool / contributeDeal.targetAmount) * 100).toFixed(1)
                        : 0
                      }%
                    </span>
                  </div>
                  <Progress
                    value={contributeDeal.targetAmount > 0
                      ? (contributeDeal.currentPool / contributeDeal.targetAmount) * 100
                      : 0
                    }
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formatAmount(contributeDeal.currentPool)} / {formatAmount(contributeDeal.targetAmount)}
                  </p>
                </div>
              </div>
            )}

            {/* Amount input */}
            <div className="space-y-2">
              <Label htmlFor="contributeAmountInput">
                Contribution Amount (USD)
              </Label>
              <Input
                id="contributeAmountInput"
                type="number"
                placeholder={`Min ${formatAmount(contributeDeal?.minContribution ?? 0)} — Max ${formatAmount(contributeDeal?.maxContribution ?? 0)}`}
                min={contributeDeal?.minContribution}
                max={contributeDeal?.maxContribution}
                step="0.01"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
              />

              {/* Quick amounts */}
              <div className="flex gap-2">
                {quickAmounts.map((qa) => (
                  <Button
                    key={qa}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setContributeAmount(String(qa))}
                  >
                    ${qa}
                  </Button>
                ))}
              </div>
            </div>

            {/* Expected return */}
            {expectedReturn && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-gold/30 bg-gold/5 p-3"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expected Return</span>
                  <span className="font-bold text-gold">{formatAmount(expectedReturn)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {contributeDeal?.roiPercent}% ROI over {contributeDeal?.duration}
                </p>
              </motion.div>
            )}

            {/* Wallet balance */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Wallet className="h-4 w-4" />
                Wallet Balance
              </span>
              <span className="font-semibold">{formatAmount(walletBalance)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setContributeOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gold text-white hover:bg-gold-dark"
              onClick={handleContribute}
              disabled={contributing}
            >
              {contributing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {contributing ? 'Processing...' : 'Confirm Contribution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
