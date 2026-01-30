'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  MapPin, 
  Clock, 
  Plus, 
  Loader2,
  RefreshCw,
  ChevronRight,
  Calendar,
  X,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Facebook,
  ExternalLink
} from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isThisWeek, differenceInDays } from 'date-fns'

// Types
interface CalendarEvent {
  id: string
  title: string
  description: string | null
  location: string | null
  start: string
  end: string
  allDay: boolean
  googleLink: string
  facebookLink?: string | null
}

interface EventSubmission {
  id: string
  title: string
  description: string | null
  proposed_date: string
  proposed_location: string
  location_address: string | null
  event_type: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
}

// Location presets
const LOCATIONS = [
  { 
    name: 'Bridgespace', 
    address: '133 SE Madison St, Portland, OR', 
    mapLink: 'https://maps.app.goo.gl/4cGaFq3j9ToAXdgg8'
  },
  { 
    name: 'Fernhill Park', 
    address: '6010 NE 37th Ave, Portland, OR', 
    mapLink: 'https://maps.app.goo.gl/Q9cQQTSGrrEKPBKJ8'
  },
]

const EVENT_TYPES = [
  { value: 'dance', label: '💃 Dance Event' },
  { value: 'workshop', label: '🎓 Workshop' },
  { value: 'gathering', label: '🤝 Community Gathering' },
  { value: 'other', label: '✨ Other' },
]

// Helper to get relative date label
function getRelativeDateLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isThisWeek(date)) return format(date, 'EEEE') // "Sunday"
  const days = differenceInDays(date, new Date())
  if (days < 14) return `In ${days} days`
  return format(date, 'MMM d')
}

// Helper to get map link
function getMapLinkForLocation(location: string | null): string | null {
  if (!location) return null
  const loc = LOCATIONS.find(l => 
    location.toLowerCase().includes(l.name.toLowerCase())
  )
  return loc?.mapLink || `https://maps.google.com/?q=${encodeURIComponent(location)}`
}

// Extract Facebook link from description if present
function extractFacebookLink(description: string | null): string | null {
  if (!description) return null
  const fbMatch = description.match(/https?:\/\/(www\.)?(facebook\.com|fb\.me)\/[^\s]+/i)
  return fbMatch ? fbMatch[0] : null
}

