'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  Search, 
  Filter, 
  MapPin, 
  Music, 
  Heart,
  Sparkles,
  User,
  ExternalLink,
  Loader2,
  MoreVertical,
  MessageCircle
} from 'lucide-react'
import { BlockUserMenuItem } from '@/components/social/UserSafetyActions'
import Link from 'next/link'

interface MemberProfile {
  id: string
  tribe_name: string
  avatar_url: string | null
  mycelial_gifts: string | null
  soundcloud_url: string | null
  website: string | null
  vibe_status: string | null
  show_in_directory: boolean
  status: string | null
}

const SKILL_TAGS = [
  { value: 'dj', label: 'DJ', emoji: '🎧' },
  { value: 'massage', label: 'Massage', emoji: '💆' },
  { value: 'breathwork', label: 'Breathwork', emoji: '🌬️' },
  { value: 'yoga', label: 'Yoga', emoji: '🧘' },
  { value: 'cooking', label: 'Cooking', emoji: '🍳' },
  { value: 'gardening', label: 'Gardening', emoji: '🌱' },
  { value: 'tech', label: 'Tech Support', emoji: '💻' },
  { value: 'carpentry', label: 'Carpentry', emoji: '🔨' },
  { value: 'art', label: 'Art', emoji: '🎨' },
  { value: 'music', label: 'Live Music', emoji: '🎵' },
  { value: 'healing', label: 'Healing Arts', emoji: '✨' },
  { value: 'childcare', label: 'Childcare', emoji: '👶' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'photography', label: 'Photography', emoji: '📸' },
  { value: 'writing', label: 'Writing', emoji: '✍️' },
]

const VIBE_LABELS: Record<string, { emoji: string; label: string }> = {
  flowing: { emoji: '🌊', label: 'Flowing' },
  staccato: { emoji: '⚡', label: 'Staccato' },
  chaos: { emoji: '🌀', label: 'In the Chaos' },
  lyrical: { emoji: '✨', label: 'Lyrical' },
  stillness: { emoji: '🕯️', label: 'Stillness' },
  open_to_dance: { emoji: '🤝', label: 'Open to Dance' },
  mycelial: { emoji: '🍄', label: 'Mycelial' },
  offline: { emoji: '⚫', label: 'Offline' },
}

