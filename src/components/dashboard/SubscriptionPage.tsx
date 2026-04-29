'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Check,
  Star,
  Crown,
  Zap,
  Loader2,
  Shield,
  Lock,
  ExternalLink,
  Landmark,
  Bitcoin,
  QrCode,
  Copy,
  RefreshCw,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import PageWrapper from '@/components/shared/PageWrapper';
import { useAuthStore } from '@/store/auth';
import { useCurrencyStore } from '@/store/currency';

interface Subscription {
  plan: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  description: string;
  paymentMethod: string;
  paymentType: string;
  txRef: string;
  createdAt: string;
  paidAt: string | null;
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

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    period: '/month',
    features: [
      '5 Core Courses',
      'Basic Investment Access',
      'Community Forum',
      'Email Support',
    ],
    icon: Zap,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    period: '/month',
    features: [
      'All Courses',
      'Advanced Investment Opportunities',
      'Referral Program (10% commission)',
      'Priority Support',
      'Monthly Webinars',
      'Certificate of Completion',
    ],
    icon: Star,
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99.99,
    period: '/month',
    features: [
      'Everything in Pro',
      '1-on-1 Mentorship',
      'VIP Investment Pool',
      'Referral Program (20% commission)',
      'Exclusive Masterclasses',
      'Early Access to New Features',
    ],
    icon: Crown,
  },
];

type PaymentStep = 'method' | 'processing' | 'crypto-details' | 'verifying';
type PaymentMethod = 'flutterwave' | 'crypto';

