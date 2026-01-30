'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Badge {
  id: string
  name: string
  description: string | null
  emoji: string
  category: string
}

interface MemberBadge {
  id: string
  awarded_at: string
  badge: Badge
  reason: string | null
}

interface BadgeDisplayProps {
  userId: string
  showAll?: boolean
  compact?: boolean
}

export default function BadgeDisplay({ userId, showAll = false, compact = false }: BadgeDisplayProps) {
  const [badges, setBadges] = useState<MemberBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchBadges()
  }, [userId])

  const fetchBadges = async () => {
    try {
      const { data, error } = await (supabase
        .from('member_badges') as any)
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false })

      if (error) throw error
      setBadges(data || [])
    } catch (error) {
      console.error('Failed to fetch badges:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return compact ? null : <div className="h-8 animate-pulse bg-fernhill-sand/10 rounded-lg" />
  }

  if (badges.length === 0) {
    return null
  }

  const displayBadges = showAll ? badges : badges.slice(0, 4)
  const hasMore = badges.length > 4

  if (compact) {
    // Just show emoji badges in a row
    return (
      <div className="flex items-center gap-0.5">
        {badges.slice(0, 3).map((mb) => (
          <span 
            key={mb.id} 
            className="text-lg cursor-default"
            title={mb.badge.name}
          >
            {mb.badge.emoji}
          </span>
        ))}
        {badges.length > 3 && (
          <span className="text-xs text-fernhill-sand/50 ml-1">+{badges.length - 3}</span>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {displayBadges.map((mb) => (
          <div
            key={mb.id}
            className="group relative"
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full glass-panel-dark hover:ring-1 hover:ring-fernhill-gold/30 transition-all cursor-default">
              <span className="text-lg">{mb.badge.emoji}</span>
              <span className="text-xs text-fernhill-cream font-medium">{mb.badge.name}</span>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-fernhill-charcoal border border-fernhill-sand/20 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
              <p className="text-xs text-fernhill-cream font-medium">{mb.badge.name}</p>
              {mb.badge.description && (
                <p className="text-xs text-fernhill-sand/60">{mb.badge.description}</p>
              )}
              <p className="text-xs text-fernhill-sand/40 mt-1">
                Earned {formatDistanceToNow(new Date(mb.awarded_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
        
        {hasMore && !showAll && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full glass-panel-dark hover:bg-fernhill-brown/30 transition-colors text-xs text-fernhill-sand/60"
          >
            +{badges.length - 4} more
          </button>
        )}
      </div>

      {/* All Badges Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md max-h-[80vh] overflow-auto glass-panel rounded-2xl p-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-fernhill-gold/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-fernhill-gold" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fernhill-cream">Badges Earned</h3>
                <p className="text-sm text-fernhill-sand/60">{badges.length} total</p>
              </div>
            </div>

            <div className="space-y-3">
              {badges.map((mb) => (
                <div key={mb.id} className="flex items-start gap-3 p-3 rounded-xl glass-panel-dark">
                  <span className="text-2xl">{mb.badge.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-fernhill-cream font-medium">{mb.badge.name}</p>
                    {mb.badge.description && (
                      <p className="text-xs text-fernhill-sand/60 mt-0.5">{mb.badge.description}</p>
                    )}
                    <p className="text-xs text-fernhill-sand/40 mt-1">
                      {formatDistanceToNow(new Date(mb.awarded_at), { addSuffix: true })}
                    </p>
                    {mb.reason && (
                      <p className="text-xs text-fernhill-gold/70 mt-1 italic">"{mb.reason}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-6 py-3 rounded-xl glass-panel text-fernhill-cream hover:bg-fernhill-brown/30 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Badge Grid (for showing all available badges)
interface BadgeGridProps {
  userBadges?: string[] // IDs of badges the user has
}

export function BadgeGrid({ userBadges = [] }: BadgeGridProps) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAllBadges()
  }, [])

  const fetchAllBadges = async () => {
    try {
      const { data, error } = await (supabase
        .from('badges') as any)
        .select('*')
        .order('category')

      if (error) throw error
      setBadges(data || [])
    } catch (error) {
      console.error('Failed to fetch badges:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="h-40 animate-pulse bg-fernhill-sand/10 rounded-2xl" />
  }

  const categories = [...new Set(badges.map(b => b.category))]

  return (
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category}>
          <h3 className="text-sm font-medium text-fernhill-sand/70 uppercase tracking-wider mb-3 flex items-center gap-2">
            {category === 'participation' && '💃'}
            {category === 'contribution' && '💝'}
            {category === 'special' && '✨'}
            {category}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {badges.filter(b => b.category === category).map(badge => {
              const hasEarned = userBadges.includes(badge.id)
              return (
                <div
                  key={badge.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    hasEarned 
                      ? 'glass-panel ring-1 ring-fernhill-gold/30' 
                      : 'glass-panel-dark opacity-50 grayscale'
                  }`}
                >
                  <span className="text-2xl">{badge.emoji}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${hasEarned ? 'text-fernhill-cream' : 'text-fernhill-sand/60'}`}>
                      {badge.name}
                    </p>
                    {badge.description && (
                      <p className="text-xs text-fernhill-sand/50 truncate">{badge.description}</p>
                    )}
                  </div>
                  {hasEarned && (
                    <Sparkles className="w-4 h-4 text-fernhill-gold flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
