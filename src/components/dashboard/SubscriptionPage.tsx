'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Check,
  Star,
  Crown,
  Zap,
  Loader2,
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
  createdAt: string;
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
  const [switching, setSwitching] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
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
      // fallback
      setSubscription({
        plan: 'pro',
        status: 'active',
        startDate: '2024-03-01',
        endDate: '2024-04-01',
      });
      setPayments([
        { id: '1', amount: 29.99, status: 'completed', description: 'Pro Plan - Monthly', createdAt: '2024-03-01' },
        { id: '2', amount: 29.99, status: 'completed', description: 'Pro Plan - Monthly', createdAt: '2024-02-01' },
        { id: '3', amount: 9.99, status: 'completed', description: 'Basic Plan - Monthly', createdAt: '2024-01-01' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchPlan = async () => {
    if (!selectedPlan) return;
    setSwitching(true);
    try {
      const res = await fetch('/api/subscription/switch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      if (res.ok) {
        setPlanDialogOpen(false);
        fetchSubscription();
      }
    } catch {
      // silent fail
    } finally {
      setSwitching(false);
    }
  };

  const currentPlan = plans.find((p) => p.id === subscription.plan);

  return (
    <PageWrapper title="Subscription" description="Manage your subscription plan and billing.">
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
                onClick={() => setPlanDialogOpen(true)}
              >
                {subscription.status === 'active' ? 'Change Plan' : 'Subscribe Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
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
                        <Badge className={
                          p.status === 'completed'
                            ? 'bg-green-100 text-green-700 border-green-200'
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

      {/* Plan Switch Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Plan</DialogTitle>
            <DialogDescription>
              {selectedPlan && `You are switching to the ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan ($${plans.find(p => p.id === selectedPlan)?.price}/month).`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedPlan && (
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium capitalize">{selectedPlan} Plan</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  ${plans.find(p => p.id === selectedPlan)?.price}/month &bull; Cancel anytime
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gold text-white hover:bg-gold-dark"
              onClick={handleSwitchPlan}
              disabled={switching}
            >
              {switching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {switching ? 'Processing...' : 'Confirm Switch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
