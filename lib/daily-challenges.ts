// ============================================
// Daily Challenges & Quests System
// Phase I: Diamond Status - v1.15.0
// ============================================

export type ChallengeType = 
  | 'daily'      // Reset every day
  | 'weekly'     // Reset every week
  | 'seasonal'   // Limited time events
  | 'special';   // One-time special challenges

export type ChallengeCategory =
  | 'social'      // Connect with others
  | 'attendance'  // Show up to events
  | 'engagement'  // React, comment, post
  | 'wellness'    // Mood tracking, self-care
  | 'exploration' // Try new things
  | 'community';  // Help others

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  type: ChallengeType;
  category: ChallengeCategory;
  xpReward: number;
  bonusXp?: number; // For completing all dailies
  requirement: {
    action: string;
    count: number;
    target?: string;
  };
  startsAt?: Date;
  endsAt?: Date;
  isActive: boolean;
}

export interface UserChallenge {
  id: string;
  challengeId: string;
  challenge: Challenge;
  userId: string;
  progress: number;
  isCompleted: boolean;
  completedAt?: Date;
  assignedAt: Date;
  expiresAt: Date;
}

export interface DailyQuest {
  date: string;
  challenges: UserChallenge[];
  allCompleted: boolean;
  bonusXpEarned: number;
  streak: number;
}

// ============================================
// CHALLENGE TEMPLATES
// ============================================

export const DAILY_CHALLENGE_POOL: Omit<Challenge, 'id'>[] = [
  // Social Challenges
  {
    slug: 'say_hello',
    title: 'Say Hello',
    description: 'Send a message to someone new',
    icon: '👋',
    type: 'daily',
    category: 'social',
    xpReward: 15,
    requirement: { action: 'send_message', count: 1, target: 'new_person' },
    isActive: true,
  },
  {
    slug: 'hype_squad',
    title: 'Hype Squad',
    description: 'React to 5 posts with ❤️',
    icon: '💖',
    type: 'daily',
    category: 'engagement',
    xpReward: 10,
    requirement: { action: 'react', count: 5, target: 'heart' },
    isActive: true,
  },
  {
    slug: 'good_vibes',
    title: 'Good Vibes Only',
    description: 'Log your mood for today',
    icon: '🌈',
    type: 'daily',
    category: 'wellness',
    xpReward: 10,
    requirement: { action: 'log_mood', count: 1 },
    isActive: true,
  },
  {
    slug: 'share_moment',
    title: 'Share a Moment',
    description: 'Post a story or update',
    icon: '📸',
    type: 'daily',
    category: 'engagement',
    xpReward: 20,
    requirement: { action: 'create_post', count: 1 },
    isActive: true,
  },
  {
    slug: 'rsvp_ready',
    title: 'RSVP Ready',
    description: 'RSVP to an upcoming event',
    icon: '✅',
    type: 'daily',
    category: 'attendance',
    xpReward: 15,
    requirement: { action: 'rsvp', count: 1 },
    isActive: true,
  },
  {
    slug: 'playlist_add',
    title: 'DJ Mode',
    description: 'Add a song to a community playlist',
    icon: '🎵',
    type: 'daily',
    category: 'engagement',
    xpReward: 15,
    requirement: { action: 'add_track', count: 1 },
    isActive: true,
  },
  {
    slug: 'welcome_newbie',
    title: 'Welcome Committee',
    description: 'Welcome a new member',
    icon: '🎉',
    type: 'daily',
    category: 'community',
    xpReward: 25,
    requirement: { action: 'welcome_new_member', count: 1 },
    isActive: true,
  },
  {
    slug: 'comment_kindness',
    title: 'Spread Kindness',
    description: 'Leave 3 supportive comments',
    icon: '💬',
    type: 'daily',
    category: 'social',
    xpReward: 20,
    requirement: { action: 'comment', count: 3 },
    isActive: true,
  },
  {
    slug: 'explore_profile',
    title: 'Get to Know You',
    description: 'View 5 community profiles',
    icon: '👀',
    type: 'daily',
    category: 'exploration',
    xpReward: 10,
    requirement: { action: 'view_profile', count: 5 },
    isActive: true,
  },
  {
    slug: 'vote_track',
    title: 'Music Critic',
    description: 'Vote on 3 playlist tracks',
    icon: '🗳️',
    type: 'daily',
    category: 'engagement',
    xpReward: 10,
    requirement: { action: 'vote_track', count: 3 },
    isActive: true,
  },
];

