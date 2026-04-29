import { db } from '@/lib/db';

// ====================
// MLM Configuration
// ====================

export const MLM_CONFIG = {
  // Commission levels: level -> percentage
  levels: {
    1: { percentage: 10, label: 'Direct Referral' },    // 10% from direct referrals
    2: { percentage: 5, label: 'Level 2 (Indirect)' },  // 5% from their referrals
    3: { percentage: 2, label: 'Level 3 (Extended)' },  // 2% from extended network
  },
  maxDepth: 3,
  // Referral sign-up bonus for direct referrer
  referralSignupBonus: 10,
  // Subscription commission trigger amounts by plan
  subscriptionAmounts: {
    basic: 9.99,
    pro: 29.99,
    premium: 99.99,
  },
} as const;

// ====================
// MLM Types
// ====================

export interface ReferralNode {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  referredBy: string | null;
  level: number;
  children: ReferralNode[];
  totalReferrals: number;
  totalEarnings: number;
  joinedAt: string;
  subscriptionPlan: string | null;
}

export interface CommissionSummary {
  totalEarned: number;
  level1Earnings: number;
  level2Earnings: number;
  level3Earnings: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  monthlyEarnings: { month: string; amount: number }[];
}

export interface NetworkGrowth {
  totalNetwork: number;
  directReferrals: number;
  level2Count: number;
  level3Count: number;
  recentSignups: { date: string; count: number }[];
  growthRate: number;
}

// ====================
// MLM Engine Functions
// ====================

/**
 * Get the full upstream referral chain for a user
 * Returns array of user IDs from direct referrer up to max depth
 */
export async function getReferralChain(userId: string, maxDepth: number = MLM_CONFIG.maxDepth): Promise<string[]> {
  const chain: string[] = [];
  let currentId: string | null = userId;

  for (let depth = 0; depth < maxDepth; depth++) {
    if (!currentId) break;

    const user = await db.user.findUnique({
      where: { id: currentId },
      select: { referredBy: true },
    });

    if (!user?.referredBy) break;

    // Find the referrer by their referral code
    const referrer = await db.user.findUnique({
      where: { referralCode: user.referredBy },
      select: { id: true },
    });

    if (!referrer) break;

    chain.push(referrer.id);
    currentId = referrer.id;
  }

  return chain;
}

/**
 * Distribute MLM commissions when a payment (subscription) is made
 * Goes up the referral chain and credits each level's percentage
 */
export async function distributeCommissions(
  sourceUserId: string,
  paymentId: string,
  paymentAmount: number,
  description: string = 'Subscription commission'
): Promise<{ commissions: { userId: string; amount: number; level: number }[] }> {
  const chain = await getReferralChain(sourceUserId);
  const commissions: { userId: string; amount: number; level: number }[] = [];

  for (let i = 0; i < chain.length; i++) {
    const level = i + 1;
    const config = MLM_CONFIG.levels[level as keyof typeof MLM_CONFIG.levels];
    if (!config) continue;

    const commissionAmount = parseFloat((paymentAmount * (config.percentage / 100)).toFixed(2));
    if (commissionAmount <= 0) continue;

    const userId = chain[i];

    // Create commission record
    await db.commission.create({
      data: {
        userId,
        sourceUserId,
        paymentId,
        level,
        amount: commissionAmount,
        percentage: config.percentage,
        status: 'paid',
        description: `${description} - ${config.label}`,
      },
    });

    // Credit wallet
    const wallet = await db.wallet.findUnique({ where: { userId } });
    if (wallet) {
      await db.wallet.update({
        where: { userId },
        data: { balance: { increment: commissionAmount } },
      });

      // Create transaction record
      await db.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          amount: commissionAmount,
          description: `MLM ${config.label}: ${description}`,
        },
      });

      // Create earning record
      await db.earning.create({
        data: {
          walletId: wallet.id,
          userId,
          amount: commissionAmount,
          source: 'referral',
          description: `Level ${level} commission: ${description}`,
        },
      });
    }

    // Notify user
    const sourceUser = await db.user.findUnique({ where: { id: sourceUserId }, select: { name: true } });
    await db.notification.create({
      data: {
        userId,
        title: `Level ${level} Commission!`,
        message: `You earned $${commissionAmount} from ${sourceUser?.name || 'your referral'} (${config.label}).`,
        type: 'success',
      },
    });

    // Update referral earnings total
    const existingReferral = await db.referral.findFirst({
      where: { referrerId: userId, referredId: sourceUserId },
    });
    if (existingReferral) {
      await db.referral.update({
        where: { id: existingReferral.id },
        data: { earnings: { increment: commissionAmount } },
      });
    }

    commissions.push({ userId, amount: commissionAmount, level });
  }

  return { commissions };
}

/**
 * Distribute signup bonus to direct referrer
 */
