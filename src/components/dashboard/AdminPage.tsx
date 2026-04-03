'use client';

import { useState, useEffect } from 'react';
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
import PageWrapper from '@/components/shared/PageWrapper';
import { useAuthStore } from '@/store/auth';

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

export default function AdminPage() {
  const token = useAuthStore((s) => s.token);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Course creation
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    category: '',
  });
  const [creatingCourse, setCreatingCourse] = useState(false);

  // Investment creation
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
      // fallback data
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
  };

  const toggleUserRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch {
      // silent fail
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdrawal = async (id: string, action: 'approved' | 'rejected') => {
    setActionLoading(id);
    try {
      await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ withdrawalId: id, action }),
      });
      setWithdrawals((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: action } : w))
      );
    } catch {
      // silent fail
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) return;
    setCreatingCourse(true);
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCourse),
      });
      if (res.ok) {
        setCourseDialogOpen(false);
        setNewCourse({ title: '', description: '', difficulty: 'beginner', category: '' });
        fetchAdminData();
      }
    } catch {
      // silent fail
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleCreateInvestment = async () => {
    if (!newInvestment.title.trim()) return;
    setCreatingInvestment(true);
    try {
      const res = await fetch('/api/admin/investments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
    } catch {
      // silent fail
    } finally {
      setCreatingInvestment(false);
    }
  };

  return (
    <PageWrapper title="Admin Panel" description="Manage users, withdrawals, courses, and investments.">
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
        </TabsList>

        {/* Users Tab */}
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
                            <Badge className={
                              user.role === 'admin'
                                ? 'bg-gold/10 text-gold border-gold/20'
                                : 'bg-muted text-muted-foreground'
                            } variant="outline">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">${user.balance.toFixed(2)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toggleUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')
                              }
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : user.role === 'admin' ? (
                                'Demote'
                              ) : (
                                'Promote'
                              )}
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

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Withdrawal Requests ({withdrawals.filter((w) => w.status === 'pending').length} pending)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gold" />
                </div>
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
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-xs font-mono">
                            {w.walletAddress}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              w.status === 'pending'
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : w.status === 'approved'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                            } variant="outline">
                              {w.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {w.status === 'pending' && (
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleWithdrawal(w.id, 'approved')}
                                  disabled={actionLoading === w.id}
                                >
                                  {actionLoading === w.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleWithdrawal(w.id, 'rejected')}
                                  disabled={actionLoading === w.id}
                                >
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

        {/* Courses Tab */}
        <TabsContent value="courses">
          <div className="flex justify-end mb-4">
            <Button
              className="bg-gold text-white hover:bg-gold-dark"
              onClick={() => setCourseDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Course
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
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary">{c.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            c.difficulty === 'beginner'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : c.difficulty === 'intermediate'
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }>
                            {c.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{c.enrollmentsCount}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Create Course Dialog */}
          <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>Add a new course to the platform.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Title</Label>
                  <Input
                    id="courseTitle"
                    placeholder="Course title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseDesc">Description</Label>
                  <Input
                    id="courseDesc"
                    placeholder="Brief description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      placeholder="e.g., Finance"
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={newCourse.difficulty}
                      onValueChange={(v) => setNewCourse({ ...newCourse, difficulty: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                <Button
                  className="bg-gold text-white hover:bg-gold-dark"
                  onClick={handleCreateCourse}
                  disabled={creatingCourse}
                >
                  {creatingCourse && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments">
          <div className="flex justify-end mb-4">
            <Button
              className="bg-gold text-white hover:bg-gold-dark"
              onClick={() => setInvestDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Opportunity
            </Button>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Investment management interface. Create opportunities using the button above.</p>
              </div>
            </CardContent>
          </Card>

          {/* Create Investment Dialog */}
          <Dialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Investment Opportunity</DialogTitle>
                <DialogDescription>Add a new investment opportunity for users.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Investment title"
                    value={newInvestment.title}
                    onChange={(e) => setNewInvestment({ ...newInvestment, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Brief description"
                    value={newInvestment.description}
                    onChange={(e) => setNewInvestment({ ...newInvestment, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Investment ($)</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={newInvestment.minInvestment}
                      onChange={(e) => setNewInvestment({ ...newInvestment, minInvestment: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Investment ($)</Label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={newInvestment.maxInvestment}
                      onChange={(e) => setNewInvestment({ ...newInvestment, maxInvestment: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ROI (%)</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={newInvestment.roiPercent}
                      onChange={(e) => setNewInvestment({ ...newInvestment, roiPercent: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      placeholder="30 days"
                      value={newInvestment.duration}
                      onChange={(e) => setNewInvestment({ ...newInvestment, duration: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInvestDialogOpen(false)}>Cancel</Button>
                <Button
                  className="bg-gold text-white hover:bg-gold-dark"
                  onClick={handleCreateInvestment}
                  disabled={creatingInvestment}
                >
                  {creatingInvestment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
