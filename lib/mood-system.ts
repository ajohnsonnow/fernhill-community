/**
 * Fernhill Community - Mood & Vibe System
 * 
 * Daily mood check-ins, community vibe dashboard,
 * and emotional wellness tracking.
 */

export interface Mood {
  id: string
  emoji: string
  label: string
  color: string
  energy: 'low' | 'medium' | 'high'
}

export const MOODS: Mood[] = [
  { id: 'ecstatic', emoji: '🤩', label: 'Ecstatic', color: '#FFD700', energy: 'high' },
  { id: 'joyful', emoji: '😊', label: 'Joyful', color: '#22C55E', energy: 'high' },
  { id: 'peaceful', emoji: '😌', label: 'Peaceful', color: '#60A5FA', energy: 'medium' },
  { id: 'grateful', emoji: '🙏', label: 'Grateful', color: '#A855F7', energy: 'medium' },
  { id: 'curious', emoji: '🤔', label: 'Curious', color: '#14B8A6', energy: 'medium' },
  { id: 'mellow', emoji: '😴', label: 'Mellow', color: '#64748B', energy: 'low' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', color: '#F97316', energy: 'high' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: '#3B82F6', energy: 'low' },
  { id: 'frustrated', emoji: '😤', label: 'Frustrated', color: '#EF4444', energy: 'high' },
  { id: 'overwhelmed', emoji: '🥺', label: 'Overwhelmed', color: '#EC4899', energy: 'low' },
]

export interface MoodEntry {
  id: string
  userId: string
  moodId: string
  note?: string
  isPublic: boolean
  createdAt: string
}

export interface CommunityVibeStats {
  totalCheckins: number
  topMoods: { moodId: string; count: number; percentage: number }[]
  averageEnergy: number // 0-100
  vibeShift: 'up' | 'down' | 'stable'
}

/**
 * Get mood by ID
 */
export function getMood(id: string): Mood | undefined {
  return MOODS.find(m => m.id === id)
}

/**
 * Get moods by energy level
 */
export function getMoodsByEnergy(energy: Mood['energy']): Mood[] {
  return MOODS.filter(m => m.energy === energy)
}

/**
 * Calculate community vibe from mood entries
 */
export function calculateCommunityVibe(entries: MoodEntry[]): CommunityVibeStats {
  if (entries.length === 0) {
    return {
      totalCheckins: 0,
      topMoods: [],
      averageEnergy: 50,
      vibeShift: 'stable',
    }
  }
  
  // Count moods
  const moodCounts: Record<string, number> = {}
  let totalEnergy = 0
  
  entries.forEach(entry => {
    moodCounts[entry.moodId] = (moodCounts[entry.moodId] || 0) + 1
    const mood = getMood(entry.moodId)
    if (mood) {
      totalEnergy += mood.energy === 'high' ? 80 : mood.energy === 'medium' ? 50 : 20
    }
  })
  
  // Sort by count
  const topMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([moodId, count]) => ({
      moodId,
      count,
      percentage: Math.round((count / entries.length) * 100),
    }))
  
  return {
    totalCheckins: entries.length,
    topMoods,
    averageEnergy: Math.round(totalEnergy / entries.length),
    vibeShift: 'stable', // Would compare to previous period
  }
}

/**
 * Get supportive message based on mood
 */
export function getSupportMessage(moodId: string): string {
  const messages: Record<string, string[]> = {
    ecstatic: [
      'Your energy is contagious! 🌟',
      'Ride that wave of joy!',
      'What a beautiful vibe to share!',
    ],
    joyful: [
      'Keep shining! ✨',
      'Your joy brightens the community!',
      'Wonderful energy today!',
    ],
    peaceful: [
      'Enjoy the calm 🧘',
      'Inner peace is a gift',
      'Serenity suits you',
    ],
    grateful: [
      'Gratitude is magic ✨',
      'Thank you for sharing your appreciation',
      'Gratitude ripples outward',
    ],
    curious: [
      'Stay curious, stay growing! 🌱',
      'Wonder is the beginning of wisdom',
      'Great minds ask questions',
    ],
    mellow: [
      'Rest is productive too 💤',
      'Gentle vibes are welcome',
      'Take your time today',
    ],
    anxious: [
      'You\'re not alone 💙',
      'This too shall pass',
      'Breathe. You\'ve got this.',
      'The community has your back',
    ],
    sad: [
      'Sending you warmth 🤗',
      'It\'s okay to feel this way',
      'We\'re here for you',
      'Sadness is part of being human',
    ],
    frustrated: [
      'Valid feelings. Deep breath 🌊',
      'Channel that energy constructively',
      'Movement can help release frustration',
    ],
    overwhelmed: [
      'One step at a time 🐢',
      'You don\'t have to carry it alone',
      'Reach out if you need support',
      'It\'s okay to ask for help',
    ],
  }
  
  const options = messages[moodId] || ['Thanks for checking in!']
  return options[Math.floor(Math.random() * options.length)]
}
