'use client';

import { Bell, Menu, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth';
import ThemeToggle from '@/components/shared/ThemeToggle';
import CurrencySelector from '@/components/shared/CurrencySelector';
import type { Page } from './Sidebar';

interface HeaderProps {
  onMenuToggle: () => void;
  activePage: Page;
  onNavigate?: (page: Page) => void;
  unreadCount?: number;
}

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  courses: 'Courses',
  referrals: 'Referrals',
  wallet: 'Wallet',
  investments: 'Investments',
  notifications: 'Notifications',
  subscription: 'Subscription',
  admin: 'Admin Panel',
  escrow: 'Escrow',
  profile: 'My Profile',
  settings: 'Settings',
};

export default function Header({ onMenuToggle, activePage, onNavigate, unreadCount = 0 }: HeaderProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleNavigate = (page: Page) => {
    onNavigate?.(page);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">{pageTitles[activePage]}</h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Currency Selector */}
        <CurrencySelector />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification bell - navigates to notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => handleNavigate('notifications')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 items-center justify-center p-0 text-[10px] bg-orange text-white border-0">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gold/10 text-gold font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col gap-1 p-2">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavigate('profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate('settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
