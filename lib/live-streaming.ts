// ==============================================
// Live Streaming - Ecstatic Dance from Home
// Phase J: Supernova v1.16.0
// ==============================================

export type StreamStatus =
  | 'scheduled'    // Stream announced but not started
  | 'preparing'    // Host is setting up
  | 'live'         // Currently streaming
  | 'paused'       // Temporarily paused
  | 'ended'        // Stream finished
  | 'archived';    // Available for replay

export type StreamQuality = '360p' | '480p' | '720p' | '1080p' | 'auto';

export interface LiveStream {
  id: string;
  eventId: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  hostAvatarUrl?: string;
  
  // Stream state
  status: StreamStatus;
  startedAt: Date | null;
  endedAt: Date | null;
  scheduledStart: Date;
  scheduledEnd: Date;
  
  // Streaming tech
  streamUrl: string;      // HLS manifest URL
  streamKey: string;      // For OBS/streaming software (host only)
  playbackUrl: string;    // Viewer URL
  thumbnailUrl?: string;
  
  // Viewer stats
  currentViewers: number;
  peakViewers: number;
  totalViews: number;
  
  // Settings
  isPrivate: boolean;
  allowChat: boolean;
  allowReactions: boolean;
  donationsEnabled: boolean;
  recordingEnabled: boolean;
  
  // Moderation
  chatModeration: 'none' | 'basic' | 'strict';
  bannedUserIds: string[];
}

export interface StreamViewer {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  joinedAt: Date;
  watchTimeSeconds: number;
  quality: StreamQuality;
  isMuted: boolean;
  deviceType: 'mobile' | 'desktop' | 'tv';
}

export interface StreamChatMessage {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  content: string;
  messageType: 'chat' | 'system' | 'donation' | 'highlight';
  timestamp: Date;
  isHost: boolean;
  isModerator: boolean;
  isPinned: boolean;
}

export interface StreamReaction {
  id: string;
  streamId: string;
  userId: string;
  emoji: string;
  timestamp: Date;
  position?: { x: number; y: number }; // For floating reactions
}

export interface StreamDonation {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  message?: string;
  timestamp: Date;
}

// Available stream reactions
export const STREAM_REACTIONS = [
  { emoji: '❤️', label: 'Love', color: '#ef4444' },
  { emoji: '🔥', label: 'Fire', color: '#f97316' },
  { emoji: '💃', label: 'Dance', color: '#ec4899' },
  { emoji: '🎉', label: 'Celebrate', color: '#8b5cf6' },
  { emoji: '✨', label: 'Sparkle', color: '#eab308' },
  { emoji: '🙏', label: 'Gratitude', color: '#22c55e' },
  { emoji: '🌊', label: 'Flow', color: '#3b82f6' },
  { emoji: '👏', label: 'Applause', color: '#f59e0b' },
] as const;

// Quality presets
export const QUALITY_PRESETS: Record<StreamQuality, { bitrate: number; resolution: string; label: string }> = {
  '360p': { bitrate: 800, resolution: '640x360', label: 'Low' },
  '480p': { bitrate: 1500, resolution: '854x480', label: 'Medium' },
  '720p': { bitrate: 3000, resolution: '1280x720', label: 'HD' },
  '1080p': { bitrate: 6000, resolution: '1920x1080', label: 'Full HD' },
  'auto': { bitrate: 0, resolution: 'auto', label: 'Auto' },
};

/**
 * Format viewer count for display
 */
export function formatViewerCount(count: number): string {
  if (count === 0) return 'No viewers';
  if (count === 1) return '1 viewer';
  if (count < 1000) return `${count} viewers`;
  return `${(count / 1000).toFixed(1)}k viewers`;
}

/**
 * Format stream duration
 */
export function formatStreamDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get time until stream starts
 */
