// ==============================================
// Live Presence - Real-time Viewer Tracking
// Phase J: Supernova v1.16.0
// ==============================================

export type PresenceStatus =
  | 'viewing'        // Just looking at the page
  | 'engaged'        // Interacting (scrolling, clicking)
  | 'typing'         // Writing a comment/message
  | 'away'           // Tab not focused
  | 'offline';       // Disconnected

export interface UserPresence {
  id: string;
  name: string;
  avatarUrl?: string;
  status: PresenceStatus;
  lastSeen: Date;
  currentPage: string;
  currentEventId?: string;
  isTyping: boolean;
  typingIn?: string; // event chat, comment, etc.
  joinedAt: Date;
  device: 'mobile' | 'desktop' | 'tablet';
}

export interface PresenceState {
  viewers: Map<string, UserPresence>;
  viewerCount: number;
  typingUsers: UserPresence[];
  recentJoins: UserPresence[];
  peakViewers: number;
  peakTime: Date | null;
}

export interface PresenceEvent {
  type: 'join' | 'leave' | 'status_change' | 'typing_start' | 'typing_stop';
  user: UserPresence;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Presence configuration
export const PRESENCE_CONFIG = {
  // How often to send heartbeat
  heartbeatIntervalMs: 30000, // 30 seconds
  
  // Consider user "away" after this much inactivity
  awayTimeoutMs: 60000, // 1 minute
  
  // Consider user "offline" after this much silence
  offlineTimeoutMs: 120000, // 2 minutes
  
  // Typing indicator timeout
  typingTimeoutMs: 5000, // 5 seconds
  
  // Max users to show in "who's here" list
  maxVisibleUsers: 20,
  
  // Debounce for status updates
  statusDebounceMs: 1000,
} as const;

/**
 * Generate viewer count display text
 */
export function formatViewerCount(count: number): string {
  if (count === 0) return 'No one viewing';
  if (count === 1) return '1 person viewing';
  if (count < 10) return `${count} people viewing`;
  if (count < 100) return `${Math.floor(count / 10) * 10}+ viewing`;
  if (count < 1000) return `${Math.floor(count / 100) * 100}+ viewing`;
  return `${(count / 1000).toFixed(1)}k viewing`;
}

/**
 * Format "X is typing..." indicator
 */
export function formatTypingIndicator(typingUsers: UserPresence[]): string {
  if (typingUsers.length === 0) return '';
  if (typingUsers.length === 1) {
    return `${typingUsers[0].name} is typing...`;
  }
  if (typingUsers.length === 2) {
    return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
  }
  return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`;
}

/**
 * Get viewer summary for display
 */
export function getViewerSummary(viewers: UserPresence[]): {
  total: number;
  engaged: number;
  away: number;
  friends: number;
  text: string;
} {
  const engaged = viewers.filter(v => v.status === 'engaged' || v.status === 'typing').length;
  const away = viewers.filter(v => v.status === 'away').length;
  const friends = 0; // Would be calculated from user's friend list
  
  let text = formatViewerCount(viewers.length);
  if (friends > 0) {
    text += ` • ${friends} friend${friends > 1 ? 's' : ''}`;
  }
  
  return {
    total: viewers.length,
    engaged,
    away,
    friends,
    text,
  };
}

/**
 * Detect device type from user agent
 */
export function detectDevice(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
  const ua = userAgent.toLowerCase();
  
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Create a new presence object
 */
export function createPresence(
  userId: string,
  userName: string,
  avatarUrl?: string
): UserPresence {
  return {
    id: userId,
    name: userName,
    avatarUrl,
    status: 'viewing',
    lastSeen: new Date(),
    currentPage: '/',
    isTyping: false,
    joinedAt: new Date(),
    device: typeof navigator !== 'undefined' 
      ? detectDevice(navigator.userAgent) 
      : 'desktop',
  };
}

/**
 * Activity indicator pulse animation config
 */
export const ACTIVITY_PULSE = {
  viewing: {
    color: 'bg-green-500',
    animation: 'animate-pulse',
    label: 'Online',
  },
  engaged: {
    color: 'bg-green-400',
    animation: 'animate-bounce',
    label: 'Active',
  },
  typing: {
    color: 'bg-blue-500',
    animation: 'animate-pulse',
    label: 'Typing',
  },
  away: {
    color: 'bg-yellow-500',
    animation: '',
    label: 'Away',
  },
  offline: {
    color: 'bg-gray-400',
    animation: '',
    label: 'Offline',
  },
} as const;

/**
 * Join/leave notification messages
 */
export const PRESENCE_MESSAGES = {
  join: [
    '{name} just joined! 👋',
    '{name} is here! ✨',
    'Welcome {name}! 🎉',
  ],
  leave: [
    '{name} left',
    '{name} stepped out',
  ],
  return: [
    '{name} is back! 👋',
    'Welcome back, {name}!',
  ],
} as const;

export function getPresenceMessage(
  type: keyof typeof PRESENCE_MESSAGES,
  name: string
): string {
  const messages = PRESENCE_MESSAGES[type];
  const template = messages[Math.floor(Math.random() * messages.length)];
  return template.replace('{name}', name);
}

/**
 * Aggregate viewers by status for pie chart
 */
export function aggregateByStatus(viewers: UserPresence[]): Record<PresenceStatus, number> {
  const counts: Record<PresenceStatus, number> = {
    viewing: 0,
    engaged: 0,
    typing: 0,
    away: 0,
    offline: 0,
  };
  
  for (const viewer of viewers) {
    counts[viewer.status]++;
  }
  
  return counts;
}

/**
 * Check if user should be marked as away
 */
export function shouldMarkAway(lastSeen: Date): boolean {
  return Date.now() - lastSeen.getTime() > PRESENCE_CONFIG.awayTimeoutMs;
}

/**
 * Check if user should be marked as offline
 */
export function shouldMarkOffline(lastSeen: Date): boolean {
  return Date.now() - lastSeen.getTime() > PRESENCE_CONFIG.offlineTimeoutMs;
}
