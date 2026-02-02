'use client'

import { useState } from 'react'
import { 
  type EventRecommendation,
  type WeeklyDigest
} from '@/lib/recommendations'
import { haptic } from '@/lib/haptics'
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Calendar,
  ChevronRight,
  Heart,
  Zap,
  Star,
  Music,
  Target,
  Trophy
} from 'lucide-react'

interface RecommendedEventCardProps {
  recommendation: EventRecommendation
  event: {
    id: string
    title: string
    date: string
    location?: string
    imageUrl?: string
    attendeeCount?: number
  }
  onClick: () => void
}

/**
 * Card showing a recommended event with reason
 */
export function RecommendedEventCard({ 
  recommendation, 
  event, 
  onClick 
}: RecommendedEventCardProps) {
  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'friend_attending': return <Users className="w-3 h-3" />
      case 'mood_match': return <Heart className="w-3 h-3" />
      case 'trending': return <TrendingUp className="w-3 h-3" />
      case 'highly_rated': return <Star className="w-3 h-3" />
      case 'streak_builder': return <Zap className="w-3 h-3" />
      case 'achievement_unlock': return <Trophy className="w-3 h-3" />
      default: return <Sparkles className="w-3 h-3" />
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      default: return 'text-stone-400'
    }
  }
  
  return (
    <button
      onClick={() => {
        haptic('light')
        onClick()
      }}
      className="w-full text-left bg-stone-800 rounded-xl overflow-hidden hover:bg-stone-750 transition-colors"
    >
      <div className="flex gap-3 p-3">
        {/* Event Image */}
        <div className="w-20 h-20 rounded-lg bg-stone-700 overflow-hidden flex-shrink-0">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-stone-500" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Recommendation Badge */}
          <div className="flex items-center gap-1 mb-1">
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-fernhill-gold/20 text-fernhill-gold">
              {getReasonIcon(recommendation.reasons[0])}
              {recommendation.primaryReason}
            </span>
            <span className={`text-xs ${getConfidenceColor(recommendation.confidence)}`}>
              {recommendation.score}% match
            </span>
          </div>
          
          <h4 className="font-semibold text-white truncate">{event.title}</h4>
          <p className="text-sm text-stone-400">{event.date}</p>
          
          {event.attendeeCount !== undefined && (
            <div className="flex items-center gap-1 mt-1 text-xs text-stone-500">
              <Users className="w-3 h-3" />
              {event.attendeeCount} going
            </div>
          )}
        </div>
        
        <ChevronRight className="w-5 h-5 text-stone-500 self-center flex-shrink-0" />
      </div>
    </button>
  )
}

interface ForYouSectionProps {
  recommendations: Array<{
    recommendation: EventRecommendation
    event: {
      id: string
      title: string
      date: string
      location?: string
      imageUrl?: string
      attendeeCount?: number
    }
  }>
  onEventClick: (eventId: string) => void
}

/**
 * "For You" personalized recommendations section
 */
