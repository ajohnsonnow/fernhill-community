// ============================================
// Anniversary & Milestone Celebrations
// Phase I: Diamond Status - v1.15.0
// ============================================

export type MilestoneType =
  | 'anniversary'        // Time-based (1 week, 1 month, 1 year)
  | 'events'             // Event attendance milestones
  | 'connections'        // Friend/connection milestones
  | 'xp'                 // XP milestones
  | 'posts'              // Content creation
  | 'streak'             // Streak milestones
  | 'community'          // Community contribution
  | 'first';             // First-time achievements

export interface Milestone {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  icon: string;
  value: number;
  unit: string;
  xpReward: number;
  celebrationType: string; // Reference to celebration config
  isSpecial: boolean; // Shows on profile permanently
}

export interface UserMilestone {
  id: string;
  milestoneId: string;
  milestone: Milestone;
  userId: string;
  achievedAt: Date;
  celebrated: boolean;
  sharedToFeed: boolean;
}

export interface AnniversaryInfo {
  userId: string;
  joinDate: Date;
  currentAnniversary: AnniversaryLevel;
  nextAnniversary: AnniversaryLevel | null;
  daysUntilNext: number;
  totalDays: number;
}

export interface AnniversaryLevel {
  days: number;
  name: string;
  icon: string;
  title: string;
  xpReward: number;
  badge?: string;
}

// ============================================
// ANNIVERSARY LEVELS
// ============================================

export const ANNIVERSARY_LEVELS: AnniversaryLevel[] = [
  { days: 7, name: 'One Week', icon: '🌱', title: 'Seedling', xpReward: 25 },
  { days: 14, name: 'Two Weeks', icon: '🌿', title: 'Sprout', xpReward: 50 },
  { days: 30, name: 'One Month', icon: '🌻', title: 'Blooming', xpReward: 100, badge: 'one_month' },
  { days: 60, name: 'Two Months', icon: '🌲', title: 'Growing Strong', xpReward: 150 },
  { days: 90, name: 'Three Months', icon: '🌳', title: 'Rooted', xpReward: 200, badge: 'three_months' },
  { days: 180, name: 'Six Months', icon: '🏔️', title: 'Established', xpReward: 350, badge: 'six_months' },
  { days: 365, name: 'One Year', icon: '⭐', title: 'Founding Member', xpReward: 500, badge: 'one_year' },
  { days: 730, name: 'Two Years', icon: '🌟', title: 'Elder', xpReward: 750, badge: 'two_years' },
  { days: 1095, name: 'Three Years', icon: '💫', title: 'Legend', xpReward: 1000, badge: 'three_years' },
  { days: 1825, name: 'Five Years', icon: '👑', title: 'Pioneer', xpReward: 2000, badge: 'five_years' },
];

// ============================================
// MILESTONE DEFINITIONS
// ============================================

