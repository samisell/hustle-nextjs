'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  ArrowLeftRight,
  BookOpen,
  TrendingUp,
  Check,
  X,
  Loader2,
  Plus,
  Lock,
  Gavel,
  Ban,
  RotateCcw,
  ChevronRight,
  DollarSign,
  AlertTriangle,
  Eye,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import PageWrapper from '@/components/shared/PageWrapper';
import StatCard from '@/components/shared/StatCard';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/hooks/use-toast';

/* ─────────────── Existing Admin Types ─────────────── */

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  referralCode: string;
  createdAt: string;
  balance: number;
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  walletAddress: string;
  status: string;
  createdAt: string;
}

interface AdminCourse {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  enrollmentsCount: number;
  createdAt: string;
}

/* ─────────────── Escrow Admin Types ─────────────── */

type EscrowStatus = 'collecting' | 'funded' | 'active' | 'disputed' | 'released' | 'refunded' | 'expired' | 'cancelled';
type EscrowType = 'deal_funding' | 'investment_deal' | 'service_payment' | 'milestone';

interface Milestone {
  id: string;
  title: string;
  description: string;
  percentage: number;
  status: string;
}

interface EscrowContribution {
  id: string;
  userName: string;
  amount: number;
  status: string;
  date: string;
}

interface EscrowDisputeAdmin {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  evidence: string;
  status: string;
  resolution: string | null;
  date: string;
}

interface AdminEscrow {
  id: string;
  title: string;
  description: string;
  type: EscrowType;
  status: EscrowStatus;
  targetAmount: number;
  collectedAmount: number;
  minContribution: number;
  maxContribution: number;
  feePercentage: number;
  fundingDeadline: string;
  releaseDate: string | null;
  terms: string;
  contributorCount: number;
  milestones: Milestone[];
  contributions: EscrowContribution[];
  disputes: EscrowDisputeAdmin[];
  createdAt: string;
}

/* ─────────────── Escrow Badge Helpers ─────────────── */

const ESCROW_STATUS_BADGE: Record<EscrowStatus, string> = {
  collecting: 'bg-amber-100 text-amber-700 border-amber-200',
  funded: 'bg-green-100 text-green-700 border-green-200',
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  disputed: 'bg-red-100 text-red-700 border-red-200',
  released: 'bg-green-100 text-green-700 border-green-200',
  refunded: 'bg-gray-100 text-gray-600 border-gray-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

const ESCROW_TYPE_LABEL: Record<EscrowType, string> = {
  deal_funding: 'Deal Funding',
  investment_deal: 'Investment Deal',
  service_payment: 'Service Payment',
  milestone: 'Milestone',
};

const MILESTONE_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  released: 'bg-green-100 text-green-700 border-green-200',
  held: 'bg-amber-100 text-amber-700 border-amber-200',
};

const DISPUTE_ADMIN_STATUS_BADGE: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700 border-amber-200',
  reviewing: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  dismissed: 'bg-gray-100 text-gray-600 border-gray-200',
};

/* ─────────────── Fallback Data ─────────────── */

