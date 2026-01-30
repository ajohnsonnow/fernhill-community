'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Play, Pause, Plus, Music, ExternalLink, Loader2, Sparkles, Filter, Clock, CheckCircle, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAudio } from '@/components/audio/AudioContext'

interface MusicSet {
  id: string
  created_at: string
  title: string
  url: string
  vibe_tags: string[]
  tracklist: string | null
  dj: {
    id: string
    tribe_name: string
    avatar_url: string | null
  }
}

interface CustomVibeTag {
  id: string
  value: string
  label: string
  emoji: string
  category: string
}

interface ContentQueueItem {
  id: string
  content_type: string
  content_data: any
  status: string
  created_at: string
}

// Built-in vibe tags
const VIBE_TAGS = [
  // Energy Levels
  { value: 'tribal', label: 'Tribal', emoji: '🥁', category: 'energy' },
  { value: 'ambient', label: 'Ambient', emoji: '🌊', category: 'energy' },
  { value: 'high_energy', label: 'High Energy', emoji: '⚡', category: 'energy' },
  { value: 'low_energy', label: 'Low Energy', emoji: '🕯️', category: 'energy' },
  { value: 'building', label: 'Building', emoji: '📈', category: 'energy' },
  { value: 'peak', label: 'Peak', emoji: '🔥', category: 'energy' },
  { value: 'comedown', label: 'Comedown', emoji: '🌙', category: 'energy' },
  
  // Genres & Styles
  { value: 'organic', label: 'Organic', emoji: '🌿', category: 'genre' },
  { value: 'electronic', label: 'Electronic', emoji: '🎹', category: 'genre' },
  { value: 'world', label: 'World', emoji: '🌍', category: 'genre' },
  { value: 'bass', label: 'Bass', emoji: '🔊', category: 'genre' },
  { value: 'melodic', label: 'Melodic', emoji: '🎵', category: 'genre' },
  { value: 'percussive', label: 'Percussive', emoji: '🪘', category: 'genre' },
  { value: 'cinematic', label: 'Cinematic', emoji: '🎬', category: 'genre' },
  { value: 'shamanic', label: 'Shamanic', emoji: '🦅', category: 'genre' },
  
  // Moods & Feelings
  { value: 'ecstatic', label: 'Ecstatic', emoji: '✨', category: 'mood' },
  { value: 'dreamy', label: 'Dreamy', emoji: '💭', category: 'mood' },
  { value: 'grounding', label: 'Grounding', emoji: '🌳', category: 'mood' },
  { value: 'heart_opening', label: 'Heart Opening', emoji: '💗', category: 'mood' },
  { value: 'playful', label: 'Playful', emoji: '🎪', category: 'mood' },
  { value: 'intense', label: 'Intense', emoji: '🌋', category: 'mood' },
  { value: 'meditative', label: 'Meditative', emoji: '🧘', category: 'mood' },
  
  // 5Rhythms-inspired
  { value: 'flowing', label: 'Flowing', emoji: '💧', category: 'rhythm' },
  { value: 'staccato', label: 'Staccato', emoji: '⚔️', category: 'rhythm' },
  { value: 'chaos', label: 'Chaos', emoji: '🌀', category: 'rhythm' },
  { value: 'lyrical', label: 'Lyrical', emoji: '🦋', category: 'rhythm' },
  { value: 'stillness', label: 'Stillness', emoji: '🪷', category: 'rhythm' },
]

