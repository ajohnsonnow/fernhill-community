// ============================================
// Stories System (24hr Ephemeral Content)
// Phase I: Diamond Status - v1.15.0
// ============================================

export type StoryType = 
  | 'photo'     // Single image
  | 'text'      // Text with background
  | 'poll'      // Quick poll
  | 'music'     // Now playing/song share
  | 'event'     // Event highlight
  | 'mood'      // Mood share
  | 'shoutout'; // Appreciation for someone

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: StoryType;
  content: StoryContent;
  createdAt: Date;
  expiresAt: Date; // 24 hours from creation
  viewCount: number;
  viewers: string[]; // User IDs who viewed
  reactions: StoryReaction[];
  isActive: boolean;
}

export type StoryContent = 
  | PhotoStoryContent
  | TextStoryContent
  | PollStoryContent
  | MusicStoryContent
  | EventStoryContent
  | MoodStoryContent
  | ShoutoutStoryContent;

export interface PhotoStoryContent {
  type: 'photo';
  imageUrl: string;
  caption?: string;
  filter?: string;
  stickers?: Sticker[];
}

export interface TextStoryContent {
  type: 'text';
  text: string;
  backgroundColor: string;
  textColor: string;
  fontStyle: 'normal' | 'bold' | 'handwritten' | 'retro';
  alignment: 'left' | 'center' | 'right';
}

export interface PollStoryContent {
  type: 'poll';
  question: string;
  options: PollOption[];
  backgroundColor: string;
  totalVotes: number;
}

export interface PollOption {
  id: string;
  text: string;
  emoji?: string;
  votes: number;
  percentage: number;
}

export interface MusicStoryContent {
  type: 'music';
  trackTitle: string;
  trackArtist: string;
  artworkUrl?: string;
  spotifyUrl?: string;
  backgroundColor: string;
  caption?: string;
}

export interface EventStoryContent {
  type: 'event';
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  imageUrl?: string;
  caption?: string;
  isHighlight: boolean;
}

export interface MoodStoryContent {
  type: 'mood';
  mood: string;
  moodEmoji: string;
  energy: number;
  backgroundColor: string;
  message?: string;
}

export interface ShoutoutStoryContent {
  type: 'shoutout';
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  message: string;
  backgroundColor: string;
  emoji: string;
}

export interface Sticker {
  id: string;
  type: 'emoji' | 'gif' | 'location' | 'mention' | 'hashtag';
  content: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

export interface StoryReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

// ============================================
// STORY RING (User's story collection)
// ============================================

export interface StoryRing {
  userId: string;
  userName: string;
  userAvatar?: string;
  stories: Story[];
  hasUnviewed: boolean;
  latestStoryAt: Date;
  isOwnStory: boolean;
}

// ============================================
// STORY BACKGROUNDS
// ============================================

export const STORY_BACKGROUNDS = {
  gradients: [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    'linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)',
    'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', // Dark
    'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', // Night
  ],
  solids: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#1a1a1a', '#2d3436', '#636e72',
  ],
};

export const STORY_FONTS = {
  normal: 'Inter, system-ui, sans-serif',
  bold: 'Inter, system-ui, sans-serif',
  handwritten: 'Caveat, cursive',
  retro: 'VT323, monospace',
};

// ============================================
// STORY REACTIONS
// ============================================

export const STORY_REACTIONS = ['❤️', '🔥', '😍', '👏', '🙌', '💯', '😂', '🥺'];

// ============================================
// STORY UTILITY FUNCTIONS
// ============================================

/**
 * Create a new story with 24hr expiration
 */
export function createStory(
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  type: StoryType,
  content: StoryContent
): Omit<Story, 'id'> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return {
    userId,
    userName,
    userAvatar,
    type,
    content,
    createdAt: now,
    expiresAt,
    viewCount: 0,
    viewers: [],
    reactions: [],
    isActive: true,
  };
}

/**
 * Check if a story is still active
 */
export function isStoryActive(story: Story): boolean {
  return story.isActive && new Date() < story.expiresAt;
}

