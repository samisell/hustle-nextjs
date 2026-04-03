'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  Loader2,
  AlertCircle,
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
import PageWrapper from '@/components/shared/PageWrapper';
import EmptyState from '@/components/shared/EmptyState';
import { useAuthStore } from '@/store/auth';

interface InvestmentOpportunity {
  id: string;
  title: string;
  description: string;
  minInvestment: number;
  maxInvestment: number;
  roiPercent: number;
  duration: string;
  status: string;
  totalPool: number;
}

interface UserInvestment {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  amount: number;
  roiPercent: number;
  expectedReturn: number;
  status: string;
  startDate: string;
  endDate: string | null;
}

export default function InvestmentsPage() {
  const token = useAuthStore((s) => s.token);
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [myInvestments, setMyInvestments] = useState<UserInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<InvestmentOpportunity | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [investing, setInvesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvestments();
  }, [token]);

  const fetchInvestments = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/investments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
        setMyInvestments(data.myInvestments || []);
      }
    } catch {
      // fallback data
      setOpportunities([
        {
          id: '1', title: 'Stable Growth Fund', description: 'Low-risk investment with steady returns. Perfect for beginners.',
          minInvestment: 10, maxInvestment: 10000, roiPercent: 5, duration: '30 days',
          status: 'active', totalPool: 50000,
        },
        {
          id: '2', title: 'Tech Innovation Pool', description: 'Invest in emerging technology companies for higher returns.',
          minInvestment: 50, maxInvestment: 50000, roiPercent: 12, duration: '90 days',
          status: 'active', totalPool: 200000,
        },
        {
          id: '3', title: 'Real Estate Trust', description: 'Diversified real estate portfolio with monthly dividend distributions.',
          minInvestment: 100, maxInvestment: 100000, roiPercent: 8, duration: '60 days',
          status: 'active', totalPool: 150000,
        },
        {
          id: '4', title: 'Crypto Hedge Fund', description: 'Professional crypto management with risk mitigation strategies.',
          minInvestment: 25, maxInvestment: 25000, roiPercent: 15, duration: '45 days',
          status: 'active', totalPool: 75000,
        },
      ]);
      setMyInvestments([
        {
          id: '1', opportunityId: '1', opportunityTitle: 'Stable Growth Fund',
          amount: 100, roiPercent: 5, expectedReturn: 105, status: 'active',
          startDate: '2024-03-01', endDate: '2024-04-01',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openInvestDialog = (opportunity: InvestmentOpportunity) => {
    setSelectedOpportunity(opportunity);
    setInvestAmount('');
    setError('');
    setInvestDialogOpen(true);
  };

  const handleInvest = async () => {
    const amount = parseFloat(investAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (selectedOpportunity && (amount < selectedOpportunity.minInvestment)) {
      setError(`Minimum investment is $${selectedOpportunity.minInvestment}.`);
      return;
    }
    if (selectedOpportunity && (amount > selectedOpportunity.maxInvestment)) {
      setError(`Maximum investment is $${selectedOpportunity.maxInvestment}.`);
      return;
    }

    setInvesting(true);
    setError('');

    try {
      const res = await fetch('/api/investments/invest', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ opportunityId: selectedOpportunity?.id, amount }),
      });

      if (res.ok) {
        setInvestDialogOpen(false);
        fetchInvestments();
      } else {
        const data = await res.json();
        setError(data.error || 'Investment failed.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setInvesting(false);
    }
  };

  return (
    <PageWrapper title="Investments" description="Grow your wealth with curated investment opportunities.">
      <Tabs defaultValue="opportunities" className="space-y-6">
        <TabsList>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="my-investments">My Investments</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : opportunities.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No opportunities available"
              description="Check back later for new investment opportunities."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {opportunities.map((opp, index) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{opp.title}</CardTitle>
                          <CardDescription className="mt-1">{opp.description}</CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">ROI</p>
                          <p className="text-lg font-bold text-gold">{opp.roiPercent}%</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="text-sm font-semibold">{opp.duration}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Min Investment</p>
                          <p className="text-sm font-semibold">${opp.minInvestment}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Pool Size</p>
                          <p className="text-sm font-semibold">${opp.totalPool.toLocaleString()}</p>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-gold text-white hover:bg-gold-dark"
                        onClick={() => openInvestDialog(opp)}
                      >
                        Invest Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-investments">
          {myInvestments.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No active investments"
              description="Start investing to grow your wealth."
              action={{ label: 'Browse Opportunities', onClick: () => {} }}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investment</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>ROI</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">End Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myInvestments.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.opportunityTitle}</TableCell>
                        <TableCell>${inv.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-gold font-medium">{inv.roiPercent}%</TableCell>
                        <TableCell>${inv.expectedReturn.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={
                            inv.status === 'active'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : inv.status === 'completed'
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : 'bg-muted text-muted-foreground'
                          } variant="outline">
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {inv.endDate ? new Date(inv.endDate).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Invest Dialog */}
      <Dialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invest in {selectedOpportunity?.title}</DialogTitle>
            <DialogDescription>
              {selectedOpportunity?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">ROI</p>
                <p className="text-lg font-bold text-gold">{selectedOpportunity?.roiPercent}%</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-semibold">{selectedOpportunity?.duration}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="investAmount">
                Investment Amount (USD)
              </Label>
              <Input
                id="investAmount"
                type="number"
                placeholder={`Min $${selectedOpportunity?.minInvestment} - Max $${selectedOpportunity?.maxInvestment?.toLocaleString()}`}
                min={selectedOpportunity?.minInvestment}
                max={selectedOpportunity?.maxInvestment}
                step="0.01"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
              />
              {investAmount && selectedOpportunity && (
                <p className="text-sm text-muted-foreground">
                  Expected return:{' '}
                  <span className="font-medium text-gold">
                    ${(parseFloat(investAmount || '0') * (1 + selectedOpportunity.roiPercent / 100)).toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gold text-white hover:bg-gold-dark"
              onClick={handleInvest}
              disabled={investing}
            >
              {investing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {investing ? 'Processing...' : 'Confirm Investment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