const FALLBACK_ADMIN_ESCROWS: AdminEscrow[] = [
  {
    id: 'e1', title: 'E-Commerce Platform Launch', description: 'Funding for the initial development and marketing of a new e-commerce platform targeting the African market.',
    type: 'deal_funding', status: 'collecting', targetAmount: 50000, collectedAmount: 32000,
    minContribution: 50, maxContribution: 10000, feePercentage: 2.5,
    fundingDeadline: new Date(Date.now() + 15 * 86400000).toISOString(),
    releaseDate: null, terms: 'Funds released upon platform launch confirmation.', contributorCount: 42,
    milestones: [], contributions: [
      { id: 'c1', userName: 'Alice Johnson', amount: 500, status: 'active', date: '2024-03-05' },
      { id: 'c2', userName: 'Bob Smith', amount: 1000, status: 'active', date: '2024-03-03' },
      { id: 'c3', userName: 'Carol White', amount: 250, status: 'active', date: '2024-03-01' },
    ], disputes: [], createdAt: '2024-03-01',
  },
  {
    id: 'e2', title: 'Real Estate Investment Pool', description: 'Pool of investors contributing to a commercial real estate acquisition.',
    type: 'investment_deal', status: 'funded', targetAmount: 200000, collectedAmount: 200000,
    minContribution: 100, maxContribution: 50000, feePercentage: 1.5,
    fundingDeadline: '2024-03-20T00:00:00Z', releaseDate: '2024-05-01T00:00:00Z',
    terms: 'Funds held until property acquisition is verified.', contributorCount: 28,
    milestones: [], contributions: [
      { id: 'c4', userName: 'Alice Johnson', amount: 5000, status: 'held', date: '2024-02-20' },
      { id: 'c5', userName: 'Dave Brown', amount: 10000, status: 'held', date: '2024-02-18' },
    ], disputes: [], createdAt: '2024-02-15',
  },
  {
    id: 'e3', title: 'Mobile App Milestone 2', description: 'Second milestone payment for mobile app development.',
    type: 'milestone', status: 'active', targetAmount: 15000, collectedAmount: 15000,
    minContribution: 500, maxContribution: 15000, feePercentage: 2,
    fundingDeadline: '2024-03-10T00:00:00Z', releaseDate: '2024-05-01T00:00:00Z',
    terms: 'Released upon completion of milestone 2.', contributorCount: 3,
    milestones: [
      { id: 'm1', title: 'UI Design', description: 'Complete UI implementation', percentage: 40, status: 'released' },
      { id: 'm2', title: 'Backend Integration', description: 'API integration and testing', percentage: 60, status: 'held' },
    ],
    contributions: [
      { id: 'c6', userName: 'Alice Johnson', amount: 5000, status: 'held', date: '2024-02-25' },
    ],
    disputes: [], createdAt: '2024-02-20',
  },
  {
    id: 'e4', title: 'Agricultural Supply Chain', description: 'Investment in an agricultural supply chain optimization project.',
    type: 'investment_deal', status: 'disputed', targetAmount: 80000, collectedAmount: 65000,
    minContribution: 200, maxContribution: 20000, feePercentage: 2,
    fundingDeadline: '2024-04-01T00:00:00Z', releaseDate: null,
    terms: 'Funds released upon delivery verification.', contributorCount: 15,
    milestones: [],
    contributions: [
      { id: 'c7', userName: 'Alice Johnson', amount: 1000, status: 'disputed', date: '2024-02-10' },
      { id: 'c8', userName: 'Bob Smith', amount: 2000, status: 'disputed', date: '2024-02-12' },
    ],
    disputes: [
      { id: 'd1', userId: 'u1', userName: 'Alice Johnson', reason: 'Project deliverables not meeting agreed specifications.', evidence: 'Screenshots attached.', status: 'reviewing', resolution: null, date: '2024-03-10' },
    ],
    createdAt: '2024-01-25',
  },
  {
    id: 'e5', title: 'Brand Identity Design', description: 'Payment for professional brand identity design services.',
    type: 'service_payment', status: 'released', targetAmount: 3000, collectedAmount: 3000,
    minContribution: 500, maxContribution: 3000, feePercentage: 3,
    fundingDeadline: '2024-02-15T00:00:00Z', releaseDate: '2024-03-15T00:00:00Z',
    terms: 'Released upon final delivery.', contributorCount: 1,
    milestones: [], contributions: [
      { id: 'c9', userName: 'Carol White', amount: 3000, status: 'released', date: '2024-01-20' },
    ], disputes: [], createdAt: '2024-01-20',
  },
];

/* ─────────────── Component ─────────────── */

