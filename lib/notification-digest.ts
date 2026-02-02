// ============================================
// Smart Notification Digest
// Phase I: Diamond Status - v1.15.0
// ============================================

export type NotificationCategory =
  | 'social'          // Messages, reactions, follows
  | 'events'          // RSVPs, reminders, updates
  | 'achievements'    // XP, badges, milestones
  | 'community'       // Announcements, tribe updates
  | 'challenges'      // Daily challenges, quests
  | 'system';         // App updates, security

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type DigestFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly';

export interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  icon?: string;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  isArchived: boolean;
  groupKey?: string; // For grouping similar notifications
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationGroup {
  key: string;
  category: NotificationCategory;
  title: string;
  count: number;
  notifications: Notification[];
  latestAt: Date;
  preview: string;
}

export interface NotificationPreferences {
  userId: string;
  
  // Global settings
  enabled: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string;   // "08:00"
  timezone: string;
  
  // Delivery preferences
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  
  // Digest settings
  digestFrequency: DigestFrequency;
  digestTime?: string; // "09:00" for daily digest
  digestDay?: number;  // 0-6 for weekly digest (0 = Sunday)
  
  // Category settings
  categories: {
    [key in NotificationCategory]: {
      enabled: boolean;
      push: boolean;
      email: boolean;
      digest: boolean;
      minPriority: NotificationPriority;
    };
  };
  
  // Smart features
  smartBundling: boolean;     // Group similar notifications
  smartTiming: boolean;       // Learn best times to notify
  summaryEnabled: boolean;    // AI-generated summaries
  
  updatedAt: Date;
}

export interface NotificationDigest {
  id: string;
  userId: string;
  frequency: DigestFrequency;
  periodStart: Date;
  periodEnd: Date;
  sections: DigestSection[];
  summary?: string;
  totalCount: number;
  createdAt: Date;
  sentAt?: Date;
}

export interface DigestSection {
  category: NotificationCategory;
  title: string;
  icon: string;
  items: DigestItem[];
  count: number;
}

export interface DigestItem {
  title: string;
  body: string;
  icon?: string;
  actionUrl?: string;
  timestamp: Date;
  isHighlight?: boolean;
}

// ============================================
// DEFAULT PREFERENCES
// ============================================

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'userId' | 'updatedAt'> = {
  enabled: true,
  timezone: 'America/Los_Angeles',
  
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  
  digestFrequency: 'daily',
  digestTime: '09:00',
  
  categories: {
    social: {
      enabled: true,
      push: true,
      email: false,
      digest: true,
      minPriority: 'low',
    },
    events: {
      enabled: true,
      push: true,
      email: true,
      digest: true,
      minPriority: 'low',
    },
    achievements: {
      enabled: true,
      push: true,
      email: false,
      digest: true,
      minPriority: 'low',
    },
    community: {
      enabled: true,
      push: true,
      email: true,
      digest: true,
      minPriority: 'medium',
    },
    challenges: {
      enabled: true,
      push: true,
      email: false,
      digest: true,
      minPriority: 'low',
    },
    system: {
      enabled: true,
      push: true,
      email: true,
      digest: false,
      minPriority: 'high',
    },
  },
  
  smartBundling: true,
  smartTiming: true,
  summaryEnabled: true,
};

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

