/**
 * Escrow System Utility Library
 *
 * Core business logic for the Hustle University escrow system.
 * Handles escrow creation, funding, milestone management,
 * dispute resolution, and automatic refund processing.
 */

import { db } from '@/lib/db';

// ==================== TYPES ====================

export type EscrowType = 'deal_funding' | 'investment_deal' | 'service_payment' | 'milestone';
export type EscrowStatus = 'collecting' | 'funded' | 'active' | 'disputed' | 'partially_released' | 'released' | 'refunded' | 'cancelled' | 'expired';
export type ContributionStatus = 'pending' | 'confirmed' | 'refunded';
export type MilestoneStatus = 'pending' | 'approved' | 'released' | 'rejected';
export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface CreateEscrowInput {
  title: string;
  description?: string;
  type?: EscrowType;
  targetAmount: number;
  currency?: string;
  feePercent?: number;
  minContribution?: number;
  maxContribution?: number;
  fundingDeadline?: string; // ISO date string
  releaseDate?: string; // ISO date string
  terms?: string; // JSON string
  milestones?: Array<{ title: string; description?: string; percentage: number; order: number }>;
}

export interface ContributeInput {
  amount: number;
  paymentMethod?: 'wallet' | 'flutterwave' | 'crypto';
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate the platform fee from an amount
 */
export function calculateFee(amount: number, feePercent: number): number {
  return (amount * feePercent) / 100;
}

/**
 * Calculate net amount after platform fee
 */
export function calculateNetAmount(amount: number, feePercent: number): number {
  return amount - calculateFee(amount, feePercent);
}

/**
 * Get percentage funded for an escrow
 */
export function getFundingPercentage(collected: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min((collected / target) * 100, 100);
}

/**
 * Check if funding deadline has passed
 */
export function isDeadlinePassed(deadline: Date | string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

/**
 * Validate escrow can accept contributions
 */
export function canAcceptContributions(
  status: EscrowStatus,
  fundingDeadline?: Date | string | null
): { ok: boolean; reason?: string } {
  if (status === 'cancelled' || status === 'released' || status === 'refunded' || status === 'expired') {
    return { ok: false, reason: `Escrow is ${status} and cannot accept contributions.` };
  }
  if (status === 'disputed') {
    return { ok: false, reason: 'Escrow is under dispute. No contributions accepted.' };
  }
  if (status === 'funded' || status === 'active' || status === 'partially_released') {
    return { ok: false, reason: 'Escrow has reached its funding target.' };
  }
  if (fundingDeadline && isDeadlinePassed(fundingDeadline)) {
    return { ok: false, reason: 'Funding deadline has passed.' };
  }
  return { ok: true };
}

/**
 * Validate contribution amount against escrow rules
 */
export function validateContribution(
  amount: number,
  minContribution: number,
  maxContribution: number,
  remaining: number,
  existingContribution?: number
): { ok: boolean; reason?: string } {
  const effectiveMax = maxContribution > 0 ? maxContribution : Infinity;
  const userTotal = (existingContribution || 0) + amount;

  if (amount <= 0) {
    return { ok: false, reason: 'Amount must be greater than zero.' };
  }
  if (amount < minContribution) {
    return { ok: false, reason: `Minimum contribution is $${minContribution.toFixed(2)}.` };
  }
  if (userTotal > effectiveMax) {
    return { ok: false, reason: maxContribution > 0
      ? `Maximum contribution per user is $${maxContribution.toFixed(2)}. You have already contributed $${(existingContribution || 0).toFixed(2)}.`
      : 'Contribution exceeds remaining target.' };
  }

  if (amount > remaining) {
    return { ok: false, reason: `Only $${remaining.toFixed(2)} remaining to reach the funding target.` };
  }
  return { ok: true };
}

// ==================== CORE FUNCTIONS ====================

/**
 * Create a new escrow transaction with optional milestones
 */
export async function createEscrow(adminUserId: string, input: CreateEscrowInput) {
  const {
    title,
    description,
    type = 'deal_funding',
    targetAmount,
    currency = 'USD',
    feePercent = 0,
    minContribution = 1,
    maxContribution = 0,
    fundingDeadline,
    releaseDate,
    terms,
    milestones,
  } = input;

  if (!title || title.trim().length === 0) {
    throw new Error('Escrow title is required.');
  }
  if (targetAmount <= 0) {
    throw new Error('Target amount must be greater than zero.');
  }

  // Validate milestones percentages add up to 100
  if (milestones && milestones.length > 0) {
    const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0);
    if (totalPercentage !== 100) {
      throw new Error(`Milestone percentages must add up to 100%. Currently: ${totalPercentage}%.`);
    }
  }

  const escrow = await db.escrowTransaction.create({
    data: {
      title: title.trim(),
      description,
      type,
      targetAmount,
      currency,
      feePercent,
      minContribution,
      maxContribution,
      fundingDeadline: fundingDeadline ? new Date(fundingDeadline) : null,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      terms,
      createdBy: adminUserId,
      milestones: milestones
        ? {
            create: milestones.map((m) => ({
              title: m.title,
              description: m.description,
              order: m.order,
              percentage: m.percentage,
            })),
          }
        : undefined,
    },
    include: {
      milestones: { orderBy: { order: 'asc' } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  return escrow;
}

/**
 * Contribute to an escrow (using wallet balance)
 */
export async function contributeToEscrow(
  userId: string,
  escrowId: string,
  input: ContributeInput
) {
  const { amount, paymentMethod = 'wallet' } = input;

  // Fetch escrow
  const escrow = await db.escrowTransaction.findUnique({
    where: { id: escrowId },
    include: {
      contributions: {
        where: { userId },
        select: { amount: true, status: true },
      },
    },
  });

  if (!escrow) {
    throw new Error('Escrow not found.');
  }

  // Check if escrow accepts contributions
  const canContribute = canAcceptContributions(
    escrow.status as EscrowStatus,
    escrow.fundingDeadline
  );
  if (!canContribute.ok) {
    throw new Error(canContribute.reason);
  }

  // Calculate remaining
  const remaining = escrow.targetAmount - escrow.collectedAmount;
  const existingConfirmed = escrow.contributions
    .filter((c) => c.status === 'confirmed')
    .reduce((sum, c) => sum + c.amount, 0);

  // Validate contribution
  const validation = validateContribution(
    amount,
    escrow.minContribution,
    escrow.maxContribution,
    remaining,
    existingConfirmed
  );
  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  // If payment is via wallet, debit the wallet
  if (paymentMethod === 'wallet') {
    const wallet = await db.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error('Wallet not found.');
    }
    if (wallet.balance < amount) {
      throw new Error('Insufficient wallet balance.');
    }

    // Debit wallet
    await db.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });

    // Create wallet transaction
    await db.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'debit',
        amount,
        description: `Escrow contribution: ${escrow.title}`,
      },
    });
  }

  // Check for existing pending contribution (update it) or create new
  const existingContribution = await db.escrowContribution.findUnique({
    where: { escrowId_userId: { escrowId, userId } },
  });

  let contribution;
  if (existingContribution && existingContribution.status === 'pending') {
    // Update existing pending contribution
    contribution = await db.escrowContribution.update({
      where: { id: existingContribution.id },
      data: {
        amount: existingConfirmed + amount,
        paymentMethod,
        status: paymentMethod === 'wallet' ? 'confirmed' : 'pending',
        txRef: `ESC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        paidAt: paymentMethod === 'wallet' ? new Date() : null,
      },
    });
  } else if (existingContribution && existingContribution.status === 'confirmed') {
    // Add to existing confirmed contribution
    const newAmount = existingContribution.amount + amount;
    contribution = await db.escrowContribution.update({
      where: { id: existingContribution.id },
      data: {
        amount: newAmount,
        paymentMethod,
      },
    });
  } else {
    // Create new contribution
    contribution = await db.escrowContribution.create({
      data: {
        escrowId,
        userId,
        amount,
        paymentMethod,
        status: paymentMethod === 'wallet' ? 'confirmed' : 'pending',
        txRef: `ESC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        paidAt: paymentMethod === 'wallet' ? new Date() : null,
      },
    });
  }

  // Update escrow collected amount
  const newCollected = escrow.collectedAmount + amount;
  const newStatus = newCollected >= escrow.targetAmount ? 'funded' : escrow.status;

  await db.escrowTransaction.update({
    where: { id: escrowId },
    data: {
      collectedAmount: newCollected,
      status: newStatus,
    },
  });

  // Notify user
  await db.notification.create({
    data: {
      userId,
      title: paymentMethod === 'wallet' ? 'Escrow Contribution Confirmed' : 'Escrow Contribution Pending',
      message: paymentMethod === 'wallet'
        ? `Your contribution of $${amount.toFixed(2)} to "${escrow.title}" has been confirmed and is held in escrow.`
        : `Your contribution of $${amount.toFixed(2)} to "${escrow.title}" is pending payment confirmation.`,
      type: paymentMethod === 'wallet' ? 'success' : 'info',
    },
  });

  // If escrow just reached target, notify all contributors
  if (newCollected >= escrow.targetAmount && escrow.status !== 'funded') {
    const allContributors = await db.escrowContribution.findMany({
      where: { escrowId, status: 'confirmed' },
      select: { userId: true },
      distinct: ['userId'],
    });
    for (const c of allContributors) {
      await db.notification.create({
        data: {
          userId: c.userId,
          title: 'Escrow Fully Funded! 🎉',
          message: `The escrow "${escrow.title}" has reached its funding target of $${escrow.targetAmount.toFixed(2)}. Funds are now secured in escrow.`,
          type: 'success',
        },
      });
    }
  }

  return contribution;
}