export function ForYouSection({ recommendations, onEventClick }: ForYouSectionProps) {
  if (recommendations.length === 0) return null
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-fernhill-gold" />
        <h2 className="font-bold text-white text-lg">For You</h2>
      </div>
      
      <div className="space-y-2">
        {recommendations.map(({ recommendation, event }) => (
          <RecommendedEventCard
            key={event.id}
            recommendation={recommendation}
            event={event}
            onClick={() => onEventClick(event.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface WeeklyDigestCardProps {
  digest: WeeklyDigest
  onViewEvent: (eventId: string) => void
}

/**
 * Weekly digest summary card
 */
export function WeeklyDigestCard({ digest, onViewEvent }: WeeklyDigestCardProps) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl overflow-hidden border border-purple-500/30">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📬</span>
          <h3 className="font-bold text-white">Your Weekly Digest</h3>
        </div>
        
        {/* Stats Row */}
        <div className="flex gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{digest.personalStats.eventsAttended}</div>
            <div className="text-xs text-stone-400">Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{digest.personalStats.xpEarned}</div>
            <div className="text-xs text-stone-400">XP Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-fernhill-gold">{digest.streakStatus.current}🔥</div>
            <div className="text-xs text-stone-400">Streak</div>
          </div>
        </div>
        
        {/* Streak Message */}
        <p className="text-sm text-stone-300 italic mb-3">"{digest.streakStatus.message}"</p>
        
        {/* Highlights */}
        {digest.communityHighlights.length > 0 && (
          <div className="space-y-1 mb-3">
            <h4 className="text-xs uppercase text-stone-400">Community Highlights</h4>
            {digest.communityHighlights.slice(0, expanded ? undefined : 2).map((highlight, i) => (
              <p key={i} className="text-sm text-stone-300">• {highlight}</p>
            ))}
          </div>
        )}
        
        {/* Recommended Events */}
        {digest.recommendedEvents.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs uppercase text-stone-400 mb-2">
              Picks for You ({digest.recommendedEvents.length})
            </h4>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-2 text-sm text-purple-300 hover:text-white transition-colors"
            >
              {expanded ? 'Show Less' : 'View Recommendations →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ExploreCarouselProps {
  title: string
  icon: React.ReactNode
  items: Array<{
    id: string
    title: string
    subtitle?: string
    imageUrl?: string
  }>
  onItemClick: (id: string) => void
}

/**
 * Horizontal carousel for discovery
 */
export function ExploreCarousel({ title, icon, items, onItemClick }: ExploreCarouselProps) {
  if (items.length === 0) return null
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-4">
        {icon}
        <h2 className="font-bold text-white text-lg">{title}</h2>
      </div>
      
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              haptic('light')
              onItemClick(item.id)
            }}
            className="flex-shrink-0 w-36 text-left group"
          >
            <div className="w-36 h-36 rounded-xl bg-stone-800 overflow-hidden mb-2 group-hover:ring-2 ring-fernhill-gold transition-all">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-stone-600" />
                </div>
              )}
            </div>
            <h4 className="font-medium text-white text-sm truncate">{item.title}</h4>
            {item.subtitle && (
              <p className="text-xs text-stone-400 truncate">{item.subtitle}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

interface DiscoveryChipsProps {
  categories: Array<{
    id: string
    label: string
    emoji: string
    count?: number
  }>
  selected: string[]
  onChange: (selected: string[]) => void
}

/**
 * Filter chips for discovery
 */
export function DiscoveryChips({ categories, selected, onChange }: DiscoveryChipsProps) {
  const toggleCategory = (id: string) => {
    haptic('light')
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id))
    } else {
      onChange([...selected, id])
    }
  }
  
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => toggleCategory(cat.id)}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap transition-colors
            ${selected.includes(cat.id)
              ? 'bg-fernhill-gold text-fernhill-dark'
              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }
          `}
        >
          <span>{cat.emoji}</span>
          <span className="text-sm">{cat.label}</span>
          {cat.count !== undefined && (
            <span className="text-xs opacity-70">({cat.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}

interface EmptyRecommendationsProps {
  onExplore: () => void
}

/**
 * Empty state when no recommendations yet
 */
export function EmptyRecommendations({ onExplore }: EmptyRecommendationsProps) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-800 flex items-center justify-center">
        <Target className="w-8 h-8 text-stone-500" />
      </div>
      <h3 className="font-bold text-white text-lg mb-2">Building Your Profile</h3>
      <p className="text-stone-400 mb-4">
        Attend a few events and we'll start suggesting ones you'll love!
      </p>
      <button
        onClick={() => {
          haptic('light')
          onExplore()
        }}
        className="px-6 py-3 rounded-xl bg-fernhill-gold text-fernhill-dark font-semibold"
      >
        Explore Events
      </button>
    </div>
  )
}
