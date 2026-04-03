'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import type { Page } from '@/components/shared/Sidebar';

import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import LandingPage from '@/components/landing/LandingPage';
import LoginPage from '@/components/auth/LoginPage';
import RegisterPage from '@/components/auth/RegisterPage';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import CoursesPage from '@/components/dashboard/CoursesPage';
import ReferralsPage from '@/components/dashboard/ReferralsPage';
import WalletPage from '@/components/dashboard/WalletPage';
import InvestmentsPage from '@/components/dashboard/InvestmentsPage';
import NotificationsPage from '@/components/dashboard/NotificationsPage';
import SubscriptionPage from '@/components/dashboard/SubscriptionPage';
import AdminPage from '@/components/dashboard/AdminPage';
import EscrowPage from '@/components/dashboard/EscrowPage';

type AppView = 'landing' | 'login' | 'register' | 'dashboard';

// Use useSyncExternalStore to detect client-side mount without setState in effect
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function Home() {
  const { user, token, login, logout, isLoading } = useAuthStore();
  const mounted = useIsMounted();
  const [view, setView] = useState<AppView>('landing');
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ref to track if we've hydrated from localStorage
  const hydratedRef = useRef(false);

  // Restore auth state on mount
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      const savedToken = localStorage.getItem('hu_token');
      const savedUser = localStorage.getItem('hu_user');

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          login(parsedUser, savedToken);
        } catch {
          localStorage.removeItem('hu_token');
          localStorage.removeItem('hu_user');
          logout();
        }
      } else {
        logout();
      }
    }
  }, [login, logout]);

  // Compute the effective view: show dashboard when user is authenticated
  const isAuthenticated = mounted && !!user && !!token;

  // Handle login/register callbacks
  const handleLogin = useCallback(() => setView('login'), []);
  const handleRegister = useCallback(() => setView('register'), []);
  const handleBack = useCallback(() => setView('landing'), []);
  const handleLogout = useCallback(() => {
    logout();
    setView('landing');
  }, [logout]);

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  // Loading state
  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold animate-pulse">
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 6 3 6 3s3 0 6-3v-5" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Auth pages
  if (view === 'login') {
    return <LoginPage onBack={handleBack} onSwitchToRegister={handleRegister} />;
  }

  if (view === 'register') {
    return <RegisterPage onBack={handleBack} onSwitchToLogin={handleLogin} />;
  }

  // Landing page (no auth)
  if (!user || view === 'landing') {
    return <LandingPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // Dashboard layout (user is authenticated)
  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'courses':
        return <CoursesPage />;
      case 'referrals':
        return <ReferralsPage />;
      case 'wallet':
        return <WalletPage />;
      case 'investments':
        return <InvestmentsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'subscription':
        return <SubscriptionPage />;
      case 'escrow':
        return <EscrowPage />;
      case 'admin':
        if (user.role === 'admin') return <AdminPage />;
        return <DashboardOverview />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          activePage={activePage}
          unreadCount={3}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {renderActivePage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