/**
 * Release all funds from an escrow (admin action)
 * Credits each contributor's wallet with their share + proportional earnings
 */
export async function releaseFunds(
  adminUserId: string,
  escrowId: string,
  notes?: string
) {
  const escrow = await db.escrowTransaction.findUnique({
    where: { id: escrowId },
    include: {
      contributions: { where: { status: 'confirmed' } },
    },
  });

  if (!escrow) {
    throw new Error('Escrow not found.');
  }
  if (escrow.status === 'released' || escrow.status === 'refunded') {
    throw new Error(`Cannot release: escrow is already ${escrow.status}.`);
  }
  if (escrow.collectedAmount <= 0) {
    throw new Error('No funds to release.');
  }

  const totalCollected = escrow.collectedAmount;
  const platformFee = calculateFee(totalCollected, escrow.feePercent);
  const netAmount = totalCollected - platformFee;

  // Credit each contributor proportionally (net of fees)
  for (const contribution of escrow.contributions) {
    const share = (contribution.amount / totalCollected) * netAmount;

    const wallet = await db.wallet.findUnique({ where: { userId: contribution.userId } });
    if (wallet) {
      await db.wallet.update({
        where: { userId: contribution.userId },
        data: { balance: { increment: share } },
      });

      await db.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          amount: share,
          description: `Escrow release: ${escrow.title}${notes ? ` — ${notes}` : ''}`,
        },
      });

      await db.notification.create({
        data: {
          userId: contribution.userId,
          title: 'Escrow Funds Released 💰',
          message: `Your share of $${share.toFixed(2)} from "${escrow.title}" has been released to your wallet.${platformFee > 0 ? ` (Platform fee: $${platformFee.toFixed(2)})` : ''}`,
          type: 'success',
        },
      });
    }
  }

  // Update escrow status
  const updatedEscrow = await db.escrowTransaction.update({
    where: { id: escrowId },
    data: { status: 'released' },
  });

  return updatedEscrow;
}

