// ============================================
// Tribes (Sub-communities/Crews)
// Phase I: Diamond Status - v1.15.0
// ============================================

export type TribeVisibility = 'public' | 'private' | 'invite_only';
export type TribeMemberRole = 'leader' | 'elder' | 'member';
export type TribeCategory = 
  | 'dance_style'    // Salsa, Swing, Ecstatic, etc.
  | 'location'       // Geographic tribes
  | 'interest'       // Music, wellness, etc.
  | 'skill_level'    // Beginners, Advanced, etc.
  | 'social'         // Friend groups
  | 'special';       // Event-specific, seasonal

export interface Tribe {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: TribeCategory;
  icon: string;
  bannerUrl?: string;
  avatarUrl?: string;
  visibility: TribeVisibility;
  memberCount: number;
  maxMembers?: number;
  createdBy: string;
  createdAt: Date;
  isVerified: boolean;
  isOfficial: boolean; // Admin-created tribes
  tags: string[];
  settings: TribeSettings;
  stats: TribeStats;
}

export interface TribeSettings {
  allowMemberPosts: boolean;
  allowMemberEvents: boolean;
  requireApproval: boolean;
  showInDirectory: boolean;
  allowDirectJoin: boolean;
  enableChat: boolean;
  enablePolls: boolean;
  customEmoji?: string[];
}

export interface TribeStats {
  totalPosts: number;
  totalEvents: number;
  weeklyActiveMembers: number;
  totalXpEarned: number;
  averageMemberLevel: number;
}

export interface TribeMember {
  id: string;
  tribeId: string;
  tribeName: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: TribeMemberRole;
  joinedAt: Date;
  xpContributed: number;
  postsCount: number;
  eventsAttended: number;
  isActive: boolean;
  customTitle?: string; // e.g., "Salsa Queen"
}

export interface TribeInvite {
  id: string;
  tribeId: string;
  inviterId: string;
  inviteeId?: string; // null for link invites
  inviteCode: string;
  expiresAt: Date;
  maxUses: number;
  uses: number;
  isActive: boolean;
  createdAt: Date;
}