/**
 * Get time remaining for a story
 */
export function getStoryTimeRemaining(story: Story): string {
  const now = new Date();
  const diff = story.expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/**
 * Group stories by user for story rings
 */
export function groupStoriesByUser(
  stories: Story[],
  currentUserId: string
): StoryRing[] {
  const userMap = new Map<string, StoryRing>();
  
  // Filter active stories and sort by creation time
  const activeStories = stories
    .filter(isStoryActive)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  for (const story of activeStories) {
    const existing = userMap.get(story.userId);
    
    if (existing) {
      existing.stories.push(story);
      if (!story.viewers.includes(currentUserId)) {
        existing.hasUnviewed = true;
      }
    } else {
      userMap.set(story.userId, {
        userId: story.userId,
        userName: story.userName,
        userAvatar: story.userAvatar,
        stories: [story],
        hasUnviewed: !story.viewers.includes(currentUserId),
        latestStoryAt: story.createdAt,
        isOwnStory: story.userId === currentUserId,
      });
    }
  }
  
  // Sort: own story first, then unviewed, then by latest
  return Array.from(userMap.values()).sort((a, b) => {
    if (a.isOwnStory) return -1;
    if (b.isOwnStory) return 1;
    if (a.hasUnviewed && !b.hasUnviewed) return -1;
    if (!a.hasUnviewed && b.hasUnviewed) return 1;
    return b.latestStoryAt.getTime() - a.latestStoryAt.getTime();
  });
}

/**
 * Create a text story
 */
export function createTextStory(
  text: string,
  options: {
    backgroundColor?: string;
    textColor?: string;
    fontStyle?: TextStoryContent['fontStyle'];
    alignment?: TextStoryContent['alignment'];
  } = {}
): TextStoryContent {
  return {
    type: 'text',
    text,
    backgroundColor: options.backgroundColor || STORY_BACKGROUNDS.gradients[0],
    textColor: options.textColor || '#ffffff',
    fontStyle: options.fontStyle || 'normal',
    alignment: options.alignment || 'center',
  };
}

/**
 * Create a mood story
 */
export function createMoodStory(
  mood: string,
  moodEmoji: string,
  energy: number,
  message?: string
): MoodStoryContent {
  // Pick background based on energy level
  const bgIndex = Math.min(energy - 1, STORY_BACKGROUNDS.gradients.length - 1);
  
  return {
    type: 'mood',
    mood,
    moodEmoji,
    energy,
    backgroundColor: STORY_BACKGROUNDS.gradients[bgIndex],
    message,
  };
}

/**
 * Create a shoutout story
 */
export function createShoutoutStory(
  recipientId: string,
  recipientName: string,
  recipientAvatar: string | undefined,
  message: string,
  emoji: string = '🙌'
): ShoutoutStoryContent {
  return {
    type: 'shoutout',
    recipientId,
    recipientName,
    recipientAvatar,
    message,
    backgroundColor: STORY_BACKGROUNDS.gradients[4], // Warm gradient
    emoji,
  };
}

/**
 * Create a poll story
 */
export function createPollStory(
  question: string,
  options: string[]
): PollStoryContent {
  return {
    type: 'poll',
    question,
    options: options.map((text, i) => ({
      id: `option_${i}`,
      text,
      votes: 0,
      percentage: 0,
    })),
    backgroundColor: STORY_BACKGROUNDS.gradients[2],
    totalVotes: 0,
  };
}

/**
 * Update poll votes
 */
export function updatePollVotes(
  poll: PollStoryContent,
  optionId: string
): PollStoryContent {
  const newOptions = poll.options.map(opt => ({
    ...opt,
    votes: opt.id === optionId ? opt.votes + 1 : opt.votes,
  }));
  
  const totalVotes = newOptions.reduce((sum, opt) => sum + opt.votes, 0);
  
  return {
    ...poll,
    options: newOptions.map(opt => ({
      ...opt,
      percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
    })),
    totalVotes,
  };
}
