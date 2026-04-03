'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Crown,
  MessageCircle,
  Send,
  Plus,
  Pin,
  Lock,
  Reply,
  Search,
  ChevronLeft,
  Clock,
  Calendar,
  ThumbsUp,
  Mic,
  CheckCircle2,
  Eye,
  Loader2,
  Users,
  Star,
  TrendingUp,
  DollarSign,
  Award,
  ArrowUp,
  Sparkles,
  X,
  Filter,
  UserPlus,
  Hash,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PageWrapper from '@/components/shared/PageWrapper';
import EmptyState from '@/components/shared/EmptyState';
import { useAuthStore } from '@/store/auth';
import { useCurrencyStore } from '@/store/currency';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════════ */

interface LeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  avatar?: string;
  totalEarnings: number;
  totalReferrals: number;
}

interface MyRanking {
  rank: number;
  totalEarnings: number;
  totalReferrals: number;
}

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  _count: { topics: number };
}

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  author: { name: string; id: string };
  replyCount: number;
  lastReplyAt: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
}

interface ForumReply {
  id: string;
  content: string;
  author: { name: string; id: string };
  createdAt: string;
}

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  lastMessageAt: string;
  lastMessage: string;
  unreadCount: number;
  members: { userId: string; name: string }[];
}

interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  author: { name: string };
}

interface QASession {
  id: string;
  title: string;
  description: string;
  expertName: string;
  expertTitle: string;
  scheduledAt: string;
  duration: number;
  status: 'upcoming' | 'live' | 'ended';
  questionCount: number;
  _count: { questions: number };
}

interface QAQuestion {
  id: string;
  content: string;
  author: { name: string; id: string };
  upvotes: number;
  isUpvoted: boolean;
  isAnswered: boolean;
  answer?: string;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Fallback Data
   ═══════════════════════════════════════════════════════════════════════════════ */

const fallbackLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Sarah Johnson', email: 'sarah@mail.com', totalEarnings: 4850, totalReferrals: 48 },
  { rank: 2, name: 'Michael Chen', email: 'michael@mail.com', totalEarnings: 3200, totalReferrals: 35 },
  { rank: 3, name: 'Amina Okafor', email: 'amina@mail.com', totalEarnings: 2950, totalReferrals: 31 },
  { rank: 4, name: 'David Williams', email: 'david@mail.com', totalEarnings: 2100, totalReferrals: 22 },
  { rank: 5, name: 'Priya Sharma', email: 'priya@mail.com', totalEarnings: 1850, totalReferrals: 19 },
  { rank: 6, name: 'James Brown', email: 'james@mail.com', totalEarnings: 1500, totalReferrals: 16 },
  { rank: 7, name: 'Fatima Ali', email: 'fatima@mail.com', totalEarnings: 1200, totalReferrals: 13 },
  { rank: 8, name: 'Carlos Rivera', email: 'carlos@mail.com', totalEarnings: 980, totalReferrals: 10 },
  { rank: 9, name: 'Emily Taylor', email: 'emily@mail.com', totalEarnings: 750, totalReferrals: 8 },
  { rank: 10, name: 'Kwame Asante', email: 'kwame@mail.com', totalEarnings: 520, totalReferrals: 6 },
];

const fallbackMyRanking: MyRanking = { rank: 7, totalEarnings: 1200, totalReferrals: 13 };

const fallbackCategories: ForumCategory[] = [
  { id: '1', name: 'General Discussion', slug: 'general', icon: 'MessageCircle', color: '#6366F1', _count: { topics: 12 } },
  { id: '2', name: 'Trading Strategies', slug: 'trading', icon: 'TrendingUp', color: '#10B981', _count: { topics: 8 } },
  { id: '3', name: 'Investment Tips', slug: 'investments', icon: 'Sparkles', color: '#F59E0B', _count: { topics: 6 } },
  { id: '4', name: 'Course Help', slug: 'courses', icon: 'Award', color: '#8B5CF6', _count: { topics: 15 } },
  { id: '5', name: 'Off-Topic', slug: 'off-topic', icon: 'MessageCircle', color: '#EC4899', _count: { topics: 4 } },
];

const fallbackTopics: ForumTopic[] = [
  { id: 't1', title: 'Best crypto trading strategies for 2025?', content: 'Looking for advice on the best crypto trading strategies going into 2025. I\'ve been researching DeFi yield farming and it seems promising...', categoryId: '2', author: { name: 'CryptoKing', id: 'u1' }, replyCount: 8, lastReplyAt: new Date().toISOString(), isPinned: true, isLocked: false, createdAt: '2025-01-10T10:00:00Z' },
  { id: 't2', title: 'How I made my first $1000 from affiliate marketing', content: 'Sharing my journey of making my first $1000 from affiliate marketing. It took 3 months of consistent effort...', categoryId: '1', author: { name: 'SideHustleQueen', id: 'u2' }, replyCount: 15, lastReplyAt: new Date().toISOString(), isPinned: false, isLocked: false, createdAt: '2025-01-09T14:00:00Z' },
  { id: 't3', title: 'Real estate flipping in Lagos - worth it?', content: 'Has anyone tried real estate flipping in Lagos? I\'m considering investing but want to hear from people with experience...', categoryId: '3', author: { name: 'PropertyGuru', id: 'u3' }, replyCount: 5, lastReplyAt: new Date().toISOString(), isPinned: false, isLocked: false, createdAt: '2025-01-08T09:00:00Z' },
  { id: 't4', title: 'Complete guide to dropshipping from scratch', content: 'I put together a comprehensive guide on starting a dropshipping business. Covers product research, supplier finding, store setup...', categoryId: '1', author: { name: 'EcomBoss', id: 'u4' }, replyCount: 22, lastReplyAt: new Date().toISOString(), isPinned: true, isLocked: false, createdAt: '2025-01-07T16:00:00Z' },
  { id: 't5', title: 'Help with Crypto Trading course Module 3', content: 'I\'m stuck on the technical analysis section in Module 3. Can someone explain moving averages in simple terms?', categoryId: '4', author: { name: 'NewbieTrader', id: 'u5' }, replyCount: 3, lastReplyAt: new Date().toISOString(), isPinned: false, isLocked: false, createdAt: '2025-01-06T11:00:00Z' },
  { id: 't6', title: 'Freelancing on Upwork vs Fiverr - which is better?', content: 'Comparing Upwork and Fiverr for freelance work. Which platform do you prefer and why?...', categoryId: '1', author: { name: 'FreelanceNinja', id: 'u6' }, replyCount: 11, lastReplyAt: new Date().toISOString(), isPinned: false, isLocked: false, createdAt: '2025-01-05T13:00:00Z' },
];

