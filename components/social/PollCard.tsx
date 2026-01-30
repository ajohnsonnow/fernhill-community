'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Check, Users, Clock, Lock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface PollOption {
  id: string
  text: string
}

interface Poll {
  id: string
  title: string
  description: string | null
  options: PollOption[]
  allow_multiple: boolean
  anonymous: boolean
  ends_at: string | null
  is_active: boolean
  created_at: string
}

interface PollCardProps {
  poll: Poll
  onVote?: () => void
}

export default function PollCard({ poll, onVote }: PollCardProps) {
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [userVotes, setUserVotes] = useState<string[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const supabase = createClient()

  const isExpired = poll.ends_at ? new Date(poll.ends_at) < new Date() : false
  const hasVoted = userVotes.length > 0

  useEffect(() => {
    fetchVotes()
  }, [poll.id])

  const fetchVotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: allVotes, error } = await (supabase
        .from('poll_votes') as any)
        .select('option_id, user_id')
        .eq('poll_id', poll.id)

      if (error) throw error

      // Count votes per option
      const voteCounts: Record<string, number> = {}
      poll.options.forEach(opt => { voteCounts[opt.id] = 0 })
      
      let total = 0
      const userVoteList: string[] = []
      
      allVotes?.forEach((v: { option_id: string; user_id: string }) => {
        voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1
        total++
        if (user && v.user_id === user.id) {
          userVoteList.push(v.option_id)
        }
      })

      setVotes(voteCounts)
      setTotalVotes(total)
      setUserVotes(userVoteList)
    } catch (error) {
      console.error('Failed to fetch poll votes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (optionId: string) => {
    if (isExpired || !poll.is_active) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to vote')
      return
    }

    setVoting(true)

    try {
      if (userVotes.includes(optionId)) {
        // Remove vote
        await (supabase
          .from('poll_votes') as any)
          .delete()
          .eq('poll_id', poll.id)
          .eq('user_id', user.id)
          .eq('option_id', optionId)
        
        setUserVotes(prev => prev.filter(v => v !== optionId))
        setVotes(prev => ({ ...prev, [optionId]: Math.max(0, (prev[optionId] || 0) - 1) }))
        setTotalVotes(prev => Math.max(0, prev - 1))
      } else {
        // If not allowing multiple, remove existing vote first
        if (!poll.allow_multiple && userVotes.length > 0) {
          const oldVote = userVotes[0]
          await (supabase
            .from('poll_votes') as any)
            .delete()
            .eq('poll_id', poll.id)
            .eq('user_id', user.id)
          
          setVotes(prev => ({ ...prev, [oldVote]: Math.max(0, (prev[oldVote] || 0) - 1) }))
          setTotalVotes(prev => prev - 1)
          setUserVotes([])
        }

        // Add new vote
        await (supabase
          .from('poll_votes') as any)
          .insert({
            poll_id: poll.id,
            user_id: user.id,
            option_id: optionId
          })
        
        setUserVotes(prev => [...prev, optionId])
        setVotes(prev => ({ ...prev, [optionId]: (prev[optionId] || 0) + 1 }))
        setTotalVotes(prev => prev + 1)
        
        toast.success('Vote recorded!')
      }
      
      onVote?.()
    } catch (error) {
      console.error('Failed to vote:', error)
      toast.error('Failed to record vote')
      fetchVotes()
    } finally {
      setVoting(false)
    }
  }

  const getPercentage = (optionId: string) => {
    if (totalVotes === 0) return 0
    return Math.round((votes[optionId] || 0) / totalVotes * 100)
  }

  return (
    <div className="glass-panel rounded-2xl p-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-fernhill-cream">{poll.title}</h3>
          {poll.description && (
            <p className="text-sm text-fernhill-sand/70 mt-1">{poll.description}</p>
          )}
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 mb-4 text-xs">
        {poll.anonymous && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-fernhill-sand/10 text-fernhill-sand/60">
            <Lock className="w-3 h-3" /> Anonymous
          </span>
        )}
        {poll.allow_multiple && (
          <span className="px-2 py-1 rounded-full bg-fernhill-sand/10 text-fernhill-sand/60">
            Multiple choice
          </span>
        )}
        {isExpired ? (
          <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400">
            Ended
          </span>
        ) : poll.ends_at && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-fernhill-gold/10 text-fernhill-gold">
            <Clock className="w-3 h-3" />
            Ends {formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.id)
          const isSelected = userVotes.includes(option.id)
          const showResults = hasVoted || isExpired

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={voting || isExpired || !poll.is_active}
              className={`w-full relative overflow-hidden rounded-xl transition-all ${
                isSelected
                  ? 'ring-2 ring-fernhill-gold'
                  : 'hover:ring-1 hover:ring-fernhill-sand/30'
              } ${voting ? 'opacity-50' : ''}`}
            >
              {/* Background bar */}
              {showResults && (
                <div 
                  className={`absolute inset-0 transition-all duration-500 ${
                    isSelected ? 'bg-fernhill-gold/20' : 'bg-fernhill-sand/10'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              {/* Content */}
              <div className="relative flex items-center justify-between p-4 glass-panel-dark">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'border-fernhill-gold bg-fernhill-gold' 
                      : 'border-fernhill-sand/30'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-fernhill-dark" />}
                  </div>
                  <span className="text-fernhill-cream">{option.text}</span>
                </div>
                
                {showResults && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-fernhill-sand/60">{votes[option.id] || 0}</span>
                    <span className={`font-semibold ${isSelected ? 'text-fernhill-gold' : 'text-fernhill-sand/70'}`}>
                      {percentage}%
                    </span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-fernhill-sand/50">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        </div>
        <span>
          {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}

// Poll List Component
interface PollListProps {
  limit?: number
  category?: string
}

export function PollList({ limit = 5, category }: PollListProps) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPolls()
  }, [category])

  const fetchPolls = async () => {
    try {
      let query = (supabase
        .from('polls') as any)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (error) throw error
      setPolls(data || [])
    } catch (error) {
      console.error('Failed to fetch polls:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse bg-fernhill-sand/10 rounded-2xl h-48" />
  }

  if (polls.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {polls.map(poll => (
        <PollCard key={poll.id} poll={poll} />
      ))}
    </div>
  )
}
