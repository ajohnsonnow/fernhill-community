/**
 * Smart Recommendations Engine
 * Phase H: Electric Avenue (v1.14.0)
 * 
 * Personalized event suggestions based on:
 * - Attendance history
 * - Mood patterns
 * - Social connections
 * - Time preferences
 * - Event ratings
 */

// Recommendation algorithms
export type RecommendationReason = 
  | 'attendance_pattern'     // You often attend similar events
  | 'friend_attending'       // Your friends are going
  | 'mood_match'            // Matches your current mood
  | 'time_preference'       // Fits your schedule
  | 'highly_rated'          // Top rated by community
  | 'trending'              // Popular right now
  | 'new_experience'        // Try something different
  | 'similar_interest'      // Based on your interests
  | 'streak_builder'        // Keep your streak going
  | 'achievement_unlock'    // Attend to unlock achievement

export interface EventRecommendation {
  eventId: string
  score: number               // 0-100 relevance score
  reasons: RecommendationReason[]
  primaryReason: string       // Human-readable explanation
  confidence: 'high' | 'medium' | 'low'
}

export interface UserProfile {
  userId: string
  attendanceHistory: AttendanceRecord[]
  moodHistory: MoodRecord[]
  interests: string[]
  friends: string[]
  preferredTimes: TimePreference[]
  eventRatings: EventRating[]
}

export interface AttendanceRecord {
  eventId: string
  eventType: string
  eventTags: string[]
  attendedAt: string
  stayedDuration: number      // minutes
  rating?: number             // 1-5
}

export interface MoodRecord {
  mood: string
  energy: number
  recordedAt: string
}

export interface TimePreference {
  dayOfWeek: number           // 0-6
  timeRange: 'morning' | 'afternoon' | 'evening' | 'night'
  attendanceRate: number      // 0-1
}

export interface EventRating {
  eventId: string
  rating: number              // 1-5
  ratedAt: string
}

// Weights for scoring (tune based on community feedback)
const SCORE_WEIGHTS = {
  attendance_pattern: 25,
  friend_attending: 20,
  mood_match: 15,
  time_preference: 15,
  highly_rated: 10,
  trending: 5,
  new_experience: 5,
  similar_interest: 20,
  streak_builder: 10,
  achievement_unlock: 10
}

/**
 * Calculate similarity between two tag arrays
 */
export function calculateTagSimilarity(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 || tags2.length === 0) return 0
  const set1 = new Set(tags1.map(t => t.toLowerCase()))
  const set2 = new Set(tags2.map(t => t.toLowerCase()))
  const intersection = [...set1].filter(t => set2.has(t))
  const union = new Set([...set1, ...set2])
  return intersection.length / union.size // Jaccard similarity
}

/**
 * Get user's preferred event types based on history
 */
export function getPreferredEventTypes(history: AttendanceRecord[]): Map<string, number> {
  const typeCounts = new Map<string, number>()
  
  history.forEach(record => {
    const current = typeCounts.get(record.eventType) || 0
    // Weight recent attendance higher
    const daysAgo = Math.floor((Date.now() - new Date(record.attendedAt).getTime()) / (1000 * 60 * 60 * 24))
    const recencyWeight = Math.max(0.1, 1 - (daysAgo / 90)) // Decay over 90 days
    typeCounts.set(record.eventType, current + recencyWeight)
  })
  
  // Normalize to 0-1
  const maxCount = Math.max(...typeCounts.values(), 1)
  typeCounts.forEach((v, k) => typeCounts.set(k, v / maxCount))
  
  return typeCounts
}

/**
 * Determine best time slots for user
 */
export function getTimePreferences(history: AttendanceRecord[]): TimePreference[] {
  const slots = new Map<string, { total: number, attended: number }>()
  
  history.forEach(record => {
    const date = new Date(record.attendedAt)
    const day = date.getDay()
    const hour = date.getHours()
    const timeRange = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'
    const key = `${day}-${timeRange}`
    
    const current = slots.get(key) || { total: 0, attended: 0 }
    current.total++
    current.attended++
    slots.set(key, current)
  })
  
  return Array.from(slots.entries()).map(([key, value]) => {
    const [day, timeRange] = key.split('-')
    return {
      dayOfWeek: parseInt(day),
      timeRange: timeRange as TimePreference['timeRange'],
      attendanceRate: value.attended / value.total
    }
  })
}