const fallbackTopicReplies: Record<string, ForumReply[]> = {
  t1: [
    { id: 'r1', content: 'DeFi yield farming is great but watch out for impermanent loss. I recommend starting with stablecoin pairs.', author: { name: 'YieldFarmer', id: 'u10' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'r2', content: 'DCA into BTC and ETH is still the most reliable strategy. Don\'t chase quick gains.', author: { name: 'HodlerMax', id: 'u11' }, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'r3', content: 'Check out the DeFi course here, Module 4 covers all the strategies you need!', author: { name: 'CryptoKing', id: 'u1' }, createdAt: new Date(Date.now() - 10800000).toISOString() },
  ],
  t2: [
    { id: 'r4', content: 'Congratulations! What niche did you focus on?', author: { name: 'AffiliatePro', id: 'u12' }, createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'r5', content: 'Great achievement! Would love to see a detailed breakdown of your strategy.', author: { name: 'BizDev', id: 'u13' }, createdAt: new Date(Date.now() - 5400000).toISOString() },
  ],
  t3: [
    { id: 'r6', content: 'Lagos real estate is very profitable right now, especially in Lekki and Ikoyi areas.', author: { name: 'LagosInvestor', id: 'u14' }, createdAt: new Date(Date.now() - 2400000).toISOString() },
  ],
  t4: [
    { id: 'r7', content: 'This is amazing! Bookmarked for later. Thank you for sharing.', author: { name: 'DropNewbie', id: 'u15' }, createdAt: new Date(Date.now() - 600000).toISOString() },
    { id: 'r8', content: 'One thing I\'d add: always order samples before committing to a supplier.', author: { name: 'EcomBoss', id: 'u4' }, createdAt: new Date(Date.now() - 1200000).toISOString() },
  ],
  t5: [
    { id: 'r9', content: 'Moving averages smooth out price data to create a single flowing line. The 50-day MA and 200-day MA are the most common.', author: { name: 'TradingMentor', id: 'u16' }, createdAt: new Date(Date.now() - 4200000).toISOString() },
  ],
  t6: [
    { id: 'r10', content: 'Upwork for long-term clients and higher rates, Fiverr for quick gigs and building a portfolio.', author: { name: 'FreelanceNinja', id: 'u6' }, createdAt: new Date(Date.now() - 3000000).toISOString() },
    { id: 'r11', content: 'I started on Fiverr and eventually moved to Upwork. Both have their pros and cons.', author: { name: 'DevFreelancer', id: 'u17' }, createdAt: new Date(Date.now() - 6600000).toISOString() },
  ],
};

const fallbackConversations: Conversation[] = [
  { id: 'c1', name: null, isGroup: false, lastMessageAt: new Date().toISOString(), lastMessage: 'Hey, did you check out the new trading course?', unreadCount: 2, members: [{ userId: 'other1', name: 'Alice Johnson' }] },
  { id: 'c2', name: 'Investment Squad', isGroup: true, lastMessageAt: new Date(Date.now() - 3600000).toISOString(), lastMessage: 'I think we should pool funds for the Dubai deal', unreadCount: 5, members: [{ userId: 'other2', name: 'Bob Smith' }, { userId: 'other3', name: 'Carol Davis' }] },
  { id: 'c3', name: null, isGroup: false, lastMessageAt: new Date(Date.now() - 86400000).toISOString(), lastMessage: 'Thanks for the referral link!', unreadCount: 0, members: [{ userId: 'other4', name: 'David Wilson' }] },
];

const fallbackMessages: Record<string, ChatMessage[]> = {
  c1: [
    { id: 'm1', userId: 'other1', content: 'Hey! How\'s it going?', createdAt: new Date(Date.now() - 3600000).toISOString(), author: { name: 'Alice Johnson' } },
    { id: 'm2', userId: 'me', content: 'Great! Just finished the crypto course', createdAt: new Date(Date.now() - 3500000).toISOString(), author: { name: 'Me' } },
    { id: 'm3', userId: 'other1', content: 'Nice! I\'m on Module 2. The DeFi section is really good.', createdAt: new Date(Date.now() - 3400000).toISOString(), author: { name: 'Alice Johnson' } },
    { id: 'm4', userId: 'other1', content: 'Hey, did you check out the new trading course?', createdAt: new Date().toISOString(), author: { name: 'Alice Johnson' } },
  ],
  c2: [
    { id: 'm5', userId: 'other2', content: 'Guys, have you seen the new Dubai deal?', createdAt: new Date(Date.now() - 7200000).toISOString(), author: { name: 'Bob Smith' } },
    { id: 'm6', userId: 'other3', content: 'Yes! 18% ROI over 12 months is solid', createdAt: new Date(Date.now() - 7100000).toISOString(), author: { name: 'Carol Davis' } },
    { id: 'm7', userId: 'other2', content: 'I think we should pool funds for the Dubai deal', createdAt: new Date(Date.now() - 7000000).toISOString(), author: { name: 'Bob Smith' } },
  ],
  c3: [
    { id: 'm8', userId: 'other4', content: 'Hey, do you have a referral link I can use?', createdAt: new Date(Date.now() - 100000000).toISOString(), author: { name: 'David Wilson' } },
    { id: 'm9', userId: 'me', content: 'Sure! Here you go: https://hustleu.com/ref/MYCODE', createdAt: new Date(Date.now() - 99000000).toISOString(), author: { name: 'Me' } },
    { id: 'm10', userId: 'other4', content: 'Thanks for the referral link!', createdAt: new Date(Date.now() - 86400000).toISOString(), author: { name: 'David Wilson' } },
  ],
};

const fallbackSessions: QASession[] = [
  { id: 's1', title: 'Mastering Crypto Trading in 2025', description: 'Learn advanced crypto trading strategies from a professional trader with 10+ years experience.', expertName: 'Dr. Sarah Okonkwo', expertTitle: 'Professional Crypto Trader', scheduledAt: new Date(Date.now() + 7 * 86400000).toISOString(), duration: 90, status: 'upcoming', questionCount: 12, _count: { questions: 12 } },
  { id: 's2', title: 'Real Estate Investment Masterclass', description: 'Expert insights on investing in African real estate markets.', expertName: 'Chief Adebayo Johnson', expertTitle: 'Real Estate Mogul', scheduledAt: new Date(Date.now() - 3600000).toISOString(), duration: 60, status: 'live', questionCount: 8, _count: { questions: 8 } },
  { id: 's3', title: 'Freelancing Success Blueprint', description: 'How to build a 6-figure freelance business on Upwork and Fiverr.', expertName: 'Lisa Chen', expertTitle: 'Top-Rated Upwork Freelancer', scheduledAt: new Date(Date.now() - 7 * 86400000).toISOString(), duration: 60, status: 'ended', questionCount: 15, _count: { questions: 15 } },
  { id: 's4', title: 'Dropshipping from Zero to $10K/month', description: 'Step-by-step guide to building a profitable dropshipping business.', expertName: 'Mark Anderson', expertTitle: 'E-commerce Expert', scheduledAt: new Date(Date.now() - 14 * 86400000).toISOString(), duration: 45, status: 'ended', questionCount: 20, _count: { questions: 20 } },
];

const fallbackQuestions: Record<string, QAQuestion[]> = {
  s1: [
    { id: 'q1', content: 'What\'s your take on the current BTC halving cycle?', author: { name: 'CryptoKing', id: 'u1' }, upvotes: 24, isUpvoted: false, isAnswered: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'q2', content: 'How do you manage risk when trading leverage?', author: { name: 'NewbieTrader', id: 'u5' }, upvotes: 18, isUpvoted: true, isAnswered: false, createdAt: new Date(Date.now() - 72000000).toISOString() },
    { id: 'q3', content: 'Which DeFi protocols do you recommend for beginners?', author: { name: 'DeFiFan', id: 'u20' }, upvotes: 15, isUpvoted: false, isAnswered: false, createdAt: new Date(Date.now() - 50000000).toISOString() },
  ],
  s2: [
    { id: 'q4', content: 'Which African cities have the highest ROI for real estate right now?', author: { name: 'InvestorX', id: 'u21' }, upvotes: 32, isUpvoted: true, isAnswered: true, answer: 'Lagos, Nairobi, and Accra are currently top performers. Lagos leads with 12-18% annual returns in prime locations like Lekki and Victoria Island.', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'q5', content: 'What\'s the minimum capital needed to start in real estate?', author: { name: 'NewbieInvest', id: 'u22' }, upvotes: 28, isUpvoted: false, isAnswered: true, answer: 'You can start with as little as $500 through REITs or fractional ownership platforms. For direct property investment, budget at least $10,000 for entry-level opportunities.', createdAt: new Date(Date.now() - 5400000).toISOString() },
    { id: 'q6', content: 'How do you handle property management remotely?', author: { name: 'RemoteLandlord', id: 'u23' }, upvotes: 19, isUpvoted: false, isAnswered: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  ],
  s3: [
    { id: 'q7', content: 'How did you get your first client on Upwork?', author: { name: 'FreelanceNinja', id: 'u6' }, upvotes: 45, isUpvoted: true, isAnswered: true, answer: 'I started with a very low rate ($5/hr) and over-delivered on every project. After 5 five-star reviews, I raised my rate to $30/hr. The key is building a strong portfolio first.', createdAt: new Date(Date.now() - 864000000).toISOString() },
    { id: 'q8', content: 'Should I focus on one niche or be a generalist?', author: { name: 'CareerChanger', id: 'u24' }, upvotes: 38, isUpvoted: false, isAnswered: true, answer: 'Niche down! Specializing in one area (e.g., Shopify development) allows you to charge premium rates and stand out. Generalists compete on price; specialists compete on value.', createdAt: new Date(Date.now() - 800000000).toISOString() },
  ],
  s4: [
    { id: 'q9', content: 'What\'s the best product research tool for dropshipping?', author: { name: 'EcomBoss', id: 'u4' }, upvotes: 52, isUpvoted: false, isAnswered: true, answer: 'Minea and Dropispy are the best for TikTok/Instagram ads research. For AliExpress, use Sell The Trend. Always validate demand with Google Trends before sourcing.', createdAt: new Date(Date.now() - 1728000000).toISOString() },
    { id: 'q10', content: 'How do you handle shipping times from China?', author: { name: 'ImpatientSeller', id: 'u25' }, upvotes: 41, isUpvoted: true, isAnswered: true, answer: 'Use private fulfillment agents in China with 7-12 day shipping. It costs $2-4 more per unit but dramatically improves customer satisfaction and reduces refund rates.', createdAt: new Date(Date.now() - 1700000000).toISOString() },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════════ */

function getCategoryColor(categoryId: string): string {
  return fallbackCategories.find((c) => c.id === categoryId)?.color || '#6366F1';
}

function getCategoryName(categoryId: string): string {
  return fallbackCategories.find((c) => c.id === categoryId)?.name || 'General';
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getRankBadge(rank: number): { label: string; color: string } {
  if (rank === 1) return { label: 'Top Referrer', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' };
  if (rank === 2) return { label: 'Rising Star', color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20' };
  if (rank === 3) return { label: 'Community Leader', color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' };
  return { label: '', color: '' };
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-6 w-6 text-amber-500" />;
  if (rank === 2) return <Trophy className="h-6 w-6 text-gray-400" />;
  if (rank === 3) return <Trophy className="h-6 w-6 text-amber-700" />;
  return null;
}

function getRankBg(rank: number): string {
  if (rank === 1) return 'from-amber-400/20 via-amber-500/5 to-transparent';
  if (rank === 2) return 'from-gray-300/20 via-gray-400/5 to-transparent';
  if (rank === 3) return 'from-orange-400/20 via-orange-500/5 to-transparent';
  return '';
}

function getRankBorder(rank: number): string {
  if (rank === 1) return 'border-amber-400/50';
  if (rank === 2) return 'border-gray-300/50';
  if (rank === 3) return 'border-orange-400/50';
  return '';
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function CommunityPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const formatAmount = useCurrencyStore((s) => s.formatAmount);

  /* ═══ Shared State ═══ */
  const [loading, setLoading] = useState(true);

  /* ═══ Leaderboard State ═══ */
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRanking, setMyRanking] = useState<MyRanking | null>(null);

  /* ═══ Forums State ═══ */
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [topicReplies, setTopicReplies] = useState<ForumReply[]>([]);
  const [topicDetailOpen, setTopicDetailOpen] = useState(false);
  const [createTopicOpen, setCreateTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('');
  const [newTopicTags, setNewTopicTags] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [submittingTopic, setSubmittingTopic] = useState(false);
  const [loadingTopic, setLoadingTopic] = useState(false);

  /* ═══ Chat State ═══ */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ═══ AMA State ═══ */
  const [sessions, setSessions] = useState<QASession[]>([]);
  const [selectedSession, setSelectedSession] = useState<QASession | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<QAQuestion[]>([]);
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);
  const [askQuestionOpen, setAskQuestionOpen] = useState(false);
  const [questionContent, setQuestionContent] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);

  /* ═══════════════════════════════════════════════════════════════════════════
     Data Fetching
     ═══════════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    fetchAllData();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [token]);

  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchLeaderboard(),
        fetchCategories(),
        fetchTopics(),
        fetchConversations(),
        fetchSessions(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/community/leaderboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setMyRanking(data.myRank || data.myStats || null);
        return;
      }
    } catch { /* fallback */ }
    setLeaderboard(fallbackLeaderboard);
    setMyRanking(fallbackMyRanking);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/forum/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        return;
      }
    } catch { /* fallback */ }
    setCategories(fallbackCategories);
  };

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/forum/topics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
        return;
      }
    } catch { /* fallback */ }
    setTopics(fallbackTopics);
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        return;
      }
    } catch { /* fallback */ }
    setConversations(fallbackConversations);
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
        return;
      }
    } catch { /* fallback */ }
    setChatMessages(fallbackMessages[conversationId] || []);
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/qa/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        return;
      }
    } catch { /* fallback */ }
    setSessions(fallbackSessions);
  };

  const fetchSessionQuestions = async (sessionId: string) => {
    setLoadingSession(true);
    try {
      const res = await fetch(`/api/qa/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessionQuestions((data.questions || []).sort((a: QAQuestion, b: QAQuestion) => b.upvotes - a.upvotes));
        return;
      }
    } catch { /* fallback */ }
    setSessionQuestions((fallbackQuestions[sessionId] || []).sort((a, b) => b.upvotes - a.upvotes));
    setLoadingSession(false);
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     Computed Values
     ═══════════════════════════════════════════════════════════════════════════ */

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const remainingLeaderboard = useMemo(() => leaderboard.slice(3), [leaderboard]);

  const filteredTopics = useMemo(() => {
    if (activeCategory === 'all') return topics;
    return topics.filter((t) => t.categoryId === activeCategory);
  }, [topics, activeCategory]);

  const sortedTopics = useMemo(() => {
    return [...filteredTopics].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.lastReplyAt).getTime() - new Date(a.lastReplyAt).getTime();
    });
  }, [filteredTopics]);

  const upcomingSessions = useMemo(() => sessions.filter((s) => s.status === 'upcoming'), [sessions]);
  const liveSessions = useMemo(() => sessions.filter((s) => s.status === 'live'), [sessions]);
  const pastSessions = useMemo(() => sessions.filter((s) => s.status === 'ended'), [sessions]);

  const getConversationName = useCallback((conv: Conversation) => {
    if (conv.name) return conv.name;
    return conv.members.map((m) => m.name).join(', ') || 'Unknown';
  }, []);

  const getConversationInitial = useCallback((conv: Conversation) => {
    if (conv.name) return conv.name.charAt(0).toUpperCase();
    return conv.members[0]?.name?.charAt(0).toUpperCase() || '?';
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════════
     Actions
     ═══════════════════════════════════════════════════════════════════════════ */

  const openTopicDetail = useCallback((topic: ForumTopic) => {
    setSelectedTopic(topic);
    setTopicDetailOpen(true);
    setReplyContent('');
    setLoadingTopic(true);

    // Try API first
    fetch(`/api/forum/topics/${topic.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.replies) {
          setTopicReplies(data.replies);
        } else {
          setTopicReplies(fallbackTopicReplies[topic.id] || []);
        }
      })
      .catch(() => {
        setTopicReplies(fallbackTopicReplies[topic.id] || []);
      })
      .finally(() => setLoadingTopic(false));
  }, [token]);

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) {
      toast.error('Please fill in title and content.');
      return;
    }
    if (!newTopicCategory) {
      toast.error('Please select a category.');
      return;
    }
    setSubmittingTopic(true);
    try {
      const res = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTopicTitle.trim(),
          content: newTopicContent.trim(),
          categoryId: newTopicCategory,
          tags: newTopicTags.trim() ? newTopicTags.split(',').map((t) => t.trim()) : undefined,
        }),
      });
      if (res.ok) {
        toast.success('Topic created successfully!');
        setCreateTopicOpen(false);
        setNewTopicTitle('');
        setNewTopicContent('');
        setNewTopicCategory('');
        setNewTopicTags('');
        fetchTopics();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create topic.');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setSubmittingTopic(false);
    }
  };

  const handlePostReply = async () => {
    if (!replyContent.trim() || !selectedTopic) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/forum/topics/${selectedTopic.id}/replies`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim() }),
      });
      if (res.ok) {
        const newReply: ForumReply = {
          id: `r_new_${Date.now()}`,
          content: replyContent.trim(),
          author: { name: user?.name || 'You', id: user?.id || 'me' },
          createdAt: new Date().toISOString(),
        };
        setTopicReplies((prev) => [...prev, newReply]);
        setReplyContent('');
        toast.success('Reply posted!');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to post reply.');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setActiveConversation(conv);
    setShowMobileChat(true);
    fetchMessages(conv.id);
  }, [fetchMessages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversation) return;
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/chat/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageInput.trim() }),
      });
      if (res.ok) {
        const newMsg: ChatMessage = {
          id: `m_new_${Date.now()}`,
          userId: 'me',
          content: messageInput.trim(),
          createdAt: new Date().toISOString(),
          author: { name: user?.name || 'Me' },
        };
        setChatMessages((prev) => [...prev, newMsg]);
        setMessageInput('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to send message.');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartConversation = async () => {
    if (!searchUsers.trim()) {
      toast.error('Please enter a name to search.');
      return;
    }
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientName: searchUsers.trim() }),
      });
      if (res.ok) {
        toast.success('Conversation started!');
        setNewMessageOpen(false);
        setSearchUsers('');
        fetchConversations();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to start conversation.');
      }
    } catch {
      toast.error('Something went wrong.');
    }
  };

  const handleOpenAskQuestion = (session: QASession) => {
    setSelectedSession(session);
    setQuestionContent('');
    setAskQuestionOpen(true);
  };

  const handleAskQuestion = async () => {
    if (!questionContent.trim() || !selectedSession) return;
    setSubmittingQuestion(true);
    try {
      const res = await fetch(`/api/qa/sessions/${selectedSession.id}/questions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: questionContent.trim() }),
      });
      if (res.ok) {
        toast.success('Question submitted!');
        setAskQuestionOpen(false);
        setQuestionContent('');
        if (sessionDetailOpen) fetchSessionQuestions(selectedSession.id);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to submit question.');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleUpvoteQuestion = async (sessionId: string, questionId: string) => {
    try {
      const res = await fetch(`/api/qa/sessions/${sessionId}/questions/${questionId}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSessionQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, isUpvoted: !q.isUpvoted, upvotes: q.isUpvoted ? q.upvotes - 1 : q.upvotes + 1 } : q))
            .sort((a, b) => b.upvotes - a.upvotes)
        );
      }
    } catch { /* silent */ }
  };

  const handleViewSession = (session: QASession) => {
    setSelectedSession(session);
    setSessionDetailOpen(true);
    fetchSessionQuestions(session.id);
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Poll for new messages
  useEffect(() => {
    if (activeConversation) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        fetchMessages(activeConversation.id);
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConversation]);

  /* ═══════════════════════════════════════════════════════════════════════════
     Loading State
     ═══════════════════════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <PageWrapper title="Community Hub" description="Connect with fellow hustlers, share strategies, and learn from expert AMAs.">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </PageWrapper>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <PageWrapper title="Community Hub" description="Connect with fellow hustlers, share strategies, and learn from expert AMAs.">

      {/* ═══════════════════════════════════════════════════════════════════════
          Tabs
          ═══════════════════════════════════════════════════════════════════════ */}
      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leaderboard" className="text-xs sm:text-sm">
            <Trophy className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="forums" className="text-xs sm:text-sm">
            <MessageCircle className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
            Forums
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-xs sm:text-sm">
            <Send className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="amas" className="text-xs sm:text-sm">
            <Mic className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
            AMAs
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════
            Tab 1: Leaderboard
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="leaderboard">
          {leaderboard.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No leaderboard data"
              description="Start earning to climb the ranks!"
            />
          ) : (
            <div className="space-y-6">
              {/* Top 3 Podium */}
              <div className="grid gap-4 sm:grid-cols-3">
                {[topThree[1], topThree[0], topThree[2]].filter(Boolean).map((entry, i) => {
                  const actualIndex = i === 0 ? 1 : i === 1 ? 0 : 2;
                  const order = actualIndex === 0 ? 'order-2 sm:order-1' : actualIndex === 1 ? 'order-1 sm:order-2' : 'order-3 sm:order-3';
                  return (
                    <motion.div
                      key={entry.rank}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: actualIndex * 0.1 }}
                      className={order}
                    >
                      <Card className={`relative overflow-hidden ${getRankBorder(entry.rank)} border-2 ${entry.rank === 1 ? 'sm:-mt-4' : ''}`}>
                        <div className={`absolute inset-0 bg-gradient-to-b ${getRankBg(entry.rank)}`} />
                        <CardContent className="p-6 text-center relative">
                          <div className="flex justify-center mb-3">
                            {getRankIcon(entry.rank)}
                          </div>
                          <Avatar className="mx-auto h-16 w-16 mb-3">
                            <AvatarFallback className={`${entry.rank === 1 ? 'bg-amber-100 text-amber-700' : entry.rank === 2 ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700'} text-xl font-bold`}>
                              {getInitial(entry.name)}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-bold text-foreground">{entry.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{entry.email}</p>
                          <div className="mt-3 flex items-center justify-center gap-3">
                            <div className="text-center">
                              <p className="text-lg font-bold text-gold">{formatAmount(entry.totalEarnings)}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">Earnings</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div className="text-center">
                              <p className="text-lg font-bold text-foreground">{entry.totalReferrals}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">Referrals</p>
                            </div>
                          </div>
                          {getRankBadge(entry.rank).label && (
                            <Badge variant="outline" className={`mt-3 text-[10px] ${getRankBadge(entry.rank).color}`}>
                              <Star className="h-3 w-3 mr-1" />
                              {getRankBadge(entry.rank).label}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Remaining Leaderboard Table */}
              {remainingLeaderboard.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden sm:table-cell">Email</TableHead>
                            <TableHead className="text-right">Earnings</TableHead>
                            <TableHead className="text-right">Referrals</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {remainingLeaderboard.map((entry, idx) => (
                            <TableRow key={entry.rank}>
                              <TableCell className="font-bold text-muted-foreground">#{entry.rank}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="bg-muted text-xs font-medium">{getInitial(entry.name)}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-foreground">{entry.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{entry.email}</TableCell>
                              <TableCell className="text-right font-medium text-green-600 dark:text-green-400">{formatAmount(entry.totalEarnings)}</TableCell>
                              <TableCell className="text-right font-medium">{entry.totalReferrals}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* My Ranking */}
              {myRanking && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="border-gold/30 bg-gradient-to-r from-gold/5 via-transparent to-orange/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20">
                            <Trophy className="h-5 w-5 text-gold" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">My Ranking</p>
                            <p className="text-xs text-muted-foreground">
                              Rank #{myRanking.rank} out of {leaderboard.length + 5}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gold">{formatAmount(myRanking.totalEarnings)}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Earnings</p>
                          </div>
                          <Separator orientation="vertical" className="h-8" />
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">{myRanking.totalReferrals}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Referrals</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            Tab 2: Forums
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="forums">
          <div className="space-y-4">
            {/* Category Filter + New Topic */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar flex-1">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveCategory('all')}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    activeCategory === 'all' ? 'bg-gold text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  All
                </motion.button>
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <motion.button
                      key={cat.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveCategory(isActive ? 'all' : cat.id)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        isActive ? 'text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      style={isActive ? { backgroundColor: cat.color } : undefined}
                    >
                      {cat.name}
                      <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                        {cat._count.topics}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <Button
                className="bg-gold text-white hover:bg-gold-dark shrink-0"
                onClick={() => setCreateTopicOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">New Topic</span>
              </Button>
            </div>

            {/* Topic List */}
            {sortedTopics.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="No topics found"
                description={activeCategory !== 'all' ? 'No topics in this category yet.' : 'Be the first to start a discussion!'}
                action={activeCategory !== 'all' ? { label: 'View All Topics', onClick: () => setActiveCategory('all') } : { label: 'Create Topic', onClick: () => setCreateTopicOpen(true) }}
              />
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {sortedTopics.map((topic, idx) => {
                    const catColor = getCategoryColor(topic.categoryId);
                    const catName = getCategoryName(topic.categoryId);
                    return (
                      <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card
                          className="cursor-pointer hover:border-gold/30 transition-colors"
                          onClick={() => openTopicDetail(topic)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                                <AvatarFallback className="bg-gold/10 text-gold text-xs font-bold">
                                  {getInitial(topic.author.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <Badge className="text-white border-0 text-[10px]" style={{ backgroundColor: catColor }}>
                                    {catName}
                                  </Badge>
                                  {topic.isPinned && (
                                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                                      <Pin className="h-2.5 w-2.5 mr-0.5" />
                                      Pinned
                                    </Badge>
                                  )}
                                  {topic.isLocked && (
                                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                                      <Lock className="h-2.5 w-2.5 mr-0.5" />
                                      Locked
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-semibold text-foreground text-sm leading-tight">{topic.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{topic.content}</p>
                                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                                  <span>{topic.author.name}</span>
                                  <span className="flex items-center gap-0.5">
                                    <Reply className="h-3 w-3" />
                                    {topic.replyCount}
                                  </span>
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="h-3 w-3" />
                                    {formatTimeAgo(topic.lastReplyAt)}
                                  </span>
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
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            Tab 3: Messages
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="messages">
          <Card className="overflow-hidden">
            <div className="flex h-[600px]">
              {/* Conversation List */}
              <div className={`w-full md:w-1/3 border-r border-border flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Messages</h3>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setNewMessageOpen(true)}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="flex-1 custom-scrollbar">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground text-center">No conversations yet</p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border/50 ${
                          activeConversation?.id === conv.id ? 'bg-gold/5 border-l-2 border-l-gold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-muted text-xs font-bold">
                                {getConversationInitial(conv)}
                              </AvatarFallback>
                            </Avatar>
                            {conv.isGroup && (
                              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold">
                                <Users className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground truncate">{getConversationName(conv)}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{formatTimeAgo(conv.lastMessageAt)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-xs text-muted-foreground truncate">{conv.lastMessage}</span>
                              {conv.unreadCount > 0 && (
                                <span className="ml-2 shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white px-1.5">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className={`flex-1 flex flex-col ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                {activeConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-3 border-b border-border flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden h-8 w-8 p-0"
                        onClick={() => setShowMobileChat(false)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gold/10 text-gold text-xs font-bold">
                          {getConversationInitial(activeConversation)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{getConversationName(activeConversation)}</p>
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-[10px] text-muted-foreground">Online</span>
                        </div>
                      </div>
                      {activeConversation.isGroup && (
                        <Badge variant="outline" className="text-[10px]">
                          <Users className="h-2.5 w-2.5 mr-1" />
                          {activeConversation.members.length} members
                        </Badge>
                      )}
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 custom-scrollbar">
                      <div className="p-4 space-y-3">
                        {chatMessages.map((msg) => {
                          const isMine = msg.userId === 'me';
                          return (
                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                isMine
                                  ? 'bg-gold text-white rounded-br-md'
                                  : 'bg-muted text-foreground rounded-bl-md'
                              }`}>
                                {!isMine && (
                                  <p className="text-[10px] font-semibold mb-1 opacity-70">{msg.author.name}</p>
                                )}
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-muted-foreground'}`}>
                                  {formatChatTime(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Type a message..."
                          className="min-h-[40px] max-h-[100px] resize-none text-sm flex-1"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          className="bg-gold text-white hover:bg-gold-dark h-10 w-10 shrink-0"
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim() || sendingMessage}
                        >
                          {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-3">
                      <MessageCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Select a conversation</h3>
                    <p className="text-sm text-muted-foreground mt-1">Choose a conversation from the list or start a new one.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            Tab 4: Live AMAs
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="amas">
          <div className="space-y-8">
            {/* Live Sessions */}
            {liveSessions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="text-lg font-bold text-foreground">Live Now</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {liveSessions.map((session, idx) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <SessionCard
                        session={session}
                        onAskQuestion={() => handleOpenAskQuestion(session)}
                        onViewSession={() => handleViewSession(session)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-foreground">Upcoming</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {upcomingSessions.map((session, idx) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <SessionCard
                        session={session}
                        onAskQuestion={() => handleOpenAskQuestion(session)}
                        onViewSession={() => handleViewSession(session)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-bold text-foreground">Past Sessions</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {pastSessions.map((session, idx) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <SessionCard
                        session={session}
                        onAskQuestion={undefined}
                        onViewSession={() => handleViewSession(session)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {sessions.length === 0 && (
              <EmptyState
                icon={Mic}
                title="No AMA sessions yet"
                description="Check back soon for upcoming sessions with experts."
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════════════
          Create Topic Dialog
          ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={createTopicOpen} onOpenChange={setCreateTopicOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
            <DialogDescription>Start a new discussion with the community.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic-title">Title</Label>
              <Input
                id="topic-title"
                placeholder="What's your topic about?"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-category">Category</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setNewTopicCategory(cat.id === newTopicCategory ? '' : cat.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      newTopicCategory === cat.id
                        ? 'text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    style={newTopicCategory === cat.id ? { backgroundColor: cat.color } : undefined}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-content">Content</Label>
              <Textarea
                id="topic-content"
                placeholder="Share your thoughts..."
                value={newTopicContent}
                onChange={(e) => setNewTopicContent(e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-tags">Tags (optional, comma-separated)</Label>
              <Input
                id="topic-tags"
                placeholder="e.g. crypto, trading, beginner"
                value={newTopicTags}
                onChange={(e) => setNewTopicTags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTopicOpen(false)}>Cancel</Button>
            <Button
              className="bg-gold text-white hover:bg-gold-dark"
              onClick={handleCreateTopic}
              disabled={submittingTopic}
            >
              {submittingTopic ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Create Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          Topic Detail Dialog
          ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={topicDetailOpen} onOpenChange={setTopicDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedTopic && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge className="text-white border-0 text-[10px]" style={{ backgroundColor: getCategoryColor(selectedTopic.categoryId) }}>
                    {getCategoryName(selectedTopic.categoryId)}
                  </Badge>
                  {selectedTopic.isPinned && (
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                      <Pin className="h-2.5 w-2.5 mr-0.5" /> Pinned
                    </Badge>
                  )}
                  {selectedTopic.isLocked && (
                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                      <Lock className="h-2.5 w-2.5 mr-0.5" /> Locked
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl">{selectedTopic.title}</DialogTitle>
                <DialogDescription className="sr-only">Topic details</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Author info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gold/10 text-gold text-xs font-bold">
                      {getInitial(selectedTopic.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedTopic.author.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Posted {new Date(selectedTopic.createdAt).toLocaleDateString()} &middot; {formatTimeAgo(selectedTopic.createdAt)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Topic Content */}
                <div className="text-sm text-foreground whitespace-pre-wrap">{selectedTopic.content}</div>

                <Separator />

                {/* Replies */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">
                    {topicReplies.length} {topicReplies.length === 1 ? 'Reply' : 'Replies'}
                  </h4>
                  {loadingTopic ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-gold" />
                    </div>
                  ) : topicReplies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No replies yet. Be the first!</p>
                  ) : (
                    <ScrollArea className="max-h-[300px] custom-scrollbar">
                      <div className="space-y-3">
                        {topicReplies.map((reply) => (
                          <div key={reply.id} className="rounded-lg bg-muted/50 p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-muted text-[10px] font-bold">{getInitial(reply.author.name)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium text-foreground">{reply.author.name}</span>
                              <span className="text-[10px] text-muted-foreground">{formatTimeAgo(reply.createdAt)}</span>
                            </div>
                            <p className="text-sm text-foreground">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Reply Input (if not locked) */}
                {!selectedTopic.isLocked && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="reply-content">Post a Reply</Label>
                      <Textarea
                        id="reply-content"
                        placeholder="Share your thoughts..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={3}
                      />
                      <Button
                        className="bg-gold text-white hover:bg-gold-dark"
                        onClick={handlePostReply}
                        disabled={!replyContent.trim() || submittingReply}
                      >
                        {submittingReply ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Reply className="h-4 w-4 mr-1.5" />}
                        Post Reply
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          New Message Dialog
          ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>Search for a user to start chatting.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewMessageOpen(false)}>Cancel</Button>
            <Button className="bg-gold text-white hover:bg-gold-dark" onClick={handleStartConversation}>
              <Send className="h-4 w-4 mr-1.5" />
              Start Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          Ask Question Dialog
          ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={askQuestionOpen} onOpenChange={setAskQuestionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ask a Question</DialogTitle>
            <DialogDescription>
              {selectedSession ? `Ask the expert about "${selectedSession.title}"` : 'Submit your question'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your question here..."
              value={questionContent}
              onChange={(e) => setQuestionContent(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              <Hash className="h-3 w-3 inline mr-1" />
              You can ask 1 question per session. Make it count!
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAskQuestionOpen(false)}>Cancel</Button>
            <Button
              className="bg-gold text-white hover:bg-gold-dark"
              onClick={handleAskQuestion}
              disabled={!questionContent.trim() || submittingQuestion}
            >
              {submittingQuestion ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
              Submit Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          View Session Dialog
          ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={sessionDetailOpen} onOpenChange={setSessionDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedSession && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <SessionStatusBadge status={selectedSession.status} />
                </div>
                <DialogTitle className="text-xl">{selectedSession.title}</DialogTitle>
                <DialogDescription className="sr-only">Session details</DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                {/* Expert Info Card */}
                <div className="rounded-lg bg-gradient-to-r from-gold/10 via-orange/5 to-transparent border border-gold/20 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gold/20 text-gold font-bold">
                        {getInitial(selectedSession.expertName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{selectedSession.expertName}</p>
                      <p className="text-xs text-muted-foreground">{selectedSession.expertTitle}</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 mt-3">{selectedSession.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(selectedSession.scheduledAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedSession.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {selectedSession.questionCount} questions
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Questions */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ArrowUp className="h-4 w-4" />
                    Questions ({sessionQuestions.length})
                  </h4>
                  {loadingSession ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-gold" />
                    </div>
                  ) : sessionQuestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No questions yet.</p>
                  ) : (
                    <ScrollArea className="max-h-[400px] custom-scrollbar">
                      <div className="space-y-3">
                        {sessionQuestions.map((q) => (
                          <div key={q.id} className="rounded-lg border border-border p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-muted text-[9px] font-bold">{getInitial(q.author.name)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium text-foreground">{q.author.name}</span>
                                  {q.isAnswered && (
                                    <Badge variant="outline" className="text-[9px] bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
                                      <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Answered
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-foreground">{q.content}</p>
                                {q.isAnswered && q.answer && (
                                  <div className="mt-2 rounded bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20 p-2.5">
                                    <p className="text-xs text-green-700 dark:text-green-400 font-semibold mb-1 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" /> Expert Answer
                                    </p>
                                    <p className="text-sm text-foreground">{q.answer}</p>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleUpvoteQuestion(selectedSession.id, q.id)}
                                className={`flex flex-col items-center gap-0.5 shrink-0 p-1.5 rounded-lg transition-colors ${
                                  q.isUpvoted ? 'bg-gold/10 text-gold' : 'text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                <ArrowUp className="h-4 w-4" />
                                <span className="text-xs font-bold">{q.upvotes}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Ask Question Button for active sessions */}
                {(selectedSession.status === 'upcoming' || selectedSession.status === 'live') && (
                  <>
                    <Separator />
                    <Button
                      className="w-full bg-gold text-white hover:bg-gold-dark"
                      onClick={() => handleOpenAskQuestion(selectedSession)}
                    >
                      <Send className="h-4 w-4 mr-1.5" />
                      Ask a Question
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════════════════════════════ */

function SessionStatusBadge({ status }: { status: 'upcoming' | 'live' | 'ended' }) {
  const config = {
    upcoming: { label: 'Upcoming', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
    live: { label: 'LIVE', className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' },
    ended: { label: 'Ended', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20' },
  };
  const c = config[status];
  return (
    <Badge variant="outline" className={`text-[10px] ${c.className} ${status === 'live' ? 'animate-pulse' : ''}`}>
      {status === 'live' && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500" />}
      {c.label}
    </Badge>
  );
}

function SessionCard({
  session,
  onAskQuestion,
  onViewSession,
}: {
  session: QASession;
  onAskQuestion?: () => void;
  onViewSession: () => void;
}) {
  const formatAmount = useCurrencyStore((s) => s.formatAmount);
  return (
    <Card className="hover:border-gold/30 transition-colors overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Status + Expert */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-gold/10 text-gold font-bold text-sm">
                {session.expertName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{session.expertName}</p>
              <p className="text-xs text-muted-foreground">{session.expertTitle}</p>
            </div>
          </div>
          <SessionStatusBadge status={session.status} />
        </div>

        {/* Title + Description */}
        <div>
          <h4 className="font-semibold text-foreground text-sm leading-tight">{session.title}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{session.description}</p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(session.scheduledAt).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {session.duration}min
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {session.questionCount}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onAskQuestion && (
            <Button size="sm" className="flex-1 bg-gold text-white hover:bg-gold-dark" onClick={(e) => { e.stopPropagation(); onAskQuestion(); }}>
              <Send className="h-3.5 w-3.5 mr-1" />
              Ask Question
            </Button>
          )}
          <Button size="sm" variant="outline" className={onAskQuestion ? '' : 'w-full'} onClick={(e) => { e.stopPropagation(); onViewSession(); }}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            View Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
