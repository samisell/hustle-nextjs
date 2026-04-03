'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Users, ArrowLeftRight, BookOpen, TrendingUp, Check, X, Loader2, Plus, Lock, Gavel, Ban, RotateCcw,
  DollarSign, AlertTriangle, Eye, CreditCard, Bell, Settings, Search, Filter, ChevronLeft,
  ChevronRight, BarChart3, Activity, PieChart as PieChartIcon, Send, UserCheck, Wallet, Edit, Trash2, Info,
  Download, Calendar, Clock, Mail, MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import PageWrapper from '@/components/shared/PageWrapper';
import StatCard from '@/components/shared/StatCard';
import { useAuthStore } from '@/store/auth';
import { useCurrencyStore } from '@/store/currency';
import { toast } from '@/hooks/use-toast';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface AdminUser {
  id: string; name: string; email: string; role: string;
  referralCode: string; createdAt: string; balance: number;
  subscriptionCount?: number; enrollmentCount?: number; investmentCount?: number;
}

interface UserDetail extends AdminUser {
  transactions?: TransactionItem[];
  payments?: PaymentItem[];
  coursesEnrolled?: { title: string; progress: number }[];
  investmentsMade?: { title: string; amount: number; status: string }[];
  referralsMade?: { name: string; date: string }[];
}

interface WithdrawalRequest {
  id: string; userId: string; userName: string; userEmail: string;
  amount: number; walletAddress: string; status: string; createdAt: string;
}

interface AdminCourse {
  id: string; title: string; description: string; difficulty: string;
  category: string; enrollmentsCount: number; lessonsCount?: number; createdAt: string;
}

interface CourseDetail extends AdminCourse {
  lessons?: { id: string; title: string; order: number }[];
  enrolledUsers?: { name: string; email: string; progress: number }[];
}

interface AdminInvestment {
  id: string; title: string; description: string; minInvestment: number;
  maxInvestment: number; roiPercent: number; duration: string; status: string;
  totalPool: number; investorCount?: number; createdAt: string;
}

interface InvestmentDetail extends AdminInvestment {
  investors?: { name: string; amount: number; expectedReturn: number; status: string; startDate: string; endDate: string }[];
}

interface PaymentItem {
  id: string; userName: string; amount: number; method: string;
  type: string; status: string; txRef: string; createdAt: string;
}

interface TransactionItem {
  id: string; type: string; amount: number; status: string; description: string; createdAt: string;
}

interface PlatformStats {
  totalUsers: number; activeSubscriptions: number; totalRevenue: number;
  pendingWithdrawals: number; totalCourses: number; totalEnrollments: number;
  totalInvestments: number; escrowHeld: number; monthlyRevenue: { month: string; revenue: number }[];
  userGrowth: { month: string; users: number }[];
  subscriptionDist: { name: string; value: number }[];
  topCourses: { title: string; enrollments: number }[];
  topReferrers: { name: string; referrals: number }[];
  paymentBreakdown: { flutterwave: number; crypto: number; wallet: number };
}

interface BroadcastItem {
  id: string; title: string; message: string; type: string;
  recipientCount: number; createdAt: string;
}

interface AdminSkillCategory {
  id: string; name: string; slug: string; description: string | null;
  icon: string; color: string; order: number; isActive: boolean;
  _count: { courses: number };
}

/* ──────── Escrow Types (preserved from original) ──────── */

type EscrowStatus = 'collecting' | 'funded' | 'active' | 'disputed' | 'released' | 'refunded' | 'expired' | 'cancelled';
type EscrowType = 'deal_funding' | 'investment_deal' | 'service_payment' | 'milestone';

interface Milestone { id: string; title: string; description: string; percentage: number; status: string; }
interface EscrowContribution { id: string; userName: string; amount: number; status: string; date: string; }
interface EscrowDisputeAdmin {
  id: string; userId: string; userName: string; reason: string;
  evidence: string; status: string; resolution: string | null; date: string;
}

interface AdminEscrow {
  id: string; title: string; description: string; type: EscrowType;
  status: EscrowStatus; targetAmount: number; collectedAmount: number;
  minContribution: number; maxContribution: number; feePercentage: number;
  fundingDeadline: string; releaseDate: string | null; terms: string;
  contributorCount: number; milestones: Milestone[];
  contributions: EscrowContribution[]; disputes: EscrowDisputeAdmin[]; createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════
   ESCROW BADGE HELPERS
   ═══════════════════════════════════════════════════════════════ */

const ESCROW_STATUS_BADGE: Record<EscrowStatus, string> = {
  collecting: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  funded: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
  active: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  disputed: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
  released: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
  refunded: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  expired: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};
const ESCROW_TYPE_LABEL: Record<EscrowType, string> = {
  deal_funding: 'Deal Funding', investment_deal: 'Investment Deal',
  service_payment: 'Service Payment', milestone: 'Milestone',
};
const MILESTONE_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  released: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
  held: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
};
const DISPUTE_ADMIN_STATUS_BADGE: Record<string, string> = {
  open: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  reviewing: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  resolved: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
  dismissed: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

/* ═══════════════════════════════════════════════════════════════
   FALLBACK DATA
   ═══════════════════════════════════════════════════════════════ */

const FALLBACK_STATS: PlatformStats = {
  totalUsers: 1247, activeSubscriptions: 389, totalRevenue: 48950,
  pendingWithdrawals: 2350, totalCourses: 12, totalEnrollments: 1843,
  totalInvestments: 67420, escrowHeld: 312000,
  monthlyRevenue: [
    { month: 'Apr', revenue: 3200 }, { month: 'May', revenue: 4100 }, { month: 'Jun', revenue: 3800 },
    { month: 'Jul', revenue: 5200 }, { month: 'Aug', revenue: 4700 }, { month: 'Sep', revenue: 5600 },
    { month: 'Oct', revenue: 4900 }, { month: 'Nov', revenue: 6100 }, { month: 'Dec', revenue: 5500 },
    { month: 'Jan', revenue: 7200 }, { month: 'Feb', revenue: 6800 }, { month: 'Mar', revenue: 7600 },
  ],
  userGrowth: [
    { month: 'Apr', users: 420 }, { month: 'May', users: 510 }, { month: 'Jun', users: 580 },
    { month: 'Jul', users: 670 }, { month: 'Aug', users: 740 }, { month: 'Sep', users: 830 },
    { month: 'Oct', users: 920 }, { month: 'Nov', users: 990 }, { month: 'Dec', users: 1060 },
    { month: 'Jan', users: 1130 }, { month: 'Feb', users: 1190 }, { month: 'Mar', users: 1247 },
  ],
  subscriptionDist: [
    { name: 'Basic', value: 180 }, { name: 'Pro', value: 140 }, { name: 'Premium', value: 69 },
  ],
  topCourses: [
    { title: 'Financial Literacy 101', enrollments: 245 }, { title: 'Crypto Trading Masterclass', enrollments: 198 },
    { title: 'Investment Fundamentals', enrollments: 167 }, { title: 'Real Estate 101', enrollments: 134 },
    { title: 'Business Strategy', enrollments: 121 },
  ],
  topReferrers: [
    { name: 'Alice Johnson', referrals: 23 }, { name: 'Bob Smith', referrals: 18 },
    { name: 'Carol White', referrals: 15 }, { name: 'Dave Brown', referrals: 12 },
    { name: 'Eve Wilson', referrals: 9 },
  ],
  paymentBreakdown: { flutterwave: 32400, crypto: 12500, wallet: 4050 },
};

const FALLBACK_USERS: AdminUser[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'user', referralCode: 'ALICE01', createdAt: '2024-01-15', balance: 250, subscriptionCount: 1, enrollmentCount: 5, investmentCount: 3 },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'user', referralCode: 'BOB02', createdAt: '2024-02-20', balance: 120, subscriptionCount: 2, enrollmentCount: 3, investmentCount: 1 },
  { id: '3', name: 'Carol White', email: 'carol@example.com', role: 'admin', referralCode: 'CAROL03', createdAt: '2024-01-10', balance: 5000, subscriptionCount: 1, enrollmentCount: 8, investmentCount: 5 },
  { id: '4', name: 'Dave Brown', email: 'dave@example.com', role: 'user', referralCode: 'DAVE04', createdAt: '2024-03-05', balance: 890, subscriptionCount: 0, enrollmentCount: 2, investmentCount: 2 },
  { id: '5', name: 'Eve Wilson', email: 'eve@example.com', role: 'user', referralCode: 'EVE05', createdAt: '2024-03-10', balance: 45, subscriptionCount: 1, enrollmentCount: 1, investmentCount: 0 },
];

const FALLBACK_WITHDRAWALS: WithdrawalRequest[] = [
  { id: '1', userId: '1', userName: 'Alice Johnson', userEmail: 'alice@example.com', amount: 50, walletAddress: '0xabc123...def456', status: 'pending', createdAt: '2024-03-15' },
  { id: '2', userId: '2', userName: 'Bob Smith', userEmail: 'bob@example.com', amount: 100, walletAddress: '0xdef789...ghi012', status: 'pending', createdAt: '2024-03-14' },
  { id: '3', userId: '3', userName: 'Carol White', userEmail: 'carol@example.com', amount: 500, walletAddress: '0xghi345...jkl678', status: 'approved', createdAt: '2024-03-12' },
  { id: '4', userId: '4', userName: 'Dave Brown', userEmail: 'dave@example.com', amount: 200, walletAddress: '0xjkl901...mno234', status: 'completed', createdAt: '2024-03-10' },
  { id: '5', userId: '5', userName: 'Eve Wilson', userEmail: 'eve@example.com', amount: 30, walletAddress: '0xmno567...pqr890', status: 'rejected', createdAt: '2024-03-08' },
];

