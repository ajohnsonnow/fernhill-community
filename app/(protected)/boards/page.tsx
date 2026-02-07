'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  Pin,
  Clock,
  ArrowLeft,
  Send,
  Loader2,
  ArrowUp,
  AlertTriangle,
  Gift,
  Tag,
  Home,
  Wrench,
  Car,
  Search,
  DollarSign,
  X,
  Timer,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow, format, differenceInDays, differenceInHours, isPast, addDays } from 'date-fns'

interface Board {
  id: string
  slug: string
  name: string
  description: string
  post_count: number
  last_activity_at: string | null
  is_marketplace?: boolean
  expires_in_days?: number | null
  allow_bumps?: boolean
}

interface BoardPost {
  id: string
  created_at: string
  title: string
  content: string
  is_pinned: boolean
  reply_count: number
  last_activity_at: string
  expires_at: string | null
  bump_count: number
  max_bumps: number
  last_bumped_at: string | null
  status: string
  price: number | null
  is_free: boolean
  condition: string | null
  contact_preference: string
  images: string[]
  author: {
    id: string
    tribe_name: string
    avatar_url: string | null
  }
}

interface Reply {
  id: string
  created_at: string
  content: string
  author: {
    tribe_name: string
    avatar_url: string | null
  }
}

// Default boards to seed - now includes marketplace boards
const DEFAULT_BOARDS = [
  { slug: 'announcements', name: '📢 Announcements', description: 'Official updates from the stewards', is_marketplace: false },
  { slug: 'free-stuff', name: '🎁 Free Stuff', description: 'Give away items to the tribe. Posts expire in 7 days.', is_marketplace: true, expires_in_days: 7 },
  { slug: 'yard-sale', name: '🏷️ Yard Sale', description: 'Buy and sell within the community. Posts expire in 14 days.', is_marketplace: true, expires_in_days: 14 },
  { slug: 'rideshare', name: '🚗 Ride Share', description: 'Find rides to dances and events. Posts expire in 7 days.', is_marketplace: true, expires_in_days: 7 },
  { slug: 'lost-found', name: '🔍 Lost & Found', description: 'Reunite items with their owners', is_marketplace: true, expires_in_days: 30 },
  { slug: 'general', name: '🌿 General Discussion', description: 'Chat about anything and everything', is_marketplace: false },
]

// Helper function to get expiration status
function getExpirationStatus(expiresAt: string | null): { status: 'active' | 'expiring-soon' | 'expired' | 'no-expiration', label: string, color: string } {
  if (!expiresAt) {
    return { status: 'no-expiration', label: 'No expiration', color: 'text-white/40' }
  }
  
  const expirationDate = new Date(expiresAt)
  const now = new Date()
  
  if (isPast(expirationDate)) {
    return { status: 'expired', label: 'Expired', color: 'text-red-400' }
  }
  
  const hoursRemaining = differenceInHours(expirationDate, now)
  const daysRemaining = differenceInDays(expirationDate, now)
  
  if (hoursRemaining <= 24) {
    return { status: 'expiring-soon', label: `Expires in ${hoursRemaining}h`, color: 'text-amber-400' }
  }
  
  if (daysRemaining <= 3) {
    return { status: 'expiring-soon', label: `Expires in ${daysRemaining}d`, color: 'text-amber-400' }
  }
  
  return { status: 'active', label: `${daysRemaining} days left`, color: 'text-green-400' }
}