export default function EventsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [mySubmissions, setMySubmissions] = useState<EventSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showMySubmissions, setShowMySubmissions] = useState(false)
  const [calendarSource, setCalendarSource] = useState<'google' | 'mock' | 'fallback'>('google')
  const supabase = createClient()

  // Fetch calendar events
  const fetchCalendar = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    
    try {
      // Fetch from 30 days ago to 90 days ahead
      const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

      const response = await fetch(
        `/api/calendar?timeMin=${timeMin}&timeMax=${timeMax}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch calendar')
      
      const data = await response.json()
      setEvents(data.events || [])
      setCalendarSource(data.source || 'google')
      
      if (showRefreshIndicator && data.source === 'google') {
        toast.success('Calendar refreshed!')
      }
    } catch (error) {
      console.error('Failed to fetch calendar:', error)
      toast.error('Could not load events')
    } finally {
      if (showRefreshIndicator) setRefreshing(false)
    }
  }, [])

  // Fetch user's event submissions
  const fetchMySubmissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await (supabase
        .from('event_submissions') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setMySubmissions(data || [])
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchCalendar(),
      fetchMySubmissions()
    ]).finally(() => setLoading(false))
  }, [fetchCalendar])

  // Split events into upcoming and past
  const now = new Date()
  const upcomingEvents = events
    .filter(e => new Date(e.start) >= now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  
  const pastEvents = events
    .filter(e => new Date(e.start) < now)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()) // Most recent first

  const displayEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents
  const pendingCount = mySubmissions.filter(s => s.status === 'pending').length

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-fernhill-cream mb-1">Events</h1>
            <p className="text-fernhill-sand/60 text-sm">Sunday dances & gatherings</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCalendar(true)}
              disabled={refreshing}
              className="p-2 glass-panel rounded-xl text-fernhill-sand/60 hover:text-fernhill-gold transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 px-3 py-2 glass-panel rounded-xl text-fernhill-gold hover:bg-fernhill-brown/30 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm">Suggest</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'upcoming'
                ? 'bg-fernhill-gold text-fernhill-dark'
                : 'glass-panel text-fernhill-sand hover:bg-fernhill-brown/30'
            }`}
          >
            Upcoming ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'past'
                ? 'bg-fernhill-gold text-fernhill-dark'
                : 'glass-panel text-fernhill-sand hover:bg-fernhill-brown/30'
            }`}
          >
            Past ({pastEvents.length})
          </button>
        </div>

        {/* Calendar Source Warning */}
        {calendarSource === 'fallback' && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Calendar temporarily unavailable. Showing cached events.</span>
          </div>
        )}

        {/* My Submissions Toggle */}
        {mySubmissions.length > 0 && (
          <button
            onClick={() => setShowMySubmissions(!showMySubmissions)}
            className="w-full mb-4 p-3 glass-panel rounded-xl flex items-center justify-between hover:bg-fernhill-brown/20 transition-colors"
          >
            <span className="text-fernhill-cream text-sm">My Event Suggestions</span>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-fernhill-gold/20 text-fernhill-gold">
                  {pendingCount} pending
                </span>
              )}
              <ChevronRight className={`w-4 h-4 text-fernhill-sand/60 transition-transform ${showMySubmissions ? 'rotate-90' : ''}`} />
            </div>
          </button>
        )}

        {/* My Submissions List */}
        {showMySubmissions && mySubmissions.length > 0 && (
          <div className="mb-4 space-y-2 animate-fadeIn">
            {mySubmissions.map((sub) => (
              <div key={sub.id} className="glass-panel-dark rounded-xl p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-fernhill-cream text-sm font-medium">{sub.title}</p>
                    <p className="text-fernhill-sand/60 text-xs">
                      {format(parseISO(sub.proposed_date), 'MMM d')} • {sub.proposed_location}
                    </p>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>
                {sub.admin_notes && (
                  <p className="mt-2 text-xs text-fernhill-sand/60 italic">&quot;{sub.admin_notes}&quot;</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-fernhill-gold animate-spin" />
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-fernhill-sand/30 mx-auto mb-4" />
            <p className="text-fernhill-sand/60">
              {activeTab === 'upcoming' ? 'No upcoming events' : 'No past events'}
            </p>
          </div>
        ) : (
          /* Event List */
          <div className="space-y-3">
            {displayEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                isPast={activeTab === 'past'}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}

        {/* Event Detail Modal */}
        {selectedEvent && (
          <EventDetailModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)} 
          />
        )}

        {/* Submit Event Modal */}
        {showSubmitModal && (
          <SubmitEventModal 
            onClose={() => setShowSubmitModal(false)}
            onSubmit={async (data) => {
              try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                  toast.error('Please sign in to suggest events')
                  return
                }

                const { error } = await (supabase
                  .from('event_submissions') as any)
                  .insert({
                    user_id: user.id,
                    ...data,
                    status: 'pending'
                  })

                if (error) throw error
                
                toast.success('Event suggestion submitted!')
                setShowSubmitModal(false)
                fetchMySubmissions()
              } catch (error) {
                console.error('Submit error:', error)
                toast.error('Failed to submit suggestion')
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

// Event Card Component
function EventCard({ 
  event, 
  isPast, 
  onClick 
}: { 
  event: CalendarEvent
  isPast: boolean
  onClick: () => void 
}) {
  const date = parseISO(event.start)
  const endDate = parseISO(event.end)
  const relativeLabel = getRelativeDateLabel(date)
  const isHighlighted = isToday(date) || isTomorrow(date)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl transition-all active:scale-[0.98] ${
        isPast 
          ? 'glass-panel-dark opacity-70' 
          : isHighlighted
            ? 'bg-gradient-to-br from-fernhill-gold/20 to-fernhill-terracotta/10 border border-fernhill-gold/30'
            : 'glass-panel hover:bg-fernhill-brown/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Event Title */}
          <h3 className={`font-semibold truncate ${isPast ? 'text-fernhill-sand/70' : 'text-fernhill-cream'}`}>
            {event.title}
          </h3>
          
          {/* Date & Time */}
          <div className="flex items-center gap-2 mt-1.5 text-sm">
            <Clock className={`w-4 h-4 flex-shrink-0 ${isHighlighted ? 'text-fernhill-gold' : 'text-fernhill-sand/50'}`} />
            <span className={isHighlighted ? 'text-fernhill-gold font-medium' : 'text-fernhill-sand/70'}>
              {relativeLabel} • {format(date, 'h:mm a')}
              {!event.allDay && ` - ${format(endDate, 'h:mm a')}`}
            </span>
          </div>
          
          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 mt-1 text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0 text-fernhill-sand/50" />
              <span className="text-fernhill-sand/70 truncate">
                {event.location.split(',')[0]}
              </span>
            </div>
          )}
        </div>
        
        {/* Arrow indicator */}
        <ChevronRight className={`w-5 h-5 flex-shrink-0 mt-1 ${isPast ? 'text-fernhill-sand/30' : 'text-fernhill-sand/50'}`} />
      </div>
    </button>
  )
}

// Event Detail Modal
function EventDetailModal({ 
  event, 
  onClose 
}: { 
  event: CalendarEvent
  onClose: () => void 
}) {
  const date = parseISO(event.start)
  const endDate = parseISO(event.end)
  const mapLink = getMapLinkForLocation(event.location)
  const facebookLink = extractFacebookLink(event.description)

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-fernhill-charcoal rounded-t-3xl rounded-b-xl max-h-[85vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-fernhill-sand/10">
          <h2 className="text-xl font-bold text-fernhill-cream font-display">{event.title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-fernhill-brown/30 transition-colors"
          >
            <X className="w-5 h-5 text-fernhill-sand/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Date & Time */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-fernhill-gold/20">
              <Calendar className="w-6 h-6 text-fernhill-gold" />
            </div>
            <div>
              <p className="text-fernhill-cream font-medium">
                {format(date, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-fernhill-sand/70 text-sm">
                {format(date, 'h:mm a')} - {format(endDate, 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3 mb-4">
              <div className="p-3 rounded-xl bg-fernhill-terracotta/20">
                <MapPin className="w-6 h-6 text-fernhill-terracotta" />
              </div>
              <div className="flex-1">
                <p className="text-fernhill-cream font-medium">
                  {event.location.split(',')[0]}
                </p>
                <p className="text-fernhill-sand/70 text-sm">
                  {event.location.split(',').slice(1).join(',').trim()}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="mt-4 p-4 rounded-xl bg-fernhill-brown/20">
              <p className="text-fernhill-sand/80 text-sm whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-fernhill-sand/10 space-y-2">
          {/* Primary Links Row */}
          <div className="flex gap-2">
            {mapLink && (
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-fernhill-terracotta/20 text-fernhill-terracotta hover:bg-fernhill-terracotta/30 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                <span className="font-medium">Directions</span>
              </a>
            )}
            <a
              href={event.googleLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-fernhill-gold/20 text-fernhill-gold hover:bg-fernhill-gold/30 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Add to Calendar</span>
            </a>
          </div>

          {/* Social Links Row */}
          {facebookLink && (
            <a
              href={facebookLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl glass-panel text-fernhill-sand hover:bg-fernhill-brown/30 transition-colors"
            >
              <Facebook className="w-5 h-5" />
              <span className="font-medium">View on Facebook</span>
            </a>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3 text-fernhill-sand/60 hover:text-fernhill-sand transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { icon: AlertCircle, bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    approved: { icon: CheckCircle, bg: 'bg-green-500/20', text: 'text-green-400' },
    rejected: { icon: XCircle, bg: 'bg-red-500/20', text: 'text-red-400' },
  }[status] || { icon: AlertCircle, bg: 'bg-gray-500/20', text: 'text-gray-400' }
  
  const Icon = config.icon

  return (
    <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  )
}

// Submit Event Modal
function SubmitEventModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    proposed_date: '',
    proposed_location: LOCATIONS[0].name,
    location_address: LOCATIONS[0].address,
    event_type: 'dance'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(formData)
    setLoading(false)
  }

  const handleLocationChange = (locationName: string) => {
    const loc = LOCATIONS.find(l => l.name === locationName)
    setFormData({
      ...formData,
      proposed_location: locationName,
      location_address: loc?.address || ''
    })
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-fernhill-charcoal rounded-t-3xl rounded-b-xl max-h-[90vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-fernhill-sand/10">
          <h2 className="text-xl font-bold text-fernhill-cream font-display">Suggest an Event</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-fernhill-brown/30 transition-colors"
          >
            <X className="w-5 h-5 text-fernhill-sand/60" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
          <div>
            <label className="block text-fernhill-sand text-sm mb-2">Event Name *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="e.g., Full Moon Dance"
              required
            />
          </div>

          <div>
            <label className="block text-fernhill-sand text-sm mb-2">Type *</label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="input-field"
              required
            >
              {EVENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-fernhill-sand text-sm mb-2">Proposed Date & Time *</label>
            <input
              type="datetime-local"
              value={formData.proposed_date}
              onChange={(e) => setFormData({ ...formData, proposed_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-fernhill-sand text-sm mb-2">Location *</label>
            <select
              value={formData.proposed_location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="input-field"
            >
              {LOCATIONS.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
              <option value="other">Other</option>
            </select>
            {formData.proposed_location === 'other' && (
              <input
                type="text"
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                className="input-field mt-2"
                placeholder="Enter address"
              />
            )}
          </div>

          <div>
            <label className="block text-fernhill-sand text-sm mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[100px] resize-none"
              placeholder="What's special about this event?"
            />
          </div>

          <p className="text-xs text-fernhill-sand/50">
            Your suggestion will be reviewed by the community organizers
          </p>

          <button
            type="submit"
            disabled={loading || !formData.title || !formData.proposed_date}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Suggestion
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
