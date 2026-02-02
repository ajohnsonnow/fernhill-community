/**
 * Fernhill Community - Gamification System
 * 
 * XP, levels, streaks, achievements, and leaderboards
 * to encourage community engagement and reward participation.
 */

// ============================================
// XP & LEVEL SYSTEM
// ============================================

export interface XPEvent {
  action: string
  xp: number
  description: string
  repeatable: boolean
  cooldown?: number // minutes between earning
}

export const XP_EVENTS: Record<string, XPEvent> = {
  // Daily actions
  daily_login: { action: 'daily_login', xp: 10, description: 'Daily check-in', repeatable: true, cooldown: 1440 },
  set_mood: { action: 'set_mood', xp: 5, description: 'Share your vibe', repeatable: true, cooldown: 1440 },
  
  // Content creation
  create_post: { action: 'create_post', xp: 15, description: 'Share in the Hearth', repeatable: true, cooldown: 60 },
  create_comment: { action: 'create_comment', xp: 5, description: 'Join the conversation', repeatable: true, cooldown: 5 },
  upload_photo: { action: 'upload_photo', xp: 20, description: 'Add to the Altar', repeatable: true, cooldown: 30 },
  
  // Social actions
  react_to_post: { action: 'react_to_post', xp: 2, description: 'React to a post', repeatable: true, cooldown: 1 },
  send_message: { action: 'send_message', xp: 3, description: 'Connect with someone', repeatable: true, cooldown: 5 },
  
  // Event participation
  rsvp_event: { action: 'rsvp_event', xp: 10, description: 'RSVP to an event', repeatable: true },
  check_in_event: { action: 'check_in_event', xp: 50, description: 'Check in at an event', repeatable: true },
  first_event: { action: 'first_event', xp: 100, description: 'Attend your first event!', repeatable: false },
  
  // Community building
  invite_accepted: { action: 'invite_accepted', xp: 100, description: 'Your invite was accepted', repeatable: true },
  help_newbie: { action: 'help_newbie', xp: 25, description: 'Help a new member', repeatable: true, cooldown: 60 },
  
  // Milestones
  profile_complete: { action: 'profile_complete', xp: 50, description: 'Complete your profile', repeatable: false },
  verified_member: { action: 'verified_member', xp: 200, description: 'Become a verified member', repeatable: false },
  
  // Streaks
  streak_7_days: { action: 'streak_7_days', xp: 100, description: '7-day login streak', repeatable: true },
  streak_30_days: { action: 'streak_30_days', xp: 500, description: '30-day login streak', repeatable: true },
  streak_100_days: { action: 'streak_100_days', xp: 2000, description: '100-day login streak', repeatable: true },
}

// Level thresholds - progressive XP requirements
export const LEVEL_THRESHOLDS: number[] = [
  0,      // Level 1 - New Dancer
  100,    // Level 2 - Regular
  300,    // Level 3 - Active
  600,    // Level 4 - Engaged
  1000,   // Level 5 - Devoted
  1500,   // Level 6 - Community Pillar
  2200,   // Level 7 - Elder
  3000,   // Level 8 - Sage
  4000,   // Level 9 - Legend
  5500,   // Level 10 - Transcendent
  7500,   // Level 11 - Cosmic
  10000,  // Level 12 - Infinite
]

export const LEVEL_TITLES: string[] = [
  'New Dancer',
  'Regular',
  'Active Member',
  'Engaged Soul',
  'Devoted Dancer',
  'Community Pillar',
  'Elder',
  'Sage',
  'Legend',
  'Transcendent',
  'Cosmic Dancer',
  'Infinite Being',
]

export const LEVEL_COLORS: string[] = [
  '#9CA3AF', // Gray
  '#60A5FA', // Blue
  '#34D399', // Green
  '#FBBF24', // Yellow
  '#F97316', // Orange
  '#EF4444', // Red
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#FFD700', // Gold
]

/**
 * Calculate level from XP
 */
export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(currentXP: number): { needed: number; total: number; progress: number } {
  const level = calculateLevel(currentXP)
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  
  const xpIntoLevel = currentXP - currentThreshold
  const xpNeededForLevel = nextThreshold - currentThreshold
  
  return {
    needed: nextThreshold - currentXP,
    total: xpNeededForLevel,
    progress: Math.min(xpIntoLevel / xpNeededForLevel, 1),
  }
}