export interface TribeJoinRequest {
  id: string;
  tribeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

// ============================================
// DEFAULT TRIBES
// ============================================

export const DEFAULT_TRIBES: Omit<Tribe, 'id' | 'createdAt' | 'stats'>[] = [
  {
    name: 'First Timers',
    slug: 'first-timers',
    description: 'Welcome to Fernhill! A supportive space for newcomers to connect and learn.',
    category: 'skill_level',
    icon: '🌱',
    visibility: 'public',
    memberCount: 0,
    createdBy: 'system',
    isVerified: true,
    isOfficial: true,
    tags: ['beginner', 'welcome', 'support'],
    settings: {
      allowMemberPosts: true,
      allowMemberEvents: false,
      requireApproval: false,
      showInDirectory: true,
      allowDirectJoin: true,
      enableChat: true,
      enablePolls: true,
    },
  },
  {
    name: 'Night Owls',
    slug: 'night-owls',
    description: 'For those who dance past midnight 🦉',
    category: 'social',
    icon: '🦉',
    visibility: 'public',
    memberCount: 0,
    createdBy: 'system',
    isVerified: true,
    isOfficial: true,
    tags: ['late-night', 'after-hours'],
    settings: {
      allowMemberPosts: true,
      allowMemberEvents: true,
      requireApproval: false,
      showInDirectory: true,
      allowDirectJoin: true,
      enableChat: true,
      enablePolls: true,
    },
  },
  {
    name: 'Ecstatic Explorers',
    slug: 'ecstatic-explorers',
    description: 'Deep diving into ecstatic dance and conscious movement',
    category: 'dance_style',
    icon: '✨',
    visibility: 'public',
    memberCount: 0,
    createdBy: 'system',
    isVerified: true,
    isOfficial: true,
    tags: ['ecstatic', 'conscious', 'movement'],
    settings: {
      allowMemberPosts: true,
      allowMemberEvents: true,
      requireApproval: false,
      showInDirectory: true,
      allowDirectJoin: true,
      enableChat: true,
      enablePolls: true,
    },
  },
  {
    name: 'Music Nerds',
    slug: 'music-nerds',
    description: 'Deep discussions about music, DJs, and the art of the playlist',
    category: 'interest',
    icon: '🎵',
    visibility: 'public',
    memberCount: 0,
    createdBy: 'system',
    isVerified: true,
    isOfficial: true,
    tags: ['music', 'playlists', 'dj'],
    settings: {
      allowMemberPosts: true,
      allowMemberEvents: true,
      requireApproval: false,
      showInDirectory: true,
      allowDirectJoin: true,
      enableChat: true,
      enablePolls: true,
    },
  },
  {
    name: 'Facilitators Circle',
    slug: 'facilitators',
    description: 'For event facilitators and those interested in holding space',
    category: 'special',
    icon: '🌀',
    visibility: 'private',
    memberCount: 0,
    createdBy: 'system',
    isVerified: true,
    isOfficial: true,
    tags: ['facilitator', 'leadership', 'training'],
    settings: {
      allowMemberPosts: true,
      allowMemberEvents: true,
      requireApproval: true,
      showInDirectory: true,
      allowDirectJoin: false,
      enableChat: true,
      enablePolls: true,
    },
  },
];

// ============================================
// TRIBE UTILITY FUNCTIONS
// ============================================

/**
 * Generate a unique tribe slug
 */
export function generateTribeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * Generate an invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Check if user can perform action in tribe
 */
export function canPerformAction(
  member: TribeMember | null,
  action: 'post' | 'create_event' | 'invite' | 'manage_members' | 'edit_settings'
): boolean {
  if (!member) return false;
  
  switch (action) {
    case 'post':
      return true; // All members can post
    case 'create_event':
      return member.role !== 'member' || true; // Check tribe settings
    case 'invite':
      return member.role !== 'member';
    case 'manage_members':
      return member.role === 'leader' || member.role === 'elder';
    case 'edit_settings':
      return member.role === 'leader';
    default:
      return false;
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: TribeMemberRole): string {
  switch (role) {
    case 'leader':
      return 'Tribe Leader';
    case 'elder':
      return 'Elder';
    case 'member':
      return 'Member';
  }
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: TribeMemberRole): string {
  switch (role) {
    case 'leader':
      return '#FFD700'; // Gold
    case 'elder':
      return '#C0C0C0'; // Silver
    case 'member':
      return '#CD7F32'; // Bronze
  }
}

/**
 * Calculate tribe level based on activity
 */
export function calculateTribeLevel(stats: TribeStats): number {
  const score = 
    stats.totalPosts * 1 +
    stats.totalEvents * 10 +
    stats.weeklyActiveMembers * 5 +
    stats.totalXpEarned * 0.01;
  
  if (score >= 10000) return 10;
  if (score >= 5000) return 9;
  if (score >= 2500) return 8;
  if (score >= 1000) return 7;
  if (score >= 500) return 6;
  if (score >= 250) return 5;
  if (score >= 100) return 4;
  if (score >= 50) return 3;
  if (score >= 20) return 2;
  return 1;
}

/**
 * Get tribe level title
 */
export function getTribeLevelTitle(level: number): string {
  const titles = [
    'Seedling',      // 1
    'Sprout',        // 2
    'Sapling',       // 3
    'Growing',       // 4
    'Established',   // 5
    'Thriving',      // 6
    'Flourishing',   // 7
    'Legendary',     // 8
    'Mythic',        // 9
    'Divine',        // 10
  ];
  return titles[Math.min(level - 1, titles.length - 1)];
}

// ============================================
// TRIBE FEED TYPES
// ============================================

export interface TribeFeedItem {
  id: string;
  tribeId: string;
  type: 'post' | 'event' | 'milestone' | 'welcome' | 'announcement';
  content: unknown;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: TribeMemberRole;
  createdAt: Date;
  reactions: { emoji: string; count: number; hasReacted: boolean }[];
  commentCount: number;
  isPinned: boolean;
}

export interface TribeMilestone {
  type: 'member_count' | 'xp_total' | 'events_hosted' | 'anniversary';
  value: number;
  message: string;
  celebrationConfig?: string; // Reference to celebration type
}

// ============================================
// XP REWARDS FOR TRIBE ACTIVITY
// ============================================

export const TRIBE_XP_REWARDS = {
  create_tribe: 100,
  join_tribe: 10,
  post_in_tribe: 5,
  host_tribe_event: 50,
  attend_tribe_event: 25,
  invite_accepted: 15,
  become_elder: 50,
  tribe_milestone: 25, // Bonus when tribe hits milestone
};
