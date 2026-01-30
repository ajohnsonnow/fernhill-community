'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, HelpCircle, Users, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

interface RSVPButtonProps {
  eventId: string // Google Calendar event ID
  compact?: boolean
}

interface RSVPCounts {
  going: number
  maybe: number
}

export default function RSVPButton({ eventId, compact = false }: RSVPButtonProps) {
  const [status, setStatus] = useState<'going' | 'maybe' | 'not_going' | null>(null)
  const [counts, setCounts] = useState<RSVPCounts>({ going: 0, maybe: 0 })
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchRSVP()
  }, [eventId])

  const fetchRSVP = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get all RSVPs for this event
      const { data: allRSVPs, error } = await (supabase
        .from('event_rsvps') as any)
        .select('status, user_id')
        .eq('google_event_id', eventId)

      if (error) throw error

      // Count statuses
      const goingCount = allRSVPs?.filter((r: any) => r.status === 'going').length || 0
      const maybeCount = allRSVPs?.filter((r: any) => r.status === 'maybe').length || 0
      setCounts({ going: goingCount, maybe: maybeCount })

      // Check user's RSVP
      if (user) {
        const userRSVP = allRSVPs?.find((r: any) => r.user_id === user.id)
        setStatus(userRSVP?.status || null)
      }
    } catch (error) {
      console.error('Failed to fetch RSVP:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRSVP = async (newStatus: 'going' | 'maybe' | 'not_going') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to RSVP')
      return
    }

    const previousStatus = status
    
    // Optimistic update
    setStatus(newStatus)
    setShowDropdown(false)
    
    // Update counts optimistically
    setCounts(prev => {
      const updated = { ...prev }
      // Remove from previous
      if (previousStatus === 'going') updated.going = Math.max(0, updated.going - 1)
      if (previousStatus === 'maybe') updated.maybe = Math.max(0, updated.maybe - 1)
      // Add to new
      if (newStatus === 'going') updated.going++
      if (newStatus === 'maybe') updated.maybe++
      return updated
    })

    try {
      // Upsert RSVP
      const { error } = await (supabase
        .from('event_rsvps') as any)
        .upsert({
          google_event_id: eventId,
          user_id: user.id,
          status: newStatus,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'google_event_id,user_id'
        })

      if (error) throw error
      
      const messages = {
        going: "See you there! 💃",
        maybe: "Hope you can make it!",
        not_going: "Maybe next time! 🙏"
      }
      toast.success(messages[newStatus])
    } catch (error) {
      // Revert on error
      setStatus(previousStatus)
      fetchRSVP()
      toast.error('Failed to update RSVP')
    }
  }

  const removeRSVP = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const previousStatus = status
    setStatus(null)
    setShowDropdown(false)
    
    // Update counts
    setCounts(prev => {
      const updated = { ...prev }
      if (previousStatus === 'going') updated.going = Math.max(0, updated.going - 1)
      if (previousStatus === 'maybe') updated.maybe = Math.max(0, updated.maybe - 1)
      return updated
    })

    try {
      await (supabase
        .from('event_rsvps') as any)
        .delete()
        .eq('google_event_id', eventId)
        .eq('user_id', user.id)
    } catch (error) {
      setStatus(previousStatus)
      fetchRSVP()
    }
  }

  if (loading) {
    return <div className="h-10 w-24 animate-pulse bg-fernhill-sand/10 rounded-xl" />
  }

  const statusConfig = {
    going: { icon: Check, label: 'Going', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    maybe: { icon: HelpCircle, label: 'Maybe', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    not_going: { icon: X, label: "Can't Go", color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  }

  const currentConfig = status ? statusConfig[status] : null

  if (compact) {
    // Compact version for calendar view
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
            currentConfig 
              ? currentConfig.color 
              : 'bg-fernhill-gold/10 text-fernhill-gold border-fernhill-gold/30 hover:bg-fernhill-gold/20'
          }`}
        >
          {currentConfig ? (
            <>
              <currentConfig.icon className="w-3 h-3" />
              {currentConfig.label}
            </>
          ) : (
            <>RSVP</>
          )}
          <ChevronDown className="w-3 h-3 ml-1" />
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 top-full mt-1 w-36 glass-panel rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
              <button
                onClick={() => handleRSVP('going')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-fernhill-brown/30 ${status === 'going' ? 'bg-green-500/10' : ''}`}
              >
                <Check className="w-4 h-4 text-green-400" /> Going
              </button>
              <button
                onClick={() => handleRSVP('maybe')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-fernhill-brown/30 ${status === 'maybe' ? 'bg-yellow-500/10' : ''}`}
              >
                <HelpCircle className="w-4 h-4 text-yellow-400" /> Maybe
              </button>
              <button
                onClick={() => handleRSVP('not_going')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-fernhill-brown/30 ${status === 'not_going' ? 'bg-red-500/10' : ''}`}
              >
                <X className="w-4 h-4 text-red-400" /> Can't Go
              </button>
              {status && (
                <button
                  onClick={removeRSVP}
                  className="w-full px-3 py-2 text-sm text-fernhill-sand/60 hover:bg-fernhill-brown/30 border-t border-fernhill-sand/10"
                >
                  Clear RSVP
                </button>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  // Full version for event detail
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-fernhill-cream">Are you going?</h3>
        <div className="flex items-center gap-2 text-xs text-fernhill-sand/60">
          <Users className="w-4 h-4" />
          <span>{counts.going} going</span>
          {counts.maybe > 0 && <span>• {counts.maybe} maybe</span>}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleRSVP('going')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
            status === 'going'
              ? 'bg-green-500/20 ring-2 ring-green-500'
              : 'bg-fernhill-sand/10 hover:bg-fernhill-sand/20'
          }`}
        >
          <Check className={`w-6 h-6 ${status === 'going' ? 'text-green-400' : 'text-fernhill-sand/60'}`} />
          <span className={`text-xs ${status === 'going' ? 'text-green-400 font-medium' : 'text-fernhill-sand/70'}`}>
            Going
          </span>
        </button>
        
        <button
          onClick={() => handleRSVP('maybe')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
            status === 'maybe'
              ? 'bg-yellow-500/20 ring-2 ring-yellow-500'
              : 'bg-fernhill-sand/10 hover:bg-fernhill-sand/20'
          }`}
        >
          <HelpCircle className={`w-6 h-6 ${status === 'maybe' ? 'text-yellow-400' : 'text-fernhill-sand/60'}`} />
          <span className={`text-xs ${status === 'maybe' ? 'text-yellow-400 font-medium' : 'text-fernhill-sand/70'}`}>
            Maybe
          </span>
        </button>
        
        <button
          onClick={() => handleRSVP('not_going')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
            status === 'not_going'
              ? 'bg-red-500/20 ring-2 ring-red-500'
              : 'bg-fernhill-sand/10 hover:bg-fernhill-sand/20'
          }`}
        >
          <X className={`w-6 h-6 ${status === 'not_going' ? 'text-red-400' : 'text-fernhill-sand/60'}`} />
          <span className={`text-xs ${status === 'not_going' ? 'text-red-400 font-medium' : 'text-fernhill-sand/70'}`}>
            Can't Go
          </span>
        </button>
      </div>
    </div>
  )
}