export default function AdminPage() {
  const token = useAuthStore((s) => s.token);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* Course creation */
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    category: '',
  });
  const [creatingCourse, setCreatingCourse] = useState(false);

  /* Investment creation */
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    title: '',
    description: '',
    minInvestment: '',
    maxInvestment: '',
    roiPercent: '',
    duration: '',
  });
  const [creatingInvestment, setCreatingInvestment] = useState(false);

  /* ──────── Escrow Admin State ──────── */
  const [escrows, setEscrows] = useState<AdminEscrow[]>([]);
  const [escrowLoading, setEscrowLoading] = useState(true);

  /* Create Escrow Dialog */
  const [createEscrowOpen, setCreateEscrowOpen] = useState(false);
  const [newEscrow, setNewEscrow] = useState({
    title: '',
    description: '',
    type: 'deal_funding' as EscrowType,
    targetAmount: '',
    minContribution: '',
    maxContribution: '',
    feePercentage: '2.5',
    fundingDeadline: '',
    releaseDate: '',
    terms: '',
  });
  const [milestones, setMilestones] = useState<{ title: string; description: string; percentage: string }[]>([]);
  const [creatingEscrow, setCreatingEscrow] = useState(false);

  /* View Escrow Detail Dialog */
  const [viewEscrowOpen, setViewEscrowOpen] = useState(false);
  const [viewEscrow, setViewEscrow] = useState<AdminEscrow | null>(null);

  /* Confirmation Dialog */
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'release' | 'refund' | 'cancel' | 'process-expired';
    escrowId: string;
    milestoneId?: string;
    disputeId?: string;
    disputeAction?: string;
  } | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirming, setConfirming] = useState(false);

  /* Resolve Dispute Dialog */
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<{ escrowId: string; disputeId: string; action: string } | null>(null);
  const [resolveResolution, setResolveResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  /* ─── Fetch ─── */
  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setWithdrawals(data.withdrawals || []);
        setCourses(data.courses || []);
      }
    } catch {
      setUsers([
        { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'user', referralCode: 'ALICE01', createdAt: '2024-01-15', balance: 250 },
        { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'user', referralCode: 'BOB02', createdAt: '2024-02-20', balance: 120 },
        { id: '3', name: 'Carol White', email: 'carol@example.com', role: 'admin', referralCode: 'CAROL03', createdAt: '2024-01-10', balance: 5000 },
      ]);
      setWithdrawals([
        { id: '1', userId: '1', userName: 'Alice Johnson', userEmail: 'alice@example.com', amount: 50, walletAddress: '0xabc123...', status: 'pending', createdAt: '2024-03-15' },
        { id: '2', userId: '2', userName: 'Bob Smith', userEmail: 'bob@example.com', amount: 100, walletAddress: '0xdef456...', status: 'pending', createdAt: '2024-03-14' },
      ]);
      setCourses([
        { id: '1', title: 'Financial Literacy 101', description: 'Basics of personal finance', difficulty: 'beginner', category: 'Finance', enrollmentsCount: 45, createdAt: '2024-01-01' },
        { id: '2', title: 'Investment Fundamentals', description: 'Learn investing basics', difficulty: 'intermediate', category: 'Investing', enrollmentsCount: 28, createdAt: '2024-01-15' },
      ]);
    } finally {
      setLoading(false);
    }
    fetchEscrows();
  };

  const fetchEscrows = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/escrow', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEscrows(data.escrows || []);
        return;
      }
    } catch {
      // fallback
    }
    setEscrows(FALLBACK_ADMIN_ESCROWS);
    setEscrowLoading(false);
  };

  /* ─── Existing Admin Actions ─── */
  const toggleUserRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch { /* silent */ } finally { setActionLoading(null); }
  };

  const handleWithdrawal = async (id: string, action: 'approved' | 'rejected') => {
    setActionLoading(id);
    try {
      await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: id, action }),
      });
      setWithdrawals((prev) => prev.map((w) => (w.id === id ? { ...w, status: action } : w)));
    } catch { /* silent */ } finally { setActionLoading(null); }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) return;
    setCreatingCourse(true);
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse),
      });
      if (res.ok) {
        setCourseDialogOpen(false);
        setNewCourse({ title: '', description: '', difficulty: 'beginner', category: '' });
        fetchAdminData();
      }
    } catch { /* silent */ } finally { setCreatingCourse(false); }
  };

  const handleCreateInvestment = async () => {
    if (!newInvestment.title.trim()) return;
    setCreatingInvestment(true);
    try {
      const res = await fetch('/api/admin/investments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInvestment,
          minInvestment: parseFloat(newInvestment.minInvestment),
          maxInvestment: parseFloat(newInvestment.maxInvestment),
          roiPercent: parseFloat(newInvestment.roiPercent),
        }),
      });
      if (res.ok) {
        setInvestDialogOpen(false);
        setNewInvestment({ title: '', description: '', minInvestment: '', maxInvestment: '', roiPercent: '', duration: '' });
      }
    } catch { /* silent */ } finally { setCreatingInvestment(false); }
  };

  /* ─── Escrow Admin Actions ─── */
  const handleCreateEscrow = async () => {
    if (!newEscrow.title.trim() || !newEscrow.targetAmount) return;
    setCreatingEscrow(true);
    try {
      const res = await fetch('/api/escrow', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEscrow,
          targetAmount: parseFloat(newEscrow.targetAmount),
          minContribution: parseFloat(newEscrow.minContribution) || undefined,
          maxContribution: parseFloat(newEscrow.maxContribution) || undefined,
          feePercentage: parseFloat(newEscrow.feePercentage) || 2.5,
          milestones: milestones.filter((m) => m.title.trim()).map((m) => ({
            title: m.title,
            description: m.description,
            percentage: parseFloat(m.percentage) || 0,
          })),
        }),
      });
      if (res.ok) {
        setCreateEscrowOpen(false);
        resetNewEscrow();
        toast({ title: 'Escrow Created', description: 'The new escrow has been created successfully.' });
        fetchEscrows();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to create escrow.' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.' });
    } finally {
      setCreatingEscrow(false);
    }
  };

  const resetNewEscrow = () => {
    setNewEscrow({
      title: '', description: '', type: 'deal_funding', targetAmount: '',
      minContribution: '', maxContribution: '', feePercentage: '2.5',
      fundingDeadline: '', releaseDate: '', terms: '',
    });
    setMilestones([]);
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', percentage: '' }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const milestoneTotal = useMemo(() => {
    return milestones.reduce((sum, m) => sum + (parseFloat(m.percentage) || 0), 0);
  }, [milestones]);

  const openViewEscrow = (escrow: AdminEscrow) => {
    setViewEscrow(escrow);
    setViewEscrowOpen(true);
  };

  const openConfirm = (type: 'release' | 'refund' | 'cancel' | 'process-expired', escrowId: string, extra?: { milestoneId?: string; disputeId?: string; disputeAction?: string }) => {
    setConfirmAction({ type, escrowId, ...extra });
    setConfirmNotes('');
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirming(true);

    const url = confirmAction.type === 'process-expired'
      ? '/api/escrow/process-expired'
      : confirmAction.milestoneId
      ? `/api/escrow/${confirmAction.escrowId}/milestones/${confirmAction.milestoneId}/release`
      : `/api/escrow/${confirmAction.escrowId}/${confirmAction.type}`;

    try {
      const body: Record<string, string> = {};
      if (confirmNotes) body.notes = confirmNotes;
      if (confirmAction.disputeId && confirmAction.disputeAction) {
        body.disputeId = confirmAction.disputeId;
        body.action = confirmAction.disputeAction;
        body.resolution = confirmNotes;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const label = confirmAction.type === 'release' ? 'Funds Released'
          : confirmAction.type === 'refund' ? 'Funds Refunded'
          : confirmAction.type === 'cancel' ? 'Escrow Cancelled'
          : 'Expired Escrows Processed';
        toast({ title: label, description: 'Action completed successfully.' });
        setConfirmDialogOpen(false);
        fetchEscrows();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Action failed.' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.' });
    } finally {
      setConfirming(false);
    }
  };

  const openResolveDispute = (escrowId: string, disputeId: string, action: string) => {
    setResolveTarget({ escrowId, disputeId, action });
    setResolveResolution('');
    setResolveDialogOpen(true);
  };

  const handleResolveDispute = async () => {
    if (!resolveTarget || !resolveResolution.trim()) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/escrow/${resolveTarget.escrowId}/disputes/${resolveTarget.disputeId}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: resolveTarget.action, resolution: resolveResolution }),
      });
      if (res.ok) {
        toast({ title: 'Dispute Resolved', description: 'The dispute has been resolved.' });
        setResolveDialogOpen(false);
        fetchEscrows();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to resolve dispute.' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.' });
    } finally {
      setResolving(false);
    }
  };

  /* ─── Escrow Stats ─── */
  const escrowStats = useMemo(() => ({
    total: escrows.length,
    active: escrows.filter((e) => ['collecting', 'funded', 'active'].includes(e.status)).length,
    held: escrows.reduce((sum, e) => sum + (['funded', 'active', 'disputed'].includes(e.status) ? e.collectedAmount : 0), 0),
    disputes: escrows.reduce((sum, e) => sum + e.disputes.filter((d) => d.status === 'open' || d.status === 'reviewing').length, 0),
  }), [escrows]);

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <PageWrapper title="Admin Panel" description="Manage users, withdrawals, courses, investments, and escrows.">
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users">
            <Users className="mr-1 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            <ArrowLeftRight className="mr-1 h-4 w-4" />
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="mr-1 h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="investments">
            <TrendingUp className="mr-1 h-4 w-4" />
            Investments
          </TabsTrigger>
          <TabsTrigger value="escrow">
            <Lock className="mr-1 h-4 w-4" />
            Escrow
          </TabsTrigger>
        </TabsList>

        {/* ═══════ Users Tab ═══════ */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gold" />
                </div>
              ) : (
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
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Badge className={user.role === 'admin' ? 'bg-gold/10 text-gold border-gold/20' : 'bg-muted text-muted-foreground'} variant="outline">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">${user.balance.toFixed(2)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => toggleUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : user.role === 'admin' ? 'Demote' : 'Promote'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ Withdrawals Tab ═══════ */}
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Withdrawal Requests ({withdrawals.filter((w) => w.status === 'pending').length} pending)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
              ) : withdrawals.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No withdrawal requests.</p>
              ) : (
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="hidden sm:table-cell">Wallet</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{w.userName}</p>
                              <p className="text-xs text-muted-foreground">{w.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">${w.amount.toFixed(2)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-xs font-mono">{w.walletAddress}</TableCell>
                          <TableCell>
                            <Badge className={
                              w.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : w.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                            } variant="outline">{w.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {w.status === 'pending' && (
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleWithdrawal(w.id, 'approved')} disabled={actionLoading === w.id}>
                                  {actionLoading === w.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleWithdrawal(w.id, 'rejected')} disabled={actionLoading === w.id}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ Courses Tab ═══════ */}
        <TabsContent value="courses">
          <div className="flex justify-end mb-4">
            <Button className="bg-gold text-white hover:bg-gold-dark" onClick={() => setCourseDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Add Course
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden sm:table-cell">Category</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead className="hidden md:table-cell">Enrollments</TableHead>
                      <TableHead className="hidden lg:table-cell">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{c.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{c.category}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            c.difficulty === 'beginner' ? 'bg-green-100 text-green-700 border-green-200'
                            : c.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                          }>{c.difficulty}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{c.enrollmentsCount}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>Add a new course to the platform.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Title</Label>
                  <Input id="courseTitle" placeholder="Course title" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseDesc">Description</Label>
                  <Input id="courseDesc" placeholder="Brief description" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input placeholder="e.g., Finance" value={newCourse.category} onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={newCourse.difficulty} onValueChange={(v) => setNewCourse({ ...newCourse, difficulty: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>Cancel</Button>
                <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleCreateCourse} disabled={creatingCourse}>
                  {creatingCourse && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════ Investments Tab ═══════ */}
        <TabsContent value="investments">
          <div className="flex justify-end mb-4">
            <Button className="bg-gold text-white hover:bg-gold-dark" onClick={() => setInvestDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Add Opportunity
            </Button>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Investment management interface. Create opportunities using the button above.</p>
              </div>
            </CardContent>
          </Card>

          <Dialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Investment Opportunity</DialogTitle>
                <DialogDescription>Add a new investment opportunity for users.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="Investment title" value={newInvestment.title} onChange={(e) => setNewInvestment({ ...newInvestment, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input placeholder="Brief description" value={newInvestment.description} onChange={(e) => setNewInvestment({ ...newInvestment, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Investment ($)</Label>
                    <Input type="number" placeholder="10" value={newInvestment.minInvestment} onChange={(e) => setNewInvestment({ ...newInvestment, minInvestment: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Investment ($)</Label>
                    <Input type="number" placeholder="10000" value={newInvestment.maxInvestment} onChange={(e) => setNewInvestment({ ...newInvestment, maxInvestment: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ROI (%)</Label>
                    <Input type="number" placeholder="5" value={newInvestment.roiPercent} onChange={(e) => setNewInvestment({ ...newInvestment, roiPercent: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input placeholder="30 days" value={newInvestment.duration} onChange={(e) => setNewInvestment({ ...newInvestment, duration: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInvestDialogOpen(false)}>Cancel</Button>
                <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleCreateInvestment} disabled={creatingInvestment}>
                  {creatingInvestment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════ ESCROW TAB ═══════ */}
        <TabsContent value="escrow">
          {/* Top action buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button className="bg-gold text-white hover:bg-gold-dark" onClick={() => { resetNewEscrow(); setCreateEscrowOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Create Escrow
            </Button>
            <Button variant="outline" onClick={() => openConfirm('process-expired', 'all')}>
              <RotateCcw className="mr-2 h-4 w-4" />Process Expired
            </Button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Escrows" value={escrowStats.total} icon={Lock} />
            <StatCard title="Active Escrows" value={escrowStats.active} icon={Shield} />
            <StatCard title="Held in Escrow" value={`$${escrowStats.held.toLocaleString()}`} icon={DollarSign} />
            <StatCard title="Open Disputes" value={escrowStats.disputes} icon={Gavel} />
          </div>

          {/* Escrow Management Table */}
          <Card>
            <CardContent className="p-0">
              {escrowLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gold" />
                </div>
              ) : escrows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No escrows found</p>
                  <p className="text-xs text-muted-foreground mt-1">Create one using the button above.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden sm:table-cell">Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Progress</TableHead>
                        <TableHead className="hidden lg:table-cell">Collected / Target</TableHead>
                        <TableHead className="hidden lg:table-cell">Contributors</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {escrows.map((escrow) => {
                        const progress = escrow.targetAmount > 0 ? (escrow.collectedAmount / escrow.targetAmount) * 100 : 0;
                        return (
                          <TableRow key={escrow.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">{escrow.title}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline" className="bg-orange/10 text-orange border-orange/20">
                                {ESCROW_TYPE_LABEL[escrow.type]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={ESCROW_STATUS_BADGE[escrow.status]} variant="outline">{escrow.status}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-2 min-w-[120px]">
                                <Progress value={progress} className="h-2 flex-1" />
                                <span className="text-xs text-muted-foreground w-10 text-right">{progress.toFixed(0)}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">
                              <span className="font-medium">${escrow.collectedAmount.toLocaleString()}</span>
                              <span className="text-muted-foreground"> / ${escrow.targetAmount.toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">{escrow.contributorCount}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openViewEscrow(escrow)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {escrow.status === 'collecting' && (
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-600" onClick={() => openConfirm('cancel', escrow.id)}>
                                    <Ban className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {(escrow.status === 'funded' || escrow.status === 'active') && (
                                  <>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-green-600 hover:text-green-700" onClick={() => openConfirm('release', escrow.id)}>
                                      <DollarSign className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-600" onClick={() => openConfirm('cancel', escrow.id)}>
                                      <Ban className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
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
        </TabsContent>
      </Tabs>

      {/* ═══════ Create Escrow Dialog ═══════ */}
      <Dialog open={createEscrowOpen} onOpenChange={setCreateEscrowOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Escrow</DialogTitle>
            <DialogDescription>Set up a new escrow with funding parameters and optional milestones.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="escrowTitle">Title <span className="text-destructive">*</span></Label>
              <Input id="escrowTitle" placeholder="Escrow title" value={newEscrow.title} onChange={(e) => setNewEscrow({ ...newEscrow, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="escrowDesc">Description</Label>
              <Textarea id="escrowDesc" placeholder="Brief description..." value={newEscrow.description} onChange={(e) => setNewEscrow({ ...newEscrow, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newEscrow.type} onValueChange={(v) => setNewEscrow({ ...newEscrow, type: v as EscrowType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deal_funding">Deal Funding</SelectItem>
                  <SelectItem value="investment_deal">Investment Deal</SelectItem>
                  <SelectItem value="service_payment">Service Payment</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Amount ($) <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder="10000" value={newEscrow.targetAmount} onChange={(e) => setNewEscrow({ ...newEscrow, targetAmount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fee Percentage (%)</Label>
                <Input type="number" placeholder="2.5" value={newEscrow.feePercentage} onChange={(e) => setNewEscrow({ ...newEscrow, feePercentage: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Contribution ($)</Label>
                <Input type="number" placeholder="10" value={newEscrow.minContribution} onChange={(e) => setNewEscrow({ ...newEscrow, minContribution: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Max Contribution ($)</Label>
                <Input type="number" placeholder="10000" value={newEscrow.maxContribution} onChange={(e) => setNewEscrow({ ...newEscrow, maxContribution: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Funding Deadline <span className="text-destructive">*</span></Label>
                <Input type="date" value={newEscrow.fundingDeadline} onChange={(e) => setNewEscrow({ ...newEscrow, fundingDeadline: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Release Date (optional)</Label>
                <Input type="date" value={newEscrow.releaseDate} onChange={(e) => setNewEscrow({ ...newEscrow, releaseDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Terms</Label>
              <Textarea placeholder="Escrow terms and conditions..." value={newEscrow.terms} onChange={(e) => setNewEscrow({ ...newEscrow, terms: e.target.value })} rows={2} />
            </div>

            <Separator />

            {/* Milestones Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Milestones</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addMilestone}>
                  <Plus className="mr-1 h-3 w-3" />Add Milestone
                </Button>
              </div>

              {milestones.length > 0 && (
                <div className="space-y-2">
                  {milestones.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-border p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Milestone {i + 1}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" onClick={() => removeMilestone(i)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1">
                          <Input placeholder="Title" value={m.title} onChange={(e) => updateMilestone(i, 'title', e.target.value)} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Input type="number" placeholder="%" value={m.percentage} onChange={(e) => updateMilestone(i, 'percentage', e.target.value)} className="h-8 text-xs" />
                        </div>
                      </div>
                      <Input placeholder="Description (optional)" value={m.description} onChange={(e) => updateMilestone(i, 'description', e.target.value)} className="h-8 text-xs" />
                    </motion.div>
                  ))}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total: {milestoneTotal}%</span>
                    {milestoneTotal > 0 && milestoneTotal !== 100 && (
                      <span className={milestoneTotal > 100 ? 'text-red-500 font-medium' : 'text-amber-600'}>
                        {milestoneTotal > 100 ? 'Exceeds 100%' : 'Must equal 100%'}
                      </span>
                    )}
                    {milestoneTotal === 100 && (
                      <span className="text-green-600 font-medium">Valid</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateEscrowOpen(false)}>Cancel</Button>
            <Button
              className="bg-gold text-white hover:bg-gold-dark"
              onClick={handleCreateEscrow}
              disabled={creatingEscrow || !newEscrow.title.trim() || !newEscrow.targetAmount}
            >
              {creatingEscrow && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {creatingEscrow ? 'Creating...' : 'Create Escrow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════ View Escrow Detail Dialog ═══════ */}
      <Dialog open={viewEscrowOpen} onOpenChange={setViewEscrowOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewEscrow?.title}
              <Badge className={viewEscrow ? ESCROW_STATUS_BADGE[viewEscrow.status] : ''} variant="outline">
                {viewEscrow?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>{viewEscrow?.description}</DialogDescription>
          </DialogHeader>

          {viewEscrow && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Escrow Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</p>
                    <p className="text-sm font-semibold">{ESCROW_TYPE_LABEL[viewEscrow.type]}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Progress</p>
                    <p className="text-sm font-semibold text-gold">{viewEscrow.targetAmount > 0 ? ((viewEscrow.collectedAmount / viewEscrow.targetAmount) * 100).toFixed(1) : 0}%</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Collected</p>
                    <p className="text-sm font-semibold">${viewEscrow.collectedAmount.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contributors</p>
                    <p className="text-sm font-semibold">{viewEscrow.contributorCount}</p>
                  </div>
                </div>

                {viewEscrow.terms && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Terms</p>
                    <p className="text-sm">{viewEscrow.terms}</p>
                  </div>
                )}

                <Separator />

                {/* Contributions */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gold" />
                    Contributions ({viewEscrow.contributions.length})
                  </h4>
                  {viewEscrow.contributions.length > 0 ? (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden sm:table-cell">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewEscrow.contributions.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">{c.userName}</TableCell>
                              <TableCell>${c.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge className={ESCROW_STATUS_BADGE[c.status as EscrowStatus] || 'bg-muted text-muted-foreground'} variant="outline">
                                  {c.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-muted-foreground">{new Date(c.date).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No contributions yet.</p>
                  )}
                </div>

                {/* Milestones */}
                {viewEscrow.milestones.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-orange" />
                        Milestones ({viewEscrow.milestones.length})
                      </h4>
                      <div className="space-y-2">
                        {viewEscrow.milestones.map((ms) => (
                          <div key={ms.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{ms.title}</p>
                                <Badge className={MILESTONE_STATUS_BADGE[ms.status] || 'bg-muted text-muted-foreground'} variant="outline">{ms.status}</Badge>
                              </div>
                              {ms.description && <p className="text-xs text-muted-foreground mt-0.5">{ms.description}</p>}
                            </div>
                            <div className="flex items-center gap-3 ml-3">
                              <span className="text-sm font-semibold text-gold">{ms.percentage}%</span>
                              {ms.status === 'held' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => openConfirm('release', viewEscrow.id, { milestoneId: ms.id })}
                                >
                                  Release
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Disputes */}
                {viewEscrow.disputes.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Disputes ({viewEscrow.disputes.length})
                      </h4>
                      <div className="space-y-3">
                        {viewEscrow.disputes.map((d) => (
                          <div key={d.id} className="rounded-lg border border-red/20 bg-red-50/50 p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="text-sm font-medium">{d.userName}</p>
                                <p className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString()}</p>
                              </div>
                              <Badge className={DISPUTE_ADMIN_STATUS_BADGE[d.status] || 'bg-muted text-muted-foreground'} variant="outline">
                                {d.status}
                              </Badge>
                            </div>
                            <p className="text-sm">{d.reason}</p>
                            {d.evidence && <p className="text-xs text-muted-foreground mt-1">Evidence: {d.evidence}</p>}
                            {d.resolution && (
                              <div className="mt-2 rounded bg-green-100 p-2 text-xs text-green-800">{d.resolution}</div>
                            )}
                            {(d.status === 'open' || d.status === 'reviewing') && (
                              <div className="flex gap-2 mt-3">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openResolveDispute(viewEscrow.id, d.id, 'dismiss')}>
                                  <X className="mr-1 h-3 w-3" />Dismiss
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-orange hover:bg-orange/10" onClick={() => openResolveDispute(viewEscrow.id, d.id, 'refund_all')}>
                                  <RotateCcw className="mr-1 h-3 w-3" />Refund All
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 hover:bg-green-50" onClick={() => openResolveDispute(viewEscrow.id, d.id, 'release_all')}>
                                  <Check className="mr-1 h-3 w-3" />Release All
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                {(viewEscrow.status === 'funded' || viewEscrow.status === 'active') && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openConfirm('release', viewEscrow.id)}>
                        <DollarSign className="mr-2 h-4 w-4" />Release All Funds
                      </Button>
                      <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => openConfirm('refund', viewEscrow.id)}>
                        <RotateCcw className="mr-2 h-4 w-4" />Refund All
                      </Button>
                      <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => openConfirm('cancel', viewEscrow.id)}>
                        <Ban className="mr-2 h-4 w-4" />Cancel Escrow
                      </Button>
                    </div>
                  </>
                )}
                {viewEscrow.status === 'collecting' && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => openConfirm('cancel', viewEscrow.id)}>
                        <Ban className="mr-2 h-4 w-4" />Cancel Escrow
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════ Confirmation Dialog ═══════ */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'release' ? 'Release Funds' : confirmAction?.type === 'refund' ? 'Refund All Funds' : confirmAction?.type === 'cancel' ? 'Cancel Escrow' : 'Process Expired'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'release' && 'This will release all held funds to the recipients. This action cannot be undone.'}
              {confirmAction?.type === 'refund' && 'This will refund all contributions back to their original contributors. This action cannot be undone.'}
              {confirmAction?.type === 'cancel' && 'This will cancel this escrow and refund all contributors. This action cannot be undone.'}
              {confirmAction?.type === 'process-expired' && 'This will process all expired escrows and refund contributors.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{confirmAction?.type === 'cancel' ? 'Reason' : 'Notes'} (optional)</Label>
            <Textarea
              placeholder={confirmAction?.type === 'cancel' ? 'Reason for cancellation...' : 'Additional notes...'}
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button
              className={
                confirmAction?.type === 'release' ? 'bg-green-600 text-white hover:bg-green-700'
                : confirmAction?.type === 'refund' ? 'bg-orange text-white hover:bg-orange-dark'
                : 'bg-red-500 text-white hover:bg-red-600'
              }
              onClick={handleConfirmAction}
              disabled={confirming}
            >
              {confirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirming ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════ Resolve Dispute Dialog ═══════ */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {resolveTarget?.action === 'dismiss' ? 'Dismiss Dispute' : resolveTarget?.action === 'refund_all' ? 'Refund All & Dismiss' : 'Release All & Dismiss'}
            </DialogTitle>
            <DialogDescription>
              {resolveTarget?.action === 'dismiss' && 'This dispute will be dismissed without any changes to funds.'}
              {resolveTarget?.action === 'refund_all' && 'All contributions will be refunded and the dispute dismissed.'}
              {resolveTarget?.action === 'release_all' && 'All held funds will be released and the dispute dismissed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Resolution <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Describe the resolution..."
              value={resolveResolution}
              onChange={(e) => setResolveResolution(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-gold text-white hover:bg-gold-dark"
              onClick={handleResolveDispute}
              disabled={resolving || !resolveResolution.trim()}
            >
              {resolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resolving ? 'Resolving...' : 'Confirm Resolution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
