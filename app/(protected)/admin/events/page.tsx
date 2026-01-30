'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  Check, 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  MessageSquare,
  ExternalLink,
  Loader2,
  Inbox,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

interface EventSubmission {
  id: string
  user_id: string
  title: string
  description: string | null
  proposed_date: string
  proposed_location: string
  location_address: string | null
  event_type: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  // Joined profile data
  profiles?: {
    tribe_name: string
    full_name: string | null
  }
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  dance: '💃 Dance Event',
  workshop: '🎓 Workshop',
  gathering: '🤝 Community Gathering',
  other: '✨ Other',
}

export default function AdminEventsPage() {
  const [submissions, setSubmissions] = useState<EventSubmission[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [noteModal, setNoteModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchSubmissions()
    fetchStats()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('event-submissions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_submissions',
      }, () => {
        fetchSubmissions()
        fetchStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filter])

  const fetchSubmissions = async () => {
    try {
      let query = (supabase
        .from('event_submissions') as any)
        .select(`
          *,
          profiles:user_id (
            tribe_name,
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setSubmissions(data || [])
    } catch (error: any) {
      console.error('Failed to fetch submissions:', error)
      toast.error('Failed to fetch event submissions')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { count: pendingCount } = await (supabase
        .from('event_submissions') as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: approvedCount } = await (supabase
        .from('event_submissions') as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      const { count: rejectedCount } = await (supabase
        .from('event_submissions') as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')

      setStats({
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        rejected: rejectedCount || 0,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleAction = async (id: string, action: 'approve' | 'reject', note?: string) => {
    setActionLoading(id)
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      
      const { error } = await (supabase
        .from('event_submissions') as any)
        .update({ 
          status: newStatus,
          admin_notes: note || null
        })
        .eq('id', id)

      if (error) throw error

      if (action === 'approve') {
        toast.success('Event approved! 🎉', {
          description: 'Remember to add it to the Google Calendar'
        })
      } else {
        toast.success('Event declined')
      }
      
      setNoteModal(null)
      setAdminNote('')
      fetchSubmissions()
      fetchStats()
    } catch (error: any) {
      toast.error(`Failed to ${action} event`)
    } finally {
      setActionLoading(null)
    }
  }

  const openGoogleCalendar = () => {
    window.open('https://calendar.google.com/calendar/u/0/r?cid=fernhilldance@gmail.com', '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-fernhill-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-fernhill-cream mb-1">Event Submissions</h1>
            <p className="text-fernhill-sand/60">Review and approve community event suggestions</p>
          </div>
          <button
            onClick={openGoogleCalendar}
            className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-fernhill-gold hover:bg-fernhill-brown/30 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="hidden sm:inline">Open Calendar</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setFilter('pending')}
            className={`glass-panel rounded-xl p-4 text-center transition-all ${
              filter === 'pending' ? 'ring-2 ring-yellow-500' : ''
            }`}
          >
            <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
            <p className="text-white/60 text-xs">Pending</p>
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`glass-panel rounded-xl p-4 text-center transition-all ${
              filter === 'approved' ? 'ring-2 ring-green-500' : ''
            }`}
          >
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{stats.approved}</p>
            <p className="text-white/60 text-xs">Approved</p>
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`glass-panel rounded-xl p-4 text-center transition-all ${
              filter === 'rejected' ? 'ring-2 ring-red-500' : ''
            }`}
          >
            <XCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{stats.rejected}</p>
            <p className="text-white/60 text-xs">Declined</p>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-fernhill-gold text-fernhill-dark font-medium'
                  : 'glass-panel text-fernhill-sand hover:bg-fernhill-brown/30'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <Inbox className="w-12 h-12 text-fernhill-sand/30 mx-auto mb-4" />
            <p className="text-fernhill-sand/80 text-lg">No {filter === 'all' ? '' : filter} submissions</p>
            <p className="text-fernhill-sand/50 text-sm mt-2">
              {filter === 'pending' ? 'All caught up! ✨' : 'Nothing to show here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="glass-panel rounded-2xl p-5 animate-fadeIn">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-fernhill-cream">{sub.title}</h3>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-fernhill-charcoal text-fernhill-sand">
                        {EVENT_TYPE_LABELS[sub.event_type] || sub.event_type}
                      </span>
                    </div>
                    <p className="text-fernhill-sand/60 text-sm flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {sub.profiles?.tribe_name || 'Unknown member'}
                      <span className="mx-1">•</span>
                      {formatDistanceToNow(parseISO(sub.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  {/* Status badge */}
                  {sub.status !== 'pending' && (
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      sub.status === 'approved' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {sub.status === 'approved' ? '✓ Approved' : '✗ Declined'}
                    </span>
                  )}
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="glass-panel-dark rounded-xl p-3">
                    <p className="text-fernhill-sand/50 text-xs mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Proposed Date
                    </p>
                    <p className="text-fernhill-cream">
                      {format(parseISO(sub.proposed_date), 'EEE, MMM d, yyyy')}
                    </p>
                    <p className="text-fernhill-sand/60 text-sm">
                      {format(parseISO(sub.proposed_date), 'h:mm a')}
                    </p>
                  </div>
                  <div className="glass-panel-dark rounded-xl p-3">
                    <p className="text-fernhill-sand/50 text-xs mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </p>
                    <p className="text-fernhill-cream">{sub.proposed_location}</p>
                    {sub.location_address && (
                      <p className="text-fernhill-sand/60 text-sm truncate">{sub.location_address}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {sub.description && (
                  <div className="glass-panel-dark rounded-xl p-3 mb-4">
                    <p className="text-fernhill-sand/50 text-xs mb-1">Description</p>
                    <p className="text-fernhill-sand/80 text-sm whitespace-pre-line">{sub.description}</p>
                  </div>
                )}

                {/* Admin Notes (if any) */}
                {sub.admin_notes && (
                  <div className="glass-panel-dark rounded-xl p-3 mb-4 border border-fernhill-gold/30">
                    <p className="text-fernhill-gold/80 text-xs mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Admin Note
                    </p>
                    <p className="text-fernhill-sand/80 text-sm">{sub.admin_notes}</p>
                  </div>
                )}

                {/* Actions (only for pending) */}
                {sub.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setNoteModal({ id: sub.id, action: 'approve' })}
                      disabled={actionLoading === sub.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600/30 hover:bg-green-600/50 text-white font-medium px-4 py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                      {actionLoading === sub.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setNoteModal({ id: sub.id, action: 'reject' })}
                      disabled={actionLoading === sub.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-white font-medium px-4 py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                      Decline
                    </button>
                  </div>
                )}

                {/* Quick add reminder for approved events */}
                {sub.status === 'approved' && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-green-400 text-sm">
                      ✓ Added to Google Calendar?
                    </p>
                    <button
                      onClick={openGoogleCalendar}
                      className="text-green-400 text-sm underline hover:no-underline"
                    >
                      Open Calendar →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Note Modal */}
        {noteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNoteModal(null)} />
            <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 animate-fadeIn">
              <h3 className="text-xl font-bold text-fernhill-cream mb-2">
                {noteModal.action === 'approve' ? 'Approve Event' : 'Decline Event'}
              </h3>
              <p className="text-fernhill-sand/60 text-sm mb-4">
                {noteModal.action === 'approve' 
                  ? 'Add a note (optional) and remember to add this event to Google Calendar!'
                  : 'Add a note explaining why this event was declined (optional).'
                }
              </p>

              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={noteModal.action === 'approve' 
                  ? "e.g., Added to calendar! See you there 🎉"
                  : "e.g., Date conflicts with existing event..."
                }
                rows={3}
                className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50 resize-none mb-4"
              />

              {noteModal.action === 'approve' && (
                <div className="mb-4 p-3 rounded-xl bg-fernhill-gold/10 border border-fernhill-gold/30">
                  <p className="text-fernhill-gold text-sm">
                    📅 Don't forget to manually add this event to the <strong>fernhilldance@gmail.com</strong> Google Calendar!
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setNoteModal(null)
                    setAdminNote('')
                  }}
                  className="flex-1 py-3 rounded-xl glass-panel text-fernhill-sand/80 hover:text-fernhill-cream transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(noteModal.id, noteModal.action, adminNote)}
                  disabled={actionLoading === noteModal.id}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                    noteModal.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {actionLoading === noteModal.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {noteModal.action === 'approve' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      {noteModal.action === 'approve' ? 'Approve' : 'Decline'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
