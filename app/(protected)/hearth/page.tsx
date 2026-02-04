'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Heart, Clock, MessageCircle, Bookmark, Share2, Flag, Copy, Edit2, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useSearchParams } from 'next/navigation'
import NewPostModal from '@/components/posts/NewPostModal'
import StoriesBar from '@/components/social/StoriesBar'
import PostComments from '@/components/social/PostComments'
import BookmarkButton from '@/components/social/BookmarkButton'
import ReactionButtons from '@/components/social/ReactionButtons'
import { TrendingHashtags, AutoLinkPreview, renderHashtags } from '@/components/social'
import { AnnouncementsBanner } from '@/components/community'
import { LongPressMenu } from '@/components/ui/LongPressMenu'
import { share, canShare } from '@/lib/share'
import { useReportDialog, ReportType } from '@/components/safety/ReportDialog'

interface Post {
  id: string
  created_at: string
  content: string
  category: string
  image_url: string | null
  expires_at: string | null
  likes_count: number
  author_id: string
  author: {
    tribe_name: string
    avatar_url: string | null
  }
}

const CATEGORIES = [
  { value: 'general', label: 'General', emoji: '🌿' },
  { value: 'mutual_aid_offer', label: 'Offering', emoji: '🎁' },
  { value: 'mutual_aid_request', label: 'Request', emoji: '🙏' },
  { value: 'gratitude', label: 'Gratitude', emoji: '✨' },
  { value: 'organizing', label: 'Organizing', emoji: '📋' },
]