export async function distributeSignupBonus(
  newUserId: string,
  referrerId: string,
  newUserName: string
): Promise<number> {
  const bonus = MLM_CONFIG.referralSignupBonus;

  // Credit referrer wallet
  const wallet = await db.wallet.findUnique({ where: { userId: referrerId } });
  if (wallet) {
    await db.wallet.update({
      where: { userId: referrerId },
      data: { balance: { increment: bonus } },
    });

    await db.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'credit',
        amount: bonus,
        description: `Referral signup bonus for ${newUserName}`,
      },
    });

    await db.earning.create({
      data: {
        walletId: wallet.id,
        userId: referrerId,
        amount: bonus,
        source: 'referral',
        description: `Signup bonus: ${newUserName} joined`,
      },
    });
  }

  // Notify
  await db.notification.create({
    data: {
      userId: referrerId,
      title: 'New Referral!',
      message: `You earned $${bonus} as a signup bonus for ${newUserName}!`,
      type: 'success',
    },
  });

  return bonus;
}

/**
 * Build referral network tree for a user (limited depth for performance)
 */
export async function getReferralTree(userId: string, maxDepth: number = 3): Promise<ReferralNode> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      referralCode: true,
      referredBy: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true } },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Count commissions earned from this user's network
  const commissionsAgg = await db.commission.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  const directReferralCount = await db.user.count({
    where: { referredBy: user.referralCode },
  });

  const node: ReferralNode = {
    id: user.id,
    name: user.name,
    email: user.email,
    referralCode: user.referralCode,
    referredBy: user.referredBy,
    level: 0,
    children: [],
    totalReferrals: directReferralCount,
    totalEarnings: commissionsAgg._sum.amount || 0,
    joinedAt: user.createdAt.toISOString(),
    subscriptionPlan: user.subscription?.plan || null,
  };

  if (maxDepth > 0) {
    const directReferrals = await db.user.findMany({
      where: { referredBy: user.referralCode },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true } },
      },
    });

    for (const ref of directReferrals) {
      const childTree = await buildChildNode(ref, 1, maxDepth);
      node.children.push(childTree);
    }
  }

  return node;
}

async function buildChildNode(user: {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  referredBy: string | null;
  createdAt: Date;
  subscription: { plan: string; status: string } | null;
}, level: number, maxDepth: number): Promise<ReferralNode> {
  const commissionsAgg = await db.commission.aggregate({
    where: { userId: user.id },
    _sum: { amount: true },
  });

  const directCount = await db.user.count({
    where: { referredBy: user.referralCode },
  });

  const node: ReferralNode = {
    id: user.id,
    name: user.name,
    email: user.email,
    referralCode: user.referralCode,
    referredBy: user.referredBy,
    level,
    children: [],
    totalReferrals: directCount,
    totalEarnings: commissionsAgg._sum.amount || 0,
    joinedAt: user.createdAt.toISOString(),
    subscriptionPlan: user.subscription?.plan || null,
  };

  if (level < maxDepth) {
    const directReferrals = await db.user.findMany({
      where: { referredBy: user.referralCode },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true } },
      },
    });

    for (const ref of directReferrals) {
      const child = await buildChildNode(ref, level + 1, maxDepth);
      node.children.push(child);
    }
  }

  return node;
}

/**
 * Get commission summary for a user
 */
export async function getCommissionSummary(userId: string): Promise<CommissionSummary> {
  const commissions = await db.commission.findMany({
    where: { userId },
    select: { level: true, amount: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const summary: CommissionSummary = {
    totalEarned: 0,
    level1Earnings: 0,
    level2Earnings: 0,
    level3Earnings: 0,
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
    monthlyEarnings: [],
  };

  // Group by month for chart data
  const monthlyMap: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = 0;
  }

  for (const c of commissions) {
    summary.totalEarned += c.amount;

    switch (c.level) {
      case 1:
        summary.level1Earnings += c.amount;
        summary.level1Count++;
        break;
      case 2:
        summary.level2Earnings += c.amount;
        summary.level2Count++;
        break;
      case 3:
        summary.level3Earnings += c.amount;
        summary.level3Count++;
        break;
    }

    // Monthly grouping
    const monthKey = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (monthKey in monthlyMap) {
      monthlyMap[monthKey] += c.amount;
    }
  }

  summary.monthlyEarnings = Object.entries(monthlyMap).map(([month, amount]) => ({
    month,
    amount: parseFloat(amount.toFixed(2)),
  }));

  return summary;
}

/**
 * Get network growth stats
 */
export async function getNetworkGrowth(userId: string): Promise<NetworkGrowth> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (!user) {
    return { totalNetwork: 0, directReferrals: 0, level2Count: 0, level3Count: 0, recentSignups: [], growthRate: 0 };
  }

  // Direct referrals
  const directReferrals = await db.user.findMany({
    where: { referredBy: user.referralCode },
    select: { id: true, createdAt: true, referralCode: true },
  });

  const directReferralCount = directReferrals.length;

  // Level 2: referrals of my direct referrals
  let level2Count = 0;
  const level2Users: string[] = [];
  for (const dr of directReferrals) {
    const l2 = await db.user.findMany({
      where: { referredBy: dr.referralCode },
      select: { id: true, createdAt: true, referralCode: true },
    });
    level2Count += l2.length;
    level2Users.push(...l2.map(u => u.id));
  }

  // Level 3: referrals of level 2
  let level3Count = 0;
  for (let i = 0; i < level2Users.length; i++) {
    const l2RefCode = await db.user.findUnique({
      where: { id: level2Users[i] },
      select: { referralCode: true },
    });
    if (l2RefCode) {
      const l3 = await db.user.count({
        where: { referredBy: l2RefCode.referralCode },
      });
      level3Count += l3;
    }
  }

  // Recent signups (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSignupsMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    recentSignupsMap[key] = 0;
  }

  const allReferralCodes = [user.referralCode, ...directReferrals.map(r => r.referralCode)];
  const recentUsers = await db.user.findMany({
    where: {
      referredBy: { in: allReferralCodes },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true },
  });

  for (const u of recentUsers) {
    const key = u.createdAt.toISOString().split('T')[0];
    if (key in recentSignupsMap) {
      recentSignupsMap[key]++;
    }
  }

  const recentSignups = Object.entries(recentSignupsMap).map(([date, count]) => ({ date, count }));
  const totalNetwork = directReferralCount + level2Count + level3Count;

  // Growth rate: compare last 30 days vs previous 30 days
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const previousPeriodCount = await db.user.count({
    where: {
      referredBy: { in: allReferralCodes },
      createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    },
  });
  const growthRate = previousPeriodCount > 0
    ? parseFloat((((recentUsers.length - previousPeriodCount) / previousPeriodCount) * 100).toFixed(1))
    : recentUsers.length > 0 ? 100 : 0;

  return {
    totalNetwork,
    directReferrals: directReferralCount,
    level2Count,
    level3Count,
    recentSignups,
    growthRate,
  };
}

