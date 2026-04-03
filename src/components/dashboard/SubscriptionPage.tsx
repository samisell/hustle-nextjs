'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
import PageWrapper from '@/components/shared/PageWrapper';
import { useAuthStore } from '@/store/auth';

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

export default function SubscriptionPage() {
  const token = useAuthStore((s) => s.token);
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
  const [verifying, setVerifying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  useEffect(() => {
    fetchSubscription();
  }, [token]);

  // Check for payment callback in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get('tx_ref');
    if (txRef && token) {
      setVerifying(true);
      verifyPayment(txRef);
      // Clean URL
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
      // fallback data for demo
      setSubscription({
        plan: 'pro',
        status: 'active',
        startDate: '2024-03-01',
        endDate: '2024-04-01',
      });
      setPayments([
        { id: '1', amount: 29.99, status: 'completed', description: 'Pro Plan - Monthly', paymentMethod: 'flutterwave', paymentType: 'subscription', txRef: 'SUB-DEMO001', createdAt: '2024-03-01', paidAt: '2024-03-01T12:00:00Z' },
        { id: '2', amount: 29.99, status: 'completed', description: 'Pro Plan - Monthly', paymentMethod: 'flutterwave', paymentType: 'subscription', txRef: 'SUB-DEMO002', createdAt: '2024-02-01', paidAt: '2024-02-01T12:00:00Z' },
        { id: '3', amount: 9.99, status: 'completed', description: 'Basic Plan - Monthly', paymentMethod: 'flutterwave', paymentType: 'subscription', txRef: 'SUB-DEMO003', createdAt: '2024-01-01', paidAt: '2024-01-01T12:00:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = useCallback(async (txRef: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/payments/verify?tx_ref=${txRef}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'completed') {
          setPaymentSuccess('Payment successful! Your subscription has been activated.');
          fetchSubscription();
        } else {
          setPaymentError('Payment verification failed. Please contact support if you were charged.');
        }
      }
    } catch {
      setPaymentError('Could not verify payment. Please check your subscription status.');
    } finally {
      setVerifying(false);
    }
  }, [token]);

  const handleSubscribe = async () => {
    if (!selectedPlan || !token) return;

    setPaying(true);
    setPaymentError('');
    setPaymentSuccess('');

    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'subscription',
          plan: selectedPlan,
        }),
      });

      const data = await res.json();

      if (res.ok && data.paymentLink) {
        // Redirect to Flutterwave checkout
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

  const currentPlan = plans.find((p) => p.id === subscription.plan);

  return (
    <PageWrapper title="Subscription" description="Manage your subscription plan and billing.">
      {/* Payment verification status */}
      {verifying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <Alert className="border-gold/30 bg-gold/5">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            <AlertDescription className="text-gold">
              Verifying your payment... Please wait.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {paymentSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Alert className="border-green-300 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {paymentSuccess}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {paymentError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Alert className="border-red-300 bg-red-50">
            <AlertDescription className="text-red-800">
              {paymentError}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-orange/5">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10">
                  {currentPlan ? (
                    <currentPlan.icon className="h-7 w-7 text-gold" />
                  ) : (
                    <CreditCard className="h-7 w-7 text-gold" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground capitalize">
                      {subscription.plan} Plan
                    </h3>
                    <Badge className={
                      subscription.status === 'active'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-muted text-muted-foreground'
                    } variant="outline">
                      {subscription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscription.status === 'active'
                      ? `Renews on ${subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}`
                      : 'No active subscription'}
                  </p>
                </div>
              </div>
              <Button
                className="bg-gold text-white hover:bg-gold-dark"
                onClick={() => {
                  setPaymentError('');
                  setPaymentSuccess('');
                  setPlanDialogOpen(true);
                }}
              >
                {subscription.status === 'active' ? 'Change Plan' : 'Subscribe Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Secure Payment Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-green-500" />
          <span>Secured by Flutterwave</span>
          <Lock className="h-3 w-3" />
        </div>
      </motion.div>

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Available Plans</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan, index) => {
            const isCurrent = plan.id === subscription.plan;
            const Icon = plan.icon;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full ${isCurrent ? 'border-gold ring-1 ring-gold/20' : ''} ${
                  (plan as any).popular ? 'border-gold/30' : ''
                }`}>
                  {(plan as any).popular && (
                    <div className="flex justify-center -mt-3">
                      <Badge className="bg-gold text-white border-0">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-gold shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${
                        isCurrent
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-gold text-white hover:bg-gold-dark'
                      }`}
                      variant={isCurrent ? 'secondary' : 'default'}
                      disabled={isCurrent}
                      onClick={() => {
                        setSelectedPlan(plan.id);
                        setPaymentError('');
                        setPaymentSuccess('');
                        setPlanDialogOpen(true);
                      }}
                    >
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
            <div className="py-8 text-center text-sm text-muted-foreground">
              No payment history yet.
            </div>
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
                      <TableCell className="text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {p.paymentMethod === 'flutterwave' ? (
                            <Badge variant="outline" className="text-xs font-normal bg-green-50 text-green-700 border-green-200">
                              <Landmark className="h-3 w-3 mr-1" />
                              Flutterwave
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs font-normal">
                              {p.paymentMethod}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          p.status === 'completed'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : p.status === 'failed'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        } variant="outline">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">${p.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Plan Selection Dialog with Payment */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gold" />
              Subscribe to Plan
            </DialogTitle>
            <DialogDescription>
              You will be redirected to Flutterwave to complete your payment securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedPlan && (
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium capitalize">{selectedPlan} Plan</h4>
                <p className="text-2xl font-bold text-gold mt-1">
                  ${plans.find(p => p.id === selectedPlan)?.price}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
                <ul className="mt-3 space-y-1">
                  {plans.find(p => p.id === selectedPlan)?.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-gold" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Payment info */}
            <div className="rounded-lg border border-muted p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Payments processed securely via Flutterwave</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Lock className="h-4 w-4" />
                <span>256-bit SSL encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <ExternalLink className="h-4 w-4" />
                <span>Pay with card, bank transfer, or mobile money</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gold text-white hover:bg-gold-dark"
              onClick={handleSubscribe}
              disabled={paying}
            >
              {paying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ${selectedPlan ? plans.find(p => p.id === selectedPlan)?.price : '0'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