export const NOTIFICATION_TEMPLATES = {
  // Social
  new_message: {
    category: 'social' as NotificationCategory,
    priority: 'high' as NotificationPriority,
    title: (from: string) => `Message from ${from}`,
    body: (preview: string) => preview,
    icon: '💬',
  },
  new_reaction: {
    category: 'social' as NotificationCategory,
    priority: 'low' as NotificationPriority,
    title: (from: string, emoji: string) => `${from} reacted ${emoji}`,
    body: (content: string) => `to your post: "${content.slice(0, 50)}..."`,
    icon: '❤️',
    groupKey: 'reactions',
  },
  new_follower: {
    category: 'social' as NotificationCategory,
    priority: 'medium' as NotificationPriority,
    title: (from: string) => `${from} connected with you`,
    body: () => 'You have a new connection!',
    icon: '🤝',
  },
  
  // Events
  event_reminder: {
    category: 'events' as NotificationCategory,
    priority: 'high' as NotificationPriority,
    title: (event: string) => `Reminder: ${event}`,
    body: (time: string) => `Starting ${time}`,
    icon: '📅',
  },
  event_update: {
    category: 'events' as NotificationCategory,
    priority: 'medium' as NotificationPriority,
    title: (event: string) => `Update: ${event}`,
    body: (change: string) => change,
    icon: '📝',
  },
  event_cancelled: {
    category: 'events' as NotificationCategory,
    priority: 'urgent' as NotificationPriority,
    title: (event: string) => `Cancelled: ${event}`,
    body: () => 'This event has been cancelled',
    icon: '❌',
  },
  
  // Achievements
  achievement_unlocked: {
    category: 'achievements' as NotificationCategory,
    priority: 'medium' as NotificationPriority,
    title: (name: string) => `🏆 Achievement Unlocked: ${name}`,
    body: (xp: number) => `You earned ${xp} XP!`,
    icon: '🏆',
  },
  level_up: {
    category: 'achievements' as NotificationCategory,
    priority: 'high' as NotificationPriority,
    title: (level: number) => `🎉 Level Up! You're now Level ${level}`,
    body: () => 'Keep up the amazing energy!',
    icon: '⬆️',
  },
  streak_milestone: {
    category: 'achievements' as NotificationCategory,
    priority: 'medium' as NotificationPriority,
    title: (days: number) => `🔥 ${days}-Day Streak!`,
    body: () => "You're on fire! Keep it going!",
    icon: '🔥',
  },
  
  // Challenges
  daily_challenges_ready: {
    category: 'challenges' as NotificationCategory,
    priority: 'medium' as NotificationPriority,
    title: () => '🎯 Daily Challenges Ready!',
    body: () => 'New challenges await you today',
    icon: '🎯',
  },
  challenge_expiring: {
    category: 'challenges' as NotificationCategory,
    priority: 'high' as NotificationPriority,
    title: (challenge: string) => `⏰ Challenge expiring: ${challenge}`,
    body: (time: string) => `Complete it in the next ${time}`,
    icon: '⏰',
  },
  
  // Community
  tribe_announcement: {
    category: 'community' as NotificationCategory,
    priority: 'medium' as NotificationPriority,
    title: (tribe: string) => `📢 ${tribe} Announcement`,
    body: (preview: string) => preview,
    icon: '📢',
  },
  community_milestone: {
    category: 'community' as NotificationCategory,
    priority: 'low' as NotificationPriority,
    title: () => '🎊 Community Milestone!',
    body: (milestone: string) => milestone,
    icon: '🎊',
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Group notifications by key or category
 */
export function groupNotifications(notifications: Notification[]): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>();
  
  for (const notification of notifications) {
    const key = notification.groupKey || notification.id;
    
    if (groups.has(key)) {
      const group = groups.get(key)!;
      group.notifications.push(notification);
      group.count++;
      if (notification.createdAt > group.latestAt) {
        group.latestAt = notification.createdAt;
      }
    } else {
      groups.set(key, {
        key,
        category: notification.category,
        title: notification.title,
        count: 1,
        notifications: [notification],
        latestAt: notification.createdAt,
        preview: notification.body,
      });
    }
  }
  
  return Array.from(groups.values()).sort(
    (a, b) => b.latestAt.getTime() - a.latestAt.getTime()
  );
}

/**
 * Build a digest from notifications
 */
export function buildDigest(
  notifications: Notification[],
  frequency: DigestFrequency,
  periodStart: Date,
  periodEnd: Date
): Omit<NotificationDigest, 'id' | 'userId' | 'createdAt' | 'sentAt'> {
  const categoryOrder: NotificationCategory[] = [
    'events',
    'achievements',
    'challenges',
    'social',
    'community',
    'system',
  ];
  
  const categoryIcons: Record<NotificationCategory, string> = {
    events: '📅',
    achievements: '🏆',
    challenges: '🎯',
    social: '💬',
    community: '🏘️',
    system: '⚙️',
  };
  
  const categoryTitles: Record<NotificationCategory, string> = {
    events: 'Events',
    achievements: 'Achievements',
    challenges: 'Challenges',
    social: 'Social',
    community: 'Community',
    system: 'System',
  };
  
  // Group by category
  const byCategory = new Map<NotificationCategory, Notification[]>();
  
  for (const notification of notifications) {
    const existing = byCategory.get(notification.category) || [];
    existing.push(notification);
    byCategory.set(notification.category, existing);
  }
  
  // Build sections
  const sections: DigestSection[] = [];
  
  for (const category of categoryOrder) {
    const categoryNotifications = byCategory.get(category);
    if (!categoryNotifications || categoryNotifications.length === 0) continue;
    
    // Sort by priority, then by time
    const sorted = categoryNotifications.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    sections.push({
      category,
      title: categoryTitles[category],
      icon: categoryIcons[category],
      items: sorted.slice(0, 5).map(n => ({
        title: n.title,
        body: n.body,
        icon: n.icon,
        actionUrl: n.actionUrl,
        timestamp: n.createdAt,
        isHighlight: n.priority === 'high' || n.priority === 'urgent',
      })),
      count: sorted.length,
    });
  }
  
  return {
    frequency,
    periodStart,
    periodEnd,
    sections,
    totalCount: notifications.length,
  };
}

/**
 * Generate digest summary
 */
export function generateDigestSummary(digest: Omit<NotificationDigest, 'id' | 'userId' | 'createdAt' | 'sentAt'>): string {
  const highlights: string[] = [];
  
  for (const section of digest.sections) {
    if (section.count > 0) {
      highlights.push(`${section.count} ${section.title.toLowerCase()}`);
    }
  }
  
  if (highlights.length === 0) {
    return 'No new updates';
  }
  
  if (highlights.length === 1) {
    return `You have ${highlights[0]}`;
  }
  
  const last = highlights.pop();
  return `You have ${highlights.join(', ')} and ${last}`;
}

/**
 * Check if notification should be sent based on preferences
 */
export function shouldSendNotification(
  notification: Notification,
  preferences: NotificationPreferences,
  deliveryMethod: 'push' | 'email' | 'digest'
): boolean {
  if (!preferences.enabled) return false;
  
  const categoryPrefs = preferences.categories[notification.category];
  if (!categoryPrefs.enabled) return false;
  
  // Check priority
  const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
  if (priorityOrder[notification.priority] < priorityOrder[categoryPrefs.minPriority]) {
    return false;
  }
  
  // Check delivery method
  switch (deliveryMethod) {
    case 'push':
      return categoryPrefs.push && preferences.pushEnabled;
    case 'email':
      return categoryPrefs.email && preferences.emailEnabled;
    case 'digest':
      return categoryPrefs.digest;
    default:
      return false;
  }
}

/**
 * Check if currently in quiet hours
 */
export function isQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
    return false;
  }
  
  const now = new Date();
  const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  if (startMinutes < endMinutes) {
    // Same day quiet hours (e.g., 22:00 - 23:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight quiet hours (e.g., 22:00 - 08:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

/**
 * Format notification time
 */
export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}