export const WEEKLY_CHALLENGES: Omit<Challenge, 'id'>[] = [
  {
    slug: 'weekly_warrior',
    title: 'Weekly Warrior',
    description: 'Complete all daily challenges for 5 days',
    icon: '⚔️',
    type: 'weekly',
    category: 'engagement',
    xpReward: 100,
    bonusXp: 50,
    requirement: { action: 'complete_dailies', count: 5 },
    isActive: true,
  },
  {
    slug: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Connect with 3 new people this week',
    icon: '🦋',
    type: 'weekly',
    category: 'social',
    xpReward: 75,
    requirement: { action: 'new_connection', count: 3 },
    isActive: true,
  },
  {
    slug: 'dance_floor_regular',
    title: 'Dance Floor Regular',
    description: 'Attend 2 events this week',
    icon: '💃',
    type: 'weekly',
    category: 'attendance',
    xpReward: 100,
    requirement: { action: 'attend_event', count: 2 },
    isActive: true,
  },
  {
    slug: 'mood_master',
    title: 'Mood Master',
    description: 'Log your mood every day this week',
    icon: '🧘',
    type: 'weekly',
    category: 'wellness',
    xpReward: 75,
    requirement: { action: 'log_mood', count: 7 },
    isActive: true,
  },
];

// ============================================
// CHALLENGE LOGIC
// ============================================

/**
 * Select random daily challenges for a user
 */
export function selectDailyChallenges(count: number = 3): Omit<Challenge, 'id'>[] {
  const shuffled = [...DAILY_CHALLENGE_POOL]
    .filter(c => c.isActive)
    .sort(() => Math.random() - 0.5);
  
  // Try to get variety in categories
  const selected: Omit<Challenge, 'id'>[] = [];
  const usedCategories = new Set<ChallengeCategory>();
  
  for (const challenge of shuffled) {
    if (selected.length >= count) break;
    
    // Prefer different categories
    if (!usedCategories.has(challenge.category) || selected.length >= shuffled.length / 2) {
      selected.push(challenge);
      usedCategories.add(challenge.category);
    }
  }
  
  return selected;
}

/**
 * Calculate bonus XP for completing all daily challenges
 */
export function calculateDailyBonusXp(completedCount: number, totalCount: number): number {
  if (completedCount < totalCount) return 0;
  return 25; // Bonus for completing all dailies
}

/**
 * Get streak multiplier for challenge rewards
 */
export function getChallengeStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;  // 30+ day streak: 2x
  if (streak >= 14) return 1.5;  // 14+ day streak: 1.5x
  if (streak >= 7) return 1.25;  // 7+ day streak: 1.25x
  if (streak >= 3) return 1.1;   // 3+ day streak: 1.1x
  return 1.0;
}

/**
 * Check if a challenge requirement is met
 */
export function checkChallengeProgress(
  challenge: Challenge,
  currentProgress: number
): { isComplete: boolean; progress: number; remaining: number } {
  const required = challenge.requirement.count;
  const progress = Math.min(currentProgress, required);
  
  return {
    isComplete: progress >= required,
    progress,
    remaining: Math.max(0, required - progress),
  };
}

/**
 * Format time remaining for a challenge
 */
export function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  
  return `${minutes}m left`;
}

// ============================================
// SEASONAL CHALLENGES (Examples)
// ============================================

export const SEASONAL_CHALLENGES: Omit<Challenge, 'id'>[] = [
  {
    slug: 'summer_solstice',
    title: 'Summer Solstice Celebration',
    description: 'Attend the Summer Solstice dance event',
    icon: '☀️',
    type: 'seasonal',
    category: 'attendance',
    xpReward: 200,
    bonusXp: 100,
    requirement: { action: 'attend_event', count: 1, target: 'summer_solstice' },
    startsAt: new Date('2026-06-15'),
    endsAt: new Date('2026-06-22'),
    isActive: true,
  },
  {
    slug: 'winter_warmth',
    title: 'Winter Warmth',
    description: 'Send 10 appreciation messages during the holidays',
    icon: '❄️',
    type: 'seasonal',
    category: 'social',
    xpReward: 150,
    requirement: { action: 'send_appreciation', count: 10 },
    startsAt: new Date('2026-12-15'),
    endsAt: new Date('2026-12-31'),
    isActive: true,
  },
  {
    slug: 'new_year_resolution',
    title: 'New Year, New Vibes',
    description: 'Set 3 community goals for the new year',
    icon: '🎆',
    type: 'seasonal',
    category: 'wellness',
    xpReward: 100,
    requirement: { action: 'set_goal', count: 3 },
    startsAt: new Date('2026-12-31'),
    endsAt: new Date('2026-01-07'),
    isActive: true,
  },
];

// ============================================
// TYPES FOR DATABASE
// ============================================

export interface ChallengeAssignment {
  id: string;
  userId: string;
  challengeSlug: string;
  progress: number;
  isCompleted: boolean;
  completedAt: Date | null;
  assignedAt: Date;
  expiresAt: Date;
  xpAwarded: number;
}

export interface DailyChallengeStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string; // YYYY-MM-DD
  totalDaysCompleted: number;
}
