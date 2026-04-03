'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Loader2,
  Send,
  Plus,
  Shield,
  Lock,
  ExternalLink,
  CreditCard,
  Bitcoin,
  QrCode,
  Copy,
  RefreshCw,
  Clock,
  ArrowLeft,
  Landmark,
  Check,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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

interface CryptoDetails {
  address: string;
  network: string;
  paymentAmount: string;
  paymentCurrency: string;
  qrCode: string;
  currency: string;
  amount: string;
  status: string;
  uuid: string;
  expiresAt: number;
}

const FUND_AMOUNTS = [10, 25, 50, 100, 250, 500];

type FundStep = 'method' | 'amount' | 'crypto-details' | 'verifying';
type PaymentMethod = 'flutterwave' | 'crypto';

export default function WalletPage() {
  const token = useAuthStore((s) => s.token);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('flutterwave');
  const [fundStep, setFundStep] = useState<FundStep>('method');
  const [withdrawing, setWithdrawing] = useState(false);
  const [funding, setFunding] = useState(false);
  const [cryptoDetails, setCryptoDetails] = useState<CryptoDetails | null>(null);
  const [cryptoTxRef, setCryptoTxRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchWallet();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token]);

  // Check for payment callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get('tx_ref');
    const method = params.get('method');
    if (txRef && token) {
      setError('');
      setPaymentSuccess('');
      if (method === 'crypto') {
        setFundStep('verifying');
        pollPaymentStatus(txRef, 'crypto');
      } else {
        verifyWalletFunding(txRef);
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [token]);

  const fetchWallet = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance ?? 0);
        setTransactions(data.transactions || []);
      }
    } catch {
      setBalance(250.75);
      setTransactions([
        { id: '1', type: 'credit', amount: 15, description: 'Referral Bonus', createdAt: '2024-03-15T10:00:00Z' },
        { id: '2', type: 'credit', amount: 45.5, description: 'Investment Return - Stable Fund', createdAt: '2024-03-12T14:00:00Z' },
        { id: '3', type: 'debit', amount: 29.99, description: 'Pro Subscription', createdAt: '2024-03-10T09:00:00Z' },
        { id: '4', type: 'credit', amount: 50, description: 'Wallet Funding (Crypto)', createdAt: '2024-03-08T16:00:00Z' },
        { id: '5', type: 'debit', amount: 100, description: 'Investment - Growth Fund', createdAt: '2024-03-05T11:00:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = useCallback((txRef: string, method: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    const poll = async () => {
      if (!token) return;
      try {
        const res = await fetch(`/api/payments/verify?tx_ref=${txRef}&method=${method}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current);
            setPaymentSuccess('Wallet funded successfully!');
            fetchWallet();
            setFundDialogOpen(false);
            setFundStep('method');
          } else if (data.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            setError('Crypto payment failed or expired. Please try again.');
            setFundStep('method');
          }
        }
      } catch { /* keep polling */ }
    };
    poll();
    pollRef.current = setInterval(poll, 15000);
  }, [token]);

  const verifyWalletFunding = useCallback(async (txRef: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/payments/verify?tx_ref=${txRef}&method=flutterwave`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'completed') {
          setPaymentSuccess('Wallet funded successfully!');
          fetchWallet();
        } else {
          setError('Funding verification failed. Please contact support if you were charged.');
        }
      }
    } catch { setError('Could not verify funding. Please check your wallet balance.'); }
  }, [token]);

  const handleFlutterwaveFund = async () => {
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) { setError('Please enter a valid amount.'); return; }
    if (amount < 5) { setError('Minimum funding amount is $5.'); return; }
    if (amount > 10000) { setError('Maximum funding amount is $10,000.'); return; }

    setFunding(true);
    setError('');
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'wallet_funding', amount }),
      });
      const data = await res.json();
      if (res.ok && data.paymentLink) {
        window.location.href = data.paymentLink;
      } else { setError(data.error || 'Failed to initialize payment.'); }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setFunding(false); }
  };

  const handleCryptoFund = async () => {
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) { setError('Please enter a valid amount.'); return; }
    if (amount < 5) { setError('Minimum funding amount is $5.'); return; }
    if (amount > 10000) { setError('Maximum funding amount is $10,000.'); return; }

    setFunding(true);
    setError('');
    try {
      const res = await fetch('/api/payments/crypto/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'wallet_funding', amount }),
      });
      const data = await res.json();
      if (res.ok && data.cryptoDetails) {
        setCryptoDetails(data.cryptoDetails);
        setCryptoTxRef(data.txRef);
        setFundStep('crypto-details');
        pollPaymentStatus(data.txRef, 'crypto');
      } else { setError(data.error || 'Failed to create crypto invoice.'); }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setFunding(false); }
  };

  const handleProceedFund = () => {
    setError('');
    if (selectedMethod === 'flutterwave') { handleFlutterwaveFund(); }
    else { handleCryptoFund(); }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { setError('Please enter a valid amount.'); return; }
    if (amount > balance) { setError('Insufficient balance.'); return; }
    if (!withdrawAddress.trim()) { setError('Please enter a wallet address.'); return; }

    setWithdrawing(true);
    setError('');
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, walletAddress: withdrawAddress.trim() }),
      });
      if (res.ok) { setWithdrawDialogOpen(false); setWithdrawAmount(''); setWithdrawAddress(''); fetchWallet(); }
      else { const data = await res.json(); setError(data.error || 'Withdrawal failed.'); }
    } catch { setError('Something went wrong.'); }
    finally { setWithdrawing(false); }
  };

  const copyAddress = () => {
    if (cryptoDetails?.address) { navigator.clipboard.writeText(cryptoDetails.address); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleFundDialogClose = (open: boolean) => {
    if (!open) {
      setFundStep('method'); setCryptoDetails(null); setCryptoTxRef(null); setSelectedMethod('flutterwave'); setFundAmount('');
      if (pollRef.current) clearInterval(pollRef.current);
    }
    setFundDialogOpen(open);
  };

  const formatExpiry = (timestamp: number) => { const mins = Math.max(0, Math.floor((timestamp * 1000 - Date.now()) / 60000)); return `${mins}m`; };
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <PageWrapper title="Wallet" description="Manage your funds, view transactions, and withdraw earnings.">
      {/* Alerts */}
      {fundStep === 'verifying' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <Alert className="border-gold/30 bg-gold/5"><Loader2 className="h-4 w-4 animate-spin text-gold" /><AlertDescription className="text-gold">Verifying your crypto payment on the blockchain...</AlertDescription></Alert>
        </motion.div>
      )}
      {paymentSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Alert className="border-green-300 bg-green-50"><ArrowDownRight className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-800">{paymentSuccess}</AlertDescription></Alert>
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Alert className="border-red-300 bg-red-50"><AlertDescription className="text-red-800">{error}</AlertDescription></Alert>
          <Button variant="ghost" size="sm" className="mt-1 text-red-600 hover:text-red-800" onClick={() => setError('')}>Dismiss</Button>
        </motion.div>
      )}

      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-gold/20 bg-gradient-to-br from-gold/5 via-transparent to-orange/5">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                <p className="mt-1 text-4xl font-bold text-foreground tracking-tight">{formatCurrency(balance)}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-green-500" />Card/Bank</span>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="flex items-center gap-1"><Bitcoin className="h-3 w-3 text-orange-500" />Crypto</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="bg-gold text-white hover:bg-gold-dark" onClick={() => { setError(''); setPaymentSuccess(''); setFundDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />Fund Wallet
                </Button>
                <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/5" onClick={() => { setError(''); setPaymentSuccess(''); setWithdrawDialogOpen(true); }}>
                  <Send className="mr-2 h-4 w-4" />Withdraw
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100"><ArrowDownRight className="h-5 w-5 text-green-600" /></div><div><p className="text-xs text-muted-foreground">Total Income</p><p className="text-lg font-semibold text-foreground">{formatCurrency(transactions.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0))}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100"><ArrowUpRight className="h-5 w-5 text-red-500" /></div><div><p className="text-xs text-muted-foreground">Total Spent</p><p className="text-lg font-semibold text-foreground">{formatCurrency(transactions.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0))}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10"><DollarSign className="h-5 w-5 text-gold" /></div><div><p className="text-xs text-muted-foreground">Transactions</p><p className="text-lg font-semibold text-foreground">{transactions.length}</p></div></div></CardContent></Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader><CardTitle className="text-base">Transaction History</CardTitle><CardDescription>All your deposits, withdrawals, and earnings</CardDescription></CardHeader>
        <CardContent>
          {loading ? (<div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>) : transactions.length === 0 ? (<EmptyState icon={Wallet} title="No transactions yet" description="Start earning by referring friends or completing courses." />) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell><div className="flex items-center gap-2"><div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>{tx.type === 'credit' ? <ArrowDownRight className="h-3.5 w-3.5 text-green-600" /> : <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />}</div><span className="text-sm font-medium">{tx.description}</span></div></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>{tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Fund Wallet Dialog — Multi-step */}
      <Dialog open={fundDialogOpen} onOpenChange={handleFundDialogClose}>
        <DialogContent className="sm:max-w-md">
          <AnimatePresence mode="wait">
            {/* Step 1: Choose Method */}
            {fundStep === 'method' && (
              <motion.div key="fw-method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-gold" />Fund Wallet</DialogTitle>
                  <DialogDescription>Choose your preferred payment method.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Current Balance</Label>
                    <p className="text-2xl font-bold text-gold">{formatCurrency(balance)}</p>
                  </div>
                  <div className="space-y-2">
                    <button type="button" onClick={() => setSelectedMethod('flutterwave')} className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${selectedMethod === 'flutterwave' ? 'border-gold bg-gold/5 ring-1 ring-gold/20' : 'border-muted hover:bg-muted/50'}`}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100"><Landmark className="h-5 w-5 text-green-600" /></div>
                      <div className="flex-1"><p className="font-medium text-sm">Card / Bank Transfer</p><p className="text-xs text-muted-foreground">Visa, Mastercard, bank transfer</p></div>
                      {selectedMethod === 'flutterwave' && <Check className="h-4 w-4 text-gold" />}
                    </button>
                    <button type="button" onClick={() => setSelectedMethod('crypto')} className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${selectedMethod === 'crypto' ? 'border-gold bg-gold/5 ring-1 ring-gold/20' : 'border-muted hover:bg-muted/50'}`}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100"><Bitcoin className="h-5 w-5 text-orange-600" /></div>
                      <div className="flex-1"><p className="font-medium text-sm">Cryptocurrency</p><p className="text-xs text-muted-foreground">BTC, ETH, USDT and more</p></div>
                      {selectedMethod === 'crypto' && <Check className="h-4 w-4 text-gold" />}
                    </button>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => handleFundDialogClose(false)}>Cancel</Button>
                  <Button className="bg-gold text-white hover:bg-gold-dark" onClick={() => setFundStep('amount')}>Continue</Button>
                </DialogFooter>
              </motion.div>
            )}

            {/* Step 2: Enter Amount */}
            {fundStep === 'amount' && (
              <motion.div key="fw-amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">{selectedMethod === 'crypto' ? <Bitcoin className="h-5 w-5 text-orange-500" /> : <Landmark className="h-5 w-5 text-green-600" />}Fund via {selectedMethod === 'crypto' ? 'Crypto' : 'Card/Bank'}</DialogTitle>
                  <DialogDescription>Enter the amount you want to fund.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fundAmount">Amount (USD)</Label>
                    <Input id="fundAmount" type="number" placeholder="0.00" min="5" max="10000" step="0.01" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Minimum $5, Maximum $10,000</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Quick Amount</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {FUND_AMOUNTS.map((amt) => (
                        <Button key={amt} variant={fundAmount === String(amt) ? 'default' : 'outline'} className={fundAmount === String(amt) ? 'bg-gold text-white hover:bg-gold-dark' : ''} size="sm" onClick={() => setFundAmount(String(amt))}>${amt}</Button>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setFundStep('method')}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                  <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleProceedFund} disabled={funding}>
                    {funding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Initializing...</> : <><CreditCard className="mr-2 h-4 w-4" />Fund {fundAmount ? formatCurrency(parseFloat(fundAmount) || 0) : ''}</>}
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {/* Step 3: Crypto Payment Details */}
            {fundStep === 'crypto-details' && cryptoDetails && (
              <motion.div key="fw-crypto" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Bitcoin className="h-5 w-5 text-orange-500" />Pay with Crypto</DialogTitle>
                  <DialogDescription>Send the exact amount to the address below.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 text-center">
                    <p className="text-sm text-orange-600 font-medium">Send Exactly</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{cryptoDetails.paymentAmount} <span className="text-sm font-normal text-muted-foreground uppercase">{cryptoDetails.paymentCurrency}</span></p>
                    <p className="text-xs text-muted-foreground mt-1">≈ ${cryptoDetails.amount} USD</p>
                    <div className="flex items-center justify-center gap-1 mt-2 text-xs text-orange-600"><Clock className="h-3 w-3" /><span>Expires in ~{formatExpiry(cryptoDetails.expiresAt)}</span></div>
                  </div>
                  {cryptoDetails.qrCode && (
                    <div className="flex justify-center"><div className="rounded-lg bg-white p-2 border"><img src={cryptoDetails.qrCode} alt="QR Code" className="h-40 w-40" /></div></div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Payment Address ({cryptoDetails.network})</Label>
                    <div className="flex items-center gap-1">
                      <code className="flex-1 rounded-lg bg-muted p-2 text-xs break-all select-all">{cryptoDetails.address}</code>
                      <Button variant="outline" size="sm" className="shrink-0" onClick={copyAddress}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="h-3.5 w-3.5 mt-0.5 animate-spin text-gold" />
                    <span>This page will automatically detect your payment. You can also close and check your wallet balance later.</span>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setFundStep('amount'); }}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                  <Button variant="ghost" onClick={() => handleFundDialogClose(false)}>Close & Wait</Button>
                </DialogFooter>
              </motion.div>
            )}

            {/* Verifying */}
            {fundStep === 'verifying' && (
              <motion.div key="fw-verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto" />
                <p className="mt-4 font-medium">Verifying Payment</p>
                <p className="text-sm text-muted-foreground mt-1">Confirming your crypto payment on the blockchain...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Withdraw Funds</DialogTitle><DialogDescription>Enter the amount and your wallet address to withdraw funds.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Available Balance</Label><p className="text-2xl font-bold text-gold">{formatCurrency(balance)}</p></div>
            <div className="space-y-2"><Label htmlFor="withdrawAmount">Amount (USD)</Label><Input id="withdrawAmount" type="number" placeholder="0.00" min="0" step="0.01" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="walletAddress">Wallet Address</Label><Input id="walletAddress" type="text" placeholder="Enter your wallet address" value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button>
            <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleWithdraw} disabled={withdrawing}>{withdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{withdrawing ? 'Processing...' : 'Withdraw'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