/**
 * Refund all contributions (admin action)
 * Returns funds to each contributor's wallet
 */
export async function refundAllContributions(
  adminUserId: string,
  escrowId: string,
  reason?: string
) {
  const escrow = await db.escrowTransaction.findUnique({
    where: { id: escrowId },
    include: {
      contributions: { where: { status: 'confirmed' } },
    },
  });

  if (!escrow) {
    throw new Error('Escrow not found.');
  }
  if (escrow.status === 'released' || escrow.status === 'refunded') {
    throw new Error(`Cannot refund: escrow is already ${escrow.status}.`);
  }

  // Refund each confirmed contribution
  for (const contribution of escrow.contributions) {
    const wallet = await db.wallet.findUnique({ where: { userId: contribution.userId } });
    if (wallet) {
      await db.wallet.update({
        where: { userId: contribution.userId },
        data: { balance: { increment: contribution.amount } },
      });

      await db.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          amount: contribution.amount,
          description: `Escrow refund: ${escrow.title}${reason ? ` — ${reason}` : ''}`,
        },
      });
    }

    // Mark contribution as refunded
    await db.escrowContribution.update({
      where: { id: contribution.id },
      data: { status: 'refunded', refundedAt: new Date() },
    });

    await db.notification.create({
      data: {
        userId: contribution.userId,
        title: 'Escrow Refund Processed',
        message: `Your contribution of $${contribution.amount.toFixed(2)} from "${escrow.title}" has been refunded to your wallet.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'info',
      },
    });
  }

  // Update escrow status
  const updatedEscrow = await db.escrowTransaction.update({
    where: { id: escrowId },
    data: { status: 'refunded', collectedAmount: 0 },
  });

  return updatedEscrow;
}

/**
 * Cancel an escrow (admin action) — auto-refunds all contributions
 */
export async function cancelEscrow(
  adminUserId: string,
  escrowId: string,
  reason?: string
) {
  const escrow = await db.escrowTransaction.findUnique({
    where: { id: escrowId },
  });

  if (!escrow) {
    throw new Error('Escrow not found.');
  }
  if (escrow.status === 'released' || escrow.status === 'refunded' || escrow.status === 'cancelled') {
    throw new Error(`Cannot cancel: escrow is already ${escrow.status}.`);
  }

  // Auto-refund if there are confirmed contributions
  const confirmedContribs = await db.escrowContribution.count({
    where: { escrowId, status: 'confirmed' },
  });

  if (confirmedContribs > 0) {
    await refundAllContributions(adminUserId, escrowId, reason || 'Escrow cancelled by admin');
  }

  // Update escrow status to cancelled
  const updatedEscrow = await db.escrowTransaction.update({
    where: { id: escrowId },
    data: { status: 'cancelled' },
  });

  return updatedEscrow;
}

/**
 * Raise a dispute on an escrow (contributor action)
 */
export async function raiseDispute(
  userId: string,
  escrowId: string,
  reason: string,
  evidence?: string
) {
  const escrow = await db.escrowTransaction.findUnique({
    where: { id: escrowId },
  });

  if (!escrow) {
    throw new Error('Escrow not found.');
  }
  if (escrow.status === 'collecting' || escrow.status === 'released' || escrow.status === 'refunded' || escrow.status === 'cancelled') {
    throw new Error('Cannot raise dispute on this escrow at its current status.');
  }

  // Check user is a contributor
  const contribution = await db.escrowContribution.findUnique({
    where: { escrowId_userId: { escrowId, userId } },
  });
  if (!contribution || contribution.status !== 'confirmed') {
    throw new Error('Only confirmed contributors can raise disputes.');
  }

  const dispute = await db.escrowDispute.create({
    data: {
      escrowId,
      raisedById: userId,
      reason,
      evidence,
      status: 'open',
    },
    include: {
      raisedBy: { select: { id: true, name: true, email: true } },
    },
  });

  // Update escrow status to disputed
  await db.escrowTransaction.update({
    where: { id: escrowId },
    data: { status: 'disputed' },
  });

  // Notify admins (find all admins)
  const admins = await db.user.findMany({
    where: { role: 'admin' },
    select: { id: true },
  });
  for (const admin of admins) {
    await db.notification.create({
      data: {
        userId: admin.id,
        title: 'New Escrow Dispute ⚠️',
        message: `A dispute has been raised on "${escrow.title}" by ${dispute.raisedBy.name}. Reason: ${reason}`,
        type: 'warning',
      },
    });
  }

  return dispute;
}

/**
 * Resolve a dispute (admin action)
 */
export async function resolveDispute(
  adminUserId: string,
  disputeId: string,
  resolution: string,
  action: 'dismiss' | 'refund' | 'release'
) {
  const dispute = await db.escrowDispute.findUnique({
    where: { id: disputeId },
    include: { escrow: true },
  });

  if (!dispute) {
    throw new Error('Dispute not found.');
  }
  if (dispute.status === 'resolved' || dispute.status === 'dismissed') {
    throw new Error(`Dispute is already ${dispute.status}.`);
  }

  // Perform the action
  if (action === 'refund') {
    await refundAllContributions(adminUserId, dispute.escrowId, resolution);
  } else if (action === 'release') {
    await releaseFunds(adminUserId, dispute.escrowId, resolution);
  }

  // Update dispute
  const updatedDispute = await db.escrowDispute.update({
    where: { id: disputeId },
    data: {
      status: action === 'dismiss' ? 'dismissed' : 'resolved',
      resolution,
      resolvedBy: adminUserId,
      resolvedAt: new Date(),
    },
  });

  // If action was not dismiss, update escrow status accordingly
  if (action !== 'dismiss') {
    const newStatus = action === 'refund' ? 'refunded' : 'released';
    await db.escrowTransaction.update({
      where: { id: dispute.escrowId },
      data: { status: newStatus },
    });
  } else {
    // Dismissed — revert escrow status back to active/funded
    const escrow = await db.escrowTransaction.findUnique({
      where: { id: dispute.escrowId },
    });
    if (escrow) {
      const revertStatus = escrow.collectedAmount >= escrow.targetAmount ? 'funded' : 'active';
      await db.escrowTransaction.update({
        where: { id: dispute.escrowId },
        data: { status: revertStatus },
      });
    }
  }

  // Notify the user who raised the dispute
  await db.notification.create({
    data: {
      userId: dispute.raisedById,
      title: `Dispute ${action === 'dismiss' ? 'Dismissed' : 'Resolved'}`,
      message: `Your dispute on "${dispute.escrow.title}" has been ${action === 'dismiss' ? 'dismissed' : `resolved with action: ${action}`}. ${resolution}`,
      type: action === 'dismiss' ? 'warning' : 'success',
    },
  });

  return updatedDispute;
}

/**
 * Add a milestone to an escrow (admin action)
 */
export async function createMilestone(
  escrowId: string,
  title: string,
  description?: string,
  percentage: number = 0,
  order: number = 0
) {
  const escrow = await db.escrowTransaction.findUnique({
    where: { id: escrowId },
    include: { milestones: true },
  });

  if (!escrow) {
    throw new Error('Escrow not found.');
  }

  // Check percentage doesn't exceed 100 minus existing milestones
  const existingPercentage = escrow.milestones.reduce((sum, m) => sum + m.percentage, 0);
  if (existingPercentage + percentage > 100) {
    throw new Error(`Milestone percentages would exceed 100%. Current: ${existingPercentage}%, Adding: ${percentage}%.`);
  }

  const milestone = await db.escrowMilestone.create({
    data: {
      escrowId,
      title,
      description,
      percentage,
      order,
    },
  });

  return milestone;
}

/**
 * Release a specific milestone (admin action)
 * Credits contributors proportionally based on milestone percentage
 */
export async function releaseMilestone(
  adminUserId: string,
  milestoneId: string,
  releaseNotes?: string
) {
  const milestone = await db.escrowMilestone.findUnique({
    where: { id: milestoneId },
    include: {
      escrow: {
        include: {
          contributions: { where: { status: 'confirmed' } },
        },
      },
    },
  });

  if (!milestone) {
    throw new Error('Milestone not found.');
  }
  if (milestone.status === 'released') {
    throw new Error('Milestone has already been released.');
  }

  const escrow = milestone.escrow;
  const totalCollected = escrow.collectedAmount;
  const milestoneAmount = (escrow.targetAmount * milestone.percentage) / 100;
  const platformFee = calculateFee(milestoneAmount, escrow.feePercent);
  const netMilestoneAmount = milestoneAmount - platformFee;

  // Credit each contributor proportionally
  for (const contribution of escrow.contributions) {
    const share = (contribution.amount / totalCollected) * netMilestoneAmount;

    const wallet = await db.wallet.findUnique({ where: { userId: contribution.userId } });
    if (wallet) {
      await db.wallet.update({
        where: { userId: contribution.userId },
        data: { balance: { increment: share } },
      });

      await db.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          amount: share,
          description: `Milestone release: ${milestone.title} — ${escrow.title}`,
        },
      });

      await db.notification.create({
        data: {
          userId: contribution.userId,
          title: 'Milestone Funds Released 🎉',
          message: `Milestone "${milestone.title}" for "${escrow.title}" has been released. Your share: $${share.toFixed(2)}`,
          type: 'success',
        },
      });
    }
  }

  // Update milestone status
  const updatedMilestone = await db.escrowMilestone.update({
    where: { id: milestoneId },
    data: {
      status: 'released',
      approvedBy: adminUserId,
      approvedAt: new Date(),
      releasedAt: new Date(),
      releaseNotes,
    },
  });

  // Check if all milestones are released
  const allMilestones = await db.escrowMilestone.findMany({
    where: { escrowId: escrow.id },
  });
  const allReleased = allMilestones.every((m) => m.status === 'released');

  if (allReleased) {
    await db.escrowTransaction.update({
      where: { id: escrow.id },
      data: { status: 'released' },
    });
  } else {
    // Some milestones released, some pending
    await db.escrowTransaction.update({
      where: { id: escrow.id },
      data: { status: 'partially_released' },
    });
  }

  return updatedMilestone;
}

/**
 * Check and process expired escrows (run periodically via cron)
 * Auto-refunds contributions if target not met by deadline
 */
export async function processExpiredEscrows() {
  const now = new Date();
  const expiredEscrows = await db.escrowTransaction.findMany({
    where: {
      status: 'collecting',
      fundingDeadline: { lte: now },
    },
    include: {
      contributions: { where: { status: 'confirmed' } },
    },
  });

  const processed: string[] = [];

  for (const escrow of expiredEscrows) {
    if (escrow.collectedAmount < escrow.targetAmount) {
      // Target not met — auto refund
      for (const contribution of escrow.contributions) {
        const wallet = await db.wallet.findUnique({ where: { userId: contribution.userId } });
        if (wallet) {
          await db.wallet.update({
            where: { userId: contribution.userId },
            data: { balance: { increment: contribution.amount } },
          });

          await db.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'credit',
              amount: contribution.amount,
              description: `Escrow expired refund: ${escrow.title}`,
            },
          });
        }

        await db.escrowContribution.update({
          where: { id: contribution.id },
          data: { status: 'refunded', refundedAt: new Date() },
        });

        await db.notification.create({
          data: {
            userId: contribution.userId,
            title: 'Escrow Expired — Auto Refund',
            message: `The escrow "${escrow.title}" did not reach its funding target by the deadline. Your contribution of $${contribution.amount.toFixed(2)} has been refunded.`,
            type: 'warning',
          },
        });
      }

      await db.escrowTransaction.update({
        where: { id: escrow.id },
        data: { status: 'expired', collectedAmount: 0 },
      });

      processed.push(escrow.id);
    } else {
      // Target met by deadline — mark as funded
      await db.escrowTransaction.update({
        where: { id: escrow.id },
        data: { status: 'funded' },
      });
      processed.push(escrow.id);
    }
  }

  return processed;
}
