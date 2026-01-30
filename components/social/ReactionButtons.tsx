'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const REACTION_EMOJIS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🙏', label: 'Gratitude' },
  { emoji: '💃', label: 'Dance' },
  { emoji: '✨', label: 'Magic' },
  { emoji: '🌀', label: 'Energy' },
]

interface Reaction {
  emoji: string
  count: number
  userReacted: boolean
}

interface ReactionButtonsProps {
  postId: string
  initialReactions?: { emoji: string; count: number }[]
  compact?: boolean
}

export default function ReactionButtons({ postId, initialReactions = [], compact = false }: ReactionButtonsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchReactions()
  }, [postId])

  const fetchReactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      // Get all reactions for this post
      const { data: allReactions, error } = await (supabase
        .from('post_reactions') as any)
        .select('emoji, user_id')
        .eq('post_id', postId)

      if (error) throw error

      // Count reactions by emoji and check user's reactions
      const reactionMap: Record<string, { count: number; userReacted: boolean }> = {}
      
      REACTION_EMOJIS.forEach(r => {
        reactionMap[r.emoji] = { count: 0, userReacted: false }
      })

      allReactions?.forEach((r: { emoji: string; user_id: string }) => {
        if (reactionMap[r.emoji]) {
          reactionMap[r.emoji].count++
          if (user && r.user_id === user.id) {
            reactionMap[r.emoji].userReacted = true
          }
        }
      })

      // Convert to array, only include emojis with counts or available for adding
      const reactionArray = REACTION_EMOJIS.map(r => ({
        emoji: r.emoji,
        count: reactionMap[r.emoji]?.count || 0,
        userReacted: reactionMap[r.emoji]?.userReacted || false,
      }))

      setReactions(reactionArray)
    } catch (error) {
      console.error('Failed to fetch reactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleReaction = async (emoji: string) => {
    if (!userId) return

    const reaction = reactions.find(r => r.emoji === emoji)
    if (!reaction) return

    // Optimistic update
    setReactions(prev => prev.map(r => 
      r.emoji === emoji 
        ? { ...r, count: r.userReacted ? r.count - 1 : r.count + 1, userReacted: !r.userReacted }
        : r
    ))
    setShowPicker(false)

    try {
      if (reaction.userReacted) {
        // Remove reaction
        await (supabase
          .from('post_reactions') as any)
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('emoji', emoji)
      } else {
        // Add reaction
        await (supabase
          .from('post_reactions') as any)
          .insert({
            post_id: postId,
            user_id: userId,
            emoji: emoji
          })
      }
    } catch (error) {
      // Revert on error
      fetchReactions()
      console.error('Failed to toggle reaction:', error)
    }
  }

  // Only show reactions that have counts or user can add
  const visibleReactions = reactions.filter(r => r.count > 0 || r.userReacted)

  if (loading) {
    return <div className="h-6" />
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1 flex-wrap">
        {/* Existing reactions */}
        {visibleReactions.map(reaction => (
          <button
            key={reaction.emoji}
            onClick={() => toggleReaction(reaction.emoji)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
              reaction.userReacted
                ? 'bg-fernhill-gold/20 border border-fernhill-gold/50'
                : 'bg-fernhill-sand/10 hover:bg-fernhill-sand/20'
            }`}
          >
            <span>{reaction.emoji}</span>
            {reaction.count > 0 && (
              <span className={`text-xs ${reaction.userReacted ? 'text-fernhill-gold' : 'text-fernhill-sand/60'}`}>
                {reaction.count}
              </span>
            )}
          </button>
        ))}

        {/* Add reaction button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-fernhill-sand/10 hover:bg-fernhill-sand/20 transition-colors text-fernhill-sand/60 hover:text-fernhill-cream"
          title="Add reaction"
        >
          <span className="text-lg">+</span>
        </button>
      </div>

      {/* Reaction picker */}
      {showPicker && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPicker(false)} 
          />
          <div className="absolute left-0 bottom-full mb-2 p-2 rounded-xl glass-panel shadow-xl z-50 animate-fadeIn">
            <div className="flex gap-1">
              {REACTION_EMOJIS.map(({ emoji, label }) => {
                const reaction = reactions.find(r => r.emoji === emoji)
                return (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(emoji)}
                    className={`p-2 rounded-lg hover:bg-fernhill-brown/50 transition-colors text-xl ${
                      reaction?.userReacted ? 'bg-fernhill-gold/20' : ''
                    }`}
                    title={label}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
