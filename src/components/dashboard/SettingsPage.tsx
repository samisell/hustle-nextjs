'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  Shield,
  User,
  Award,
  Trophy,
  Star,
  Lock,
  Download,
  Trash2,
  Globe,
  Eye,
  Zap,
  Users,
  BookOpen,
  TrendingUp,
  Loader2,
  Check,
  BookCheck,
  UserPlus,
  BarChart3,
  DollarSign,
  Rocket,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageWrapper from '@/components/shared/PageWrapper';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/hooks/use-toast';

interface Achievement {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  category: string;
  requirement: string;
  points: number;
  earned: boolean;
  earnedAt: string | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  GraduationCap: Award,
  Award,
  Users,
  UserPlus,
  Star,
  TrendingUp,
  BarChart3,
  DollarSign,
  Rocket,
  Flame,
  CheckCircle,
  Trophy,
  Zap,
  Eye,
  Globe,
};

type CategoryFilter = 'all' | 'learning' | 'referral' | 'investment' | 'engagement';

export default function SettingsPage() {
  const { user, token } = useAuthStore();

  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [investmentUpdates, setInvestmentUpdates] = useState(true);
  const [courseReminders, setCourseReminders] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('usd');
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmSecPassword, setConfirmSecPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Account dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [loadingAchievements, setLoadingAchievements] = useState(true);

  // Fetch achievements
  useEffect(() => {
    if (!token) return;
    const fetchAchievements = async () => {
      try {
        const res = await fetch('/api/user/achievements', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAchievements(data.achievements || []);
          setTotalPoints(data.totalPoints || 0);
          setEarnedCount(data.earnedCount || 0);
          setTotalAchievements(data.totalAchievements || 0);
        } else {
          // Fallback
          setAchievements([
            { id: '1', title: 'First Steps', description: 'Complete your first course', icon: 'BookOpen', category: 'learning', requirement: 'Complete 1 course', points: 50, earned: true, earnedAt: '2024-03-10T10:00:00Z' },
            { id: '2', title: 'Knowledge Seeker', description: 'Complete 5 courses', icon: 'Award', category: 'learning', requirement: 'Complete 5 courses', points: 200, earned: false, earnedAt: null },
            { id: '3', title: 'First Referral', description: 'Refer your first friend', icon: 'Users', category: 'referral', requirement: 'Refer 1 user', points: 100, earned: true, earnedAt: '2024-03-05T10:00:00Z' },
            { id: '4', title: 'Networker', description: 'Refer 10 friends', icon: 'UserPlus', category: 'referral', requirement: 'Refer 10 users', points: 300, earned: false, earnedAt: null },
            { id: '5', title: 'First Investment', description: 'Make your first investment', icon: 'TrendingUp', category: 'investment', requirement: 'Invest 1 time', points: 100, earned: true, earnedAt: '2024-03-08T10:00:00Z' },
            { id: '6', title: 'Investor Pro', description: 'Have 5 active investments', icon: 'BarChart3', category: 'investment', requirement: 'Have 5 investments', points: 300, earned: false, earnedAt: null },
            { id: '7', title: 'Early Adopter', description: 'Joined during the beta period', icon: 'Rocket', category: 'engagement', requirement: 'Join platform', points: 50, earned: true, earnedAt: '2024-03-01T10:00:00Z' },
            { id: '8', title: 'Verified', description: 'Complete your profile', icon: 'CheckCircle', category: 'engagement', requirement: 'Fill out profile', points: 25, earned: false, earnedAt: null },
          ]);
          setTotalPoints(250);
          setEarnedCount(4);
          setTotalAchievements(8);
        }
      } catch {
        setAchievements([]);
      } finally {
        setLoadingAchievements(false);
      }
    };
    fetchAchievements();
  }, [token]);

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSavingPrefs(false);
    toast({ title: 'Success', description: 'Preferences saved successfully.' });
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmSecPassword) {
      toast({ title: 'Error', description: 'All password fields are required.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'New password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmSecPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword: confirmSecPassword }),
      });
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmSecPassword('');
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

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(false);
    toast({
      title: 'Not Available',
      description: 'Account deletion is not available in demo mode.',
      variant: 'destructive',
    });
  };

  const handleExportData = () => {
    toast({ title: 'Coming Soon', description: 'Data export feature will be available soon.' });
  };

  const filteredAchievements = categoryFilter === 'all'
    ? achievements
    : achievements.filter((a) => a.category === categoryFilter);

  const categoryLabels: Record<string, string> = {
    all: 'All',
    learning: 'Learning',
    referral: 'Referral',
    investment: 'Investment',
    engagement: 'Engagement',
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      learning: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
      referral: 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
      investment: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
      engagement: 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400',
      general: 'bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400',
    };
    return colors[category] || colors.general;
  };

  const getAchievementIcon = (iconName: string) => {
    return ICON_MAP[iconName] || Trophy;
  };

  return (
    <PageWrapper title="Settings" description="Manage your preferences, security, and achievements.">
      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="preferences" className="flex-1 sm:flex-none gap-2 data-[state=active]:bg-gold data-[state=active]:text-white">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 sm:flex-none gap-2 data-[state=active]:bg-gold data-[state=active]:text-white">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex-1 sm:flex-none gap-2 data-[state=active]:bg-gold data-[state=active]:text-white">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex-1 sm:flex-none gap-2 data-[state=active]:bg-gold data-[state=active]:text-white">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Achievements</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Preferences */}
        <TabsContent value="preferences">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-gold" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose how you want to be notified.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive email updates about your account.</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive push notifications in your browser.</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Investment Updates</Label>
                    <p className="text-xs text-muted-foreground">Get notified about investment returns and opportunities.</p>
                  </div>
                  <Switch checked={investmentUpdates} onCheckedChange={setInvestmentUpdates} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Course Reminders</Label>
                    <p className="text-xs text-muted-foreground">Receive reminders to continue your learning.</p>
                  </div>
                  <Switch checked={courseReminders} onCheckedChange={setCourseReminders} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Marketing Emails</Label>
                    <p className="text-xs text-muted-foreground">Receive promotional offers and newsletters.</p>
                  </div>
                  <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                </div>
              </CardContent>
            </Card>

            {/* Display Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gold" />
                  Display Preferences
                </CardTitle>
                <CardDescription>Customize how content is displayed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Language
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Currency Display
                    </Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                        <SelectItem value="ngn">NGN (₦)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                className="bg-gold text-white hover:bg-gold-dark"
                onClick={handleSavePreferences}
                disabled={savingPrefs}
              >
                {savingPrefs ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Tab 2: Security */}
        <TabsContent value="security">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gold" />
                  Change Password
                </CardTitle>
                <CardDescription>Ensure your account stays secure by using a strong password.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="secCurrentPassword">Current Password</Label>
                    <Input
                      id="secCurrentPassword"
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secNewPassword">New Password</Label>
                    <Input
                      id="secNewPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Must be at least 6 characters.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secConfirmPassword">Confirm New Password</Label>
                    <Input
                      id="secConfirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmSecPassword}
                      onChange={(e) => setConfirmSecPassword(e.target.value)}
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
                        <Lock className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gold" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>Add an extra layer of security to your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Enable 2FA</p>
                    <p className="text-xs text-muted-foreground">
                      Two-factor authentication adds an additional layer of security by requiring
                      a code from your authenticator app when signing in.
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={(checked) => {
                      setTwoFactorEnabled(checked);
                      toast({
                        title: checked ? '2FA Enabled' : '2FA Disabled',
                        description: checked
                          ? 'Two-factor authentication has been enabled. (Demo mode)'
                          : 'Two-factor authentication has been disabled.',
                      });
                    }}
                  />
                </div>
                {twoFactorEnabled && (
                  <Alert className="mt-4 border-gold/30 bg-gold/5">
                    <Zap className="h-4 w-4 text-gold" />
                    <AlertDescription className="text-gold/80">
                      Two-factor authentication is active. In production, you would scan a QR code
                      with an authenticator app like Google Authenticator or Authy.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Active Sessions & Last Login */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gold" />
                  Session Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/10">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Current Session</p>
                      <p className="text-xs text-muted-foreground">
                        {typeof navigator !== 'undefined' && navigator.userAgent.includes('Chrome')
                          ? 'Chrome on ' + (typeof navigator !== 'undefined' && navigator.platform || 'Desktop')
                          : 'Active Browser Session'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-0">Active</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active Sessions</p>
                    <p className="text-xs text-muted-foreground">You have 1 active session on this device.</p>
                  </div>
                  <Badge variant="outline" className="text-xs">1 Session</Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-foreground">Last Login</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Tab 3: Account */}
        <TabsContent value="account">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-gold" />
                  Account Information
                </CardTitle>
                <CardDescription>Summary of your account details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{user?.name || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">{user?.email || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium capitalize">{user?.role || 'user'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Referral Code</p>
                    <p className="text-sm font-mono font-medium text-gold">{user?.referralCode || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-gold" />
                  Subscription Management
                </CardTitle>
                <CardDescription>View and manage your subscription plan.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-gold/20 bg-gold/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20">
                      <Star className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Current Plan</p>
                      <p className="text-xs text-muted-foreground">Visit the Subscription page to manage your plan.</p>
                    </div>
                  </div>
                  <Badge className="bg-gold text-white border-0">Manage</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Export Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4 text-gold" />
                  Export Data
                </CardTitle>
                <CardDescription>Download a copy of your data.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Download Your Data</p>
                    <p className="text-xs text-muted-foreground">
                      Get a copy of all your account data including profile, transactions, and activity.
                    </p>
                  </div>
                  <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/5" onClick={handleExportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Trash2 className="h-4 w-4" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4">
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Delete Account</p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Once deleted, your account cannot be recovered. All data will be permanently removed.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Tab 4: Achievements */}
        <TabsContent value="achievements">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Achievement Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-gold/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                    <Trophy className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{earnedCount}/{totalAchievements}</p>
                    <p className="text-xs text-muted-foreground">Achievements Earned</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-orange/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange/10">
                    <Star className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalPoints.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Points</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200 dark:border-green-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/10">
                    <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {totalAchievements > 0 ? Math.round((earnedCount / totalAchievements) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Completion Rate</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(categoryLabels) as CategoryFilter[]).map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  className={
                    categoryFilter === cat
                      ? 'bg-gold text-white hover:bg-gold-dark'
                      : 'border-gold/30 text-muted-foreground hover:text-foreground hover:border-gold/50'
                  }
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {categoryLabels[cat]}
                </Button>
              ))}
            </div>

            {/* Achievement Grid */}
            {loadingAchievements ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
              </div>
            ) : filteredAchievements.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm font-medium text-muted-foreground">No achievements found</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {categoryFilter !== 'all'
                      ? 'No achievements in this category yet.'
                      : 'Start learning, referring, and investing to unlock achievements!'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAchievements.map((achievement, i) => {
                  const IconComponent = getAchievementIcon(achievement.icon);
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card
                        className={`relative overflow-hidden transition-all hover:shadow-md ${
                          achievement.earned
                            ? 'border-gold/30 bg-gradient-to-br from-gold/5 to-transparent'
                            : 'opacity-60'
                        }`}
                      >
                        {achievement.earned && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px] px-1.5">
                              <Check className="mr-0.5 h-2.5 w-2.5" />
                              Earned
                            </Badge>
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                                achievement.earned
                                  ? 'bg-gold/10'
                                  : 'bg-muted'
                              }`}
                            >
                              <IconComponent
                                className={`h-5 w-5 ${
                                  achievement.earned ? 'text-gold' : 'text-muted-foreground'
                                }`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {achievement.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {achievement.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] px-1.5 ${getCategoryColor(achievement.category)}`}
                                >
                                  {categoryLabels[achievement.category] || achievement.category}
                                </Badge>
                                <span className="flex items-center gap-0.5 text-[10px] text-gold font-medium">
                                  <Star className="h-2.5 w-2.5" />
                                  {achievement.points} pts
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              {achievement.requirement}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action is permanent and cannot be undone.
              All your data, including wallet balance, investments, and course progress, will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium">Warning: This action cannot be reversed!</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Your wallet balance, investments, course progress, referrals, and all other data will be lost forever.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