/**
 * Check if event matches user's mood
 */
export function matchesMood(
  eventVibe: string, 
  currentMood: string,
  moodEnergy: number
): boolean {
  // Map event vibes to compatible moods
  const vibeToMood: Record<string, string[]> = {
    'energetic': ['joyful', 'excited', 'groovy'],
    'chill': ['peaceful', 'grateful', 'reflective'],
    'romantic': ['loved', 'peaceful', 'grateful'],
    'funky': ['groovy', 'excited', 'joyful'],
    'house': ['groovy', 'excited', 'focused'],
    'latin': ['joyful', 'excited', 'loved'],
    'throwback': ['nostalgic', 'joyful', 'grateful'],
    'ambient': ['peaceful', 'reflective', 'focused'],
    'world': ['curious', 'excited', 'grateful'],
    'mixed': ['joyful', 'excited', 'groovy', 'curious']
  }
  
  const compatibleMoods = vibeToMood[eventVibe] || vibeToMood['mixed']
  return compatibleMoods.includes(currentMood)
}

/**
 * Get "friends attending" count
 */
export function getFriendsAttending(
  eventAttendees: string[], 
  userFriends: string[]
): string[] {
  const friendSet = new Set(userFriends)
  return eventAttendees.filter(a => friendSet.has(a))
}

/**
 * Calculate trending score based on recent RSVPs
 */
export function calculateTrendingScore(
  recentRsvps: number,
  totalCapacity: number,
  hoursUntilEvent: number
): number {
  // Higher score for events filling up quickly
  const fillRate = recentRsvps / Math.max(totalCapacity, 1)
  const urgencyBoost = hoursUntilEvent < 24 ? 1.5 : hoursUntilEvent < 48 ? 1.2 : 1
  return Math.min(100, fillRate * 100 * urgencyBoost)
}

/**
 * Generate human-readable reason string
 */
export function formatRecommendationReason(
  reason: RecommendationReason,
  context?: Record<string, any>
): string {
  const templates: Record<RecommendationReason, string> = {
    attendance_pattern: 'You love these events!',
    friend_attending: context?.count 
      ? `${context.count} friend${context.count > 1 ? 's' : ''} going`
      : 'Friends are going',
    mood_match: 'Matches your vibe',
    time_preference: 'Perfect for your schedule',
    highly_rated: '⭐ Community favorite',
    trending: '🔥 Trending now',
    new_experience: '✨ Try something new',
    similar_interest: 'Based on your interests',
    streak_builder: '🔥 Keep your streak!',
    achievement_unlock: '🏆 Unlock an achievement!'
  }
  return templates[reason]
}

/**
 * Generate recommendations for a user
 */