export default function JourneyPage() {
  const [sets, setSets] = useState<MusicSet[]>([])
  const [customTags, setCustomTags] = useState<CustomVibeTag[]>([])
  const [myPendingSets, setMyPendingSets] = useState<ContentQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSuggestTagModal, setShowSuggestTagModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [requiresReview, setRequiresReview] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const { currentTrack, isPlaying, play, pause } = useAudio()
  const supabase = createClient()

  // Combine built-in and custom tags
  const allVibeTags = [...VIBE_TAGS, ...customTags.map(t => ({ ...t, category: t.category || 'custom' }))]

  useEffect(() => {
    fetchSets()
    fetchCustomTags()
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // First try with requires_review, fall back to basic query if column doesn't exist
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()

    const p = profile as any
    setIsAdmin(p?.status === 'admin' || p?.status === 'facilitator')
    
    // Try to get requires_review separately (may not exist if migration not run)
    const { data: profileWithReview, error: reviewError } = await supabase
      .from('profiles')
      .select('requires_review')
      .eq('id', user.id)
      .single()
    
    // If error (column doesn't exist), assume not requiring review
    if (reviewError) {
      setRequiresReview(false)
    } else {
      const pr = profileWithReview as any
      setRequiresReview(pr?.requires_review !== false)
      
      // Fetch user's pending submissions only if content_queue exists
      if (pr?.requires_review !== false) {
        fetchMyPendingSubmissions(user.id)
      }
    }
  }

  const fetchMyPendingSubmissions = async (userId: string) => {
    const { data, error } = await (supabase
      .from('content_queue') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('content_type', 'music_set')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    // If error (table doesn't exist), ignore silently
    if (!error) {
      setMyPendingSets(data || [])
    } else {
      setMyPendingSets([])
    }
  }

  const fetchSets = async () => {
    try {
      const { data, error } = await supabase
        .from('music_sets')
        .select(`
          *,
          dj:profiles!music_sets_dj_id_fkey(id, tribe_name, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSets(data as any || [])
    } catch (error: any) {
      toast.error('Failed to load music sets')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomTags = async () => {
    const { data, error } = await (supabase
      .from('custom_vibe_tags') as any)
      .select('*')
      .eq('is_approved', true)
    
    // If error (table doesn't exist), ignore silently
    if (!error) {
      setCustomTags(data || [])
    } else {
      setCustomTags([])
    }
  }

  const handlePlay = (set: MusicSet) => {
    if (currentTrack?.id === set.id && isPlaying) {
      pause()
    } else {
      play({
        id: set.id,
        title: set.title,
        url: set.url,
        dj_name: set.dj.tribe_name,
        vibe_tags: set.vibe_tags,
      })
    }
  }

  const isCurrentlyPlaying = (setId: string) => {
    return currentTrack?.id === setId && isPlaying
  }

  // Filter sets by vibe tag
  const filteredSets = activeFilter 
    ? sets.filter(s => s.vibe_tags?.includes(activeFilter))
    : sets

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-fernhill-cream mb-1">The Journey</h1>
            <p className="text-fernhill-sand/60">Music sets from the tribe's DJs</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSuggestTagModal(true)}
              className="p-2 glass-panel rounded-xl text-fernhill-sand/60 hover:text-fernhill-gold transition-colors"
              title="Suggest a vibe tag"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            {(isAdmin || !requiresReview) && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-fernhill-gold hover:bg-fernhill-brown/30 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Set
              </button>
            )}
            {requiresReview && !isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-fernhill-sand hover:bg-fernhill-brown/30 transition-colors"
              >
                <Send className="w-5 h-5" />
                Submit Set
              </button>
            )}
          </div>
        </div>

        {/* Pending submissions notice */}
        {myPendingSets.length > 0 && (
          <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">You have {myPendingSets.length} pending submission{myPendingSets.length > 1 ? 's' : ''}</span>
            </div>
            <p className="text-fernhill-sand/70 text-sm">Your music sets are awaiting admin approval.</p>
          </div>
        )}

        {/* Filter by vibe tag */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-fernhill-sand/60" />
            <span className="text-fernhill-sand/60 text-sm">Filter by vibe:</span>
            {activeFilter && (
              <button 
                onClick={() => setActiveFilter(null)}
                className="text-xs text-fernhill-gold hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {allVibeTags.slice(0, 12).map((tag) => (
              <button
                key={tag.value}
                onClick={() => setActiveFilter(activeFilter === tag.value ? null : tag.value)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  activeFilter === tag.value
                    ? 'bg-fernhill-gold text-fernhill-dark'
                    : 'glass-panel-dark text-fernhill-sand/60 hover:text-fernhill-cream'
                }`}
              >
                {tag.emoji} {tag.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-fernhill-gold mx-auto" />
          </div>
        ) : filteredSets.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Music className="w-16 h-16 mx-auto mb-4 text-fernhill-sand/30" />
            <p className="text-fernhill-sand/60 text-lg mb-2">
              {activeFilter ? 'No sets with this vibe' : 'No music sets yet'}
            </p>
            <p className="text-fernhill-sand/40 text-sm">
              {activeFilter 
                ? 'Try a different filter or add a set with this vibe!'
                : 'DJs and facilitators can add sets for the tribe to enjoy.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSets.map((set) => (
              <div
                key={set.id}
                className={`glass-panel rounded-2xl p-6 transition-all ${
                  currentTrack?.id === set.id ? 'ring-2 ring-fernhill-gold/50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handlePlay(set)}
                    className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      isCurrentlyPlaying(set.id)
                        ? 'bg-fernhill-gold text-fernhill-dark'
                        : 'glass-panel-dark hover:bg-fernhill-brown/30 text-fernhill-gold'
                    }`}
                  >
                    {isCurrentlyPlaying(set.id) ? (
                      <Pause className="w-7 h-7" />
                    ) : (
                      <Play className="w-7 h-7 ml-1" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-fernhill-cream mb-1 truncate">{set.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full glass-panel-dark overflow-hidden">
                        {set.dj.avatar_url ? (
                          <img src={set.dj.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-fernhill-gold text-xs font-bold">
                            {set.dj.tribe_name?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-fernhill-sand/60 text-sm">{set.dj.tribe_name}</span>
                      <span className="text-fernhill-sand/30">•</span>
                      <span className="text-fernhill-sand/40 text-sm">
                        {formatDistanceToNow(new Date(set.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {set.vibe_tags && set.vibe_tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {set.vibe_tags.map((tag) => {
                          const tagInfo = allVibeTags.find(t => t.value === tag)
                          return (
                            <button
                              key={tag}
                              onClick={() => setActiveFilter(tag)}
                              className="px-2 py-1 rounded-lg glass-panel-dark text-fernhill-sand/60 text-xs hover:text-fernhill-cream transition-colors"
                            >
                              {tagInfo?.emoji} {tagInfo?.label || tag}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <a
                    href={set.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open in new tab"
                    className="p-2 rounded-xl glass-panel-dark hover:bg-fernhill-brown/30 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-fernhill-sand/40" />
                  </a>
                </div>

                {set.tracklist && (
                  <div className="mt-4 pt-4 border-t border-fernhill-sand/10">
                    <p className="text-fernhill-sand/50 text-sm mb-2">Tracklist:</p>
                    <p className="text-fernhill-sand/70 text-sm whitespace-pre-wrap">{set.tracklist}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddSetModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            fetchSets()
            checkUserStatus()
          }}
          vibeTags={allVibeTags}
          requiresReview={requiresReview && !isAdmin}
        />
      )}

      {showSuggestTagModal && (
        <SuggestTagModal onClose={() => setShowSuggestTagModal(false)} />
      )}
    </div>
  )
}

interface AddSetModalProps {
  onClose: () => void
  onSuccess: () => void
  vibeTags: { value: string; label: string; emoji: string; category: string }[]
  requiresReview: boolean
}

function AddSetModal({ onClose, onSuccess, vibeTags, requiresReview }: AddSetModalProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tracklist, setTracklist] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (requiresReview) {
        // Submit to content queue for admin approval
        const { error } = await (supabase
          .from('content_queue') as any)
          .insert({
            user_id: user.id,
            content_type: 'music_set',
            content_data: {
              title,
              url,
              vibe_tags: selectedTags,
              tracklist: tracklist || null,
              dj_id: user.id,
            },
            status: 'pending'
          })

        if (error) throw error
        toast.success('Music set submitted for review! 🎵', {
          description: 'An admin will review your submission soon.'
        })
      } else {
        // Direct publish (trusted user or admin)
        const { error } = await supabase
          .from('music_sets')
          .insert({
            title,
            url,
            vibe_tags: selectedTags,
            tracklist: tracklist || null,
            dj_id: user.id,
          } as any)

        if (error) throw error
        toast.success('Music set added to The Journey! 🎵')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit music set')
    } finally {
      setLoading(false)
    }
  }

  // Group tags by category
  const tagCategories = [
    { key: 'energy', label: 'Energy' },
    { key: 'genre', label: 'Genre & Style' },
    { key: 'mood', label: 'Mood' },
    { key: 'rhythm', label: '5Rhythms' },
    { key: 'custom', label: 'Custom' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 my-8 animate-fadeIn max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-fernhill-cream mb-2">
          {requiresReview ? 'Submit Music Set' : 'Add Music Set'}
        </h2>
        {requiresReview && (
          <p className="text-fernhill-sand/60 text-sm mb-4">
            Your submission will be reviewed by an admin before appearing publicly.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
              Set Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sunday Flow Session"
              required
              className="w-full px-4 py-3 glass-panel-dark rounded-xl border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
              SoundCloud or Mixcloud URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://soundcloud.com/..."
              required
              className="w-full px-4 py-3 glass-panel-dark rounded-xl border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
              Vibe Tags (select up to 5)
            </label>
            {tagCategories.map(cat => {
              const catTags = vibeTags.filter(t => t.category === cat.key)
              if (catTags.length === 0) return null
              return (
                <div key={cat.key} className="mb-3">
                  <p className="text-xs text-fernhill-sand/50 mb-2">{cat.label}</p>
                  <div className="flex gap-2 flex-wrap">
                    {catTags.map((tag) => (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => toggleTag(tag.value)}
                        disabled={selectedTags.length >= 5 && !selectedTags.includes(tag.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selectedTags.includes(tag.value)
                            ? 'bg-fernhill-gold text-fernhill-dark'
                            : 'glass-panel-dark text-fernhill-sand/60 hover:text-fernhill-cream disabled:opacity-30'
                        }`}
                      >
                        {tag.emoji} {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
              Tracklist (Optional)
            </label>
            <textarea
              value={tracklist}
              onChange={(e) => setTracklist(e.target.value)}
              placeholder="1. Artist - Track Name&#10;2. Artist - Track Name"
              rows={4}
              className="w-full px-4 py-3 glass-panel-dark rounded-xl border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 rounded-xl glass-panel text-fernhill-sand/80 hover:text-fernhill-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title || !url}
              className="flex-1 py-3 rounded-xl bg-fernhill-gold text-fernhill-dark font-semibold hover:bg-fernhill-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : requiresReview ? (
                <>
                  <Send className="w-4 h-4" />
                  Submit for Review
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Set
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Suggest Vibe Tag Modal
function SuggestTagModal({ onClose }: { onClose: () => void }) {
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('')
  const [category, setCategory] = useState('mood')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const value = label.toLowerCase().replace(/\s+/g, '_')

      // Submit to content queue for admin approval
      const { error } = await (supabase
        .from('content_queue') as any)
        .insert({
          user_id: user.id,
          content_type: 'vibe_tag_suggestion',
          content_data: {
            value,
            label,
            emoji,
            category,
          },
          status: 'pending'
        })

      if (error) throw error

      toast.success('Vibe tag suggested! ✨', {
        description: 'An admin will review your suggestion.'
      })
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to suggest tag')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 animate-fadeIn">
        <h2 className="text-xl font-bold text-fernhill-cream mb-2">Suggest a Vibe Tag</h2>
        <p className="text-fernhill-sand/60 text-sm mb-6">
          Have a vibe that's not listed? Suggest it for the community!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">Tag Name *</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Euphoric"
              required
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">Emoji *</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🎆"
              required
              maxLength={4}
              className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
            />
            <p className="text-xs text-fernhill-sand/50 mt-1">Pick an emoji that represents this vibe</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
            >
              <option value="energy">Energy Level</option>
              <option value="genre">Genre & Style</option>
              <option value="mood">Mood & Feeling</option>
              <option value="rhythm">Movement Style</option>
              <option value="custom">Other</option>
            </select>
          </div>

          {/* Preview */}
          {label && emoji && (
            <div className="p-3 rounded-xl glass-panel-dark">
              <p className="text-xs text-fernhill-sand/50 mb-2">Preview:</p>
              <span className="px-3 py-1.5 rounded-lg bg-fernhill-gold/20 text-fernhill-gold text-sm">
                {emoji} {label}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl glass-panel text-fernhill-sand/80 hover:text-fernhill-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !label || !emoji}
              className="flex-1 py-3 rounded-xl bg-fernhill-gold text-fernhill-dark font-semibold hover:bg-fernhill-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Suggest
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
