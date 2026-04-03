'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Award,
  Edit,
  Lock,
  Copy,
  Check,
  BookOpen,
  TrendingUp,
  Users,
  Wallet,
  Key,
  Loader2,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import PageWrapper from '@/components/shared/PageWrapper';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  referralCode: string;
  bio: string | null;
  phone: string | null;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
  };
}

interface UserStats {
  totalEnrolled: number;
  completedCourses: number;
  totalInvestments: number;
  totalReferrals: number;
  walletBalance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, token, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalEnrolled: 0,
    completedCourses: 0,
    totalInvestments: 0,
    totalReferrals: 0,
    walletBalance: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/user/stats', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.user);
          setEditName(profileData.user.name || '');
          setEditBio(profileData.user.bio || '');
          setEditPhone(profileData.user.phone || '');
        } else {
          setProfile({
            name: user?.name || 'User',
            email: user?.email || '',
            role: user?.role || 'user',
            referralCode: user?.referralCode || 'N/A',
            bio: null,
            phone: null,
            createdAt: new Date().toISOString(),
            subscription: { plan: 'none', status: 'inactive', startDate: null, endDate: null },
          });
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            totalEnrolled: statsData.courses?.enrolled || 0,
            completedCourses: statsData.courses?.completed || 0,
            totalInvestments: statsData.investments?.total || 0,
            totalReferrals: statsData.referrals?.total || 0,
            walletBalance: statsData.walletBalance || 0,
          });
        } else {
          setStats({
            totalEnrolled: 3,
            completedCourses: 1,
            totalInvestments: 2,
            totalReferrals: 5,
            walletBalance: 250.75,
          });
          setRecentTransactions([
            { id: '1', type: 'credit', amount: 15, description: 'Referral Bonus', createdAt: '2024-03-15T10:00:00Z' },
            { id: '2', type: 'debit', amount: 29.99, description: 'Pro Subscription', createdAt: '2024-03-12T14:00:00Z' },
            { id: '3', type: 'credit', amount: 5, description: 'Course Completion Bonus', createdAt: '2024-03-10T09:00:00Z' },
            { id: '4', type: 'debit', amount: 100, description: 'Investment - Growth Fund', createdAt: '2024-03-08T16:00:00Z' },
            { id: '5', type: 'credit', amount: 45.5, description: 'Investment Return', createdAt: '2024-03-05T11:00:00Z' },
          ]);
        }
      } catch {
        setProfile({
          name: user?.name || 'User',
          email: user?.email || '',
          role: user?.role || 'user',
          referralCode: user?.referralCode || 'N/A',
          bio: null,
          phone: null,
          createdAt: new Date().toISOString(),
          subscription: { plan: 'none', status: 'inactive', startDate: null, endDate: null },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, user]);

  const handleSaveProfile = async () => {
    if (!editName.trim() || editName.trim().length < 2) {
      toast({ title: 'Error', description: 'Name must be at least 2 characters.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), bio: editBio, phone: editPhone }),
      });
      if (res.ok) {
        const data = await res.json();
        updateUser({ name: data.user.name });
        setProfile((prev) => prev ? { ...prev, name: data.user.name, bio: data.user.bio, phone: data.user.phone } : prev);
        setEditDialogOpen(false);
        toast({ title: 'Success', description: 'Profile updated successfully.' });
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to update profile.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'All password fields are required.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'New password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast({ title: 'Success', description: 'Password changed successfully.' });
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to change password.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  const copyReferralCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-gray-100 text-gray-700',
      pro: 'bg-gold/10 text-gold border-gold/20',
      premium: 'bg-purple-100 text-purple-700',
      none: 'bg-gray-100 text-gray-500',
    };
    return colors[plan] || colors.none;
  };

  if (loading) {
    return (
      <PageWrapper title="Profile" description="Manage your account settings and view your activity.">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </PageWrapper>
    );
  }

  const displayUser = profile || {
    name: user?.name || 'User',
    email: user?.email || '',
    role: user?.role || 'user',
    referralCode: user?.referralCode || 'N/A',
    bio: null,
    phone: null,
    createdAt: new Date().toISOString(),
    subscription: { plan: 'none', status: 'inactive', startDate: null, endDate: null },
  };

  const statCards = [
    { icon: BookOpen, label: 'Courses Enrolled', value: stats.totalEnrolled, color: 'bg-blue-100 text-blue-600' },
    { icon: Award, label: 'Courses Completed', value: stats.completedCourses, color: 'bg-green-100 text-green-600' },
    { icon: TrendingUp, label: 'Investments', value: stats.totalInvestments, color: 'bg-purple-100 text-purple-600' },
    { icon: Users, label: 'Referrals', value: stats.totalReferrals, color: 'bg-orange-100 text-orange-600' },
    { icon: Wallet, label: 'Wallet Balance', value: `$${stats.walletBalance.toFixed(2)}`, color: 'bg-gold/10 text-gold' },
  ];

  return (
    <PageWrapper title="Profile" description="Manage your account settings and view your activity.">
      {/* Profile Header Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border-gold/20 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-gold/20 via-gold/10 to-orange/10" />
          <CardContent className="relative p-6 pt-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                <div className="-mt-12">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarFallback className="bg-gold text-white text-3xl font-bold">
                      {displayUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h2 className="text-xl font-bold text-foreground">{displayUser.name}</h2>
                    <Badge variant="outline" className={getPlanBadge(displayUser.subscription.plan)}>
                      {displayUser.subscription.plan === 'none' ? 'Free Plan' : displayUser.subscription.plan.charAt(0).toUpperCase() + displayUser.subscription.plan.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{displayUser.email}</p>
                  <div className="flex items-center gap-4 mt-2 justify-center sm:justify-start">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Joined {formatDate(displayUser.createdAt)}
                    </span>
                    <Badge variant="secondary" className="capitalize text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      {displayUser.role}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                className="bg-gold text-white hover:bg-gold-dark shrink-0"
                onClick={() => {
                  setEditName(displayUser.name);
                  setEditBio(displayUser.bio || '');
                  setEditPhone(displayUser.phone || '');
                  setEditDialogOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Details Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Personal Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-gold" />
                Personal Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="text-sm font-medium text-foreground truncate">{displayUser.name}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{displayUser.email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-foreground truncate">{displayUser.phone || 'Not set'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Bio</p>
                  <p className="text-sm text-foreground line-clamp-3">{displayUser.bio || 'No bio yet. Click Edit Profile to add one.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-gold" />
                Account Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <Badge variant="outline" className="capitalize text-xs">{displayUser.role}</Badge>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Key className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Referral Code</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-sm font-mono font-medium text-gold bg-gold/10 px-2 py-0.5 rounded">
                      {displayUser.referralCode}
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyReferralCode}>
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(displayUser.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-gold" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 shrink-0">
                  <Award className="h-4 w-4 text-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Current Plan</p>
                  <Badge className={getPlanBadge(displayUser.subscription.plan)}>
                    {displayUser.subscription.plan === 'none' ? 'Free' : displayUser.subscription.plan.charAt(0).toUpperCase() + displayUser.subscription.plan.slice(1)}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Check className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={
                      displayUser.subscription.status === 'active'
                        ? 'border-green-300 text-green-700 bg-green-50'
                        : 'border-gray-300 text-gray-500 bg-gray-50'
                    }
                  >
                    {displayUser.subscription.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(displayUser.subscription.startDate || '')}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Renewal Date</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(displayUser.subscription.endDate || '')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Change Password Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-gold" />
              Change Password
            </CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Must be at least 6 characters.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                className="bg-gold text-white hover:bg-gold-dark"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold" />
              Activity Overview
            </CardTitle>
            <CardDescription>Your platform activity at a glance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {statCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center hover:border-gold/30 transition-colors"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your last 5 wallet transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No recent transactions.
              </div>
            ) : (
              <div className="relative space-y-0">
                {recentTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="flex gap-4"
                  >
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                          tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        {tx.type === 'credit' ? (
                          <ArrowDownRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      {index < recentTransactions.length - 1 && (
                        <div className="w-px flex-1 bg-border my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className={`flex-1 pb-6 ${index === recentTransactions.length - 1 ? 'pb-0' : ''}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{tx.description}</p>
                        <span
                          className={`text-sm font-semibold ${
                            tx.type === 'credit' ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-gold" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>Update your personal information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                placeholder="Your name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBio">Bio</Label>
              <Textarea
                id="editBio"
                placeholder="Tell us about yourself..."
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                placeholder="Phone number"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gold text-white hover:bg-gold-dark"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
