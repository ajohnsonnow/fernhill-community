'use client'

import { useEffect, useState } from 'react'
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
  Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Board {
  id: string
  slug: string
  name: string
  description: string
  post_count: number
  last_activity_at: string | null
}

interface BoardPost {
  id: string
  created_at: string
  title: string
  content: string
  is_pinned: boolean
  reply_count: number
  last_activity_at: string
  author: {
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

// Default boards to seed
const DEFAULT_BOARDS = [
  { slug: 'announcements', name: '📢 Announcements', description: 'Official updates from the stewards' },
  { slug: 'organizing', name: '📋 Organizing', description: 'Coordinate events, carpools, and community projects' },
  { slug: 'rideshare', name: '🚗 Ride Share', description: 'Find rides to dances and events' },
  { slug: 'mutual-aid', name: '🤝 Mutual Aid', description: 'Give and receive support from the tribe' },
  { slug: 'lost-found', name: '🔍 Lost & Found', description: 'Reunite items with their owners' },
  { slug: 'general', name: '🌿 General Discussion', description: 'Chat about anything and everything' },
]

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)
  const [posts, setPosts] = useState<BoardPost[]>([])
  const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error

      // If no boards exist, display defaults (they won't have data but show the UI)
      if (!data || data.length === 0) {
        setBoards(DEFAULT_BOARDS.map((b, i) => ({
          id: `temp-${i}`,
          slug: b.slug,
          name: b.name,
          description: b.description,
          post_count: 0,
          last_activity_at: null,
        })))
      } else {
        setBoards(data)
      }
    } catch (error: any) {
      // If table doesn't exist, show defaults
      setBoards(DEFAULT_BOARDS.map((b, i) => ({
        id: `temp-${i}`,
        slug: b.slug,
        name: b.name,
        description: b.description,
        post_count: 0,
        last_activity_at: null,
      })))
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async (boardId: string) => {
    try {
      const { data, error } = await supabase
        .from('board_posts')
        .select(`
          *,
          author:profiles!board_posts_author_id_fkey(tribe_name, avatar_url)
        `)
        .eq('board_id', boardId)
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false })

      if (error) throw error
      setPosts(data as any || [])
    } catch (error: any) {
      setPosts([])
    }
  }

  const fetchReplies = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('replies')
        .select(`
          *,
          author:profiles!replies_author_id_fkey(tribe_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setReplies(data as any || [])
    } catch (error: any) {
      setReplies([])
    }
  }

  const handleSelectBoard = (board: Board) => {
    setSelectedBoard(board)
    setSelectedPost(null)
    if (!board.id.startsWith('temp-')) {
      fetchPosts(board.id)
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

  // Board List View
  if (!selectedBoard) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gradient-gold mb-1">Discussion Boards</h1>
            <p className="text-white/60">Persistent threads for the tribe</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-sacred-gold">Loading boards...</div>
            </div>
          ) : (
            <div className="space-y-3">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => handleSelectBoard(board)}
                  className="w-full glass-panel rounded-2xl p-5 text-left hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{board.name}</h3>
                      <p className="text-white/50 text-sm">{board.description}</p>
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
                      <ChevronRight className="w-5 h-5 text-white/30" />
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
    return (
      <div className="min-h-screen p-4">
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
              <h1 className="text-2xl font-bold text-white">{selectedBoard.name}</h1>
              <p className="text-white/50 text-sm">{selectedBoard.description}</p>
            </div>
            <button
              onClick={() => setShowNewPostModal(true)}
              className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-sacred-gold hover:bg-white/10 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Post
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <p className="text-white/60 text-lg mb-2">No discussions yet</p>
              <p className="text-white/40 text-sm">Be the first to start a conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => handleSelectPost(post)}
                  className="w-full glass-panel rounded-2xl p-5 text-left hover:bg-white/5 transition-all"
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
                      <div className="flex items-center gap-2 mb-1">
                        {post.is_pinned && <Pin className="w-4 h-4 text-sacred-gold" />}
                        <h3 className="font-semibold text-white truncate">{post.title}</h3>
                      </div>
                      <p className="text-white/50 text-sm line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                        <span>{post.author.tribe_name}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                        <span>•</span>
                        <span>{post.reply_count} replies</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {showNewPostModal && (
            <NewPostModal
              boardId={selectedBoard.id}
              onClose={() => setShowNewPostModal(false)}
              onSuccess={() => {
                setShowNewPostModal(false)
                fetchPosts(selectedBoard.id)
              }}
            />
          )}
        </div>
      </div>
    )
  }

  // Post Detail View with Replies
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to {selectedBoard.name}
        </button>

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
            <div>
              <h1 className="text-xl font-bold text-white mb-1">{selectedPost.title}</h1>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <span>{selectedPost.author.tribe_name}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <p className="text-white/80 whitespace-pre-wrap">{selectedPost.content}</p>
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
  boardId: string
  onClose: () => void
  onSuccess: () => void
}

function NewPostModal({ boardId, onClose, onSuccess }: NewPostModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (boardId.startsWith('temp-')) {
      toast.error('This board needs to be set up by an admin first')
      return
    }
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('board_posts')
        .insert({
          board_id: boardId,
          author_id: user.id,
          title,
          content,
        } as any)

      if (error) throw error

      toast.success('Post created!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 animate-fadeIn">
        <h2 className="text-xl font-bold text-white mb-6">New Discussion</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              required
              maxLength={200}
              className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
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
        } as any)

      if (error) throw error

      setContent('')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to post reply')
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
