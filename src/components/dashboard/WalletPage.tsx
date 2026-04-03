'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowDownUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Loader2,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import PageWrapper from '@/components/shared/PageWrapper';
import EmptyState from '@/components/shared/EmptyState';
import { useAuthStore } from '@/store/auth';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const token = useAuthStore((s) => s.token);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWallet();
  }, [token]);

  const fetchWallet = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance ?? 0);
        setTransactions(data.transactions || []);
      }
    } catch {
      // fallback
      setBalance(250.75);
      setTransactions([
        { id: '1', type: 'credit', amount: 15, description: 'Referral Bonus', createdAt: '2024-03-15T10:00:00Z' },
        { id: '2', type: 'credit', amount: 45.5, description: 'Investment Return - Stable Fund', createdAt: '2024-03-12T14:00:00Z' },
        { id: '3', type: 'debit', amount: 29.99, description: 'Pro Subscription', createdAt: '2024-03-10T09:00:00Z' },
        { id: '4', type: 'credit', amount: 10, description: 'Referral Bonus', createdAt: '2024-03-08T16:00:00Z' },
        { id: '5', type: 'debit', amount: 100, description: 'Investment - Growth Fund', createdAt: '2024-03-05T11:00:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (amount > balance) {
      setError('Insufficient balance.');
      return;
    }
    if (!withdrawAddress.trim()) {
      setError('Please enter a wallet address.');
      return;
    }

    setWithdrawing(true);
    setError('');

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, walletAddress: withdrawAddress.trim() }),
      });

      if (res.ok) {
        setWithdrawDialogOpen(false);
        setWithdrawAmount('');
        setWithdrawAddress('');
        fetchWallet();
      } else {
        const data = await res.json();
        setError(data.error || 'Withdrawal failed.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <PageWrapper title="Wallet" description="Manage your funds, view transactions, and withdraw earnings.">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-gold/20 bg-gradient-to-br from-gold/5 via-transparent to-orange/5">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                <p className="mt-1 text-4xl font-bold text-foreground tracking-tight">
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-gold text-white hover:bg-gold-dark"
                  onClick={() => setWithdrawDialogOpen(true)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <ArrowDownRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Income</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(transactions.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <ArrowUpRight className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(transactions.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                <DollarSign className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-lg font-semibold text-foreground">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
          <CardDescription>All your deposits, withdrawals, and earnings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No transactions yet"
              description="Start earning by referring friends or completing courses."
            />
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
                            tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {tx.type === 'credit' ? (
                              <ArrowDownRight className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                            )}
                          </div>
                          <span className="text-sm font-medium">{tx.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Enter the amount and your wallet address to withdraw funds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>Available Balance</Label>
              <p className="text-2xl font-bold text-gold">{formatCurrency(balance)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawAmount">Amount (USD)</Label>
              <Input
                id="withdrawAmount"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="walletAddress">Wallet Address</Label>
              <Input
                id="walletAddress"
                type="text"
                placeholder="Enter your wallet address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gold text-white hover:bg-gold-dark"
              onClick={handleWithdraw}
              disabled={withdrawing}
            >
              {withdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {withdrawing ? 'Processing...' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
