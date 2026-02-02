// ============================================
// Referral System
// Phase I: Diamond Status - v1.15.0
// ============================================

export interface ReferralCode {
  id: string;
  code: string;
  userId: string;
  userName: string;
  uses: number;
  maxUses: number | null; // null = unlimited
  xpPerReferral: number;
  bonusXpThresholds: BonusThreshold[];
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface BonusThreshold {
  count: number;
  bonusXp: number;
  badge?: string;
  message: string;
}

export interface Referral {
  id: string;
  referralCodeId: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  status: 'pending' | 'completed' | 'rewarded';
  xpAwarded: number;
  bonusXpAwarded: number;
  createdAt: Date;
  completedAt: Date | null;
  rewardedAt: Date | null;
}

export interface ReferralStats {
  userId: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalXpEarned: number;
  currentTier: ReferralTier;
  nextTierProgress: number;
  referralCode: string;
}

export type ReferralTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// ============================================
// REFERRAL CONFIGURATION
// ============================================

export const REFERRAL_CONFIG = {
  baseXpPerReferral: 50,
  referredUserXp: 25, // XP for the person who was referred
  
  // Completion criteria
  completionRequirements: {
    daysActive: 7,          // Referred user must be active for 7 days
    eventsAttended: 1,      // Must attend at least 1 event
    profileComplete: true,  // Must complete profile
  },
  
  // Tier thresholds
  tiers: {
    bronze: { minReferrals: 0, multiplier: 1.0, badge: '🥉' },
    silver: { minReferrals: 5, multiplier: 1.25, badge: '🥈' },
    gold: { minReferrals: 15, multiplier: 1.5, badge: '🥇' },
    platinum: { minReferrals: 30, multiplier: 1.75, badge: '💎' },
    diamond: { minReferrals: 50, multiplier: 2.0, badge: '👑' },
  },
  
  // Milestone bonuses
  milestones: [
    { count: 1, bonusXp: 25, message: 'First Friend! 🎉' },
    { count: 5, bonusXp: 100, badge: 'Connector', message: 'Silver Tier Unlocked! 🥈' },
    { count: 10, bonusXp: 200, message: 'Double Digits! 🔟' },
    { count: 15, bonusXp: 300, badge: 'Ambassador', message: 'Gold Tier Unlocked! 🥇' },
    { count: 25, bonusXp: 500, message: 'Quarter Century! 🌟' },
    { count: 30, bonusXp: 750, badge: 'Champion', message: 'Platinum Tier Unlocked! 💎' },
    { count: 50, bonusXp: 1000, badge: 'Legend', message: 'Diamond Tier Unlocked! 👑' },
    { count: 100, bonusXp: 2500, badge: 'Founding Father', message: 'Century Club! 💯' },
  ],
};

// ============================================
// REFERRAL FUNCTIONS
// ============================================

/**
 * Generate a unique referral code
 */
export function generateReferralCode(userName: string): string {
  // Use first 4 chars of username + random string
  const prefix = userName
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 4)
    .toUpperCase();
  
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}${suffix}`;
}

/**
 * Get tier based on referral count
 */
export function getReferralTier(completedReferrals: number): ReferralTier {
  const { tiers } = REFERRAL_CONFIG;
  
  if (completedReferrals >= tiers.diamond.minReferrals) return 'diamond';
  if (completedReferrals >= tiers.platinum.minReferrals) return 'platinum';
  if (completedReferrals >= tiers.gold.minReferrals) return 'gold';
  if (completedReferrals >= tiers.silver.minReferrals) return 'silver';
  return 'bronze';
}

/**
 * Get XP multiplier for tier
 */
export function getTierMultiplier(tier: ReferralTier): number {
  return REFERRAL_CONFIG.tiers[tier].multiplier;
}

/**
 * Calculate XP for a referral
 */
export function calculateReferralXp(
  completedReferrals: number
): { xp: number; bonusXp: number; milestone: typeof REFERRAL_CONFIG.milestones[0] | null } {
  const tier = getReferralTier(completedReferrals);
  const multiplier = getTierMultiplier(tier);
  const baseXp = Math.round(REFERRAL_CONFIG.baseXpPerReferral * multiplier);
  
  // Check for milestone bonus
  const milestone = REFERRAL_CONFIG.milestones.find(m => m.count === completedReferrals + 1);
  const bonusXp = milestone?.bonusXp || 0;
  
  return { xp: baseXp, bonusXp, milestone: milestone || null };
}

/**
 * Get progress to next tier
 */
export function getNextTierProgress(completedReferrals: number): { nextTier: ReferralTier | null; progress: number; remaining: number } {
  const currentTier = getReferralTier(completedReferrals);
  const tierOrder: ReferralTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  if (currentIndex === tierOrder.length - 1) {
    return { nextTier: null, progress: 100, remaining: 0 };
  }
  
  const nextTier = tierOrder[currentIndex + 1];
  const nextThreshold = REFERRAL_CONFIG.tiers[nextTier].minReferrals;
  const currentThreshold = REFERRAL_CONFIG.tiers[currentTier].minReferrals;
  
  const progress = Math.round(
    ((completedReferrals - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  );
  
  return {
    nextTier,
    progress: Math.min(100, progress),
    remaining: nextThreshold - completedReferrals,
  };
}

/**
 * Format tier display
 */
export function formatTierDisplay(tier: ReferralTier): { name: string; badge: string; color: string } {
  const displays: Record<ReferralTier, { name: string; badge: string; color: string }> = {
    bronze: { name: 'Bronze', badge: '🥉', color: '#CD7F32' },
    silver: { name: 'Silver', badge: '🥈', color: '#C0C0C0' },
    gold: { name: 'Gold', badge: '🥇', color: '#FFD700' },
    platinum: { name: 'Platinum', badge: '💎', color: '#E5E4E2' },
    diamond: { name: 'Diamond', badge: '👑', color: '#B9F2FF' },
  };
  
  return displays[tier];
}

/**
 * Check if referral is complete
 */
export function checkReferralCompletion(referredUser: {
  daysActive: number;
  eventsAttended: number;
  profileComplete: boolean;
}): boolean {
  const { completionRequirements } = REFERRAL_CONFIG;
  
  return (
    referredUser.daysActive >= completionRequirements.daysActive &&
    referredUser.eventsAttended >= completionRequirements.eventsAttended &&
    referredUser.profileComplete === completionRequirements.profileComplete
  );
}

/**
 * Generate shareable referral message
 */
export function generateShareMessage(code: string, userName: string): {
  text: string;
  title: string;
  url: string;
} {
  return {
    title: 'Join me at Fernhill Community!',
    text: `Hey! ${userName} invited you to join Fernhill Community - the best dance community app! Use code ${code} to join and we both get rewards! 💃🕺`,
    url: `https://fernhill.community/join?ref=${code}`,
  };
}

// ============================================
// LEADERBOARD
// ============================================

export interface ReferralLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  completedReferrals: number;
  tier: ReferralTier;
  totalXpEarned: number;
}

export function sortLeaderboard(entries: ReferralLeaderboardEntry[]): ReferralLeaderboardEntry[] {
  return entries
    .sort((a, b) => b.completedReferrals - a.completedReferrals)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
