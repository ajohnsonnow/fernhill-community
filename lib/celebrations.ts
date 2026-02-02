// ============================================
// Celebration Animations & Delights
// Phase I: Diamond Status - v1.15.0
// ============================================

export type CelebrationType =
  | 'confetti'        // Classic confetti burst
  | 'fireworks'       // Firework explosions
  | 'sparkles'        // Subtle sparkle effect
  | 'hearts'          // Floating hearts
  | 'stars'           // Shooting stars
  | 'emoji_burst'     // Burst of emojis
  | 'level_up'        // Level up celebration
  | 'achievement'     // Achievement unlock
  | 'streak'          // Streak milestone
  | 'anniversary';    // Anniversary celebration

export interface CelebrationConfig {
  type: CelebrationType;
  duration: number; // ms
  intensity: 'subtle' | 'normal' | 'epic';
  colors?: string[];
  emoji?: string;
  sound?: string;
  haptic?: 'light' | 'medium' | 'heavy';
  message?: string;
  subMessage?: string;
}

// ============================================
// CELEBRATION PRESETS
// ============================================

export const CELEBRATIONS: Record<string, CelebrationConfig> = {
  // Achievement unlocks
  achievement_common: {
    type: 'sparkles',
    duration: 2000,
    intensity: 'subtle',
    colors: ['#FFD700', '#FFA500'],
    haptic: 'light',
  },
  achievement_uncommon: {
    type: 'confetti',
    duration: 2500,
    intensity: 'normal',
    colors: ['#4CAF50', '#8BC34A', '#CDDC39'],
    haptic: 'medium',
  },
  achievement_rare: {
    type: 'confetti',
    duration: 3000,
    intensity: 'normal',
    colors: ['#2196F3', '#03A9F4', '#00BCD4'],
    haptic: 'medium',
    sound: 'achievement_rare',
  },
  achievement_epic: {
    type: 'fireworks',
    duration: 4000,
    intensity: 'epic',
    colors: ['#9C27B0', '#E91E63', '#FF4081'],
    haptic: 'heavy',
    sound: 'achievement_epic',
  },
  achievement_legendary: {
    type: 'fireworks',
    duration: 5000,
    intensity: 'epic',
    colors: ['#FFD700', '#FFC107', '#FF9800', '#FF5722'],
    haptic: 'heavy',
    sound: 'achievement_legendary',
  },

  // Level ups
  level_up_basic: {
    type: 'level_up',
    duration: 3000,
    intensity: 'normal',
    colors: ['#4CAF50', '#8BC34A'],
    haptic: 'medium',
    sound: 'level_up',
  },
  level_up_milestone: {
    type: 'level_up',
    duration: 4000,
    intensity: 'epic',
    colors: ['#FFD700', '#FFC107', '#FF9800'],
    haptic: 'heavy',
    sound: 'level_up_epic',
  },

  // Streaks
  streak_3: {
    type: 'streak',
    duration: 2000,
    intensity: 'subtle',
    emoji: '🔥',
    haptic: 'light',
  },
  streak_7: {
    type: 'streak',
    duration: 2500,
    intensity: 'normal',
    emoji: '🔥',
    colors: ['#FF6B6B', '#FF8E53'],
    haptic: 'medium',
  },
  streak_30: {
    type: 'fireworks',
    duration: 4000,
    intensity: 'epic',
    emoji: '🔥',
    colors: ['#FF6B6B', '#FF8E53', '#FFD93D'],
    haptic: 'heavy',
    sound: 'streak_epic',
  },

  // Social
  first_connection: {
    type: 'hearts',
    duration: 2500,
    intensity: 'normal',
    colors: ['#FF6B6B', '#FF8E8E', '#FFB3B3'],
    haptic: 'medium',
  },
  new_friend: {
    type: 'emoji_burst',
    duration: 2000,
    intensity: 'normal',
    emoji: '🤝',
    haptic: 'light',
  },

  // Events
  event_checkin: {
    type: 'sparkles',
    duration: 1500,
    intensity: 'subtle',
    colors: ['#00BCD4', '#4DD0E1'],
    haptic: 'light',
  },
  event_checkin_first: {
    type: 'confetti',
    duration: 3000,
    intensity: 'normal',
    colors: ['#9C27B0', '#E91E63', '#FF4081', '#F48FB1'],
    haptic: 'medium',
    message: 'First to arrive! 🎉',
  },

  // Daily challenges
  daily_complete: {
    type: 'sparkles',
    duration: 1500,
    intensity: 'subtle',
    colors: ['#4CAF50', '#8BC34A'],
    haptic: 'light',
  },
  all_dailies_complete: {
    type: 'confetti',
    duration: 3000,
    intensity: 'normal',
    colors: ['#FFD700', '#FFC107', '#FF9800'],
    haptic: 'medium',
    message: 'All Daily Challenges Complete!',
    subMessage: '+25 Bonus XP',
  },

  // Anniversary
  anniversary_month: {
    type: 'confetti',
    duration: 3000,
    intensity: 'normal',
    colors: ['#E91E63', '#9C27B0', '#673AB7'],
    haptic: 'medium',
    message: '1 Month Anniversary! 🎂',
  },
  anniversary_year: {
    type: 'fireworks',
    duration: 5000,
    intensity: 'epic',
    colors: ['#FFD700', '#FF6B6B', '#4CAF50', '#2196F3', '#9C27B0'],
    haptic: 'heavy',
    sound: 'anniversary',
    message: '1 Year Anniversary! 🎉',
    subMessage: 'Thank you for being part of our community!',
  },

  // Reactions
  reaction_burst: {
    type: 'emoji_burst',
    duration: 1000,
    intensity: 'subtle',
    haptic: 'light',
  },
};

