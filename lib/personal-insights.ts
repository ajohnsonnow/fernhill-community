// ==============================================
// Personal Insights - Activity Analytics
// Phase J: Supernova v1.16.0
// ==============================================

export interface PersonalInsights {
  userId: string;
  period: InsightPeriod;
  summary: InsightSummary;
  activity: ActivityInsights;
  social: SocialInsights;
  events: EventInsights;
  growth: GrowthInsights;
  highlights: Highlight[];
  generatedAt: Date;
}

export type InsightPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all-time';

export interface InsightSummary {
  headline: string;
  subheadline: string;
  vibe: VibeEmoji;
  score: number; // 0-100 engagement score
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

export type VibeEmoji = '🔥' | '⭐' | '🌟' | '✨' | '💫' | '🌙' | '🌱';

export interface ActivityInsights {
  totalActions: number;
  postsCreated: number;
  commentsWritten: number;
  reactionsGiven: number;
  messagessSent: number;
  daysActive: number;
  longestStreak: number;
  currentStreak: number;
  mostActiveDay: string;
  mostActiveHour: number;
  activityByDay: Record<string, number>;
  activityByHour: Record<number, number>;
}

export interface SocialInsights {
  connectionsGained: number;
  connectionsMade: number;
  messagesExchanged: number;
  peopleInteractedWith: number;
  topConnections: ConnectionStat[];
  communityReach: number;
  socialScore: number;
}

export interface ConnectionStat {
  userId: string;
  name: string;
  avatarUrl?: string;
  interactions: number;
  relationshipStrength: 'new' | 'growing' | 'strong' | 'besties';
}

export interface EventInsights {
  eventsAttended: number;
  eventsRsvped: number;
  showUpRate: number;
  favoriteEventType: string;
  totalHoursAtEvents: number;
  eventsHosted: number;
  eventsByType: Record<string, number>;
  eventsByMonth: Record<string, number>;
}

export interface GrowthInsights {
  xpGained: number;
  levelProgress: {
    current: number;
    nextLevel: number;
    percentToNext: number;
    xpToNext: number;
  };
  achievementsUnlocked: number;
  badgesEarned: string[];
  challengesCompleted: number;
  milestonesReached: string[];
}

export interface Highlight {
  id: string;
  type: HighlightType;
  title: string;
  description: string;
  emoji: string;
  date: Date;
  value?: number | string;
}

export type HighlightType =
  | 'achievement'
  | 'streak'
  | 'event'
  | 'connection'
  | 'milestone'
  | 'first'
  | 'record';

/**
 * Generate insight summary headline
 */
export function generateInsightHeadline(insights: PersonalInsights): string {
  const { activity, events, social } = insights;
  
  // Different headlines based on activity pattern
  if (activity.currentStreak >= 7) {
    return `🔥 You're on fire! ${activity.currentStreak} days and counting!`;
  }
  
  if (events.eventsAttended >= 5) {
    return `💃 Movement master! ${events.eventsAttended} events this month!`;
  }
  
  if (social.connectionsGained >= 3) {
    return `✨ Your circle is growing! +${social.connectionsGained} new connections!`;
  }
  
  if (activity.daysActive >= 15) {
    return `⭐ A consistent presence! Active ${activity.daysActive} days!`;
  }
  
  return `🌟 Your Fernhill journey continues!`;
}

/**
 * Calculate overall engagement score
 */
export function calculateEngagementScore(insights: Partial<PersonalInsights>): number {
  let score = 0;
  const { activity, events, social } = insights;
  
  // Activity contributes 40%
  if (activity) {
    score += Math.min(activity.daysActive * 2, 20); // Up to 20 points
    score += Math.min(activity.currentStreak, 10); // Up to 10 points
    score += Math.min(activity.totalActions * 0.1, 10); // Up to 10 points
  }
  
  // Events contribute 35%
  if (events) {
    score += Math.min(events.eventsAttended * 5, 20); // Up to 20 points
    score += Math.min(events.showUpRate * 15, 15); // Up to 15 points
  }
  
  // Social contributes 25%
  if (social) {
    score += Math.min(social.connectionsGained * 3, 15); // Up to 15 points
    score += Math.min(social.peopleInteractedWith, 10); // Up to 10 points
  }
  
  return Math.min(Math.round(score), 100);
}

/**
 * Determine vibe emoji based on score
 */
export function getVibeEmoji(score: number): VibeEmoji {
  if (score >= 90) return '🔥';
  if (score >= 75) return '⭐';
  if (score >= 60) return '🌟';
  if (score >= 45) return '✨';
  if (score >= 30) return '💫';
  if (score >= 15) return '🌙';
  return '🌱';
}

/**
 * Generate fun facts about user's activity
 */
export function generateFunFacts(insights: PersonalInsights): string[] {
  const facts: string[] = [];
  const { activity, events, social } = insights;
  
  // Time-based facts
  const hourNames = [
    'night owl', 'night owl', 'night owl', 'night owl', 'night owl',
    'early bird', 'early bird', 'morning person', 'morning person',
    'mid-morning mover', 'mid-morning mover', 'lunch hour legend',
    'afternoon attendee', 'afternoon attendee', 'afternoon attendee',
    'happy hour regular', 'happy hour regular', 'evening enthusiast',
    'evening enthusiast', 'evening enthusiast', 'night dancer',
    'night dancer', 'night owl', 'night owl',
  ];
  
  if (activity.mostActiveHour !== undefined) {
    facts.push(`You're a ${hourNames[activity.mostActiveHour]}! Most active at ${activity.mostActiveHour}:00`);
  }
  
  // Social facts
  if (social.topConnections.length > 0) {
    const bestie = social.topConnections[0];
    facts.push(`You and ${bestie.name} are community besties! 💕`);
  }
  
  // Event facts
  if (events.favoriteEventType) {
    facts.push(`${events.favoriteEventType} events are clearly your jam! 🎵`);
  }
  
  if (events.showUpRate >= 0.9) {
    facts.push(`90%+ show-up rate! You're the reliable one! 🏆`);
  }
  
  // Streak facts
  if (activity.longestStreak >= 7) {
    facts.push(`Your longest streak was ${activity.longestStreak} days! Can you beat it?`);
  }
  
  return facts;
}

/**
 * Compare two periods for trend analysis
 */
export function comparePeriods(
  current: PersonalInsights,
  previous: PersonalInsights
): { trend: 'up' | 'down' | 'stable'; percent: number } {
  const currentScore = calculateEngagementScore(current);
  const previousScore = calculateEngagementScore(previous);
  
  const diff = currentScore - previousScore;
  const percent = previousScore > 0 ? Math.round((diff / previousScore) * 100) : 0;
  
  if (percent > 5) return { trend: 'up', percent };
  if (percent < -5) return { trend: 'down', percent: Math.abs(percent) };
  return { trend: 'stable', percent: 0 };
}

/**
 * Chart data formatters for UI
 */
export function formatActivityForChart(activity: ActivityInsights): {
  dayLabels: string[];
  dayData: number[];
  hourLabels: string[];
  hourData: number[];
} {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayData = days.map(d => activity.activityByDay[d] || 0);
  
  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const hourData = hourLabels.map((_, i) => activity.activityByHour[i] || 0);
  
  return {
    dayLabels: days,
    dayData,
    hourLabels,
    hourData,
  };
}

/**
 * Period labels for display
 */
export const PERIOD_LABELS: Record<InsightPeriod, string> = {
  week: 'This Week',
  month: 'This Month',
  quarter: 'This Quarter',
  year: 'This Year',
  'all-time': 'All Time',
};

/**
 * Insight card configurations
 */
export const INSIGHT_CARDS = [
  {
    id: 'events',
    title: 'Events',
    icon: '📅',
    color: 'bg-purple-500',
    metric: (i: PersonalInsights) => i.events.eventsAttended,
    label: 'attended',
  },
  {
    id: 'connections',
    title: 'Connections',
    icon: '🤝',
    color: 'bg-blue-500',
    metric: (i: PersonalInsights) => i.social.connectionsGained,
    label: 'new friends',
  },
  {
    id: 'xp',
    title: 'XP Earned',
    icon: '⭐',
    color: 'bg-yellow-500',
    metric: (i: PersonalInsights) => i.growth.xpGained,
    label: 'points',
  },
  {
    id: 'streak',
    title: 'Streak',
    icon: '🔥',
    color: 'bg-orange-500',
    metric: (i: PersonalInsights) => i.activity.currentStreak,
    label: 'days',
  },
] as const;

/**
 * Empty state for new users
 */
export const EMPTY_INSIGHTS: PersonalInsights = {
  userId: '',
  period: 'month',
  summary: {
    headline: '🌱 Your journey begins!',
    subheadline: 'Start exploring to see your insights grow',
    vibe: '🌱',
    score: 0,
    trend: 'stable',
    trendPercent: 0,
  },
  activity: {
    totalActions: 0,
    postsCreated: 0,
    commentsWritten: 0,
    reactionsGiven: 0,
    messagessSent: 0,
    daysActive: 0,
    longestStreak: 0,
    currentStreak: 0,
    mostActiveDay: '',
    mostActiveHour: 0,
    activityByDay: {},
    activityByHour: {},
  },
  social: {
    connectionsGained: 0,
    connectionsMade: 0,
    messagesExchanged: 0,
    peopleInteractedWith: 0,
    topConnections: [],
    communityReach: 0,
    socialScore: 0,
  },
  events: {
    eventsAttended: 0,
    eventsRsvped: 0,
    showUpRate: 0,
    favoriteEventType: '',
    totalHoursAtEvents: 0,
    eventsHosted: 0,
    eventsByType: {},
    eventsByMonth: {},
  },
  growth: {
    xpGained: 0,
    levelProgress: {
      current: 1,
      nextLevel: 2,
      percentToNext: 0,
      xpToNext: 100,
    },
    achievementsUnlocked: 0,
    badgesEarned: [],
    challengesCompleted: 0,
    milestonesReached: [],
  },
  highlights: [],
  generatedAt: new Date(),
};