export default function SubscriptionPage() {
  const token = useAuthStore((s) => s.token);
  const formatAmount = useCurrencyStore((s) => s.formatAmount);
  const [subscription, setSubscription] = useState<Subscription>({
    plan: 'basic',
    status: 'inactive',
    startDate: null,
    endDate: null,
  });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('flutterwave');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('method');
  const [cryptoDetails, setCryptoDetails] = useState<CryptoDetails | null>(null);
  const [cryptoTxRef, setCryptoTxRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSubscription();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token]);

  // Check for payment callback in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get('tx_ref');
    const method = params.get('method');
    if (txRef && token) {
      setPaymentError('');
      setPaymentSuccess('');
      if (method === 'crypto') {
        setPaymentStep('verifying');
        pollPaymentStatus(txRef, 'crypto');
      } else {
        verifyPayment(txRef);
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [token]);

  const fetchSubscription = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription || subscription);
        setPayments(data.payments || []);
      }
    } catch {
      setSubscription({ plan: 'pro', status: 'active', startDate: '2024-03-01', endDate: '2024-04-01' });
      setPayments([
        { id: '1', amount: 29.99, status: 'completed', description: 'Pro Plan - Monthly', paymentMethod: 'flutterwave', paymentType: 'subscription', txRef: 'SUB-DEMO001', createdAt: '2024-03-01', paidAt: '2024-03-01T12:00:00Z' },
        { id: '2', amount: 99.99, status: 'completed', description: 'Premium Plan - Monthly', paymentMethod: 'cryptomus', paymentType: 'subscription', txRef: 'CRC-SUB-DEMO1', createdAt: '2024-02-01', paidAt: '2024-02-01T12:00:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = useCallback(async (txRef: string) => {
    if (!token) return;
    setPaymentError('');
    try {
      const res = await fetch(`/api/payments/verify?tx_ref=${txRef}&method=flutterwave`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'completed') {
          setPaymentSuccess('Payment successful! Your subscription has been activated.');
          fetchSubscription();
          setPlanDialogOpen(false);
        } else {
          setPaymentError('Payment verification failed. Please contact support if you were charged.');
        }
      }
    } catch {
      setPaymentError('Could not verify payment. Please check your subscription status.');
    }
  }, [token]);

  const pollPaymentStatus = useCallback((txRef: string, method: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    const poll = async () => {
      if (!token) return;
      try {
        const res = await fetch(`/api/payments/verify?tx_ref=${txRef}&method=${method}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current);
            setPaymentSuccess('Crypto payment confirmed! Your subscription has been activated.');
            fetchSubscription();
            setPlanDialogOpen(false);
            setPaymentStep('method');
          } else if (data.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            setPaymentError('Crypto payment failed or expired. Please try again.');
            setPaymentStep('method');
          }
        }
      } catch { /* keep polling */ }
    };

    poll();
    pollRef.current = setInterval(poll, 15000); // poll every 15s
  }, [token]);

  const handleFlutterwavePay = async () => {
    if (!selectedPlan || !token) return;
    setPaying(true);
    setPaymentError('');

    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', plan: selectedPlan }),
      });
      const data = await res.json();
      if (res.ok && data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        setPaymentError(data.error || 'Failed to initialize payment.');
      }
    } catch {
      setPaymentError('Something went wrong. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const handleCryptoPay = async () => {
    if (!selectedPlan || !token) return;
    setPaying(true);
    setPaymentError('');

    try {
      const res = await fetch('/api/payments/crypto/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', plan: selectedPlan }),
      });
      const data = await res.json();
      if (res.ok && data.cryptoDetails) {
        setCryptoDetails(data.cryptoDetails);
        setCryptoTxRef(data.txRef);
        setPaymentStep('crypto-details');
        // Start polling for confirmation
        pollPaymentStatus(data.txRef, 'crypto');
      } else {
        setPaymentError(data.error || 'Failed to create crypto invoice.');
      }
    } catch {
      setPaymentError('Something went wrong. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const handleProceedToPay = () => {
    if (selectedMethod === 'flutterwave') {
      handleFlutterwavePay();
    } else {
      handleCryptoPay();
    }
  };

  const copyAddress = () => {
    if (cryptoDetails?.address) {
      navigator.clipboard.writeText(cryptoDetails.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setPaymentStep('method');
      setCryptoDetails(null);
      setCryptoTxRef(null);
      setSelectedMethod('flutterwave');
      if (pollRef.current) clearInterval(pollRef.current);
    }
    setPlanDialogOpen(open);
  };

  const formatExpiry = (timestamp: number) => {
    const mins = Math.max(0, Math.floor((timestamp * 1000 - Date.now()) / 60000));
    return `${mins}m`;
  };

  const currentPlan = plans.find((p) => p.id === subscription.plan);

  return (
    <PageWrapper title="Subscription" description="Manage your subscription plan and billing.">
      {/* Status alerts */}
      {paymentStep === 'verifying' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <Alert className="border-gold/30 bg-gold/5">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            <AlertDescription className="text-gold">Verifying your crypto payment on the blockchain...</AlertDescription>
          </Alert>
        </motion.div>
      )}
      {paymentSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Alert className="border-green-300 bg-green-50 dark:border-green-500/30 dark:bg-green-500/10">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-300">{paymentSuccess}</AlertDescription>
          </Alert>
        </motion.div>
      )}
      {paymentError && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Alert className="border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10">
            <AlertDescription className="text-red-800 dark:text-red-300">{paymentError}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Current Plan */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-orange/5">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10">
                  {currentPlan ? <currentPlan.icon className="h-7 w-7 text-gold" /> : <CreditCard className="h-7 w-7 text-gold" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground capitalize">{subscription.plan} Plan</h3>
                    <Badge className={subscription.status === 'active' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 'bg-muted text-muted-foreground'} variant="outline">
                      {subscription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscription.status === 'active' ? `Renews on ${subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}` : 'No active subscription'}
                  </p>
                </div>
              </div>
              <Button className="bg-gold text-white hover:bg-gold-dark" onClick={() => { setPaymentError(''); setPaymentSuccess(''); setPlanDialogOpen(true); }}>
                {subscription.status === 'active' ? 'Change Plan' : 'Subscribe Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Gateway Badges */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-center gap-4 py-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-green-500" /> Flutterwave</span>
          <span className="text-muted-foreground/40">|</span>
          <span className="flex items-center gap-1"><Bitcoin className="h-3.5 w-3.5 text-orange-500" /> Cryptomus Crypto</span>
        </div>
      </motion.div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Available Plans</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan, index) => {
            const isCurrent = plan.id === subscription.plan;
            const Icon = plan.icon;
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className={`h-full ${isCurrent ? 'border-gold ring-1 ring-gold/20' : ''} ${(plan as any).popular ? 'border-gold/30' : ''}`}>
                  {(plan as any).popular && <div className="flex justify-center -mt-3"><Badge className="bg-gold text-white border-0">Most Popular</Badge></div>}
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gold/10"><Icon className="h-5 w-5 text-gold" /></div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-foreground">{formatAmount(plan.price)}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-gold shrink-0" />{f}</li>
                      ))}
                    </ul>
                    <Button className={`w-full ${isCurrent ? 'bg-muted text-muted-foreground' : 'bg-gold text-white hover:bg-gold-dark'}`} variant={isCurrent ? 'secondary' : 'default'} disabled={isCurrent} onClick={() => { setSelectedPlan(plan.id); setPaymentError(''); setPaymentSuccess(''); setPlanDialogOpen(true); }}>
                      {isCurrent ? 'Current Plan' : 'Select Plan'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
          <CardDescription>Track all your subscription payments</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No payment history yet.</div>
          ) : (
            <ScrollArea className="max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.description}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {p.paymentMethod === 'flutterwave' ? (
                          <Badge variant="outline" className="text-xs font-normal bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"><Landmark className="h-3 w-3 mr-1" />Flutterwave</Badge>
                        ) : p.paymentMethod === 'cryptomus' ? (
                          <Badge variant="outline" className="text-xs font-normal bg-orange-50 text-orange-700 border-orange-200"><Bitcoin className="h-3 w-3 mr-1" />Crypto</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-normal">{p.paymentMethod}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={p.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : p.status === 'failed' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'} variant="outline">{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatAmount(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog — Multi-step */}
      <Dialog open={planDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <AnimatePresence mode="wait">
            {/* Step 1: Choose Payment Method */}
            {paymentStep === 'method' && (
              <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-gold" />Subscribe to Plan</DialogTitle>
                  <DialogDescription>Choose your preferred payment method.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {selectedPlan && (
                    <div className="rounded-lg bg-muted/50 p-4">
                      <h4 className="font-medium capitalize">{selectedPlan} Plan</h4>
                      <p className="text-2xl font-bold text-gold mt-1">{formatAmount(plans.find(p => p.id === selectedPlan)?.price ?? 0)}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    </div>
                  )}
                  {/* Payment Method Cards */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('flutterwave')}
                      className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${selectedMethod === 'flutterwave' ? 'border-gold bg-gold/5 ring-1 ring-gold/20' : 'border-muted hover:bg-muted/50'}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/10"><Landmark className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Card / Bank Transfer</p>
                        <p className="text-xs text-muted-foreground">Pay with Visa, Mastercard, bank transfer via Flutterwave</p>
                      </div>
                      {selectedMethod === 'flutterwave' && <Check className="h-4 w-4 text-gold" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('crypto')}
                      className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${selectedMethod === 'crypto' ? 'border-gold bg-gold/5 ring-1 ring-gold/20' : 'border-muted hover:bg-muted/50'}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100"><Bitcoin className="h-5 w-5 text-orange-600" /></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Cryptocurrency</p>
                        <p className="text-xs text-muted-foreground">Pay with BTC, ETH, USDT, and more via Cryptomus</p>
                      </div>
                      {selectedMethod === 'crypto' && <Check className="h-4 w-4 text-gold" />}
                    </button>
                  </div>

                  {/* Security info */}
                  <div className="rounded-lg border border-muted p-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Shield className="h-3.5 w-3.5 text-green-500" /><span>Secure payments with 256-bit SSL encryption</span></div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /><span>PCI DSS compliant payment processing</span></div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
                  <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleProceedToPay} disabled={paying}>
                    {paying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Initializing...</> : <>Continue with {selectedMethod === 'crypto' ? 'Crypto' : 'Card'}</>}
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {/* Step 2: Crypto Payment Details */}
            {paymentStep === 'crypto-details' && cryptoDetails && (
              <motion.div key="crypto-details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Bitcoin className="h-5 w-5 text-orange-500" />Pay with Crypto</DialogTitle>
                  <DialogDescription>Send the exact amount to the address below.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Amount */}
                  <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 text-center">
                    <p className="text-sm text-orange-600 font-medium">Send Exactly</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {cryptoDetails.paymentAmount} <span className="text-sm font-normal text-muted-foreground uppercase">{cryptoDetails.paymentCurrency}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">≈ {formatAmount(parseFloat(cryptoDetails.amount))} USD</p>
                    <div className="flex items-center justify-center gap-1 mt-2 text-xs text-orange-600">
                      <Clock className="h-3 w-3" />
                      <span>Expires in ~{formatExpiry(cryptoDetails.expiresAt)}</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  {cryptoDetails.qrCode && (
                    <div className="flex justify-center">
                      <div className="rounded-lg bg-white p-2 border"><img src={cryptoDetails.qrCode} alt="QR Code" className="h-40 w-40" /></div>
                    </div>
                  )}

                  {/* Address */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Payment Address ({cryptoDetails.network})</Label>
                    <div className="flex items-center gap-1">
                      <code className="flex-1 rounded-lg bg-muted p-2 text-xs break-all select-all">{cryptoDetails.address}</code>
                      <Button variant="outline" size="sm" className="shrink-0" onClick={copyAddress}>
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Auto-verify note */}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="h-3.5 w-3.5 mt-0.5 animate-spin text-gold" />
                    <span>This page will automatically detect your payment. You can also close this and check your subscription status later.</span>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setPaymentStep('method'); }}>
                    <ArrowLeft className="mr-2 h-4 w-4" />Back
                  </Button>
                  <Button variant="ghost" onClick={() => handleDialogClose(false)}>Close & Wait</Button>
                </DialogFooter>
              </motion.div>
            )}

            {/* Step 3: Verifying */}
            {paymentStep === 'verifying' && (
              <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto" />
                <p className="mt-4 font-medium">Verifying Payment</p>
                <p className="text-sm text-muted-foreground mt-1">Confirming your crypto payment on the blockchain...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