/**
 * Get level info
 */
export function getLevelInfo(xp: number) {
  const level = calculateLevel(xp)
  const { needed, total, progress } = getXPForNextLevel(xp)
  
  return {
    level,
    title: LEVEL_TITLES[level - 1] || 'Infinite Being',
    color: LEVEL_COLORS[level - 1] || '#FFD700',
    xp,
    xpToNextLevel: needed,
    xpProgress: progress,
    isMaxLevel: level >= LEVEL_THRESHOLDS.length,
  }
}

// ============================================
// ACHIEVEMENTS SYSTEM
// ============================================

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xpReward: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  category: 'social' | 'events' | 'content' | 'community' | 'special'
  requirement: {
    type: 'count' | 'streak' | 'milestone' | 'special'
    target: number
    metric?: string
  }
  secret?: boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  // Social Achievements
  {
    id: 'first_post',
    name: 'Finding My Voice',
    description: 'Share your first post in the Hearth',
    icon: '📝',
    xpReward: 25,
    rarity: 'common',
    category: 'content',
    requirement: { type: 'count', target: 1, metric: 'posts' },
  },
  {
    id: 'prolific_poster',
    name: 'Prolific Poster',
    description: 'Create 50 posts',
    icon: '✍️',
    xpReward: 200,
    rarity: 'rare',
    category: 'content',
    requirement: { type: 'count', target: 50, metric: 'posts' },
  },
  {
    id: 'first_message',
    name: 'Breaking the Ice',
    description: 'Send your first direct message',
    icon: '💬',
    xpReward: 15,
    rarity: 'common',
    category: 'social',
    requirement: { type: 'count', target: 1, metric: 'messages_sent' },
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Message 20 different people',
    icon: '🦋',
    xpReward: 150,
    rarity: 'uncommon',
    category: 'social',
    requirement: { type: 'count', target: 20, metric: 'unique_conversations' },
  },
  {
    id: 'connector',
    name: 'The Connector',
    description: 'Message 100 different community members',
    icon: '🔗',
    xpReward: 500,
    rarity: 'epic',
    category: 'social',
    requirement: { type: 'count', target: 100, metric: 'unique_conversations' },
  },
  
  // Event Achievements
  {
    id: 'first_dance',
    name: 'First Dance',
    description: 'Check in at your first event',
    icon: '💃',
    xpReward: 50,
    rarity: 'common',
    category: 'events',
    requirement: { type: 'count', target: 1, metric: 'event_checkins' },
  },
  {
    id: 'regular_dancer',
    name: 'Regular Dancer',
    description: 'Attend 10 events',
    icon: '🕺',
    xpReward: 200,
    rarity: 'uncommon',
    category: 'events',
    requirement: { type: 'count', target: 10, metric: 'event_checkins' },
  },
  {
    id: 'dance_devotee',
    name: 'Dance Devotee',
    description: 'Attend 50 events',
    icon: '⭐',
    xpReward: 500,
    rarity: 'rare',
    category: 'events',
    requirement: { type: 'count', target: 50, metric: 'event_checkins' },
  },
  {
    id: 'century_dancer',
    name: 'Century Dancer',
    description: 'Attend 100 events - you ARE the community!',
    icon: '💯',
    xpReward: 1000,
    rarity: 'legendary',
    category: 'events',
    requirement: { type: 'count', target: 100, metric: 'event_checkins' },
  },
  
  // Streak Achievements
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Log in 7 days in a row',
    icon: '📅',
    xpReward: 100,
    rarity: 'uncommon',
    category: 'community',
    requirement: { type: 'streak', target: 7, metric: 'login_streak' },
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: 'Log in 30 days in a row',
    icon: '🗓️',
    xpReward: 500,
    rarity: 'rare',
    category: 'community',
    requirement: { type: 'streak', target: 30, metric: 'login_streak' },
  },
  {
    id: 'century_streak',
    name: '100 Days of Dance',
    description: 'Log in 100 days in a row - incredible dedication!',
    icon: '🔥',
    xpReward: 2000,
    rarity: 'legendary',
    category: 'community',
    requirement: { type: 'streak', target: 100, metric: 'login_streak' },
  },
  
  // Community Achievements
  {
    id: 'welcomer',
    name: 'Welcomer',
    description: 'Message 5 new members to welcome them',
    icon: '👋',
    xpReward: 100,
    rarity: 'uncommon',
    category: 'community',
    requirement: { type: 'count', target: 5, metric: 'newbie_welcomes' },
  },
  {
    id: 'mentor',
    name: 'Community Mentor',
    description: 'Help 20 new members find their way',
    icon: '🧭',
    xpReward: 300,
    rarity: 'rare',
    category: 'community',
    requirement: { type: 'count', target: 20, metric: 'newbie_welcomes' },
  },
  {
    id: 'recruiter',
    name: 'Community Builder',
    description: 'Invite 10 friends who join the community',
    icon: '🌱',
    xpReward: 500,
    rarity: 'epic',
    category: 'community',
    requirement: { type: 'count', target: 10, metric: 'successful_invites' },
  },
  
  // Content Achievements
  {
    id: 'photographer',
    name: 'Memory Keeper',
    description: 'Upload 10 photos to the Altar',
    icon: '📸',
    xpReward: 100,
    rarity: 'uncommon',
    category: 'content',
    requirement: { type: 'count', target: 10, metric: 'photos_uploaded' },
  },
  {
    id: 'archivist',
    name: 'Community Archivist',
    description: 'Upload 100 photos documenting our community',
    icon: '🗃️',
    xpReward: 500,
    rarity: 'epic',
    category: 'content',
    requirement: { type: 'count', target: 100, metric: 'photos_uploaded' },
  },
  
  // Special/Secret Achievements
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Active between 2 AM and 5 AM',
    icon: '🦉',
    xpReward: 50,
    rarity: 'uncommon',
    category: 'special',
    requirement: { type: 'special', target: 1 },
    secret: true,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Active before 6 AM',
    icon: '🐦',
    xpReward: 50,
    rarity: 'uncommon',
    category: 'special',
    requirement: { type: 'special', target: 1 },
    secret: true,
  },
  {
    id: 'og_member',
    name: 'OG Member',
    description: 'One of the first 100 members',
    icon: '👑',
    xpReward: 500,
    rarity: 'legendary',
    category: 'special',
    requirement: { type: 'milestone', target: 100 },
    secret: true,
  },
  {
    id: 'anniversary',
    name: 'One Year Strong',
    description: 'Been a member for one year',
    icon: '🎂',
    xpReward: 1000,
    rarity: 'epic',
    category: 'special',
    requirement: { type: 'milestone', target: 365 },
  },
]