/**
 * Create a payout request
 */
export async function createPayoutRequest(data: {
  userId: string;
  amount: number;
  method: string;
  currency: string;
  walletAddress?: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
}): Promise<{ payout: any; error?: string }> {
  const { userId, amount, method, currency, walletAddress, bankName, bankAccount, bankAccountName } = data;

  // Validate minimum payout
  const MIN_PAYOUT = 10;
  if (amount < MIN_PAYOUT) {
    return { payout: null, error: `Minimum payout amount is $${MIN_PAYOUT}` };
  }

  // Validate method
  const validMethods = ['bitcoin', 'usdt', 'bank_transfer'];
  if (!validMethods.includes(method)) {
    return { payout: null, error: 'Invalid payout method' };
  }

  // Validate method-specific fields
  if (method === 'bitcoin' || method === 'usdt') {
    if (!walletAddress) {
      return { payout: null, error: 'Wallet address is required for crypto payouts' };
    }
  }

  if (method === 'bank_transfer') {
    if (!bankName || !bankAccount || !bankAccountName) {
      return { payout: null, error: 'Bank name, account number, and account holder name are required' };
    }
  }

  // Check wallet balance
  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet || wallet.balance < amount) {
    return { payout: null, error: 'Insufficient wallet balance' };
  }

  const payout = await db.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'debit',
        amount,
        description: `Payout request via ${method}`,
      },
    });

    const createdPayout = await tx.payout.create({
      data: {
        userId,
        amount,
        method,
        currency,
        walletAddress,
        bankName,
        bankAccount,
        bankAccountName,
        status: 'pending',
      },
    });

    await tx.notification.create({
      data: {
        userId,
        title: 'Payout Requested',
        message: `Your payout of $${amount.toFixed(2)} via ${method.replace('_', ' ')} has been submitted and is pending processing.`,
        type: 'info',
      },
    });

    return createdPayout;
  });

  return { payout };
}

/**
 * Process payout (admin action)
 */
export async function processPayout(payoutId: string, action: 'complete' | 'reject', txHash?: string, reference?: string, notes?: string) {
  const payout = await db.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw new Error('Payout not found');
  if (payout.status !== 'pending') throw new Error('Payout is not pending');

  if (action === 'complete') {
    await db.$transaction(async (tx) => {
      await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'completed',
          txHash,
          reference,
          processedAt: new Date(),
          notes,
        },
      });

      await tx.notification.create({
        data: {
          userId: payout.userId,
          title: 'Payout Completed!',
          message: `Your payout of $${payout.amount.toFixed(2)} via ${payout.method.replace('_', ' ')} has been processed successfully.${txHash ? ` TX: ${txHash}` : ''}${reference ? ` Ref: ${reference}` : ''}`,
          type: 'success',
        },
      });
    });
  } else {
    await db.$transaction(async (tx) => {
      await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'rejected',
          notes,
          processedAt: new Date(),
        },
      });

      const wallet = await tx.wallet.findUnique({ where: { userId: payout.userId } });
      if (wallet) {
        await tx.wallet.update({
          where: { userId: payout.userId },
          data: { balance: { increment: payout.amount } },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'credit',
            amount: payout.amount,
            description: `Refunded rejected payout (${payout.method})`,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: payout.userId,
          title: 'Payout Rejected',
          message: `Your payout of $${payout.amount.toFixed(2)} was rejected and refunded to your wallet.${notes ? ` Reason: ${notes}` : ''}`,
          type: 'warning',
        },
      });
    });
  }
}