// Board icon helper
function getBoardIcon(slug: string) {
  switch (slug) {
    case 'free-stuff': return <Gift className="w-5 h-5" />
    case 'yard-sale': return <Tag className="w-5 h-5" />
    case 'housing': return <Home className="w-5 h-5" />
    case 'services': return <Wrench className="w-5 h-5" />
    case 'rideshare': return <Car className="w-5 h-5" />
    case 'lost-found': return <Search className="w-5 h-5" />
    default: return <MessageSquare className="w-5 h-5" />
  }
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)
  const [posts, setPosts] = useState<BoardPost[]>([])
  const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showExpiredPosts, setShowExpiredPosts] = useState(false)
  const [filter, setFilter] = useState<'all' | 'marketplace' | 'discussion'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchBoards()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)
  }

  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        setBoards(DEFAULT_BOARDS.map((b, i) => ({
          id: `temp-${i}`,
          slug: b.slug,
          name: b.name,
          description: b.description,
          post_count: 0,
          last_activity_at: null,
          is_marketplace: b.is_marketplace,
          expires_in_days: b.expires_in_days,
          allow_bumps: true,
        })))
      } else {
        setBoards(data)
      }
    } catch (error: unknown) {
      setBoards(DEFAULT_BOARDS.map((b, i) => ({
        id: `temp-${i}`,
        slug: b.slug,
        name: b.name,
        description: b.description,
        post_count: 0,
        last_activity_at: null,
        is_marketplace: b.is_marketplace,
        expires_in_days: b.expires_in_days,
        allow_bumps: true,
      })))
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async (boardId: string, includeExpired = false) => {
    try {
      // Get current user to check if admin
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id
      
      // Get current user's profile to check admin status
      let isAdmin = false
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', userId)
          .single()
        isAdmin = (profile as any)?.status === 'admin'
      }

      let query = supabase
        .from('board_posts')
        .select(`
          *,
          author:profiles!board_posts_author_id_fkey(id, tribe_name, avatar_url, muted)
        `)
        .eq('board_id', boardId)
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false })

      // Filter by expiration status
      if (!includeExpired) {
        query = query.or('expires_at.is.null,expires_at.gt.now()')
      }

      const { data, error } = await query

      if (error) throw error
      
      // Filter out muted users' posts (unless it's the user's own post or user is admin)
      const filteredPosts = (data || []).filter((post: any) => {
        const authorMuted = post.author?.muted === true
        const isOwnPost = post.author_id === userId
        return !authorMuted || isOwnPost || isAdmin
      })
      
      setPosts(filteredPosts as BoardPost[] || [])
    } catch (error: unknown) {
      setPosts([])
    }
  }

  const fetchReplies = async (postId: string) => {
    try {
      // Get current user to check if admin
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id
      
      // Get current user's profile to check admin status
      let isAdmin = false
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', userId)
          .single()
        isAdmin = (profile as any)?.status === 'admin'
      }

      const { data, error } = await supabase
        .from('replies')
        .select(`
          *,
          author:profiles!replies_author_id_fkey(tribe_name, avatar_url, muted)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // Filter out muted users' replies (unless it's the user's own reply or user is admin)
      const filteredReplies = (data || []).filter((reply: any) => {
        const authorMuted = reply.author?.muted === true
        const isOwnReply = reply.author_id === userId
        return !authorMuted || isOwnReply || isAdmin
      })
      
      setReplies(filteredReplies as Reply[] || [])
    } catch (error: unknown) {
      setReplies([])
    }
  }

  const handleBumpPost = async (post: BoardPost) => {
    if (!currentUserId) {
      toast.error('You must be logged in to bump posts')
      return
    }

    if (post.author.id !== currentUserId) {
      toast.error('You can only bump your own posts')
      return
    }

    if (post.bump_count >= (post.max_bumps || 3)) {
      toast.error('Maximum bumps reached (3 per post)')
      return
    }

    try {
      // Call the bump function (if RPC exists)
      const { data, error } = await supabase.rpc('bump_post', { post_id_param: post.id } as never)

      if (error) throw error

      const result = data as { success: boolean; error?: string; bumps_remaining?: number } | null
      if (result && !result.success) {
        toast.error(result.error || 'Failed to bump post')
        return
      }

      toast.success(`Post bumped! ${result?.bumps_remaining ?? 'some'} bumps remaining`)
      
      // Refresh posts
      if (selectedBoard) {
        fetchPosts(selectedBoard.id, showExpiredPosts)
      }
    } catch (error: unknown) {
      // Fallback: direct update if RPC doesn't exist
      try {
        const board = selectedBoard
        const daysToAdd = board?.expires_in_days || 7
        const newExpiresAt = addDays(new Date(), daysToAdd).toISOString()

        const { error: updateError } = await supabase
          .from('board_posts')
          .update({
            expires_at: newExpiresAt,
            bump_count: post.bump_count + 1,
            last_bumped_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            status: 'active',
          } as never)
          .eq('id', post.id)
          .eq('author_id', currentUserId)

        if (updateError) throw updateError

        toast.success(`Post bumped! ${(post.max_bumps || 3) - post.bump_count - 1} bumps remaining`)
        
        if (selectedBoard) {
          fetchPosts(selectedBoard.id, showExpiredPosts)
        }
      } catch (fallbackError: unknown) {
        const errMsg = fallbackError instanceof Error ? fallbackError.message : 'Failed to bump post'
        toast.error(errMsg)
      }
    }
  }

  const handleSelectBoard = (board: Board) => {
    setSelectedBoard(board)
    setSelectedPost(null)
    setShowExpiredPosts(false)
    if (!board.id.startsWith('temp-')) {
      fetchPosts(board.id, false)
    } else {
      setPosts([])
    }
  }

  const handleSelectPost = (post: BoardPost) => {
    setSelectedPost(post)
    fetchReplies(post.id)
  }

  const handleBack = () => {
    if (selectedPost) {
      setSelectedPost(null)
      setReplies([])
    } else if (selectedBoard) {
      setSelectedBoard(null)
      setPosts([])
    }
  }

  const toggleExpiredPosts = () => {
    const newValue = !showExpiredPosts
    setShowExpiredPosts(newValue)
    if (selectedBoard && !selectedBoard.id.startsWith('temp-')) {
      fetchPosts(selectedBoard.id, newValue)
    }
  }

  // Filter boards
  const filteredBoards = boards.filter(board => {
    if (filter === 'all') return true
    if (filter === 'marketplace') return board.is_marketplace
    return !board.is_marketplace
  })

  // Board List View
  if (!selectedBoard) {
    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gradient-gold mb-1">Community Boards</h1>
            <p className="text-white/60">Discussions, marketplace, and more</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['all', 'marketplace', 'discussion'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  filter === f
                    ? 'bg-sacred-gold text-sacred-charcoal'
                    : 'glass-panel text-white/70 hover:bg-white/10'
                }`}
              >
                {f === 'all' ? '🌟 All Boards' : f === 'marketplace' ? '🛒 Marketplace' : '💬 Discussions'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-sacred-gold" />
              <p className="text-white/40 mt-2">Loading boards...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBoards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => handleSelectBoard(board)}
                  className="w-full glass-panel rounded-2xl p-5 text-left hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        board.is_marketplace ? 'bg-sacred-gold/20 text-sacred-gold' : 'glass-panel-dark text-white/60'
                      }`}>
                        {getBoardIcon(board.slug)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">{board.name}</h3>
                          {board.is_marketplace && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-sacred-gold/20 text-sacred-gold">
                              {board.expires_in_days}d
                            </span>
                          )}
                        </div>
                        <p className="text-white/50 text-sm">{board.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white/60 text-sm">{board.post_count} posts</p>
                        {board.last_activity_at && (
                          <p className="text-white/40 text-xs">
                            {formatDistanceToNow(new Date(board.last_activity_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-sacred-gold transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Post List View
  if (!selectedPost) {
    const activePosts = posts.filter(p => {
      const { status } = getExpirationStatus(p.expires_at)
      return status !== 'expired'
    })
    const expiredPosts = posts.filter(p => {
      const { status } = getExpirationStatus(p.expires_at)
      return status === 'expired'
    })
    const myExpiredPosts = expiredPosts.filter(p => p.author.id === currentUserId)

    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="p-2 rounded-xl glass-panel-dark hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{selectedBoard.name}</h1>
                {selectedBoard.is_marketplace && selectedBoard.expires_in_days && (
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {selectedBoard.expires_in_days}d expiry
                  </span>
                )}
              </div>
              <p className="text-white/50 text-sm">{selectedBoard.description}</p>
            </div>
            <button
              onClick={() => setShowNewPostModal(true)}
              className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-sacred-gold hover:bg-white/10 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Post</span>
            </button>
          </div>

          {/* Expired Posts Toggle for Authors */}
          {myExpiredPosts.length > 0 && (
            <button
              onClick={toggleExpiredPosts}
              className="w-full mb-4 p-3 glass-panel-dark rounded-xl flex items-center justify-between text-amber-400 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">You have {myExpiredPosts.length} expired post(s) that can be bumped</span>
              </div>
              <ChevronRight className={`w-5 h-5 transition-transform ${showExpiredPosts ? 'rotate-90' : ''}`} />
            </button>
          )}

          {posts.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <p className="text-white/60 text-lg mb-2">No posts yet</p>
              <p className="text-white/40 text-sm">Be the first to post something!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(showExpiredPosts ? posts : activePosts).map((post) => {
                const expiration = getExpirationStatus(post.expires_at)
                const isOwner = post.author.id === currentUserId
                const canBump = isOwner && (post.bump_count || 0) < (post.max_bumps || 3)
                
                return (
                  <div
                    key={post.id}
                    className={`glass-panel rounded-2xl p-5 transition-all ${
                      expiration.status === 'expired' ? 'opacity-60 border border-red-500/30' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleSelectPost(post)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-4">
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
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {post.is_pinned && <Pin className="w-4 h-4 text-sacred-gold flex-shrink-0" />}
                            <h3 className="font-semibold text-white truncate">{post.title}</h3>
                            {post.is_free && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">FREE</span>
                            )}
                            {post.price && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-sacred-gold/20 text-sacred-gold flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />{post.price}
                              </span>
                            )}
                          </div>
                          <p className="text-white/50 text-sm line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-white/40 flex-wrap">
                            <span>{post.author.tribe_name}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                            <span>•</span>
                            <span>{post.reply_count} replies</span>
                            {post.expires_at && (
                              <>
                                <span>•</span>
                                <span className={`flex items-center gap-1 ${expiration.color}`}>
                                  <Clock className="w-3 h-3" />
                                  {expiration.label}
                                </span>
                              </>
                            )}
                            {post.bump_count > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-blue-400">
                                  <ArrowUp className="w-3 h-3" />
                                  Bumped {post.bump_count}x
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
                      </div>
                    </button>

                    {/* Bump Button */}
                    {isOwner && expiration.status !== 'no-expiration' && canBump && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBumpPost(post)
                          }}
                          className={`w-full py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                            expiration.status === 'expired'
                              ? 'bg-sacred-gold text-sacred-charcoal hover:bg-sacred-gold/90'
                              : 'glass-panel-dark text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <RefreshCw className="w-4 h-4" />
                          {expiration.status === 'expired' ? 'Renew Post' : 'Bump Post'}
                          <span className="text-xs opacity-70">({(post.max_bumps || 3) - (post.bump_count || 0)} left)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {showNewPostModal && (
            <NewPostModal
              board={selectedBoard}
              onClose={() => setShowNewPostModal(false)}
              onSuccess={() => {
                setShowNewPostModal(false)
                fetchPosts(selectedBoard.id, showExpiredPosts)
              }}
            />
          )}
        </div>
      </div>
    )
  }

  // Post Detail View with Replies
  const expiration = getExpirationStatus(selectedPost.expires_at)
  const isOwner = selectedPost.author.id === currentUserId
  const canBump = isOwner && (selectedPost.bump_count || 0) < (selectedPost.max_bumps || 3)

  return (
    <div className="min-h-screen p-4 pb-32">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to {selectedBoard.name}
        </button>

        {/* Expiration Banner */}
        {selectedPost.expires_at && (
          <div className={`mb-4 p-3 rounded-xl flex items-center justify-between ${
            expiration.status === 'expired' ? 'bg-red-500/20 border border-red-500/30' :
            expiration.status === 'expiring-soon' ? 'bg-amber-500/20 border border-amber-500/30' :
            'glass-panel-dark'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${expiration.color}`} />
              <span className={`text-sm ${expiration.color}`}>
                {expiration.status === 'expired' 
                  ? 'This post has expired'
                  : `Expires ${format(new Date(selectedPost.expires_at), 'MMM d, yyyy')}`
                }
              </span>
            </div>
            {canBump && (
              <button
                onClick={() => handleBumpPost(selectedPost)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${
                  expiration.status === 'expired'
                    ? 'bg-sacred-gold text-sacred-charcoal'
                    : 'glass-panel text-white/70 hover:bg-white/10'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                {expiration.status === 'expired' ? 'Renew' : 'Bump'}
              </button>
            )}
          </div>
        )}

        <div className="glass-panel rounded-2xl p-6 mb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full glass-panel-dark overflow-hidden flex-shrink-0">
              {selectedPost.author.avatar_url ? (
                <img src={selectedPost.author.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sacred-gold font-bold">
                  {selectedPost.author.tribe_name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-white">{selectedPost.title}</h1>
                {selectedPost.is_free && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">FREE</span>
                )}
                {selectedPost.price && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-sacred-gold/20 text-sacred-gold flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />{selectedPost.price}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50 flex-wrap">
                <span>{selectedPost.author.tribe_name}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true })}</span>
                {selectedPost.condition && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{selectedPost.condition}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Images */}
          {selectedPost.images && selectedPost.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {selectedPost.images.map((img, idx) => (
                <img 
                  key={idx} 
                  src={img} 
                  alt={`Image ${idx + 1}`} 
                  className="w-full h-48 object-cover rounded-xl"
                />
              ))}
            </div>
          )}
          
          <p className="text-white/80 whitespace-pre-wrap">{selectedPost.content}</p>
          
          {/* Bump History */}
          {(selectedPost.bump_count || 0) > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/40 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                Bumped {selectedPost.bump_count} time(s)
                {selectedPost.last_bumped_at && (
                  <span>
                    • Last bumped {formatDistanceToNow(new Date(selectedPost.last_bumped_at), { addSuffix: true })}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Replies */}
        <div className="space-y-3 mb-24">
          {replies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/40">No replies yet. Be the first to respond!</p>
            </div>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} className="glass-panel-dark rounded-xl p-4 ml-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full glass-panel overflow-hidden flex-shrink-0">
                    {reply.author.avatar_url ? (
                      <img src={reply.author.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sacred-gold text-sm font-bold">
                        {reply.author.tribe_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">{reply.author.tribe_name}</span>
                      <span className="text-white/40 text-xs">
                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm">{reply.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Input */}
        <ReplyInput
          postId={selectedPost.id}
          onSuccess={() => fetchReplies(selectedPost.id)}
        />
      </div>
    </div>
  )
}

interface NewPostModalProps {
  board: Board
  onClose: () => void
  onSuccess: () => void
}

function NewPostModal({ board, onClose, onSuccess }: NewPostModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [price, setPrice] = useState('')
  const [isFree, setIsFree] = useState(board.slug === 'free-stuff')
  const [condition, setCondition] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const isMarketplace = board.is_marketplace

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (board.id.startsWith('temp-')) {
      toast.error('This board needs to be set up by an admin first')
      return
    }
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const postData: Record<string, unknown> = {
        board_id: board.id,
        author_id: user.id,
        title,
        content,
      }

      if (isMarketplace) {
        postData.is_free = isFree
        if (!isFree && price) {
          postData.price = parseFloat(price)
        }
        if (condition) {
          postData.condition = condition
        }
      }

      const { error } = await supabase
        .from('board_posts')
        .insert(postData as never)

      if (error) throw error

      toast.success('Post created!')
      onSuccess()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to create post'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {isMarketplace ? 'Create Listing' : 'New Discussion'}
          </h2>
          <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Expiration Notice */}
        {board.expires_in_days && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <Timer className="w-4 h-4" />
              <span>Posts in this board expire after {board.expires_in_days} days</span>
            </div>
            <p className="text-amber-400/70 text-xs mt-1">You can bump expired posts up to 3 times</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isMarketplace ? "What are you listing?" : "What's on your mind?"}
              required
              maxLength={200}
              className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50"
            />
          </div>

          {/* Marketplace Fields */}
          {isMarketplace && (
            <>
              {/* Price / Free Toggle */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFree(true)}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    isFree 
                      ? 'bg-green-500/30 border-2 border-green-500 text-green-400'
                      : 'glass-panel-dark text-white/60'
                  }`}
                >
                  <Gift className="w-5 h-5" />
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setIsFree(false)}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    !isFree 
                      ? 'bg-sacred-gold/30 border-2 border-sacred-gold text-sacred-gold'
                      : 'glass-panel-dark text-white/60'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  For Sale
                </button>
              </div>

              {/* Price Input */}
              {!isFree && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="25.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50"
                  />
                </div>
              )}

              {/* Condition */}
              <div>
                <label htmlFor="condition-select" className="block text-sm font-medium text-white/80 mb-2">Condition</label>
                <select
                  id="condition-select"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  aria-label="Item condition"
                  className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sacred-gold/50"
                >
                  <option value="">Select condition...</option>
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="for-parts">For Parts</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Description *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isMarketplace ? "Describe your item..." : "Share your thoughts..."}
              required
              rows={6}
              maxLength={5000}
              className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50 resize-none"
            />
            <p className="text-white/40 text-xs text-right mt-1">{content.length}/5000</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title || !content}
              className="flex-1 btn-primary bg-sacred-gold text-sacred-charcoal hover:bg-sacred-gold/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ReplyInputProps {
  postId: string
  onSuccess: () => void
}

function ReplyInput({ postId, onSuccess }: ReplyInputProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('replies')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: content.trim(),
        } as never)

      if (error) throw error

      setContent('')
      onSuccess()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to post reply'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="fixed bottom-20 left-0 right-0 glass-panel border-t border-white/10 p-4">
      <div className="max-w-4xl mx-auto flex gap-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a reply..."
          maxLength={2000}
          className="flex-1 px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-3 bg-sacred-gold text-sacred-charcoal rounded-xl hover:bg-sacred-gold/90 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </form>
  )
}
