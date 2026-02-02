/**
 * Fernhill Community - Live Event Mode
 * 
 * Real-time presence, who's dancing, live chat,
 * and event-specific interactions.
 */

export interface EventPresence {
  userId: string
  tribeName: string
  avatarUrl: string | null
  status: 'dancing' | 'resting' | 'arriving' | 'leaving'
  lastSeen: string
  mood?: string // Current mood emoji
}

export interface LiveEventState {
  eventId: string
  isLive: boolean
  attendees: EventPresence[]
  currentTrack?: {
    title: string
    artist: string
    artworkUrl?: string
  }
  energyLevel: number // 0-100
  chatMessages: LiveChatMessage[]
}

export interface LiveChatMessage {
  id: string
  userId: string
  tribeName: string
  avatarUrl: string | null
  content: string
  type: 'text' | 'reaction' | 'system'
  createdAt: string
}

// Status options for presence
export const PRESENCE_STATUSES = [
  { id: 'dancing', label: 'Dancing', emoji: '💃' },
  { id: 'resting', label: 'Taking a break', emoji: '☕' },
  { id: 'arriving', label: 'Just arrived', emoji: '👋' },
  { id: 'leaving', label: 'Heading out', emoji: '🚗' },
]

/**
 * Calculate event energy level from attendee statuses and reactions
 */
export function calculateEnergyLevel(attendees: EventPresence[]): number {
  if (attendees.length === 0) return 0
  
  const dancing = attendees.filter(a => a.status === 'dancing').length
  const total = attendees.length
  
  // Base energy from dancing ratio
  const baseEnergy = (dancing / total) * 80
  
  // Add bonus for crowd size
  const crowdBonus = Math.min(attendees.length * 0.5, 20)
  
  return Math.min(Math.round(baseEnergy + crowdBonus), 100)
}

/**
 * Group attendees by status
 */
export function groupByStatus(attendees: EventPresence[]): Record<string, EventPresence[]> {
  return attendees.reduce((acc, attendee) => {
    if (!acc[attendee.status]) acc[attendee.status] = []
    acc[attendee.status].push(attendee)
    return acc
  }, {} as Record<string, EventPresence[]>)
}

// Quick reaction emojis for live chat
export const LIVE_REACTIONS = ['🔥', '💃', '🎶', '✨', '❤️', '🙌', '🌊', '⚡']

/**
 * Generate a random entry animation class
 */
export function getEntryAnimation(): string {
  const animations = [
    'animate-slide-in-left',
    'animate-slide-in-right',
    'animate-fade-in',
    'animate-scale-in',
  ]
  return animations[Math.floor(Math.random() * animations.length)]
}