export function getTimeUntilStream(scheduledStart: Date): string {
  const now = new Date();
  const diff = scheduledStart.getTime() - now.getTime();
  
  if (diff <= 0) return 'Starting soon...';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `Starts in ${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `Starts in ${hours}h ${minutes}m`;
  }
  return `Starts in ${minutes} minutes`;
}

/**
 * Calculate optimal quality based on connection
 */
export function getOptimalQuality(connectionSpeed: number): StreamQuality {
  // connectionSpeed in Mbps
  if (connectionSpeed >= 10) return '1080p';
  if (connectionSpeed >= 5) return '720p';
  if (connectionSpeed >= 2) return '480p';
  return '360p';
}

/**
 * Stream chat moderation - check for blocked words
 */
const BLOCKED_PATTERNS = [
  // Add your blocked word patterns here
  /spam/i,
  /http[s]?:\/\//i, // Links (basic)
];

export function moderateMessage(content: string, level: 'none' | 'basic' | 'strict'): {
  allowed: boolean;
  reason?: string;
} {
  if (level === 'none') return { allowed: true };
  
  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return { allowed: false, reason: 'Message contains blocked content' };
    }
  }
  
  // Strict mode: limit message length and frequency
  if (level === 'strict') {
    if (content.length > 200) {
      return { allowed: false, reason: 'Message too long' };
    }
  }
  
  return { allowed: true };
}

/**
 * Generate floating reaction animation positions
 */
export function generateReactionPosition(): { x: number; y: number; delay: number } {
  return {
    x: 70 + Math.random() * 20, // 70-90% from left
    y: 100, // Start at bottom
    delay: Math.random() * 0.3,
  };
}

/**
 * Stream status badge configuration
 */
export const STREAM_STATUS_BADGES: Record<StreamStatus, { label: string; color: string; pulse: boolean }> = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-500', pulse: false },
  preparing: { label: 'Starting Soon', color: 'bg-yellow-500', pulse: true },
  live: { label: 'LIVE', color: 'bg-red-500', pulse: true },
  paused: { label: 'Paused', color: 'bg-orange-500', pulse: false },
  ended: { label: 'Ended', color: 'bg-gray-500', pulse: false },
  archived: { label: 'Replay', color: 'bg-purple-500', pulse: false },
};

/**
 * Stream notification messages
 */
export const STREAM_NOTIFICATIONS = {
  starting: (hostName: string) => `🔴 ${hostName} is going live! Join the dance!`,
  reminder: (title: string, minutes: number) => `⏰ "${title}" starts in ${minutes} minutes!`,
  ended: (hostName: string) => `${hostName}'s stream has ended. Thanks for dancing! 💃`,
  milestone: (viewers: number) => `🎉 We hit ${viewers} viewers! The energy is amazing!`,
} as const;

/**
 * OBS/Streaming software settings guide
 */
export const STREAMING_GUIDE = {
  recommended: {
    encoder: 'x264 or NVENC',
    bitrate: '4000-6000 kbps',
    resolution: '1920x1080',
    fps: 30,
    keyframeInterval: 2,
    audioCodec: 'AAC',
    audioBitrate: '160 kbps',
    audioSampleRate: 44100,
  },
  tips: [
    'Use a wired internet connection for stability',
    'Test your stream before going live',
    'Have good lighting - natural light works great!',
    'Position camera to capture the full dance space',
    'Use a microphone separate from your camera if possible',
    'Consider having a moderator to manage chat',
  ],
} as const;

/**
 * Create default stream settings
 */
export function createDefaultStream(eventId: string, hostId: string, hostName: string): Partial<LiveStream> {
  return {
    eventId,
    hostId,
    hostName,
    status: 'scheduled',
    currentViewers: 0,
    peakViewers: 0,
    totalViews: 0,
    isPrivate: false,
    allowChat: true,
    allowReactions: true,
    donationsEnabled: false,
    recordingEnabled: true,
    chatModeration: 'basic',
    bannedUserIds: [],
  };
}

/**
 * Sync timestamp for live viewing
 * Returns offset in ms to sync viewers
 */
export function calculateSyncOffset(serverTimestamp: number): number {
  const localTimestamp = Date.now();
  return serverTimestamp - localTimestamp;
}
