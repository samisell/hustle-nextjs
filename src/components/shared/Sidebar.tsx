'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Wallet,
  TrendingUp,
  Bell,
  CreditCard,
  Shield,
  GraduationCap,
  ChevronLeft,
  X,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

export type Page = 'dashboard' | 'courses' | 'referrals' | 'wallet' | 'investments' | 'notifications' | 'subscription' | 'escrow' | 'admin';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { icon: React.ElementType; label: string; page: Page }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: BookOpen, label: 'Courses', page: 'courses' },
  { icon: Users, label: 'Referrals', page: 'referrals' },
  { icon: Wallet, label: 'Wallet', page: 'wallet' },
  { icon: TrendingUp, label: 'Investments', page: 'investments' },
  { icon: Bell, label: 'Notifications', page: 'notifications' },
  { icon: CreditCard, label: 'Subscription', page: 'subscription' },
  { icon: Lock, label: 'Escrow', page: 'escrow' },
];

const adminItems: { icon: React.ElementType; label: string; page: Page }[] = [
  { icon: Shield, label: 'Admin Panel', page: 'admin' },
];

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold">
              <GraduationCap className="h-5 w-5 text-sidebar" />
            </div>
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground">Hustle</h1>
              <p className="text-xs text-gold">University</p>
            </div>
          </div>
          <button onClick={onClose} className="text-sidebar-foreground/60 hover:text-sidebar-foreground md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activePage === item.page;
              return (
                <motion.button
                  key={item.page}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigate(item.page)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-gold'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-gold')} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-gold"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Admin section */}
          {user?.role === 'admin' && (
            <div className="mt-6">
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                Admin
              </div>
              <div className="space-y-1">
                {adminItems.map((item) => {
                  const isActive = activePage === item.page;
                  return (
                    <motion.button
                      key={item.page}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavigate(item.page)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-gold'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-gold')} />
                      <span>{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/30 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name || 'User'}</p>
              <p className="truncate text-xs text-sidebar-foreground/50 capitalize">{user?.role || 'Member'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