export default function DirectoryPage() {
  const [members, setMembers] = useState<MemberProfile[]>([])
  const [filteredMembers, setFilteredMembers] = useState<MemberProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchMembers()
    // Get current user ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null)
    })
  }, [])

  useEffect(() => {
    filterMembers()
  }, [members, searchQuery, selectedSkill, showOnlineOnly])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, tribe_name, avatar_url, mycelial_gifts, soundcloud_url, website, vibe_status, show_in_directory, status')
        .eq('show_in_directory', true)
        .in('status', ['active', 'facilitator', 'admin'])
        .order('tribe_name', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (error: any) {
      console.error('Failed to fetch members:', error.message)
      // If column doesn't exist, fetch without it
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, tribe_name, avatar_url, mycelial_gifts, soundcloud_url, website, vibe_status, status')
          .in('status', ['active', 'facilitator', 'admin'])
          .order('tribe_name', { ascending: true })
        
        setMembers((data || []).map((m: any) => ({ ...m, show_in_directory: true })))
      } catch {
        toast.error('Failed to load directory')
      }
    } finally {
      setLoading(false)
    }
  }

  const filterMembers = () => {
    let filtered = [...members]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m => 
        m.tribe_name?.toLowerCase().includes(query) ||
        m.mycelial_gifts?.toLowerCase().includes(query)
      )
    }

    // Skill filter
    if (selectedSkill) {
      filtered = filtered.filter(m => 
        m.mycelial_gifts?.toLowerCase().includes(selectedSkill.toLowerCase())
      )
    }

    // Online filter
    if (showOnlineOnly) {
      filtered = filtered.filter(m => m.vibe_status && m.vibe_status !== 'offline')
    }

    setFilteredMembers(filtered)
  }

  const getVibeInfo = (status: string | null) => {
    if (!status || status === 'offline') return null
    return VIBE_LABELS[status] || null
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display text-fernhill-cream">Soul Gallery</h1>
          <p className="text-fernhill-sand/60 text-sm">Discover gifts within our tribe</p>
        </div>

        {/* Search & Filters */}
        <div className="glass-panel rounded-2xl p-4 mb-6 space-y-4">
          {/* Search */}
          <div className="flex items-center gap-3 glass-panel-dark rounded-xl px-4 py-3">
            <Search className="w-5 h-5 text-fernhill-sand/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or skills..."
              className="flex-1 bg-transparent text-fernhill-cream placeholder-fernhill-sand/40 border-none focus:outline-none"
            />
          </div>

          {/* Skill Tags */}
          <div className="flex flex-wrap gap-2 pb-2">
            <button
              onClick={() => setSelectedSkill(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedSkill === null
                  ? 'bg-fernhill-gold text-fernhill-dark'
                  : 'glass-panel-dark text-fernhill-sand/60'
              }`}
            >
              All Skills
            </button>
            {SKILL_TAGS.map((tag) => (
              <button
                key={tag.value}
                onClick={() => setSelectedSkill(selectedSkill === tag.value ? null : tag.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedSkill === tag.value
                    ? 'bg-fernhill-gold text-fernhill-dark'
                    : 'glass-panel-dark text-fernhill-sand/60'
                }`}
              >
                {tag.emoji} {tag.label}
              </button>
            ))}
          </div>

          {/* Online Toggle */}
          <button
            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showOnlineOnly
                ? 'bg-green-500/20 text-green-400'
                : 'glass-panel-dark text-fernhill-sand/60'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showOnlineOnly ? 'bg-green-400' : 'bg-fernhill-sand/40'}`} />
            Show Online Only
          </button>
        </div>

        {/* Results Count */}
        <p className="text-fernhill-sand/60 text-sm mb-4">
          {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'} found
        </p>

        {/* Members Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-fernhill-gold mx-auto" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <User className="w-12 h-12 text-fernhill-gold/50 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-fernhill-cream mb-2">No Members Found</h3>
            <p className="text-fernhill-sand/60">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMembers.map((member) => {
              const vibeInfo = getVibeInfo(member.vibe_status)
              
              return (
                <div 
                  key={member.id}
                  className="glass-panel rounded-2xl p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-full glass-panel-dark overflow-hidden ${
                        vibeInfo ? 'ring-2 ring-fernhill-gold/50' : ''
                      }`}>
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-fernhill-gold text-xl font-bold">
                            {member.tribe_name?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      {vibeInfo && (
                        <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full glass-panel text-xs">
                          {vibeInfo.emoji}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-fernhill-cream truncate">
                          {member.tribe_name}
                        </h3>
                        {vibeInfo && (
                          <span className="text-fernhill-sand/60 text-xs">{vibeInfo.label}</span>
                        )}
                      </div>

                      {member.mycelial_gifts && (
                        <p className="text-fernhill-sand/80 text-sm mt-1 line-clamp-2">
                          {member.mycelial_gifts}
                        </p>
                      )}

                      {/* Links */}
                      <div className="flex gap-2 mt-3">
                        {/* Message Button */}
                        {member.id !== currentUserId && (
                          <Link
                            href={`/messages?user=${member.id}`}
                            className="p-2 rounded-lg glass-panel-dark text-emerald-400 hover:bg-white/10 transition-colors"
                            aria-label="Send message"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Link>
                        )}
                        {member.soundcloud_url && (
                          <a
                            href={member.soundcloud_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg glass-panel-dark text-fernhill-gold hover:bg-white/10 transition-colors"
                            aria-label="SoundCloud"
                          >
                            <Music className="w-4 h-4" />
                          </a>
                        )}
                        {member.website && (
                          <a
                            href={member.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg glass-panel-dark text-fernhill-gold hover:bg-white/10 transition-colors"
                            aria-label="Website"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        
                        {/* Safety Menu (for other users only) */}
                        {member.id !== currentUserId && (
                          <div className="relative ml-auto">
                            <button
                              onClick={() => setMenuOpenId(menuOpenId === member.id ? null : member.id)}
                              className="p-2 rounded-lg glass-panel-dark text-fernhill-sand/60 hover:bg-white/10 transition-colors"
                              aria-label="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {menuOpenId === member.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40"
                                  onClick={() => setMenuOpenId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                                  <BlockUserMenuItem 
                                    userId={member.id}
                                    userName={member.tribe_name}
                                    userStatus={member.status || undefined}
                                    onBlock={() => setMenuOpenId(null)}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