export function generateRecommendations(
  profile: UserProfile,
  availableEvents: any[],
  options: {
    limit?: number
    excludeAttended?: boolean
    minScore?: number
  } = {}
): EventRecommendation[] {
  const { limit = 10, excludeAttended = true, minScore = 30 } = options
  
  const attendedIds = new Set(profile.attendanceHistory.map(a => a.eventId))
  const preferredTypes = getPreferredEventTypes(profile.attendanceHistory)
  const timePrefs = getTimePreferences(profile.attendanceHistory)
  const currentMood = profile.moodHistory[0]
  
  const recommendations: EventRecommendation[] = []
  
  availableEvents.forEach(event => {
    if (excludeAttended && attendedIds.has(event.id)) return
    
    let score = 0
    const reasons: RecommendationReason[] = []
    
    // 1. Attendance pattern match
    const typeScore = preferredTypes.get(event.type) || 0
    if (typeScore > 0.3) {
      score += SCORE_WEIGHTS.attendance_pattern * typeScore
      reasons.push('attendance_pattern')
    }
    
    // 2. Friends attending
    const friendsGoing = getFriendsAttending(event.attendees || [], profile.friends)
    if (friendsGoing.length > 0) {
      score += SCORE_WEIGHTS.friend_attending * Math.min(1, friendsGoing.length / 3)
      reasons.push('friend_attending')
    }
    
    // 3. Mood match
    if (currentMood && event.vibe && matchesMood(event.vibe, currentMood.mood, currentMood.energy)) {
      score += SCORE_WEIGHTS.mood_match
      reasons.push('mood_match')
    }
    
    // 4. Time preference
    const eventDate = new Date(event.date)
    const eventDay = eventDate.getDay()
    const eventHour = eventDate.getHours()
    const eventTimeRange = eventHour < 12 ? 'morning' : eventHour < 17 ? 'afternoon' : eventHour < 21 ? 'evening' : 'night'
    const timePref = timePrefs.find(t => t.dayOfWeek === eventDay && t.timeRange === eventTimeRange)
    if (timePref && timePref.attendanceRate > 0.5) {
      score += SCORE_WEIGHTS.time_preference * timePref.attendanceRate
      reasons.push('time_preference')
    }
    
    // 5. Highly rated
    if (event.averageRating && event.averageRating >= 4.5) {
      score += SCORE_WEIGHTS.highly_rated
      reasons.push('highly_rated')
    }
    
    // 6. Similar interests (tag matching)
    if (event.tags && profile.interests.length > 0) {
      const similarity = calculateTagSimilarity(event.tags, profile.interests)
      if (similarity > 0.2) {
        score += SCORE_WEIGHTS.similar_interest * similarity
        reasons.push('similar_interest')
      }
    }
    
    // 7. New experience bonus (events user hasn't tried)
    if (!preferredTypes.has(event.type)) {
      score += SCORE_WEIGHTS.new_experience
      reasons.push('new_experience')
    }
    
    if (score >= minScore && reasons.length > 0) {
      recommendations.push({
        eventId: event.id,
        score: Math.round(score),
        reasons,
        primaryReason: formatRecommendationReason(reasons[0]),
        confidence: score > 70 ? 'high' : score > 50 ? 'medium' : 'low'
      })
    }
  })
  
  // Sort by score, take top N
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Generate weekly digest content
 */
export interface WeeklyDigest {
  userId: string
  generatedAt: string
  recommendedEvents: EventRecommendation[]
  streakStatus: {
    current: number
    message: string
  }
  communityHighlights: string[]
  personalStats: {
    eventsAttended: number
    newFriends: number
    xpEarned: number
  }
}

export function generateWeeklyDigest(
  profile: UserProfile,
  upcomingEvents: any[],
  stats: { eventsAttended: number, newFriends: number, xpEarned: number },
  currentStreak: number
): WeeklyDigest {
  const recommendations = generateRecommendations(profile, upcomingEvents, { limit: 5 })
  
  const streakMessages = [
    { min: 0, max: 0, msg: "Start a new streak this week!" },
    { min: 1, max: 2, msg: "Your streak is growing! Keep it up!" },
    { min: 3, max: 5, msg: "Impressive streak! You're on fire! 🔥" },
    { min: 6, max: 10, msg: "Amazing dedication! You're a regular! ⭐" },
    { min: 11, max: 999, msg: "Legendary streak! You're an inspiration! 👑" }
  ]
  
  const streakMessage = streakMessages.find(
    m => currentStreak >= m.min && currentStreak <= m.max
  )?.msg || "Keep dancing!"
  
  return {
    userId: profile.userId,
    generatedAt: new Date().toISOString(),
    recommendedEvents: recommendations,
    streakStatus: {
      current: currentStreak,
      message: streakMessage
    },
    communityHighlights: [
      "New event category: Partner Dancing! 💃",
      "Community playlist now has 100+ tracks 🎵",
      "Photo gallery from Saturday's Swing Night 📸"
    ],
    personalStats: stats
  }
}
