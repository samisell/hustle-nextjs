'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Clock,
  DollarSign,
  Loader2,
  AlertCircle,
  Users,
  Wallet,
  CreditCard,
  Bitcoin,
  MessageSquare,
  HandCoins,
  ChevronRight,
  AlertTriangle,
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
import { useAuthStore } from '@/store/auth';
import { toast } from '@/hooks/use-toast';

/* ─────────────── Types ─────────────── */

type EscrowStatus = 'collecting' | 'funded' | 'active' | 'disputed' | 'released' | 'refunded' | 'expired' | 'cancelled';
type EscrowType = 'deal_funding' | 'investment_deal' | 'service_payment' | 'milestone';

interface EscrowItem {
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
  createdAt: string;
}

interface EscrowContribution {
  id: string;
  escrowId: string;
  escrowTitle: string;
  amount: number;
  status: string;
  createdAt: string;
  hasDispute: boolean;
}

interface EscrowDispute {
  id: string;
  escrowId: string;
  escrowTitle: string;
  reason: string;
  evidence: string;
  status: string;
  resolution: string | null;
  createdAt: string;
}

type PaymentMethod = 'wallet' | 'card' | 'crypto';

/* ─────────────── Helpers ─────────────── */

const STATUS_BADGE: Record<EscrowStatus, string> = {
  collecting: 'bg-amber-100 text-amber-700 border-amber-200',
  funded: 'bg-green-100 text-green-700 border-green-200',
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  disputed: 'bg-red-100 text-red-700 border-red-200',
  released: 'bg-green-100 text-green-700 border-green-200',
  refunded: 'bg-gray-100 text-gray-600 border-gray-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

const TYPE_LABEL: Record<EscrowType, string> = {
  deal_funding: 'Deal Funding',
  investment_deal: 'Investment Deal',
  service_payment: 'Service Payment',
  milestone: 'Milestone',
};

const TYPE_BADGE: Record<EscrowType, string> = {
  deal_funding: 'bg-orange/10 text-orange border-orange/20',
  investment_deal: 'bg-gold/10 text-gold border-gold/20',
  service_payment: 'bg-blue-50 text-blue-600 border-blue-200',
  milestone: 'bg-purple-50 text-purple-600 border-purple-200',
};

const DISPUTE_STATUS_BADGE: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700 border-amber-200',
  reviewing: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  dismissed: 'bg-gray-100 text-gray-600 border-gray-200',
};