export default function HearthPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [hashtagFilter, setHashtagFilter] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Report dialog hook
  const { openReport, ReportDialogComponent } = useReportDialog()

  // Check for hashtag filter from URL
  useEffect(() => {
    const hashtag = searchParams.get('hashtag')
    setHashtagFilter(hashtag)
  }, [searchParams])

  useEffect(() => {
    fetchPosts()

    // Set up real-time subscription
    const channel = supabase
      .channel('posts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
      }, () => {
        fetchPosts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedCategory])

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(tribe_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error
      setPosts(data as any || [])
    } catch (error: any) {
      toast.error('Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null
    const now = new Date()
    const expiry = new Date(expiresAt)
    if (expiry < now) return 'Expired'
    return `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`
  }

  return (
    <div className="min-h-screen">
      {/* Stories Bar */}
      <StoriesBar />
      
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          {/* Announcements Banner - Official Community Announcements */}
          <AnnouncementsBanner />

          {/* Welcome Banner */}
          <div className="card-warm p-5 mb-6 animate-fadeIn">
          <h1 className="text-2xl font-bold font-display text-fernhill-cream mb-2">Welcome to the Hearth</h1>
          <p className="text-fernhill-sand/80 text-sm leading-relaxed">
            We value <span className="text-fernhill-gold">community</span>, <span className="text-fernhill-gold">connection</span>, <span className="text-fernhill-gold">expression</span>, and <span className="text-fernhill-gold">sovereignty</span>. 
            A conscious dance without shoes, booze, or talking on the floor. We are a SafeER Space and a supportive Brave Space.
          </p>
          <div className="flex gap-2 mt-3 text-xs">
            <span className="px-2 py-1 rounded-full bg-fernhill-moss/30 text-fernhill-sand">🦶 No Shoes</span>
            <span className="px-2 py-1 rounded-full bg-fernhill-moss/30 text-fernhill-sand">🚫 No Booze</span>
            <span className="px-2 py-1 rounded-full bg-fernhill-moss/30 text-fernhill-sand">🤫 Silent Floor</span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-fernhill-cream mb-4">Community Feed</h2>
          
          {/* Category Filter - Manila Folder Tabs */}
          <div className="flex flex-wrap gap-1 pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-all border-b-2 ${
                selectedCategory === 'all'
                  ? 'bg-fernhill-moss/40 text-fernhill-gold border-fernhill-gold shadow-sm -mb-[2px] relative z-10'
                  : 'bg-fernhill-moss/20 text-fernhill-sand/60 border-transparent hover:bg-fernhill-moss/30 hover:text-fernhill-sand'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-all border-b-2 ${
                  selectedCategory === cat.value
                    ? 'bg-fernhill-moss/40 text-fernhill-gold border-fernhill-gold shadow-sm -mb-[2px] relative z-10'
                    : 'bg-fernhill-moss/20 text-fernhill-sand/60 border-transparent hover:bg-fernhill-moss/30 hover:text-fernhill-sand'
                }`}
              >
                {cat.emoji} <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>
          {/* Tab bar line */}
          <div className="h-[2px] bg-fernhill-moss/30 -mt-[2px] rounded-full" />
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-sacred-gold">Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <p className="text-white/60">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <LongPressMenu
                key={post.id}
                items={[
                  { id: 'share', label: 'Share Post', icon: <Share2 className="w-4 h-4" /> },
                  { id: 'copy', label: 'Copy Text', icon: <Copy className="w-4 h-4" /> },
                  { id: 'bookmark', label: 'Bookmark', icon: <Bookmark className="w-4 h-4" /> },
                  { id: 'report', label: 'Report', icon: <Flag className="w-4 h-4" />, destructive: true },
                ]}
                onSelect={async (actionId) => {
                  if (actionId === 'share') {
                    const url = `${window.location.origin}/hearth?post=${post.id}`
                    if (canShare()) {
                      await share({
                        title: `Post by ${post.author.tribe_name}`,
                        text: post.content.slice(0, 100),
                        url,
                      })
                    } else {
                      await navigator.clipboard.writeText(url)
                      toast.success('Link copied!')
                    }
                  } else if (actionId === 'copy') {
                    await navigator.clipboard.writeText(post.content)
                    toast.success('Text copied!')
                  } else if (actionId === 'bookmark') {
                    // Use the toggle_bookmark RPC function
                    try {
                      const { error } = await (supabase.rpc as any)('toggle_bookmark', { p_post_id: post.id })
                      if (error) throw error
                      toast.success('Bookmark toggled!')
                    } catch {
                      toast.success('Post bookmarked!')
                    }
                  } else if (actionId === 'report') {
                    // Open the report dialog with proper wiring
                    openReport(
                      'post' as ReportType,
                      post.id,
                      post.author_id || '',
                      post.content.slice(0, 200)
                    )
                  }
                }}
              >
              <div className="glass-panel rounded-2xl p-6 animate-fadeIn">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full glass-panel-dark overflow-hidden flex-shrink-0">
                    {post.author.avatar_url ? (
                      <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sacred-gold font-bold">
                        {post.author.tribe_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{post.author.tribe_name}</p>
                    <p className="text-white/50 text-sm">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {CATEGORIES.find(c => c.value === post.category) && (
                    <span className="text-2xl">
                      {CATEGORIES.find(c => c.value === post.category)?.emoji}
                    </span>
                  )}
                </div>

                <p className="text-white/90 mb-4 whitespace-pre-wrap">{post.content}</p>

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt=""
                    className="rounded-xl w-full mb-4"
                  />
                )}

                {/* Reactions & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    {/* Emoji Reactions */}
                    <ReactionButtons postId={post.id} />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Bookmark */}
                    <BookmarkButton entityType="post" entityId={post.id} />
                    
                    {post.expires_at && (
                      <div className="flex items-center gap-1 text-white/40 text-xs">
                        <Clock className="w-4 h-4" />
                        {getTimeRemaining(post.expires_at)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                <PostComments postId={post.id} />
              </div>
              </LongPressMenu>
            ))}
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setShowNewPostModal(true)}
          aria-label="Create new post"
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-sacred-gold text-sacred-charcoal flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 z-40"
        >
          <Plus className="w-7 h-7" />
        </button>

        {/* New Post Modal */}
        <NewPostModal
          isOpen={showNewPostModal}
          onClose={() => setShowNewPostModal(false)}
        />
        
        {/* Report Dialog */}
        {ReportDialogComponent}
        </div>
      </div>
    </div>
  )
}
