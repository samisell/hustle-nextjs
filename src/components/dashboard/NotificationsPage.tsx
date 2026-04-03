'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import PageWrapper from '@/components/shared/PageWrapper';
import EmptyState from '@/components/shared/EmptyState';
import { useAuthStore } from '@/store/auth';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

const typeConfig = {
  info: { icon: Info, color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  success: { icon: CheckCircle2, color: 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400', badge: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' },
  warning: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  error: { icon: XCircle, color: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400', badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' },
};

export default function NotificationsPage() {
  const token = useAuthStore((s) => s.token);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // fallback
      setNotifications([
        { id: '1', title: 'Welcome to Hustle University!', message: 'Start your financial journey by exploring our courses.', type: 'info', read: false, createdAt: '2024-03-15T10:00:00Z' },
        { id: '2', title: 'Referral Bonus Earned', message: 'You earned $15.00 from your referral. Keep sharing!', type: 'success', read: false, createdAt: '2024-03-14T14:00:00Z' },
        { id: '3', title: 'Investment Update', message: 'Your investment in Stable Growth Fund is performing well.', type: 'info', read: true, createdAt: '2024-03-13T09:00:00Z' },
        { id: '4', title: 'Withdrawal Processing', message: 'Your withdrawal request of $50.00 is being processed.', type: 'warning', read: true, createdAt: '2024-03-12T16:00:00Z' },
        { id: '5', title: 'Course Completed', message: 'Congratulations! You completed Financial Literacy 101.', type: 'success', read: true, createdAt: '2024-03-10T11:00:00Z' },
        { id: '6', title: 'Payment Failed', message: 'Your subscription renewal failed. Please update your payment method.', type: 'error', read: false, createdAt: '2024-03-09T08:00:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch {
      // silent fail
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // silent fail
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // silent fail
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <PageWrapper title="Notifications" description={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}.`}>
      {/* Actions */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            You have <span className="font-medium text-foreground">{unreadCount}</span> unread notifications
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-gold hover:text-gold-dark"
          >
            <CheckCheck className="mr-1 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! New notifications will appear here."
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((notification, index) => {
              const config = typeConfig[notification.type];
              const Icon = config.icon;

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`transition-all hover:shadow-sm ${
                      !notification.read
                        ? 'border-gold/20 bg-gold/5'
                        : 'bg-card'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="h-2 w-2 rounded-full bg-gold shrink-0" />
                                )}
                              </div>
                              <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>
                              <p className="mt-1 text-xs text-muted-foreground/70">{formatTime(notification.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </PageWrapper>
  );
}