function daysRemaining(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/* ─────────────── Fallback Data ─────────────── */

const FALLBACK_ESCROWS: EscrowItem[] = [
  {
    id: 'e1', title: 'E-Commerce Platform Launch', description: 'Funding for the initial development and marketing of a new e-commerce platform targeting the African market.',
    type: 'deal_funding', status: 'collecting', targetAmount: 50000, collectedAmount: 32000,
    minContribution: 50, maxContribution: 10000, feePercentage: 2.5,
    fundingDeadline: new Date(Date.now() + 15 * 86400000).toISOString(),
    releaseDate: null, terms: 'Funds released upon platform launch confirmation.', contributorCount: 42, createdAt: '2024-03-01',
  },
  {
    id: 'e2', title: 'Real Estate Investment Pool', description: 'Pool of investors contributing to a commercial real estate acquisition in Lagos.',
    type: 'investment_deal', status: 'collecting', targetAmount: 200000, collectedAmount: 185000,
    minContribution: 100, maxContribution: 50000, feePercentage: 1.5,
    fundingDeadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    releaseDate: null, terms: 'Funds held until property acquisition is verified.', contributorCount: 28, createdAt: '2024-02-15',
  },
  {
    id: 'e3', title: 'Freelance Developer Payment', description: 'Payment for completed website development services held in escrow until delivery verification.',
    type: 'service_payment', status: 'funded', targetAmount: 5000, collectedAmount: 5000,
    minContribution: 100, maxContribution: 5000, feePercentage: 3,
    fundingDeadline: '2024-03-20T00:00:00Z', releaseDate: '2024-04-20T00:00:00Z',
    terms: 'Released upon client approval of deliverables.', contributorCount: 1, createdAt: '2024-02-28',
  },
  {
    id: 'e4', title: 'Mobile App Milestone 2', description: 'Second milestone payment for mobile app development – UI implementation phase.',
    type: 'milestone', status: 'active', targetAmount: 15000, collectedAmount: 15000,
    minContribution: 500, maxContribution: 15000, feePercentage: 2,
    fundingDeadline: '2024-03-10T00:00:00Z', releaseDate: '2024-05-01T00:00:00Z',
    terms: 'Released upon completion of milestone 2 deliverables.', contributorCount: 3, createdAt: '2024-02-20',
  },
  {
    id: 'e5', title: 'Agricultural Supply Chain', description: 'Investment in an agricultural supply chain optimization project.',
    type: 'investment_deal', status: 'disputed', targetAmount: 80000, collectedAmount: 65000,
    minContribution: 200, maxContribution: 20000, feePercentage: 2,
    fundingDeadline: '2024-04-01T00:00:00Z', releaseDate: null,
    terms: 'Funds released upon delivery verification.', contributorCount: 15, createdAt: '2024-01-25',
  },
  {
    id: 'e6', title: 'Brand Identity Design', description: 'Payment for professional brand identity design services including logo, colors, and guidelines.',
    type: 'service_payment', status: 'released', targetAmount: 3000, collectedAmount: 3000,
    minContribution: 500, maxContribution: 3000, feePercentage: 3,
    fundingDeadline: '2024-02-15T00:00:00Z', releaseDate: '2024-03-15T00:00:00Z',
    terms: 'Released upon final delivery.', contributorCount: 1, createdAt: '2024-01-20',
  },
];

const FALLBACK_CONTRIBUTIONS: EscrowContribution[] = [
  { id: 'c1', escrowId: 'e1', escrowTitle: 'E-Commerce Platform Launch', amount: 500, status: 'active', createdAt: '2024-03-05', hasDispute: false },
  { id: 'c2', escrowId: 'e2', escrowTitle: 'Real Estate Investment Pool', amount: 2000, status: 'active', createdAt: '2024-03-01', hasDispute: false },
  { id: 'c3', escrowId: 'e5', escrowTitle: 'Agricultural Supply Chain', amount: 1000, status: 'disputed', createdAt: '2024-02-10', hasDispute: true },
];

const FALLBACK_DISPUTES: EscrowDispute[] = [
  {
    id: 'd1', escrowId: 'e5', escrowTitle: 'Agricultural Supply Chain',
    reason: 'Project deliverables not meeting agreed specifications. Quality of the supply chain platform is below the expected standard.',
    evidence: 'Attached screenshots of incomplete features and comparison document.',
    status: 'reviewing', resolution: null, createdAt: '2024-03-10',
  },
];

/* ─────────────── Component ─────────────── */

export default function EscrowPage() {
  const token = useAuthStore((s) => s.token);

  /* Data state */
  const [escrows, setEscrows] = useState<EscrowItem[]>([]);
  const [contributions, setContributions] = useState<EscrowContribution[]>([]);
  const [disputes, setDisputes] = useState<EscrowDispute[]>([]);
  const [loading, setLoading] = useState(true);

  /* Contribute dialog */
  const [contributeOpen, setContributeOpen] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const [contributeError, setContributeError] = useState('');

  /* Dispute dialog */
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeEscrowId, setDisputeEscrowId] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState('');

  /* ─── Fetch ─── */
  useEffect(() => {
    fetchEscrowData();
  }, [token]);

  const fetchEscrowData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/escrow', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEscrows(data.escrows || []);
        setContributions(data.contributions || []);
        setDisputes(data.disputes || []);
        return;
      }
    } catch {
      // fall through to fallback
    }
    setEscrows(FALLBACK_ESCROWS);
    setContributions(FALLBACK_CONTRIBUTIONS);
    setDisputes(FALLBACK_DISPUTES);
    setLoading(false);
  };

  /* ─── Contribute ─── */
  const openContribute = (escrow: EscrowItem) => {
    setSelectedEscrow(escrow);
    setPaymentMethod('wallet');
    setContributeAmount('');
    setContributeError('');
    setContributeOpen(true);
  };

  const handleContribute = async () => {
    const amount = parseFloat(contributeAmount);
    if (!amount || amount <= 0) {
      setContributeError('Please enter a valid amount.');
      return;
    }
    if (selectedEscrow && amount < selectedEscrow.minContribution) {
      setContributeError(`Minimum contribution is $${selectedEscrow.minContribution}.`);
      return;
    }
    if (selectedEscrow && amount > selectedEscrow.maxContribution) {
      setContributeError(`Maximum contribution is $${selectedEscrow.maxContribution.toLocaleString()}.`);
      return;
    }

    setContributing(true);
    setContributeError('');

    try {
      const res = await fetch(`/api/escrow/${selectedEscrow?.id}/contribute`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, paymentMethod }),
      });
      if (res.ok) {
        setContributeOpen(false);
        toast({ title: 'Contribution Successful', description: `You contributed $${amount.toFixed(2)} to ${selectedEscrow?.title}.` });
        fetchEscrowData();
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

  /* ─── Dispute ─── */
  const openDispute = (escrowId: string) => {
    setDisputeEscrowId(escrowId);
    setDisputeReason('');
    setDisputeEvidence('');
    setDisputeError('');
    setDisputeOpen(true);
  };

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim()) {
      setDisputeError('Please provide a reason for the dispute.');
      return;
    }
    setSubmittingDispute(true);
    setDisputeError('');
    try {
      const res = await fetch(`/api/escrow/${disputeEscrowId}/disputes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: disputeReason, evidence: disputeEvidence }),
      });
      if (res.ok) {
        setDisputeOpen(false);
        toast({ title: 'Dispute Filed', description: 'Your dispute has been submitted and will be reviewed.' });
        fetchEscrowData();
      } else {
        const data = await res.json();
        setDisputeError(data.error || 'Failed to submit dispute.');
      }
    } catch {
      setDisputeError('Something went wrong.');
    } finally {
      setSubmittingDispute(false);
    }
  };

  /* ─── Computed ─── */
  const collectingEscrows = useMemo(() => escrows.filter((e) => e.status === 'collecting'), [escrows]);
  const allOtherEscrows = useMemo(() => escrows.filter((e) => e.status !== 'collecting'), [escrows]);

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { value: 'wallet', label: 'Wallet', icon: Wallet },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'crypto', label: 'Crypto', icon: Bitcoin },
  ];

  const quickAmounts = [10, 50, 100, 500];

  const expectedShare = useMemo(() => {
    if (!contributeAmount || !selectedEscrow) return null;
    const amt = parseFloat(contributeAmount);
    if (!amt || amt <= 0) return null;
    return ((amt / selectedEscrow.targetAmount) * 100).toFixed(2);
  }, [contributeAmount, selectedEscrow]);

  /* ─────────── Render ─────────── */
  return (
    <PageWrapper title="Escrow" description="Secure your investments with our escrow protection system.">
      <Tabs defaultValue="available" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="available">
            <Shield className="mr-1.5 h-4 w-4" />
            Available Escrows
          </TabsTrigger>
          <TabsTrigger value="contributions">
            <HandCoins className="mr-1.5 h-4 w-4" />
            My Contributions
          </TabsTrigger>
          <TabsTrigger value="disputes">
            <AlertTriangle className="mr-1.5 h-4 w-4" />
            Disputes
          </TabsTrigger>
        </TabsList>

        {/* ────── Available Escrows Tab ────── */}
        <TabsContent value="available">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : escrows.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No escrows available"
              description="Check back later for new escrow opportunities."
            />
          ) : (
            <>
              {collectingEscrows.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Open for Contributions
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {collectingEscrows.map((escrow, index) => (
                      <motion.div
                        key={escrow.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        whileHover={{ y: -2 }}
                        className="cursor-pointer"
                        onClick={() => openContribute(escrow)}
                      >
                        <Card className="h-full border-border/80 hover:border-gold/30 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-base truncate">{escrow.title}</CardTitle>
                                <CardDescription className="mt-1 line-clamp-2">{escrow.description}</CardDescription>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <Badge className={STATUS_BADGE[escrow.status]} variant="outline">
                                  {escrow.status}
                                </Badge>
                                <Badge className={TYPE_BADGE[escrow.type]} variant="outline">
                                  {TYPE_LABEL[escrow.type]}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Funding progress */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-foreground">
                                  ${escrow.collectedAmount.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground">
                                  of ${escrow.targetAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className="relative">
                                <Progress
                                  value={(escrow.collectedAmount / escrow.targetAmount) * 100}
                                  className="h-2.5"
                                />
                                <span className="absolute -top-5 right-0 text-xs font-semibold text-gold">
                                  {((escrow.collectedAmount / escrow.targetAmount) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {/* Details grid */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deadline</p>
                                <div className="flex items-center justify-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3 text-orange" />
                                  <p className="text-xs font-semibold">{daysRemaining(escrow.fundingDeadline)}d</p>
                                </div>
                              </div>
                              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Min</p>
                                <p className="text-xs font-semibold mt-0.5">${escrow.minContribution}</p>
                              </div>
                              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contributors</p>
                                <div className="flex items-center justify-center gap-1 mt-0.5">
                                  <Users className="h-3 w-3 text-gold" />
                                  <p className="text-xs font-semibold">{escrow.contributorCount}</p>
                                </div>
                              </div>
                            </div>

                            <Button
                              className="w-full bg-gold text-white hover:bg-gold-dark"
                              onClick={(e) => {
                                e.stopPropagation();
                                openContribute(escrow);
                              }}
                            >
                              Contribute
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {allOtherEscrows.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Other Escrows
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {allOtherEscrows.map((escrow, index) => (
                      <motion.div
                        key={escrow.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                      >
                        <Card className="h-full opacity-80">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-base truncate">{escrow.title}</CardTitle>
                                <CardDescription className="mt-1 line-clamp-2">{escrow.description}</CardDescription>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <Badge className={STATUS_BADGE[escrow.status]} variant="outline">
                                  {escrow.status}
                                </Badge>
                                <Badge className={TYPE_BADGE[escrow.type]} variant="outline">
                                  {TYPE_LABEL[escrow.type]}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">${escrow.collectedAmount.toLocaleString()}</span>
                                <span className="text-muted-foreground">of ${escrow.targetAmount.toLocaleString()}</span>
                              </div>
                              <Progress value={(escrow.collectedAmount / escrow.targetAmount) * 100} className="h-2" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deadline</p>
                                <p className="text-xs font-semibold mt-0.5">
                                  {daysRemaining(escrow.fundingDeadline) > 0 ? `${daysRemaining(escrow.fundingDeadline)}d` : 'Ended'}
                                </p>
                              </div>
                              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Min</p>
                                <p className="text-xs font-semibold mt-0.5">${escrow.minContribution}</p>
                              </div>
                              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contributors</p>
                                <p className="text-xs font-semibold mt-0.5">{escrow.contributorCount}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ────── My Contributions Tab ────── */}
        <TabsContent value="contributions">
          {contributions.length === 0 ? (
            <EmptyState
              icon={HandCoins}
              title="No contributions yet"
              description="Start contributing to escrows to protect your investments."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Escrow</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contributions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.escrowTitle}</TableCell>
                          <TableCell className="font-medium">${c.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_BADGE[c.status as EscrowStatus] || 'bg-muted text-muted-foreground'} variant="outline">
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {c.status !== 'disputed' && !c.hasDispute && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => openDispute(c.escrowId)}
                              >
                                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                                Raise Dispute
                              </Button>
                            )}
                            {c.hasDispute && (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200" variant="outline">
                                Disputed
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ────── Disputes Tab ────── */}
        <TabsContent value="disputes">
          {disputes.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No disputes filed"
              description="You haven&apos;t raised any disputes yet."
            />
          ) : (
            <div className="space-y-4">
              {disputes.map((d, index) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{d.escrowTitle}</CardTitle>
                          <CardDescription className="mt-1">
                            Filed on {new Date(d.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge className={DISPUTE_STATUS_BADGE[d.status] || 'bg-muted text-muted-foreground'} variant="outline">
                          {d.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-sm text-foreground">{d.reason}</p>
                      </div>
                      {d.evidence && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Evidence</p>
                          <p className="text-sm text-foreground">{d.evidence}</p>
                        </div>
                      )}
                      {d.resolution && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Resolution</p>
                          <p className="text-sm text-green-800">{d.resolution}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ────── Contribute Dialog ────── */}
      <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contribute to Escrow</DialogTitle>
            <DialogDescription>{selectedEscrow?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {contributeError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {contributeError}
              </div>
            )}

            {/* Escrow info */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <p className="text-xs text-muted-foreground line-clamp-2">{selectedEscrow?.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Funding Progress</span>
                <span className="font-semibold text-gold">
                  ${selectedEscrow?.collectedAmount.toLocaleString()} / ${selectedEscrow?.targetAmount.toLocaleString()}
                </span>
              </div>
              <Progress value={selectedEscrow ? (selectedEscrow.collectedAmount / selectedEscrow.targetAmount) * 100 : 0} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Deadline: {selectedEscrow ? new Date(selectedEscrow.fundingDeadline).toLocaleDateString() : '-'}</span>
                <span>Fee: {selectedEscrow?.feePercentage}%</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((pm) => (
                  <motion.button
                    key={pm.value}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors ${
                      paymentMethod === pm.value
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border bg-background text-muted-foreground hover:border-gold/40'
                    }`}
                  >
                    <pm.icon className="h-5 w-5" />
                    {pm.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="contributeAmount">Contribution Amount (USD)</Label>
              <Input
                id="contributeAmount"
                type="number"
                placeholder={`Min $${selectedEscrow?.minContribution} — Max $${selectedEscrow?.maxContribution?.toLocaleString()}`}
                min={selectedEscrow?.minContribution}
                max={selectedEscrow?.maxContribution}
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
              {expectedShare && (
                <p className="text-sm text-muted-foreground">
                  Expected share:{' '}
                  <span className="font-medium text-gold">{expectedShare}%</span>
                  {selectedEscrow && (
                    <span className="text-muted-foreground">
                      {' '}of escrow
                    </span>
                  )}
                </p>
              )}
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

      {/* ────── Raise Dispute Dialog ────── */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Raise a Dispute</DialogTitle>
            <DialogDescription>
              Provide details about your concern. Our team will review and resolve it fairly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {disputeError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {disputeError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="disputeReason">Reason <span className="text-destructive">*</span></Label>
              <Textarea
                id="disputeReason"
                placeholder="Describe the issue in detail..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disputeEvidence">Evidence (optional)</Label>
              <Textarea
                id="disputeEvidence"
                placeholder="Any supporting evidence or documentation..."
                value={disputeEvidence}
                onChange={(e) => setDisputeEvidence(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleSubmitDispute}
              disabled={submittingDispute}
            >
              {submittingDispute && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submittingDispute ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