const FALLBACK_COURSES: AdminCourse[] = [
  { id: '1', title: 'Financial Literacy 101', description: 'Basics of personal finance and money management', difficulty: 'beginner', category: 'Finance', enrollmentsCount: 245, lessonsCount: 12, createdAt: '2024-01-01' },
  { id: '2', title: 'Crypto Trading Masterclass', description: 'Learn advanced crypto trading strategies', difficulty: 'advanced', category: 'Crypto', enrollmentsCount: 198, lessonsCount: 18, createdAt: '2024-01-15' },
  { id: '3', title: 'Investment Fundamentals', description: 'Learn investing basics across multiple asset classes', difficulty: 'intermediate', category: 'Investing', enrollmentsCount: 167, lessonsCount: 10, createdAt: '2024-02-01' },
  { id: '4', title: 'Real Estate 101', description: 'Introduction to real estate investment strategies', difficulty: 'beginner', category: 'Real Estate', enrollmentsCount: 134, lessonsCount: 8, createdAt: '2024-02-15' },
];

const FALLBACK_INVESTMENTS: AdminInvestment[] = [
  { id: '1', title: 'Stable Growth Fund', description: 'Low-risk investment with steady returns', minInvestment: 10, maxInvestment: 10000, roiPercent: 5, duration: '30 days', status: 'active', totalPool: 50000, investorCount: 89, createdAt: '2024-01-01' },
  { id: '2', title: 'Tech Innovation Pool', description: 'Invest in emerging technology companies', minInvestment: 50, maxInvestment: 50000, roiPercent: 12, duration: '90 days', status: 'active', totalPool: 200000, investorCount: 45, createdAt: '2024-01-15' },
  { id: '3', title: 'Real Estate Trust', description: 'Diversified real estate portfolio with monthly dividends', minInvestment: 100, maxInvestment: 100000, roiPercent: 8, duration: '60 days', status: 'active', totalPool: 150000, investorCount: 32, createdAt: '2024-02-01' },
  { id: '4', title: 'Crypto Hedge Fund', description: 'Professional crypto management with risk mitigation', minInvestment: 25, maxInvestment: 25000, roiPercent: 15, duration: '45 days', status: 'closed', totalPool: 75000, investorCount: 0, createdAt: '2024-02-15' },
];