// ============================================
// CONFETTI CONFIGURATION
// ============================================

export interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'square' | 'circle' | 'ribbon';
}

export function generateConfettiParticles(
  count: number,
  colors: string[],
  origin: { x: number; y: number } = { x: 0.5, y: 0.3 }
): ConfettiParticle[] {
  const particles: ConfettiParticle[] = [];
  const shapes: ConfettiParticle['shape'][] = ['square', 'circle', 'ribbon'];
  
  for (let i = 0; i < count; i++) {
    particles.push({
      x: origin.x + (Math.random() - 0.5) * 0.2,
      y: origin.y,
      vx: (Math.random() - 0.5) * 15,
      vy: Math.random() * -15 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    });
  }
  
  return particles;
}

// ============================================
// FIREWORK CONFIGURATION
// ============================================

export interface Firework {
  x: number;
  y: number;
  targetY: number;
  exploded: boolean;
  particles: FireworkParticle[];
  color: string;
}

export interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
}

export function createFirework(
  x: number,
  color: string
): Firework {
  return {
    x,
    y: 1.0,
    targetY: 0.2 + Math.random() * 0.3,
    exploded: false,
    particles: [],
    color,
  };
}

export function explodeFirework(firework: Firework, particleCount: number = 50): FireworkParticle[] {
  const particles: FireworkParticle[] = [];
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    
    particles.push({
      x: firework.x,
      y: firework.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      decay: Math.random() * 0.02 + 0.01,
      color: firework.color,
    });
  }
  
  return particles;
}

// ============================================
// HAPTIC FEEDBACK
// ============================================

export function triggerHaptic(intensity: 'light' | 'medium' | 'heavy'): void {
  if (!('vibrate' in navigator)) return;
  
  switch (intensity) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'medium':
      navigator.vibrate([20, 10, 20]);
      break;
    case 'heavy':
      navigator.vibrate([30, 20, 30, 20, 50]);
      break;
  }
}

// ============================================
// SOUND EFFECTS (URLs would be actual audio files)
// ============================================

export const CELEBRATION_SOUNDS: Record<string, string> = {
  achievement_rare: '/sounds/achievement-rare.mp3',
  achievement_epic: '/sounds/achievement-epic.mp3',
  achievement_legendary: '/sounds/achievement-legendary.mp3',
  level_up: '/sounds/level-up.mp3',
  level_up_epic: '/sounds/level-up-epic.mp3',
  streak_epic: '/sounds/streak-epic.mp3',
  anniversary: '/sounds/anniversary.mp3',
  confetti: '/sounds/confetti.mp3',
};

// ============================================
// TRIGGER CELEBRATION
// ============================================

export interface CelebrationTrigger {
  trigger: (config: CelebrationConfig) => void;
  stop: () => void;
}

export function getCelebrationForAchievement(rarity: string): CelebrationConfig {
  switch (rarity) {
    case 'legendary':
      return CELEBRATIONS.achievement_legendary;
    case 'epic':
      return CELEBRATIONS.achievement_epic;
    case 'rare':
      return CELEBRATIONS.achievement_rare;
    case 'uncommon':
      return CELEBRATIONS.achievement_uncommon;
    default:
      return CELEBRATIONS.achievement_common;
  }
}

export function getCelebrationForLevelUp(level: number): CelebrationConfig {
  // Milestone levels: 5, 10, 15, 20, etc.
  if (level % 5 === 0) {
    return {
      ...CELEBRATIONS.level_up_milestone,
      message: `Level ${level}!`,
      subMessage: 'Milestone Reached! 🎉',
    };
  }
  
  return {
    ...CELEBRATIONS.level_up_basic,
    message: `Level ${level}!`,
  };
}

export function getCelebrationForStreak(streak: number): CelebrationConfig | null {
  if (streak >= 30 && streak % 30 === 0) {
    return {
      ...CELEBRATIONS.streak_30,
      message: `${streak} Day Streak! 🔥`,
    };
  }
  if (streak >= 7 && streak % 7 === 0) {
    return {
      ...CELEBRATIONS.streak_7,
      message: `${streak} Day Streak! 🔥`,
    };
  }
  if (streak === 3) {
    return {
      ...CELEBRATIONS.streak_3,
      message: '3 Day Streak! 🔥',
    };
  }
  return null;
}

// ============================================
// EASTER EGGS
// ============================================

export const EASTER_EGGS = {
  konami: {
    code: ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'],
    celebration: {
      type: 'fireworks' as CelebrationType,
      duration: 5000,
      intensity: 'epic' as const,
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
      haptic: 'heavy' as const,
      message: '🎮 Konami Code Activated!',
      subMessage: '+100 Secret XP',
    },
  },
  dance_party: {
    trigger: 'shake', // Shake device
    celebration: {
      type: 'emoji_burst' as CelebrationType,
      duration: 3000,
      intensity: 'epic' as const,
      emoji: '💃🕺',
      haptic: 'heavy' as const,
      message: 'Shake it! 💃',
    },
  },
  midnight: {
    trigger: 'time', // At midnight
    celebration: {
      type: 'stars' as CelebrationType,
      duration: 4000,
      intensity: 'normal' as const,
      colors: ['#FFFFFF', '#FFD700', '#87CEEB'],
      message: '✨ Midnight Dancer ✨',
    },
  },
};