export const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
}

/**
 * Get achievement by ID
 */
export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id)
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category)
}

// ============================================
// STREAK SYSTEM
// ============================================

export interface StreakInfo {
  current: number
  longest: number
  lastActiveDate: string | null
  isActiveToday: boolean
}

/**
 * Calculate streak from last active date
 */
export function calculateStreak(
  lastActiveDate: string | null,
  currentStreak: number
): { newStreak: number; streakBroken: boolean } {
  if (!lastActiveDate) {
    return { newStreak: 1, streakBroken: false }
  }
  
  const last = new Date(lastActiveDate)
  const now = new Date()
  
  // Reset to start of day
  last.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    // Same day - no change
    return { newStreak: currentStreak, streakBroken: false }
  } else if (diffDays === 1) {
    // Consecutive day - increment streak
    return { newStreak: currentStreak + 1, streakBroken: false }
  } else {
    // Streak broken - reset to 1
    return { newStreak: 1, streakBroken: true }
  }
}

// ============================================
// LEADERBOARD
// ============================================

export interface LeaderboardEntry {
  userId: string
  tribeName: string
  avatarUrl: string | null
  xp: number
  level: number
  rank: number
}

export type LeaderboardPeriod = 'all-time' | 'monthly' | 'weekly'

/**
 * Format rank with suffix
 */
export function formatRank(rank: number): string {
  const suffix = ['th', 'st', 'nd', 'rd']
  const v = rank % 100
  return rank + (suffix[(v - 20) % 10] || suffix[v] || suffix[0])
}

/**
 * Get rank emoji for top 3
 */
export function getRankEmoji(rank: number): string {
  switch (rank) {
    case 1: return '🥇'
    case 2: return '🥈'
    case 3: return '🥉'
    default: return ''
  }
}