const FALLBACK_PAYMENTS: PaymentItem[] = Array.from({ length: 25 }, (_, i) => ({
  id: `p${i + 1}`,
  userName: ['Alice Johnson', 'Bob Smith', 'Carol White', 'Dave Brown', 'Eve Wilson'][i % 5],
  amount: [9.99, 29.99, 99.99, 50, 100, 200, 500][i % 7],
  method: ['flutterwave', 'crypto', 'wallet'][i % 3],
  type: ['subscription', 'wallet_funding', 'escrow'][i % 3],
  status: ['completed', 'completed', 'completed', 'pending', 'failed'][i % 5],
  txRef: `TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  createdAt: new Date(2024, 2, 15 - i).toISOString(),
}));

const FALLBACK_ESCROWS: AdminEscrow[] = [
  { id: 'e1', title: 'E-Commerce Platform Launch', description: 'Funding for the initial development and marketing of a new e-commerce platform targeting the African market.', type: 'deal_funding', status: 'collecting', targetAmount: 50000, collectedAmount: 32000, minContribution: 50, maxContribution: 10000, feePercentage: 2.5, fundingDeadline: new Date(Date.now() + 15 * 86400000).toISOString(), releaseDate: null, terms: 'Funds released upon platform launch confirmation.', contributorCount: 42, milestones: [], contributions: [{ id: 'c1', userName: 'Alice Johnson', amount: 500, status: 'active', date: '2024-03-05' }, { id: 'c2', userName: 'Bob Smith', amount: 1000, status: 'active', date: '2024-03-03' }], disputes: [], createdAt: '2024-03-01' },
  { id: 'e2', title: 'Real Estate Investment Pool', description: 'Pool of investors contributing to a commercial real estate acquisition.', type: 'investment_deal', status: 'funded', targetAmount: 200000, collectedAmount: 200000, minContribution: 100, maxContribution: 50000, feePercentage: 1.5, fundingDeadline: '2024-03-20T00:00:00Z', releaseDate: '2024-05-01T00:00:00Z', terms: 'Funds held until property acquisition is verified.', contributorCount: 28, milestones: [], contributions: [{ id: 'c4', userName: 'Alice Johnson', amount: 5000, status: 'held', date: '2024-02-20' }], disputes: [], createdAt: '2024-02-15' },
  { id: 'e3', title: 'Mobile App Milestone 2', description: 'Second milestone payment for mobile app development.', type: 'milestone', status: 'active', targetAmount: 15000, collectedAmount: 15000, minContribution: 500, maxContribution: 15000, feePercentage: 2, fundingDeadline: '2024-03-10T00:00:00Z', releaseDate: '2024-05-01T00:00:00Z', terms: 'Released upon completion of milestone 2.', contributorCount: 3, milestones: [{ id: 'm1', title: 'UI Design', description: 'Complete UI implementation', percentage: 40, status: 'released' }, { id: 'm2', title: 'Backend Integration', description: 'API integration and testing', percentage: 60, status: 'held' }], contributions: [{ id: 'c6', userName: 'Alice Johnson', amount: 5000, status: 'held', date: '2024-02-25' }], disputes: [], createdAt: '2024-02-20' },
  { id: 'e4', title: 'Agricultural Supply Chain', description: 'Investment in an agricultural supply chain optimization project.', type: 'investment_deal', status: 'disputed', targetAmount: 80000, collectedAmount: 65000, minContribution: 200, maxContribution: 20000, feePercentage: 2, fundingDeadline: '2024-04-01T00:00:00Z', releaseDate: null, terms: 'Funds released upon delivery verification.', contributorCount: 15, milestones: [], contributions: [{ id: 'c7', userName: 'Alice Johnson', amount: 1000, status: 'disputed', date: '2024-02-10' }], disputes: [{ id: 'd1', userId: 'u1', userName: 'Alice Johnson', reason: 'Project deliverables not meeting agreed specifications.', evidence: 'Screenshots attached.', status: 'reviewing', resolution: null, date: '2024-03-10' }], createdAt: '2024-01-25' },
  { id: 'e5', title: 'Brand Identity Design', description: 'Payment for professional brand identity design services.', type: 'service_payment', status: 'released', targetAmount: 3000, collectedAmount: 3000, minContribution: 500, maxContribution: 3000, feePercentage: 3, fundingDeadline: '2024-02-15T00:00:00Z', releaseDate: '2024-03-15T00:00:00Z', terms: 'Released upon final delivery.', contributorCount: 1, milestones: [], contributions: [{ id: 'c9', userName: 'Carol White', amount: 3000, status: 'released', date: '2024-01-20' }], disputes: [], createdAt: '2024-01-20' },
];

const FALLBACK_BROADCASTS: BroadcastItem[] = [
  { id: 'b1', title: 'Platform Update', message: 'We have launched new investment opportunities. Check them out now!', type: 'info', recipientCount: 1247, createdAt: '2024-03-14' },
  { id: 'b2', title: 'Maintenance Notice', message: 'Scheduled maintenance on March 20th from 2-4 AM UTC.', type: 'warning', recipientCount: 1247, createdAt: '2024-03-12' },
];

const PIE_COLORS = ['#D4AF37', '#FF8C00', '#2D5A27'];

const TAB_ANIMATION = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function AdminPage() {
  const token = useAuthStore((s) => s.token);
  const formatAmount = useCurrencyStore((s) => s.formatAmount);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ──────── Data State ──────── */
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [investments, setInvestments] = useState<AdminInvestment[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [escrows, setEscrows] = useState<AdminEscrow[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [escrowLoading, setEscrowLoading] = useState(true);

  /* ──────── Filter / Search ──────── */
  const [userSearch, setUserSearch] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [paymentPage, setPaymentPage] = useState(1);
  const PAYMENTS_PER_PAGE = 20;

  /* ──────── Dialog States ──────── */
  // User Detail
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  // Adjust Balance
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceTarget, setBalanceTarget] = useState<AdminUser | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [adjustingBalance, setAdjustingBalance] = useState(false);

  // Course
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', difficulty: 'beginner', category: '' });
  const [creatingCourse, setCreatingCourse] = useState(false);

  // Course Detail
  const [courseDetailOpen, setCourseDetailOpen] = useState(false);
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);

  // Investment
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<AdminInvestment | null>(null);
  const [newInvestment, setNewInvestment] = useState({ title: '', description: '', minInvestment: '', maxInvestment: '', roiPercent: '', duration: '' });
  const [creatingInvestment, setCreatingInvestment] = useState(false);

  // Investment Detail (View Investors)
  const [investDetailOpen, setInvestDetailOpen] = useState(false);
  const [investDetail, setInvestDetail] = useState<InvestmentDetail | null>(null);
  const [investDetailLoading, setInvestDetailLoading] = useState(false);

  // Delete Confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Notification Broadcast
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('info');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  /* ──────── Escrow State ──────── */
  const [createEscrowOpen, setCreateEscrowOpen] = useState(false);
  const [newEscrow, setNewEscrow] = useState({ title: '', description: '', type: 'deal_funding' as EscrowType, targetAmount: '', minContribution: '', maxContribution: '', feePercentage: '2.5', fundingDeadline: '', releaseDate: '', terms: '' });
  const [milestones, setMilestones] = useState<{ title: string; description: string; percentage: string }[]>([]);
  const [creatingEscrow, setCreatingEscrow] = useState(false);
  const [viewEscrowOpen, setViewEscrowOpen] = useState(false);
  const [viewEscrow, setViewEscrow] = useState<AdminEscrow | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'release' | 'refund' | 'cancel' | 'process-expired'; escrowId: string; milestoneId?: string; disputeId?: string; disputeAction?: string } | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<{ escrowId: string; disputeId: string; action: string } | null>(null);
  const [resolveResolution, setResolveResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  /* ──────── Skill Category State ──────── */
  const [skillCategories, setSkillCategories] = useState<AdminSkillCategory[]>([]);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<AdminSkillCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', icon: 'BookOpen', color: '#D4AF37', order: '0' });
  const [catSaving, setCatSaving] = useState(false);

  /* ═══════════════════════════════════════════════════════════════
     DATA FETCHING
     ═══════════════════════════════════════════════════════════════ */

  useEffect(() => { fetchAllData(); }, [token]);

  const fetchAllData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setWithdrawals(data.withdrawals || []);
        setCourses(data.courses || []);
        setInvestments(data.investments || []);
      }
    } catch {
      setUsers(FALLBACK_USERS);
      setWithdrawals(FALLBACK_WITHDRAWALS);
      setCourses(FALLBACK_COURSES);
      setInvestments(FALLBACK_INVESTMENTS);
    } finally { setLoading(false); }
    fetchStats();
    fetchEscrows();
    fetchPayments();
    fetchBroadcasts();
    fetchSkillCategories();
  }, [token]);

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setStats(await res.json()); return; }
    } catch { /* fallback */ }
    setStats(FALLBACK_STATS);
  };

  const fetchEscrows = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/escrow', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setEscrows(data.escrows || []); return; }
    } catch { /* fallback */ }
    setEscrows(FALLBACK_ESCROWS);
    setEscrowLoading(false);
  };

  const fetchPayments = async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (paymentStatusFilter !== 'all') params.set('status', paymentStatusFilter);
      if (paymentMethodFilter !== 'all') params.set('method', paymentMethodFilter);
      if (paymentTypeFilter !== 'all') params.set('type', paymentTypeFilter);
      params.set('page', String(paymentPage));
      params.set('limit', String(PAYMENTS_PER_PAGE));
      const res = await fetch(`/api/admin/payments?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setPayments(data.payments || []); return; }
    } catch { /* fallback */ }
    setPayments(FALLBACK_PAYMENTS);
  };

  const fetchBroadcasts = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/notifications/broadcasts', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setBroadcasts(data.broadcasts || []); return; }
    } catch { /* fallback */ }
    setBroadcasts(FALLBACK_BROADCASTS);
  };

  const fetchSkillCategories = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/skill-categories', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setSkillCategories(data.categories || []); return; }
    } catch { /* fallback */ }
    setSkillCategories([
      { id: 'c1', name: 'Finance', slug: 'finance', description: 'Financial literacy', icon: 'DollarSign', color: '#10B981', order: 0, isActive: true, _count: { courses: 3 } },
      { id: 'c2', name: 'Investing', slug: 'investing', description: 'Investment strategies', icon: 'TrendingUp', color: '#3B82F6', order: 1, isActive: true, _count: { courses: 2 } },
      { id: 'c3', name: 'Crypto', slug: 'crypto', description: 'Cryptocurrency', icon: 'Bitcoin', color: '#F59E0B', order: 2, isActive: true, _count: { courses: 1 } },
      { id: 'c4', name: 'Business', slug: 'business', description: 'Business strategy', icon: 'Briefcase', color: '#8B5CF6', order: 3, isActive: false, _count: { courses: 0 } },
    ]);
  };

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) return;
    setCatSaving(true);
    try {
      const url = editingCat ? `/api/skill-categories/${editingCat.id}` : '/api/skill-categories';
      const method = editingCat ? 'PATCH' : 'POST';
      const body = { ...catForm, order: parseInt(catForm.order) || 0 };
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { toast({ title: editingCat ? 'Category Updated' : 'Category Created', description: 'Success.' }); setCatDialogOpen(false); resetCatForm(); fetchSkillCategories(); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed.' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong.' }); }
    finally { setCatSaving(false); }
  };

  const resetCatForm = () => { setCatForm({ name: '', slug: '', description: '', icon: 'BookOpen', color: '#D4AF37', order: '0' }); setEditingCat(null); };

  const openCatDialog = (cat?: AdminSkillCategory) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon, color: cat.color, order: String(cat.order) });
    } else { resetCatForm(); }
    setCatDialogOpen(true);
  };

  const handleDeleteCat = async (cat: AdminSkillCategory) => {
    setActionLoading(`delete-cat-${cat.id}`);
    try {
      const res = await fetch(`/api/skill-categories/${cat.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast({ title: 'Deleted', description: `${cat.name} has been deleted.` }); fetchSkillCategories(); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed.' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong.' }); }
    finally { setActionLoading(null); }
  };

  const handleToggleCatActive = async (cat: AdminSkillCategory) => {
    setActionLoading(`toggle-cat-${cat.id}`);
    try {
      const res = await fetch(`/api/skill-categories/${cat.id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !cat.isActive }) });
      if (res.ok) { setSkillCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !cat.isActive } : c)); toast({ title: cat.isActive ? 'Deactivated' : 'Activated', description: `${cat.name} is now ${cat.isActive ? 'inactive' : 'active'}.` }); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed.' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong.' }); }
    finally { setActionLoading(null); }
  };

  useEffect(() => { fetchPayments(); }, [paymentStatusFilter, paymentMethodFilter, paymentTypeFilter, paymentPage, token]);

  /* ═══════════════════════════════════════════════════════════════
     COMPUTED VALUES
     ═══════════════════════════════════════════════════════════════ */

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, userSearch]);

  const filteredWithdrawals = useMemo(() => {
    if (withdrawalFilter === 'all') return withdrawals;
    return withdrawals.filter((w) => w.status === withdrawalFilter);
  }, [withdrawals, withdrawalFilter]);

  const filteredPayments = useMemo(() => {
    let result = payments;
    if (paymentStatusFilter !== 'all') result = result.filter((p) => p.status === paymentStatusFilter);
    if (paymentMethodFilter !== 'all') result = result.filter((p) => p.method === paymentMethodFilter);
    if (paymentTypeFilter !== 'all') result = result.filter((p) => p.type === paymentTypeFilter);
    return result;
  }, [payments, paymentStatusFilter, paymentMethodFilter, paymentTypeFilter]);

  const paymentStats = useMemo(() => ({
    total: payments.length,
    completedRevenue: payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount, 0),
    pendingAmount: payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    failedAmount: payments.filter((p) => p.status === 'failed').reduce((s, p) => s + p.amount, 0),
  }), [payments]);

  const escrowStats = useMemo(() => ({
    total: escrows.length,
    active: escrows.filter((e) => ['collecting', 'funded', 'active'].includes(e.status)).length,
    held: escrows.reduce((sum, e) => sum + (['funded', 'active', 'disputed'].includes(e.status) ? e.collectedAmount : 0), 0),
    disputes: escrows.reduce((sum, e) => sum + e.disputes.filter((d) => d.status === 'open' || d.status === 'reviewing').length, 0),
  }), [escrows]);

  const milestoneTotal = useMemo(() => milestones.reduce((sum, m) => sum + (parseFloat(m.percentage) || 0), 0), [milestones]);

  /* ═══════════════════════════════════════════════════════════════
     ACTION HANDLERS
     ═══════════════════════════════════════════════════════════════ */

  /* Users */
  const toggleUserRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await fetch('/api/admin/users/role', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role: newRole }) });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast({ title: 'Role Updated', description: `User role changed to ${newRole}.` });
    } catch { toast({ title: 'Error', description: 'Failed to update role.' }); }
    finally { setActionLoading(null); }
  };

  const fetchUserDetail = async (userId: string) => {
    setUserDetailLoading(true);
    setUserDetailOpen(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setUserDetail(await res.json()); return; }
    } catch { /* fallback */ }
    const user = users.find((u) => u.id === userId);
    setUserDetail(user ? { ...user, transactions: FALLBACK_PAYMENTS.slice(0, 5).map((p) => ({ id: p.id, type: 'payment', amount: p.amount, status: p.status, description: `${p.type} via ${p.method}`, createdAt: p.createdAt })), payments: FALLBACK_PAYMENTS.slice(0, 5), coursesEnrolled: [{ title: 'Financial Literacy 101', progress: 75 }, { title: 'Investment Fundamentals', progress: 40 }], investmentsMade: [{ title: 'Stable Growth Fund', amount: 100, status: 'active' }], referralsMade: [{ name: 'Bob Smith', date: '2024-02-20' }] } : null);
    setUserDetailLoading(false);
  };

  const handleAdjustBalance = async () => {
    if (!balanceTarget || !balanceAmount) return;
    setAdjustingBalance(true);
    try {
      const res = await fetch(`/api/admin/users/${balanceTarget.id}/balance`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(balanceAmount), reason: balanceReason }) });
      if (res.ok) { toast({ title: 'Balance Updated', description: `Adjusted by ${formatAmount(parseFloat(balanceAmount))}` }); setBalanceDialogOpen(false); fetchAllData(); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed to adjust balance.' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong.' }); }
    finally { setAdjustingBalance(false); }
  };

  /* Withdrawals */
  const handleWithdrawal = async (id: string, action: 'approved' | 'rejected' | 'completed') => {
    setActionLoading(id);
    try {
      await fetch('/api/admin/withdrawals', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ withdrawalId: id, action }) });
      setWithdrawals((prev) => prev.map((w) => (w.id === id ? { ...w, status: action } : w)));
      toast({ title: `Withdrawal ${action === 'approved' ? 'Approved' : action === 'rejected' ? 'Rejected' : 'Marked Complete'}`, description: 'Action completed.' });
    } catch { toast({ title: 'Error', description: 'Failed to process withdrawal.' }); }
    finally { setActionLoading(null); }
  };

  /* Courses */
  const handleSaveCourse = async () => {
    if (!newCourse.title.trim()) return;
    setCreatingCourse(true);
    try {
      const url = editingCourse ? `/api/admin/courses/${editingCourse.id}` : '/api/admin/courses';
      const method = editingCourse ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(newCourse) });
      if (res.ok) { toast({ title: editingCourse ? 'Course Updated' : 'Course Created', description: 'Success.' }); setCourseDialogOpen(false); resetCourseForm(); fetchAllData(); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed.' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong.' }); }
    finally { setCreatingCourse(false); }
  };

  const resetCourseForm = () => { setNewCourse({ title: '', description: '', difficulty: 'beginner', category: '' }); setEditingCourse(null); };

  const handleDeleteCourse = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${deleteTarget.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast({ title: 'Deleted', description: `${deleteTarget.title} has been deleted.` }); setDeleteDialogOpen(false); setDeleteTarget(null); fetchAllData(); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed.' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong.' }); }
    finally { setDeleting(false); }
  };

  const fetchCourseDetail = async (courseId: string) => {
    setCourseDetailLoading(true);
    setCourseDetailOpen(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setCourseDetail(await res.json()); setCourseDetailLoading(false); return; }
    } catch { /* fallback */ }
    const c = courses.find((x) => x.id === courseId);
    setCourseDetail(c ? { ...c, lessons: [{ id: 'l1', title: 'Introduction', order: 1 }, { id: 'l2', title: 'Getting Started', order: 2 }], enrolledUsers: [{ name: 'Alice Johnson', email: 'alice@example.com', progress: 75 }, { name: 'Bob Smith', email: 'bob@example.com', progress: 40 }] } : null);
    setCourseDetailLoading(false);
  };

  /* Investments */
  const handleSaveInvestment = async () => {
    if (!newInvestment.title.trim()) return;
    setCreatingInvestment(true);
    try {
      const url = editingInvestment ? `/api/admin/investments/${editingInvestment.id}` : '/api/admin/investments';
      const method = editingInvestment ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newInvestment, minInvestment: parseFloat(newInvestment.minInvestment), maxInvestment: parseFloat(newInvestment.maxInvestment), roiPercent: parseFloat(newInvestment.roiPercent) }) });
      if (res.ok) { toast({ title: editingInvestment ? 'Updated' : 'Created', description: 'Success.' }); setInvestDialogOpen(false); resetInvestmentForm(); fetchAllData(); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed.' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong.' }); }
    finally { setCreatingInvestment(false); }
  };

  const resetInvestmentForm = () => { setNewInvestment({ title: '', description: '', minInvestment: '', maxInvestment: '', roiPercent: '', duration: '' }); setEditingInvestment(null); };

  const fetchInvestmentDetail = async (invId: string) => {
    setInvestDetailLoading(true);
    setInvestDetailOpen(true);
    try {
      const res = await fetch(`/api/admin/investments/${invId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setInvestDetail(await res.json()); setInvestDetailLoading(false); return; }
    } catch { /* fallback */ }
    const inv = investments.find((x) => x.id === invId);
    setInvestDetail(inv ? { ...inv, investors: [{ name: 'Alice Johnson', amount: 500, expectedReturn: 525, status: 'active', startDate: '2024-03-01', endDate: '2024-04-01' }, { name: 'Bob Smith', amount: 1000, expectedReturn: 1050, status: 'active', startDate: '2024-03-02', endDate: '2024-04-02' }] } : null);
    setInvestDetailLoading(false);
  };

  /* Notifications */
  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setSendingBroadcast(true);
    try {
      const res = await fetch('/api/admin/notifications/broadcast', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage, type: broadcastType, recipient: 'all' }) });
      if (res.ok) { toast({ title: 'Broadcast Sent', description: 'Notification sent to all users.' }); setBroadcastDialogOpen(false); setBroadcastTitle(''); setBroadcastMessage(''); fetchBroadcasts(); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed.' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong.' }); }
    finally { setSendingBroadcast(false); }
  };

  /* ──────── Escrow Actions (preserved) ──────── */

  const handleCreateEscrow = async () => {
    if (!newEscrow.title.trim() || !newEscrow.targetAmount) return;
    setCreatingEscrow(true);
    try {
      const res = await fetch('/api/escrow', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newEscrow, targetAmount: parseFloat(newEscrow.targetAmount), minContribution: parseFloat(newEscrow.minContribution) || undefined, maxContribution: parseFloat(newEscrow.maxContribution) || undefined, feePercentage: parseFloat(newEscrow.feePercentage) || 2.5, milestones: milestones.filter((m) => m.title.trim()).map((m) => ({ title: m.title, description: m.description, percentage: parseFloat(m.percentage) || 0 })) }) });
      if (res.ok) { setCreateEscrowOpen(false); resetNewEscrow(); toast({ title: 'Escrow Created', description: 'Created successfully.' }); fetchEscrows(); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed to create escrow.' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong.' }); }
    finally { setCreatingEscrow(false); }
  };

  const resetNewEscrow = () => { setNewEscrow({ title: '', description: '', type: 'deal_funding', targetAmount: '', minContribution: '', maxContribution: '', feePercentage: '2.5', fundingDeadline: '', releaseDate: '', terms: '' }); setMilestones([]); };
  const addMilestone = () => setMilestones([...milestones, { title: '', description: '', percentage: '' }]);
  const removeMilestone = (i: number) => setMilestones(milestones.filter((_, idx) => idx !== i));
  const updateMilestone = (i: number, field: string, value: string) => { const updated = [...milestones]; updated[i] = { ...updated[i], [field]: value }; setMilestones(updated); };
  const openViewEscrow = (escrow: AdminEscrow) => { setViewEscrow(escrow); setViewEscrowOpen(true); };
  const openConfirm = (type: 'release' | 'refund' | 'cancel' | 'process-expired', escrowId: string, extra?: { milestoneId?: string; disputeId?: string; disputeAction?: string }) => { setConfirmAction({ type, escrowId, ...extra }); setConfirmNotes(''); setConfirmDialogOpen(true); };
  const openResolveDispute = (escrowId: string, disputeId: string, action: string) => { setResolveTarget({ escrowId, disputeId, action }); setResolveResolution(''); setResolveDialogOpen(true); };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirming(true);
    const url = confirmAction.type === 'process-expired' ? '/api/escrow/process-expired' : confirmAction.milestoneId ? `/api/escrow/${confirmAction.escrowId}/milestones/${confirmAction.milestoneId}/release` : `/api/escrow/${confirmAction.escrowId}/${confirmAction.type}`;
    try {
      const body: Record<string, string> = {};
      if (confirmNotes) body.notes = confirmNotes;
      if (confirmAction.disputeId && confirmAction.disputeAction) { body.disputeId = confirmAction.disputeId; body.action = confirmAction.disputeAction; body.resolution = confirmNotes; }
      const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { const label = confirmAction.type === 'release' ? 'Funds Released' : confirmAction.type === 'refund' ? 'Funds Refunded' : confirmAction.type === 'cancel' ? 'Escrow Cancelled' : 'Expired Escrows Processed'; toast({ title: label, description: 'Action completed.' }); setConfirmDialogOpen(false); fetchEscrows(); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Action failed.' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong.' }); }
    finally { setConfirming(false); }
  };

  const handleResolveDispute = async () => {
    if (!resolveTarget || !resolveResolution.trim()) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/escrow/${resolveTarget.escrowId}/disputes/${resolveTarget.disputeId}/resolve`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: resolveTarget.action, resolution: resolveResolution }) });
      if (res.ok) { toast({ title: 'Dispute Resolved', description: 'The dispute has been resolved.' }); setResolveDialogOpen(false); fetchEscrows(); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed to resolve dispute.' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong.' }); }
    finally { setResolving(false); }
  };

  /* ═══════════════════════════════════════════════════════════════
     LOADING SPINNER
     ═══════════════════════════════════════════════════════════════ */

  const Spinner = ({ className = '' }: { className?: string }) => <div className={`flex items-center justify-center py-8 ${className}`}><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  const s = stats || FALLBACK_STATS;

  return (
    <PageWrapper title="Admin Panel" description="Platform management and analytics dashboard.">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap gap-1">
          {[
            { value: 'overview', icon: BarChart3, label: 'Overview' },
            { value: 'users', icon: Users, label: 'Users' },
            { value: 'withdrawals', icon: ArrowLeftRight, label: 'Withdrawals' },
            { value: 'courses', icon: BookOpen, label: 'Courses' },
            { value: 'investments', icon: TrendingUp, label: 'Investments' },
            { value: 'escrow', icon: Lock, label: 'Escrow' },
            { value: 'payments', icon: CreditCard, label: 'Payments' },
            { value: 'notifications', icon: Bell, label: 'Notify' },
            { value: 'settings', icon: Settings, label: 'Settings' },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1">
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══════════════════ OVERVIEW TAB ═══════════════════ */}
        <TabsContent value="overview">
          <motion.div {...TAB_ANIMATION} className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Users" value={s.totalUsers.toLocaleString()} icon={Users} trend={{ value: 12, label: 'vs last month' }} />
              <StatCard title="Active Subscriptions" value={s.activeSubscriptions.toLocaleString()} icon={UserCheck} trend={{ value: 8, label: 'vs last month' }} />
              <StatCard title="Total Revenue" value={formatAmount(s.totalRevenue)} icon={DollarSign} trend={{ value: 15, label: 'vs last month' }} />
              <StatCard title="Pending Withdrawals" value={formatAmount(s.pendingWithdrawals)} icon={ArrowLeftRight} />
              <StatCard title="Total Courses" value={s.totalCourses} icon={BookOpen} />
              <StatCard title="Total Enrollments" value={s.totalEnrollments.toLocaleString()} icon={Activity} />
              <StatCard title="Total Investments" value={formatAmount(s.totalInvestments)} icon={TrendingUp} />
              <StatCard title="Escrow Held" value={formatAmount(s.escrowHeld)} icon={Lock} />
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Revenue</CardTitle><CardDescription>Last 12 months</CardDescription></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={s.monthlyRevenue}>
                      <defs><linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} /><stop offset="95%" stopColor="#D4AF37" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" fontSize={12} tickLine={false} />
                      <YAxis fontSize={12} tickLine={false} tickFormatter={(v: number) => formatAmount(v, true, true)} />
                      <Tooltip formatter={(v: number) => [formatAmount(v), 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fill="url(#goldGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Growth Chart */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">User Growth</CardTitle><CardDescription>Last 12 months</CardDescription></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={s.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" fontSize={12} tickLine={false} />
                      <YAxis fontSize={12} tickLine={false} />
                      <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Users']} />
                      <Bar dataKey="users" fill="#FF8C00" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Subscription Distribution */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Subscriptions</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={s.subscriptionDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                        {s.subscriptionDist.map((_entry: { name: string; value: number }, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    {s.subscriptionDist.map((item: { name: string; value: number }, i: number) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Courses */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Top Courses</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {s.topCourses.map((c: { title: string; enrollments: number }, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm truncate max-w-[140px]">{c.title}</span>
                        <Badge variant="secondary" className="shrink-0">{c.enrollments}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods + Quick Actions */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { label: 'Create Course', icon: BookOpen, onClick: () => { resetCourseForm(); setCourseDialogOpen(true); } },
                      { label: 'Add Investment', icon: TrendingUp, onClick: () => { resetInvestmentForm(); setInvestDialogOpen(true); } },
                      { label: 'Create Escrow', icon: Lock, onClick: () => { resetNewEscrow(); setCreateEscrowOpen(true); } },
                      { label: 'Send Notification', icon: Bell, onClick: () => setBroadcastDialogOpen(true) },
                      { label: 'View Payments', icon: CreditCard, onClick: () => {} },
                    ].map((a, i) => (
                      <Button key={i} variant="outline" className="w-full justify-start gap-2 h-9" onClick={a.onClick}>
                        <a.icon className="h-4 w-4 text-gold" />{a.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>

        {/* ═══════════════════ USERS TAB ═══════════════════ */}
        <TabsContent value="users">
          <motion.div {...TAB_ANIMATION} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="grid grid-cols-3 gap-4">
                <StatCard title="Total Users" value={users.length} icon={Users} />
                <StatCard title="Admins" value={users.filter((u) => u.role === 'admin').length} icon={Shield} />
                <StatCard title="New This Week" value={users.filter((u) => new Date(u.createdAt) > new Date(Date.now() - 7 * 86400000)).length} icon={UserCheck} />
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
            <Card>
              <CardContent className="p-0">
                {loading ? <Spinner /> : (
                  <ScrollArea className="max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden sm:table-cell">Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="hidden md:table-cell">Balance</TableHead>
                          <TableHead className="hidden lg:table-cell">Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">{user.email}</TableCell>
                            <TableCell>
                              <Badge className={user.role === 'admin' ? 'bg-gold/10 text-gold border-gold/20' : 'bg-muted text-muted-foreground'} variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{formatAmount(user.balance)}</TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => fetchUserDetail(user.id)}><Eye className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { setBalanceTarget(user); setBalanceAmount(''); setBalanceReason(''); setBalanceDialogOpen(true); }}><Wallet className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => toggleUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')} disabled={actionLoading === user.id}>
                                  {actionLoading === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
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
        </TabsContent>

        {/* ═══════════════════ WITHDRAWALS TAB ═══════════════════ */}
        <TabsContent value="withdrawals">
          <motion.div {...TAB_ANIMATION} className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'approved', 'rejected', 'completed'].map((f) => (
                <Button key={f} variant={withdrawalFilter === f ? 'default' : 'outline'} size="sm" className={withdrawalFilter === f ? 'bg-gold text-white hover:bg-gold-dark' : ''} onClick={() => setWithdrawalFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <StatCard title="Total Withdrawals" value={withdrawals.length} icon={ArrowLeftRight} />
              <StatCard title="Pending Amount" value={formatAmount(withdrawals.filter((w) => w.status === 'pending').reduce((s, w) => s + w.amount, 0))} icon={Clock} />
              <StatCard title="Total Paid" value={formatAmount(withdrawals.filter((w) => w.status === 'completed' || w.status === 'approved').reduce((s, w) => s + w.amount, 0))} icon={DollarSign} />
            </div>
            <Card>
              <CardContent className="p-0">
                {loading ? <Spinner /> : filteredWithdrawals.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No withdrawal requests.</p> : (
                  <ScrollArea className="max-h-96">
                    <Table>
                      <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead className="hidden sm:table-cell">Wallet</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {filteredWithdrawals.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell><div><p className="font-medium">{w.userName}</p><p className="text-xs text-muted-foreground">{w.userEmail}</p></div></TableCell>
                            <TableCell className="font-medium">{formatAmount(w.amount)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground text-xs font-mono">{w.walletAddress}</TableCell>
                            <TableCell>
                              <Badge className={w.status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : w.status === 'approved' || w.status === 'completed' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'} variant="outline">{w.status}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {w.status === 'pending' && <>
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-500/10" onClick={() => handleWithdrawal(w.id, 'approved')} disabled={actionLoading === w.id}>{actionLoading === w.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}</Button>
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleWithdrawal(w.id, 'rejected')} disabled={actionLoading === w.id}><X className="h-3.5 w-3.5" /></Button>
                                </>}
                                {w.status === 'approved' && (
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10" onClick={() => handleWithdrawal(w.id, 'completed')} disabled={actionLoading === w.id}>
                                    {actionLoading === w.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1" />Complete</>}
                                  </Button>
                                )}
                              </div>
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
        </TabsContent>

        {/* ═══════════════════ COURSES TAB ═══════════════════ */}
        <TabsContent value="courses">
          <motion.div {...TAB_ANIMATION} className="space-y-6">
            {/* ──────── Courses Section ──────── */}
            <div>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-gold" />Courses</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard title="Total Courses" value={courses.length} icon={BookOpen} />
                  <StatCard title="Total Enrollments" value={courses.reduce((s, c) => s + c.enrollmentsCount, 0)} icon={Users} />
                  <StatCard title="Avg Completion" value="67%" icon={Activity} />
                </div>
                <Button className="bg-gold text-white hover:bg-gold-dark" onClick={() => { resetCourseForm(); setCourseDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add Course</Button>
              </div>
              <Card className="mt-4">
                <CardContent className="p-0">
                  <ScrollArea className="max-h-96">
                    <Table>
                      <TableHeader><TableRow><TableHead>Title</TableHead><TableHead className="hidden sm:table-cell">Category</TableHead><TableHead>Difficulty</TableHead><TableHead className="hidden md:table-cell">Enrollments</TableHead><TableHead className="hidden lg:table-cell">Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {courses.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell><div><p className="font-medium">{c.title}</p><p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p></div></TableCell>
                            <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{c.category}</Badge></TableCell>
                            <TableCell><Badge variant="outline" className={c.difficulty === 'beginner' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' : c.difficulty === 'intermediate' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'}>{c.difficulty}</Badge></TableCell>
                            <TableCell className="hidden md:table-cell">{c.enrollmentsCount}</TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => fetchCourseDetail(c.id)}><Eye className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { setEditingCourse(c); setNewCourse({ title: c.title, description: c.description, difficulty: c.difficulty, category: c.category }); setCourseDialogOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300" onClick={() => { setDeleteTarget({ type: 'course', id: c.id, title: c.title }); setDeleteDialogOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* ──────── Skill Categories Section ──────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold flex items-center gap-2"><Filter className="h-4 w-4 text-gold" />Skill Categories</h3>
                <Button size="sm" className="bg-gold text-white hover:bg-gold-dark" onClick={() => openCatDialog()}><Plus className="mr-1.5 h-3.5 w-3.5" />Add Category</Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-72">
                    <Table>
                      <TableHeader><TableRow><TableHead>Icon</TableHead><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Slug</TableHead><TableHead className="hidden md:table-cell">Color</TableHead><TableHead>Courses</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {skillCategories.map((cat) => (
                          <TableRow key={cat.id} className={!cat.isActive ? 'opacity-50' : ''}>
                            <TableCell>
                              <div className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-white" style={{ backgroundColor: cat.color }}>
                                {cat.icon.slice(0, 2).toUpperCase()}
                              </div>
                            </TableCell>
                            <TableCell><div><p className="font-medium text-sm">{cat.name}</p><p className="text-xs text-muted-foreground line-clamp-1 hidden lg:block">{cat.description || '—'}</p></div></TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">{cat.slug}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-1.5">
                                <div className="h-4 w-4 rounded-sm border border-border" style={{ backgroundColor: cat.color }} />
                                <span className="text-xs text-muted-foreground">{cat.color}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs">{cat._count.courses}</Badge></TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cat.isActive ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}>
                                {cat.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleToggleCatActive(cat)} disabled={actionLoading === `toggle-cat-${cat.id}`}>
                                  {actionLoading === `toggle-cat-${cat.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openCatDialog(cat)}><Edit className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 dark:text-red-400 hover:text-red-600" onClick={() => handleDeleteCat(cat)} disabled={actionLoading === `delete-cat-${cat.id}`}>
                                  {actionLoading === `delete-cat-${cat.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {skillCategories.length === 0 && (
                          <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No categories created yet.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>

        {/* ═══════════════════ INVESTMENTS TAB ═══════════════════ */}
        <TabsContent value="investments">
          <motion.div {...TAB_ANIMATION} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="grid grid-cols-4 gap-4">
                <StatCard title="Opportunities" value={investments.length} icon={TrendingUp} />
                <StatCard title="Active" value={investments.filter((inv) => inv.status === 'active').length} icon={Activity} />
                <StatCard title="Total Pool" value={formatAmount(investments.reduce((s, inv) => s + inv.totalPool, 0))} icon={DollarSign} />
                <StatCard title="Investors" value={investments.reduce((s, inv) => s + (inv.investorCount || 0), 0)} icon={Users} />
              </div>
              <Button className="bg-gold text-white hover:bg-gold-dark" onClick={() => { resetInvestmentForm(); setInvestDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add Opportunity</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead className="hidden sm:table-cell">ROI</TableHead><TableHead className="hidden md:table-cell">Duration</TableHead><TableHead className="hidden md:table-cell">Pool</TableHead><TableHead className="hidden lg:table-cell">Investors</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {investments.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell><div><p className="font-medium">{inv.title}</p><p className="text-xs text-muted-foreground">{formatAmount(inv.minInvestment)}-{formatAmount(inv.maxInvestment)}</p></div></TableCell>
                          <TableCell className="hidden sm:table-cell text-gold font-semibold">{inv.roiPercent}%</TableCell>
                          <TableCell className="hidden md:table-cell">{inv.duration}</TableCell>
                          <TableCell className="hidden md:table-cell">{formatAmount(inv.totalPool)}</TableCell>
                          <TableCell className="hidden lg:table-cell">{inv.investorCount || 0}</TableCell>
                          <TableCell><Badge className={inv.status === 'active' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'} variant="outline">{inv.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => fetchInvestmentDetail(inv.id)}><Eye className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { setEditingInvestment(inv); setNewInvestment({ title: inv.title, description: inv.description, minInvestment: String(inv.minInvestment), maxInvestment: String(inv.maxInvestment), roiPercent: String(inv.roiPercent), duration: inv.duration }); setInvestDialogOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ═══════════════════ ESCROW TAB ═══════════════════ */}
        <TabsContent value="escrow">
          <motion.div {...TAB_ANIMATION} className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-6">
              <Button className="bg-gold text-white hover:bg-gold-dark" onClick={() => { resetNewEscrow(); setCreateEscrowOpen(true); }}><Plus className="mr-2 h-4 w-4" />Create Escrow</Button>
              <Button variant="outline" onClick={() => openConfirm('process-expired', 'all')}><RotateCcw className="mr-2 h-4 w-4" />Process Expired</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard title="Total Escrows" value={escrowStats.total} icon={Lock} />
              <StatCard title="Active Escrows" value={escrowStats.active} icon={Shield} />
              <StatCard title="Held in Escrow" value={formatAmount(escrowStats.held)} icon={DollarSign} />
              <StatCard title="Open Disputes" value={escrowStats.disputes} icon={Gavel} />
            </div>
            <Card>
              <CardContent className="p-0">
                {escrowLoading ? <Spinner /> : escrows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center"><Shield className="h-10 w-10 text-muted-foreground mb-3" /><p className="text-sm font-medium text-muted-foreground">No escrows found</p></div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader><TableRow><TableHead>Title</TableHead><TableHead className="hidden sm:table-cell">Type</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Progress</TableHead><TableHead className="hidden lg:table-cell">Collected / Target</TableHead><TableHead className="hidden lg:table-cell">Contributors</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {escrows.map((escrow) => {
                          const progress = escrow.targetAmount > 0 ? (escrow.collectedAmount / escrow.targetAmount) * 100 : 0;
                          return (
                            <TableRow key={escrow.id}>
                              <TableCell className="font-medium max-w-[200px] truncate">{escrow.title}</TableCell>
                              <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="bg-orange/10 text-orange border-orange/20">{ESCROW_TYPE_LABEL[escrow.type]}</Badge></TableCell>
                              <TableCell><Badge className={ESCROW_STATUS_BADGE[escrow.status]} variant="outline">{escrow.status}</Badge></TableCell>
                              <TableCell className="hidden md:table-cell"><div className="flex items-center gap-2 min-w-[120px]"><Progress value={progress} className="h-2 flex-1" /><span className="text-xs text-muted-foreground w-10 text-right">{progress.toFixed(0)}%</span></div></TableCell>
                              <TableCell className="hidden lg:table-cell text-sm"><span className="font-medium">{formatAmount(escrow.collectedAmount)}</span><span className="text-muted-foreground"> / {formatAmount(escrow.targetAmount)}</span></TableCell>
                              <TableCell className="hidden lg:table-cell">{escrow.contributorCount}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openViewEscrow(escrow)}><Eye className="h-3.5 w-3.5" /></Button>
                                  {escrow.status === 'collecting' && <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300" onClick={() => openConfirm('cancel', escrow.id)}><Ban className="h-3.5 w-3.5" /></Button>}
                                  {(escrow.status === 'funded' || escrow.status === 'active') && <>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300" onClick={() => openConfirm('release', escrow.id)}><DollarSign className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300" onClick={() => openConfirm('cancel', escrow.id)}><Ban className="h-3.5 w-3.5" /></Button>
                                  </>}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ═══════════════════ PAYMENTS TAB ═══════════════════ */}
        <TabsContent value="payments">
          <motion.div {...TAB_ANIMATION} className="space-y-6">
            {/* Filter Row */}
            <div className="flex flex-wrap gap-2">
              <Select value={paymentStatusFilter} onValueChange={(v) => { setPaymentStatusFilter(v); setPaymentPage(1); }}>
                <SelectTrigger className="w-[140px]"><Filter className="mr-1 h-3.5 w-3.5" /><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentMethodFilter} onValueChange={(v) => { setPaymentMethodFilter(v); setPaymentPage(1); }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="flutterwave">Flutterwave</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentTypeFilter} onValueChange={(v) => { setPaymentTypeFilter(v); setPaymentPage(1); }}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="wallet_funding">Wallet Funding</SelectItem>
                  <SelectItem value="escrow">Escrow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Payments" value={paymentStats.total} icon={CreditCard} />
              <StatCard title="Completed Revenue" value={formatAmount(paymentStats.completedRevenue)} icon={DollarSign} />
              <StatCard title="Pending Amount" value={formatAmount(paymentStats.pendingAmount)} icon={Clock} />
              <StatCard title="Failed Amount" value={formatAmount(paymentStats.failedAmount)} icon={AlertTriangle} />
            </div>

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead className="hidden sm:table-cell">Type</TableHead><TableHead>Status</TableHead><TableHead className="hidden lg:table-cell">Reference</TableHead><TableHead className="hidden lg:table-cell">Date</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {filteredPayments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.userName}</TableCell>
                          <TableCell className="font-medium">{formatAmount(p.amount)}</TableCell>
                          <TableCell><Badge className={p.method === 'flutterwave' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' : p.method === 'crypto' ? 'bg-orange/10 text-orange border-orange/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'} variant="outline">{p.method}</Badge></TableCell>
                          <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{p.type}</Badge></TableCell>
                          <TableCell><Badge className={p.status === 'completed' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' : p.status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'} variant="outline">{p.status}</Badge></TableCell>
                          <TableCell className="hidden lg:table-cell text-xs font-mono text-muted-foreground">{p.txRef.slice(0, 16)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Showing {Math.min((paymentPage - 1) * PAYMENTS_PER_PAGE + 1, filteredPayments.length)}-{Math.min(paymentPage * PAYMENTS_PER_PAGE, filteredPayments.length)} of {filteredPayments.length}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={paymentPage <= 1} onClick={() => setPaymentPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={paymentPage * PAYMENTS_PER_PAGE >= filteredPayments.length} onClick={() => setPaymentPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ═══════════════════ NOTIFICATIONS TAB ═══════════════════ */}
        <TabsContent value="notifications">
          <motion.div {...TAB_ANIMATION} className="space-y-6">
            <div className="flex justify-end">
              <Button className="bg-gold text-white hover:bg-gold-dark" onClick={() => setBroadcastDialogOpen(true)}><Send className="mr-2 h-4 w-4" />Send Broadcast</Button>
            </div>

            {/* Recent Broadcasts */}
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Broadcasts</CardTitle></CardHeader>
              <CardContent>
                {broadcasts.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No broadcasts sent yet.</p> : (
                  <div className="space-y-3">
                    {broadcasts.map((b) => (
                      <div key={b.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{b.title || 'Untitled'}</p>
                              <Badge className={b.type === 'info' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' : b.type === 'success' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' : b.type === 'warning' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'} variant="outline">{b.type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{b.message}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">{b.recipientCount} recipients</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ═══════════════════ SETTINGS TAB ═══════════════════ */}
        <TabsContent value="settings">
          <motion.div {...TAB_ANIMATION} className="space-y-6">
            {/* Platform Info */}
            <Card>
              <CardHeader><CardTitle className="text-base">Platform Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Platform Name</p>
                    <p className="text-lg font-bold text-gradient-gold">Hustle University</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                    <p className="text-sm">Empowering entrepreneurs through education, investment opportunities, and community.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Plans */}
            <Card>
              <CardHeader><CardTitle className="text-base">Subscription Plans</CardTitle><CardDescription>Manage available subscription tiers</CardDescription></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { name: 'Basic', price: formatAmount(9.99), features: 'Basic courses, Community access', active: true },
                    { name: 'Pro', price: formatAmount(29.99), features: 'All courses, Priority support, Investment access', active: true },
                    { name: 'Premium', price: formatAmount(99.99), features: 'Everything in Pro, 1-on-1 mentoring, Escrow access', active: true },
                  ].map((plan) => (
                    <div key={plan.name} className="rounded-xl border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{plan.name}</p>
                          <p className="text-2xl font-bold text-gold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                        </div>
                        <Badge className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" variant="outline">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.features}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader><CardTitle className="text-base">System Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-green-500" /><span className="text-sm font-medium">Database</span></div>
                    <p className="text-xs text-muted-foreground">SQLite - Connected</p>
                    <p className="text-xs text-muted-foreground">Last backup: 2 hours ago</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-green-500" /><span className="text-sm font-medium">Server</span></div>
                    <p className="text-xs text-muted-foreground">Next.js 15 - Running</p>
                    <p className="text-xs text-muted-foreground">Uptime: 99.9%</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-green-500" /><span className="text-sm font-medium">Payments</span></div>
                    <p className="text-xs text-muted-foreground">Flutterwave + Cryptomus</p>
                    <p className="text-xs text-muted-foreground">All gateways operational</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════
         DIALOGS
         ═══════════════════════════════════════════════════════════════ */}

      {/* ──────── User Detail Dialog ──────── */}
      <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {userDetailLoading ? <Spinner /> : userDetail && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase">Name</p><p className="text-sm font-semibold">{userDetail.name}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase">Email</p><p className="text-sm font-semibold">{userDetail.email}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase">Role</p><p className="text-sm font-semibold">{userDetail.role}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase">Balance</p><p className="text-sm font-semibold text-gold">{formatAmount(userDetail.balance)}</p></div>
                </div>
                {userDetail.transactions && userDetail.transactions.length > 0 && (
                  <><Separator /><div><h4 className="text-sm font-semibold mb-3">Recent Transactions</h4><div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{userDetail.transactions.slice(0, 10).map((t) => <TableRow key={t.id}><TableCell className="text-sm">{t.description}</TableCell><TableCell className="text-sm font-medium">{formatAmount(t.amount)}</TableCell><TableCell><Badge className={t.status === 'completed' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'} variant="outline">{t.status}</Badge></TableCell></TableRow>)}</TableBody></Table></div></div></>
                )}
                {userDetail.coursesEnrolled && userDetail.coursesEnrolled.length > 0 && (
                  <><Separator /><div><h4 className="text-sm font-semibold mb-3">Enrolled Courses</h4><div className="space-y-2">{userDetail.coursesEnrolled.map((c, i) => <div key={i} className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm">{c.title}</span><div className="flex items-center gap-2"><Progress value={c.progress} className="h-2 w-20" /><span className="text-xs text-muted-foreground">{c.progress}%</span></div></div>)}</div></div></>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ──────── Adjust Balance Dialog ──────── */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adjust Balance</DialogTitle><DialogDescription>Adjust wallet balance for {balanceTarget?.name}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Amount (positive = credit, negative = debit)</Label><Input type="number" placeholder="e.g., 50 or -25" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} /></div>
            <div className="space-y-2"><Label>Reason</Label><Textarea placeholder="Reason for adjustment..." value={balanceReason} onChange={(e) => setBalanceReason(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>Cancel</Button>
            <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleAdjustBalance} disabled={adjustingBalance || !balanceAmount}>{adjustingBalance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Adjust</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──────── Course Dialog (Create/Edit) ──────── */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle><DialogDescription>{editingCourse ? 'Update course details.' : 'Add a new course to the platform.'}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input placeholder="Course title" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Course description" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Category</Label><Input placeholder="e.g., Finance" value={newCourse.category} onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })} /></div>
              <div className="space-y-2"><Label>Difficulty</Label><Select value={newCourse.difficulty} onValueChange={(v) => setNewCourse({ ...newCourse, difficulty: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCourseDialogOpen(false); resetCourseForm(); }}>Cancel</Button>
            <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleSaveCourse} disabled={creatingCourse || !newCourse.title.trim()}>{creatingCourse && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingCourse ? 'Update' : 'Create'} Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──────── Course Detail Dialog ──────── */}
      <Dialog open={courseDetailOpen} onOpenChange={setCourseDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader><DialogTitle>{courseDetail?.title}</DialogTitle><DialogDescription>{courseDetail?.description}</DialogDescription></DialogHeader>
          {courseDetailLoading ? <Spinner /> : courseDetail && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase">Category</p><p className="text-sm font-semibold">{courseDetail.category}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase">Difficulty</p><p className="text-sm font-semibold">{courseDetail.difficulty}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase">Enrollments</p><p className="text-sm font-semibold">{courseDetail.enrollmentsCount}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase">Lessons</p><p className="text-sm font-semibold">{courseDetail.lessonsCount || 0}</p></div>
                </div>
                {courseDetail.lessons && courseDetail.lessons.length > 0 && (
                  <><Separator /><div><h4 className="text-sm font-semibold mb-3">Lessons</h4><div className="space-y-2">{courseDetail.lessons.map((l) => <div key={l.id} className="flex items-center gap-3 rounded-lg border p-3"><ChevronRight className="h-4 w-4 text-gold shrink-0" /><span className="text-sm">{l.title}</span></div>)}</div></div></>
                )}
                {courseDetail.enrolledUsers && courseDetail.enrolledUsers.length > 0 && (
                  <><Separator /><div><h4 className="text-sm font-semibold mb-3">Enrolled Users</h4><div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Progress</TableHead></TableRow></TableHeader><TableBody>{courseDetail.enrolledUsers.map((u, i) => <TableRow key={i}><TableCell className="text-sm">{u.name}</TableCell><TableCell><div className="flex items-center gap-2"><Progress value={u.progress} className="h-2 w-20" /><span className="text-xs">{u.progress}%</span></div></TableCell></TableRow>)}</TableBody></Table></div></div></>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ──────── Skill Category Dialog ──────── */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Edit Category' : 'Create Category'}</DialogTitle>
            <DialogDescription>{editingCat ? 'Update the skill category details.' : 'Add a new skill category for organizing courses.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Finance" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input placeholder="auto-generated-from-name" value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of the category..." value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Icon</Label>
                <Input placeholder="BookOpen" value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} />
                <p className="text-[10px] text-muted-foreground">Lucide icon name</p>
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <Input placeholder="#D4AF37" value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })} />
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: catForm.color }} />
                  <span className="text-[10px] text-muted-foreground">Preview</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Order</Label>
                <Input type="number" placeholder="0" value={catForm.order} onChange={(e) => setCatForm({ ...catForm, order: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleSaveCat} disabled={catSaving || !catForm.name.trim()}>
              {catSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : editingCat ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──────── Delete Confirmation Dialog ──────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete {deleteTarget?.type}</DialogTitle><DialogDescription>Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}>Cancel</Button>
            <Button className="bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700" onClick={handleDeleteCourse} disabled={deleting}>{deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──────── Investment Dialog (Create/Edit) ──────── */}
      <Dialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingInvestment ? 'Edit Opportunity' : 'Create Investment Opportunity'}</DialogTitle><DialogDescription>{editingInvestment ? 'Update investment details.' : 'Add a new investment opportunity.'}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input placeholder="Investment title" value={newInvestment.title} onChange={(e) => setNewInvestment({ ...newInvestment, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Brief description" value={newInvestment.description} onChange={(e) => setNewInvestment({ ...newInvestment, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Min Investment ($)</Label><Input type="number" placeholder="10" value={newInvestment.minInvestment} onChange={(e) => setNewInvestment({ ...newInvestment, minInvestment: e.target.value })} /></div>
              <div className="space-y-2"><Label>Max Investment ($)</Label><Input type="number" placeholder="10000" value={newInvestment.maxInvestment} onChange={(e) => setNewInvestment({ ...newInvestment, maxInvestment: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>ROI (%)</Label><Input type="number" placeholder="5" value={newInvestment.roiPercent} onChange={(e) => setNewInvestment({ ...newInvestment, roiPercent: e.target.value })} /></div>
              <div className="space-y-2"><Label>Duration</Label><Input placeholder="30 days" value={newInvestment.duration} onChange={(e) => setNewInvestment({ ...newInvestment, duration: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setInvestDialogOpen(false); resetInvestmentForm(); }}>Cancel</Button>
            <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleSaveInvestment} disabled={creatingInvestment || !newInvestment.title.trim()}>{creatingInvestment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingInvestment ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──────── Investment Detail Dialog (View Investors) ──────── */}
      <Dialog open={investDetailOpen} onOpenChange={setInvestDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader><DialogTitle>{investDetail?.title}</DialogTitle><DialogDescription>Investors in this opportunity</DialogDescription></DialogHeader>
          {investDetailLoading ? <Spinner /> : investDetail && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase">ROI</p><p className="text-sm font-semibold text-gold">{investDetail.roiPercent}%</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase">Duration</p><p className="text-sm font-semibold">{investDetail.duration}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase">Pool Size</p><p className="text-sm font-semibold">{formatAmount(investDetail.totalPool)}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase">Status</p><p className="text-sm font-semibold">{investDetail.status}</p></div>
                </div>
                {investDetail.investors && investDetail.investors.length > 0 ? (
                  <><Separator /><div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>Investor</TableHead><TableHead>Amount</TableHead><TableHead>Expected Return</TableHead><TableHead>Status</TableHead><TableHead className="hidden sm:table-cell">Start</TableHead><TableHead className="hidden sm:table-cell">End</TableHead></TableRow></TableHeader><TableBody>{investDetail.investors.map((inv, i) => <TableRow key={i}><TableCell className="font-medium">{inv.name}</TableCell><TableCell>{formatAmount(inv.amount)}</TableCell><TableCell className="text-gold font-medium">{formatAmount(inv.expectedReturn)}</TableCell><TableCell><Badge className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" variant="outline">{inv.status}</Badge></TableCell><TableCell className="hidden sm:table-cell text-muted-foreground">{new Date(inv.startDate).toLocaleDateString()}</TableCell><TableCell className="hidden sm:table-cell text-muted-foreground">{inv.endDate ? new Date(inv.endDate).toLocaleDateString() : '-'}</TableCell></TableRow>)}</TableBody></Table></div></>
                ) : <p className="py-4 text-center text-sm text-muted-foreground">No investors yet.</p>}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ──────── Broadcast Dialog ──────── */}
      <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Send Broadcast</DialogTitle><DialogDescription>Send a notification to users.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input placeholder="Notification title" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Message <span className="text-destructive">*</span></Label><Textarea placeholder="Write your message..." value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} rows={4} /></div>
            <div className="space-y-2"><Label>Type</Label><Select value={broadcastType} onValueChange={setBroadcastType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="info">Info</SelectItem><SelectItem value="success">Success</SelectItem><SelectItem value="warning">Warning</SelectItem><SelectItem value="error">Error</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Recipient</Label><div className="flex gap-3"><label className="flex items-center gap-2 text-sm"><input type="radio" name="recipient" defaultChecked className="accent-gold" /><span>All Users ({users.length})</span></label></div></div>
            {broadcastMessage.trim() && (
              <div className="rounded-lg border p-4 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preview</p>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm font-medium">{broadcastTitle || 'Notification'}</p>
                  <p className="text-sm text-muted-foreground">{broadcastMessage}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBroadcastDialogOpen(false); setBroadcastTitle(''); setBroadcastMessage(''); }}>Cancel</Button>
            <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleSendBroadcast} disabled={sendingBroadcast || !broadcastMessage.trim()}>{sendingBroadcast && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send Broadcast</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──────── Create Escrow Dialog ──────── */}
      <Dialog open={createEscrowOpen} onOpenChange={setCreateEscrowOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Escrow</DialogTitle><DialogDescription>Set up a new escrow with funding parameters and optional milestones.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title <span className="text-destructive">*</span></Label><Input placeholder="Escrow title" value={newEscrow.title} onChange={(e) => setNewEscrow({ ...newEscrow, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Brief description..." value={newEscrow.description} onChange={(e) => setNewEscrow({ ...newEscrow, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Type</Label><Select value={newEscrow.type} onValueChange={(v) => setNewEscrow({ ...newEscrow, type: v as EscrowType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="deal_funding">Deal Funding</SelectItem><SelectItem value="investment_deal">Investment Deal</SelectItem><SelectItem value="service_payment">Service Payment</SelectItem><SelectItem value="milestone">Milestone</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Target Amount ($) <span className="text-destructive">*</span></Label><Input type="number" placeholder="10000" value={newEscrow.targetAmount} onChange={(e) => setNewEscrow({ ...newEscrow, targetAmount: e.target.value })} /></div>
              <div className="space-y-2"><Label>Fee (%)</Label><Input type="number" placeholder="2.5" value={newEscrow.feePercentage} onChange={(e) => setNewEscrow({ ...newEscrow, feePercentage: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Min Contribution ($)</Label><Input type="number" placeholder="10" value={newEscrow.minContribution} onChange={(e) => setNewEscrow({ ...newEscrow, minContribution: e.target.value })} /></div>
              <div className="space-y-2"><Label>Max Contribution ($)</Label><Input type="number" placeholder="10000" value={newEscrow.maxContribution} onChange={(e) => setNewEscrow({ ...newEscrow, maxContribution: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Funding Deadline <span className="text-destructive">*</span></Label><Input type="date" value={newEscrow.fundingDeadline} onChange={(e) => setNewEscrow({ ...newEscrow, fundingDeadline: e.target.value })} /></div>
              <div className="space-y-2"><Label>Release Date (optional)</Label><Input type="date" value={newEscrow.releaseDate} onChange={(e) => setNewEscrow({ ...newEscrow, releaseDate: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Terms</Label><Textarea placeholder="Escrow terms and conditions..." value={newEscrow.terms} onChange={(e) => setNewEscrow({ ...newEscrow, terms: e.target.value })} rows={2} /></div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label className="text-sm font-semibold">Milestones</Label><Button variant="outline" size="sm" className="h-7 text-xs" onClick={addMilestone}><Plus className="mr-1 h-3 w-3" />Add Milestone</Button></div>
              {milestones.length > 0 && (
                <div className="space-y-2">
                  {milestones.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-start justify-between"><span className="text-xs font-medium text-muted-foreground">Milestone {i + 1}</span><Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300" onClick={() => removeMilestone(i)}><X className="h-3.5 w-3.5" /></Button></div>
                      <div className="grid grid-cols-3 gap-2"><div className="col-span-2 space-y-1"><Input placeholder="Title" value={m.title} onChange={(e) => updateMilestone(i, 'title', e.target.value)} className="h-8 text-xs" /></div><div className="space-y-1"><Input type="number" placeholder="%" value={m.percentage} onChange={(e) => updateMilestone(i, 'percentage', e.target.value)} className="h-8 text-xs" /></div></div>
                      <Input placeholder="Description (optional)" value={m.description} onChange={(e) => updateMilestone(i, 'description', e.target.value)} className="h-8 text-xs" />
                    </motion.div>
                  ))}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total: {milestoneTotal}%</span>
                    {milestoneTotal > 0 && milestoneTotal !== 100 && <span className={milestoneTotal > 100 ? 'text-red-500 dark:text-red-400 font-medium' : 'text-amber-600 dark:text-amber-400'}>{milestoneTotal > 100 ? 'Exceeds 100%' : 'Must equal 100%'}</span>}
                    {milestoneTotal === 100 && <span className="text-green-600 dark:text-green-400 font-medium">Valid</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateEscrowOpen(false)}>Cancel</Button>
            <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleCreateEscrow} disabled={creatingEscrow || !newEscrow.title.trim() || !newEscrow.targetAmount}>{creatingEscrow && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{creatingEscrow ? 'Creating...' : 'Create Escrow'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──────── View Escrow Detail Dialog ──────── */}
      <Dialog open={viewEscrowOpen} onOpenChange={setViewEscrowOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{viewEscrow?.title}<Badge className={viewEscrow ? ESCROW_STATUS_BADGE[viewEscrow.status] : ''} variant="outline">{viewEscrow?.status}</Badge></DialogTitle>
            <DialogDescription>{viewEscrow?.description}</DialogDescription>
          </DialogHeader>
          {viewEscrow && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</p><p className="text-sm font-semibold">{ESCROW_TYPE_LABEL[viewEscrow.type]}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Progress</p><p className="text-sm font-semibold text-gold">{viewEscrow.targetAmount > 0 ? ((viewEscrow.collectedAmount / viewEscrow.targetAmount) * 100).toFixed(1) : 0}%</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Collected</p><p className="text-sm font-semibold">{formatAmount(viewEscrow.collectedAmount)}</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contributors</p><p className="text-sm font-semibold">{viewEscrow.contributorCount}</p></div>
                </div>
                {viewEscrow.terms && <><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Terms</p><p className="text-sm">{viewEscrow.terms}</p></>}
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-gold" />Contributions ({viewEscrow.contributions.length})</h4>
                  {viewEscrow.contributions.length > 0 ? (
                    <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead></TableRow></TableHeader><TableBody>{viewEscrow.contributions.map((c) => <TableRow key={c.id}><TableCell className="font-medium">{c.userName}</TableCell><TableCell>{formatAmount(c.amount)}</TableCell><TableCell><Badge className={ESCROW_STATUS_BADGE[c.status as EscrowStatus] || 'bg-muted text-muted-foreground'} variant="outline">{c.status}</Badge></TableCell><TableCell className="hidden sm:table-cell text-muted-foreground">{new Date(c.date).toLocaleDateString()}</TableCell></TableRow>)}</TableBody></Table></div>
                  ) : <p className="text-sm text-muted-foreground">No contributions yet.</p>}
                </div>
                {viewEscrow.milestones.length > 0 && (
                  <><Separator /><div><h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><ChevronRight className="h-4 w-4 text-orange" />Milestones ({viewEscrow.milestones.length})</h4><div className="space-y-2">{viewEscrow.milestones.map((ms) => (
                    <div key={ms.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-medium">{ms.title}</p><Badge className={MILESTONE_STATUS_BADGE[ms.status] || 'bg-muted text-muted-foreground'} variant="outline">{ms.status}</Badge></div>{ms.description && <p className="text-xs text-muted-foreground mt-0.5">{ms.description}</p>}</div>
                      <div className="flex items-center gap-3 ml-3"><span className="text-sm font-semibold text-gold">{ms.percentage}%</span>{ms.status === 'held' && <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-500/10" onClick={() => openConfirm('release', viewEscrow.id, { milestoneId: ms.id })}>Release</Button>}</div>
                    </div>
                  ))}</div></div></>
                )}
                {viewEscrow.disputes.length > 0 && (
                  <><Separator /><div><h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />Disputes ({viewEscrow.disputes.length})</h4><div className="space-y-3">{viewEscrow.disputes.map((d) => (
                    <div key={d.id} className="rounded-lg border border-red/20 bg-red-50/50 dark:bg-red-500/10 p-3">
                      <div className="flex items-start justify-between gap-2 mb-2"><div><p className="text-sm font-medium">{d.userName}</p><p className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString()}</p></div><Badge className={DISPUTE_ADMIN_STATUS_BADGE[d.status] || 'bg-muted text-muted-foreground'} variant="outline">{d.status}</Badge></div>
                      <p className="text-sm">{d.reason}</p>{d.evidence && <p className="text-xs text-muted-foreground mt-1">Evidence: {d.evidence}</p>}
                      {d.resolution && <div className="mt-2 rounded bg-green-100 dark:bg-green-500/10 p-2 text-xs text-green-800 dark:text-green-300">{d.resolution}</div>}
                      {(d.status === 'open' || d.status === 'reviewing') && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openResolveDispute(viewEscrow.id, d.id, 'dismiss')}><X className="mr-1 h-3 w-3" />Dismiss</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-orange hover:bg-orange/10" onClick={() => openResolveDispute(viewEscrow.id, d.id, 'refund_all')}><RotateCcw className="mr-1 h-3 w-3" />Refund All</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10" onClick={() => openResolveDispute(viewEscrow.id, d.id, 'release_all')}><Check className="mr-1 h-3 w-3" />Release All</Button>
                        </div>
                      )}
                    </div>
                  ))}</div></div></>
                )}
                {(viewEscrow.status === 'funded' || viewEscrow.status === 'active') && <><Separator /><div className="flex flex-wrap gap-2"><Button variant="outline" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-500/10" onClick={() => openConfirm('release', viewEscrow.id)}><DollarSign className="mr-2 h-4 w-4" />Release All Funds</Button><Button variant="outline" className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => openConfirm('refund', viewEscrow.id)}><RotateCcw className="mr-2 h-4 w-4" />Refund All</Button><Button variant="outline" className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => openConfirm('cancel', viewEscrow.id)}><Ban className="mr-2 h-4 w-4" />Cancel Escrow</Button></div></>}
                {viewEscrow.status === 'collecting' && <><Separator /><div className="flex flex-wrap gap-2"><Button variant="outline" className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => openConfirm('cancel', viewEscrow.id)}><Ban className="mr-2 h-4 w-4" />Cancel Escrow</Button></div></>}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ──────── Confirmation Dialog ──────── */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{confirmAction?.type === 'release' ? 'Release Funds' : confirmAction?.type === 'refund' ? 'Refund All Funds' : confirmAction?.type === 'cancel' ? 'Cancel Escrow' : 'Process Expired'}</DialogTitle>
            <DialogDescription>{confirmAction?.type === 'release' && 'This will release all held funds. This action cannot be undone.'}{confirmAction?.type === 'refund' && 'This will refund all contributions. This action cannot be undone.'}{confirmAction?.type === 'cancel' && 'This will cancel and refund all contributors.'}{confirmAction?.type === 'process-expired' && 'This will process all expired escrows.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2"><Label>{confirmAction?.type === 'cancel' ? 'Reason' : 'Notes'} (optional)</Label><Textarea placeholder={confirmAction?.type === 'cancel' ? 'Reason for cancellation...' : 'Additional notes...'} value={confirmNotes} onChange={(e) => setConfirmNotes(e.target.value)} rows={2} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button className={confirmAction?.type === 'release' ? 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800' : confirmAction?.type === 'refund' ? 'bg-orange text-white hover:bg-orange-dark' : 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700'} onClick={handleConfirmAction} disabled={confirming}>{confirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{confirming ? 'Processing...' : 'Confirm'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──────── Resolve Dispute Dialog ──────── */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{resolveTarget?.action === 'dismiss' ? 'Dismiss Dispute' : resolveTarget?.action === 'refund_all' ? 'Refund All & Dismiss' : 'Release All & Dismiss'}</DialogTitle>
            <DialogDescription>{resolveTarget?.action === 'dismiss' && 'Dismiss without changes.'}{resolveTarget?.action === 'refund_all' && 'Refund all contributions.'}{resolveTarget?.action === 'release_all' && 'Release all held funds.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2"><Label>Resolution <span className="text-destructive">*</span></Label><Textarea placeholder="Describe the resolution..." value={resolveResolution} onChange={(e) => setResolveResolution(e.target.value)} rows={2} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
            <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleResolveDispute} disabled={resolving || !resolveResolution.trim()}>{resolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{resolving ? 'Resolving...' : 'Confirm Resolution'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