export const MILESTONES: Omit<Milestone, 'id'>[] = [
  // First-time milestones
  {
    type: 'first',
    title: 'First Event',
    description: 'Attended your first event',
    icon: '💃',
    value: 1,
    unit: 'event',
    xpReward: 50,
    celebrationType: 'confetti',
    isSpecial: true,
  },
  {
    type: 'first',
    title: 'First Post',
    description: 'Created your first post',
    icon: '📝',
    value: 1,
    unit: 'post',
    xpReward: 25,
    celebrationType: 'sparkles',
    isSpecial: false,
  },
  {
    type: 'first',
    title: 'First Connection',
    description: 'Made your first friend',
    icon: '🤝',
    value: 1,
    unit: 'connection',
    xpReward: 30,
    celebrationType: 'hearts',
    isSpecial: true,
  },
  {
    type: 'first',
    title: 'First Check-in',
    description: 'First QR check-in at an event',
    icon: '📱',
    value: 1,
    unit: 'checkin',
    xpReward: 25,
    celebrationType: 'sparkles',
    isSpecial: false,
  },

  // Event attendance milestones
  {
    type: 'events',
    title: 'Regular',
    description: 'Attended 5 events',
    icon: '🎭',
    value: 5,
    unit: 'events',
    xpReward: 75,
    celebrationType: 'confetti',
    isSpecial: false,
  },
  {
    type: 'events',
    title: 'Dedicated',
    description: 'Attended 10 events',
    icon: '🎪',
    value: 10,
    unit: 'events',
    xpReward: 150,
    celebrationType: 'confetti',
    isSpecial: true,
  },
  {
    type: 'events',
    title: 'Movement Master',
    description: 'Attended 25 events',
    icon: '🏆',
    value: 25,
    unit: 'events',
    xpReward: 300,
    celebrationType: 'fireworks',
    isSpecial: true,
  },
  {
    type: 'events',
    title: 'Dance Legend',
    description: 'Attended 50 events',
    icon: '👑',
    value: 50,
    unit: 'events',
    xpReward: 500,
    celebrationType: 'fireworks',
    isSpecial: true,
  },
  {
    type: 'events',
    title: 'Century Dancer',
    description: 'Attended 100 events',
    icon: '💯',
    value: 100,
    unit: 'events',
    xpReward: 1000,
    celebrationType: 'achievement_legendary',
    isSpecial: true,
  },

  // Connection milestones
  {
    type: 'connections',
    title: 'Social Butterfly',
    description: 'Made 10 connections',
    icon: '🦋',
    value: 10,
    unit: 'connections',
    xpReward: 100,
    celebrationType: 'hearts',
    isSpecial: false,
  },
  {
    type: 'connections',
    title: 'Community Pillar',
    description: 'Made 25 connections',
    icon: '🏛️',
    value: 25,
    unit: 'connections',
    xpReward: 200,
    celebrationType: 'confetti',
    isSpecial: true,
  },
  {
    type: 'connections',
    title: 'Heart of the Community',
    description: 'Made 50 connections',
    icon: '❤️',
    value: 50,
    unit: 'connections',
    xpReward: 400,
    celebrationType: 'fireworks',
    isSpecial: true,
  },

  // XP milestones
  {
    type: 'xp',
    title: 'Rising Star',
    description: 'Earned 1,000 XP',
    icon: '⭐',
    value: 1000,
    unit: 'XP',
    xpReward: 50,
    celebrationType: 'sparkles',
    isSpecial: false,
  },
  {
    type: 'xp',
    title: 'Shining Bright',
    description: 'Earned 5,000 XP',
    icon: '🌟',
    value: 5000,
    unit: 'XP',
    xpReward: 100,
    celebrationType: 'confetti',
    isSpecial: true,
  },
  {
    type: 'xp',
    title: 'Supernova',
    description: 'Earned 10,000 XP',
    icon: '💫',
    value: 10000,
    unit: 'XP',
    xpReward: 200,
    celebrationType: 'fireworks',
    isSpecial: true,
  },
  {
    type: 'xp',
    title: 'Cosmic Force',
    description: 'Earned 25,000 XP',
    icon: '🌌',
    value: 25000,
    unit: 'XP',
    xpReward: 500,
    celebrationType: 'achievement_legendary',
    isSpecial: true,
  },

  // Streak milestones
  {
    type: 'streak',
    title: 'Week Warrior',
    description: '7-day activity streak',
    icon: '🔥',
    value: 7,
    unit: 'days',
    xpReward: 50,
    celebrationType: 'streak_7',
    isSpecial: false,
  },
  {
    type: 'streak',
    title: 'Consistency King',
    description: '30-day activity streak',
    icon: '🔥',
    value: 30,
    unit: 'days',
    xpReward: 200,
    celebrationType: 'streak_30',
    isSpecial: true,
  },
  {
    type: 'streak',
    title: 'Unstoppable',
    description: '100-day activity streak',
    icon: '🔥',
    value: 100,
    unit: 'days',
    xpReward: 500,
    celebrationType: 'achievement_legendary',
    isSpecial: true,
  },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get user's current anniversary level
 */
export function getCurrentAnniversary(joinDate: Date): AnniversaryLevel | null {
  const now = new Date();
  const daysSinceJoin = Math.floor(
    (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let currentLevel: AnniversaryLevel | null = null;
  
  for (const level of ANNIVERSARY_LEVELS) {
    if (daysSinceJoin >= level.days) {
      currentLevel = level;
    } else {
      break;
    }
  }
  
  return currentLevel;
}

/**
 * Get next anniversary level
 */
export function getNextAnniversary(joinDate: Date): { level: AnniversaryLevel | null; daysUntil: number } {
  const now = new Date();
  const daysSinceJoin = Math.floor(
    (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  for (const level of ANNIVERSARY_LEVELS) {
    if (daysSinceJoin < level.days) {
      return {
        level,
        daysUntil: level.days - daysSinceJoin,
      };
    }
  }
  
  return { level: null, daysUntil: 0 };
}

/**
 * Get full anniversary info for a user
 */
export function getAnniversaryInfo(userId: string, joinDate: Date): AnniversaryInfo {
  const now = new Date();
  const totalDays = Math.floor(
    (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const current = getCurrentAnniversary(joinDate);
  const next = getNextAnniversary(joinDate);
  
  return {
    userId,
    joinDate,
    currentAnniversary: current || ANNIVERSARY_LEVELS[0],
    nextAnniversary: next.level,
    daysUntilNext: next.daysUntil,
    totalDays,
  };
}

/**
 * Check for new milestones
 */
export function checkMilestones(
  stats: {
    eventsAttended: number;
    connections: number;
    totalXp: number;
    currentStreak: number;
    postsCreated: number;
  },
  achievedMilestones: string[]
): Milestone[] {
  const newMilestones: Milestone[] = [];
  
  for (const milestone of MILESTONES) {
    // Skip already achieved
    const milestoneKey = `${milestone.type}_${milestone.value}`;
    if (achievedMilestones.includes(milestoneKey)) continue;
    
    let achieved = false;
    
    switch (milestone.type) {
      case 'events':
      case 'first':
        if (milestone.unit === 'event' || milestone.unit === 'events') {
          achieved = stats.eventsAttended >= milestone.value;
        }
        break;
      case 'connections':
        achieved = stats.connections >= milestone.value;
        break;
      case 'xp':
        achieved = stats.totalXp >= milestone.value;
        break;
      case 'streak':
        achieved = stats.currentStreak >= milestone.value;
        break;
    }
    
    if (achieved) {
      newMilestones.push(milestone as Milestone);
    }
  }
  
  return newMilestones;
}

/**
 * Format milestone for display
 */
export function formatMilestoneDisplay(milestone: Milestone): string {
  return `${milestone.icon} ${milestone.title}: ${milestone.value} ${milestone.unit}`;
}

/**
 * Get celebration message for anniversary
 */
export function getAnniversaryMessage(level: AnniversaryLevel, userName: string): {
  title: string;
  message: string;
  subMessage: string;
} {
  return {
    title: `🎉 ${level.name} Anniversary!`,
    message: `Congratulations ${userName}!`,
    subMessage: `You've earned the "${level.title}" title and ${level.xpReward} XP!`,
  };
}

/**
 * Check if today is user's anniversary
 */
export function isAnniversaryToday(joinDate: Date): boolean {
  const now = new Date();
  return (
    now.getMonth() === joinDate.getMonth() &&
    now.getDate() === joinDate.getDate() &&
    now.getFullYear() > joinDate.getFullYear()
  );
}

/**
 * Get days until next anniversary date
 */
export function getDaysUntilAnniversaryDate(joinDate: Date): number {
  const now = new Date();
  const thisYearAnniversary = new Date(
    now.getFullYear(),
    joinDate.getMonth(),
    joinDate.getDate()
  );
  
  if (thisYearAnniversary < now) {
    thisYearAnniversary.setFullYear(thisYearAnniversary.getFullYear() + 1);
  }
  
  return Math.ceil(
    (thisYearAnniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}
