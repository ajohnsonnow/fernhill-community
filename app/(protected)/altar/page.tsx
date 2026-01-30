'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  Plus, 
  Heart, 
  X, 
  Loader2, 
  Camera,
  Image as ImageIcon,
  Sparkles,
  Trash2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import imageCompression from 'browser-image-compression'

interface AltarPost {
  id: string
  created_at: string
  image_url: string
  file_path?: string
  caption: string | null
  likes_count: number
  author_id: string
  author: {
    tribe_name: string
    avatar_url: string | null
  }
}

export default function AltarPage() {
  const [posts, setPosts] = useState<AltarPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<AltarPost | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkUserRole()
    fetchPosts()
  }, [])

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    setCurrentUserId(user.id)
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()
    
    const p = profile as any
    setIsAdmin(p?.status === 'admin' || p?.status === 'facilitator')
  }

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('altar_posts')
        .select(`
          *,
          author:profiles!altar_posts_author_id_fkey(tribe_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      
      // Generate fresh signed URLs for private bucket images
      const postsWithSignedUrls = await Promise.all(
        (data || []).map(async (post: any) => {
          // If we have a file_path, generate a signed URL (valid for 1 hour)
          if (post.file_path) {
            const { data: signedData } = await supabase.storage
              .from('altar_photos')
              .createSignedUrl(post.file_path, 60 * 60) // 1 hour
            
            return {
              ...post,
              image_url: signedData?.signedUrl || post.image_url
            }
          }
          return post
        })
      )
      
      setPosts(postsWithSignedUrls as any)
    } catch (error: any) {
      // Table might not exist yet, show empty state
      console.log('Altar posts not available:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const post = posts.find(p => p.id === postId)
      if (!post) return

      await (supabase
        .from('altar_posts') as any)
        .update({ likes_count: post.likes_count + 1 })
        .eq('id', postId)

      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
      ))
    } catch (error) {
      toast.error('Failed to like')
    }
  }

  const handleDelete = async (post: AltarPost) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      // Delete the storage file if we have the path
      if (post.file_path) {
        await supabase.storage
          .from('altar_photos')
          .remove([post.file_path])
      }

      // Delete the database record
      const { error } = await (supabase
        .from('altar_posts') as any)
        .delete()
        .eq('id', post.id)

      if (error) throw error

      toast.success('Photo deleted')
      setPosts(posts.filter(p => p.id !== post.id))
      setSelectedPost(null)
    } catch (error: any) {
      toast.error('Failed to delete photo')
    }
  }

  const canDelete = (post: AltarPost) => {
    return isAdmin || post.author_id === currentUserId
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-fernhill-cream">The Altar</h1>
            <p className="text-fernhill-sand/60 text-sm">Sacred moments from our dances</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="p-3 rounded-full glass-panel text-fernhill-gold hover:bg-white/10 transition-colors"
            aria-label="Upload photo"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="card-warm p-4 mb-6 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-fernhill-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-fernhill-cream text-sm font-medium">Sacred Space</p>
            <p className="text-fernhill-sand/70 text-xs">
              Share beautiful moments from our dances. Photos are visible to community members only.
            </p>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-fernhill-gold mx-auto" />
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Sparkles className="w-12 h-12 text-fernhill-gold/50 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-fernhill-cream mb-2">The Altar Awaits</h3>
            <p className="text-fernhill-sand/60 mb-6">
              Share sacred moments from our dances.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 rounded-xl bg-fernhill-gold/20 text-fernhill-gold font-medium hover:bg-fernhill-gold/30 transition-colors"
            >
              <Camera className="w-5 h-5 inline mr-2" />
              Upload First Photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="relative aspect-square rounded-xl overflow-hidden glass-panel group cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                {/* Image */}
                <img
                  src={post.image_url}
                  alt={post.caption || 'Altar photo'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // If image fails to load, show placeholder
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Delete button for admin/owner */}
                {canDelete(post) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(post)
                    }}
                    className="absolute top-2 right-2 p-2 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Delete photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium truncate">
                      {post.author.tribe_name}
                    </span>
                    <button
                      onClick={(e) => handleLike(post.id, e)}
                      className="flex items-center gap-1 text-white/80 hover:text-red-400 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span className="text-xs">{post.likes_count}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} onSuccess={fetchPosts} />
      )}

      {/* Lightbox */}
      {selectedPost && (
        <Lightbox 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)}
          onDelete={canDelete(selectedPost) ? () => handleDelete(selectedPost) : undefined}
        />
      )}
    </div>
  )
}

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Compress image
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp' as const,
      }
      const compressedFile = await imageCompression(selectedFile, options)
      setFile(compressedFile)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      toast.error('Failed to process image')
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload to storage (PRIVATE bucket)
      const fileName = `${user.id}/${Date.now()}.webp`
      const { error: uploadError } = await supabase.storage
        .from('altar_photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get signed URL for private bucket (valid for 1 hour - will refresh on page load)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('altar_photos')
        .createSignedUrl(fileName, 60 * 60) // 1 hour

      if (urlError) throw urlError

      // Create post with file_path for signed URL regeneration
      const { error: postError } = await (supabase
        .from('altar_posts') as any)
        .insert({
          author_id: user.id,
          image_url: urlData.signedUrl,
          file_path: fileName,
          caption: caption || null,
        })

      if (postError) throw postError

      toast.success('Photo added to the Altar ✨')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-panel rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-fernhill-cream">Add to the Altar</h2>
          <button onClick={onClose} className="p-2 rounded-lg glass-panel-dark hover:bg-white/10" title="Close">
            <X className="w-5 h-5 text-fernhill-sand" />
          </button>
        </div>

        {!preview ? (
          <label className="block cursor-pointer">
            <div className="aspect-square rounded-xl glass-panel-dark flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-colors">
              <ImageIcon className="w-12 h-12 text-fernhill-gold/50" />
              <span className="text-fernhill-sand/60">Tap to select photo</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption (optional)"
              className="w-full px-4 py-3 rounded-xl glass-panel-dark text-fernhill-cream placeholder-fernhill-sand/40 border-none focus:ring-2 focus:ring-fernhill-gold/50"
            />

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3 rounded-xl bg-fernhill-gold text-fernhill-dark font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Add to Altar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Lightbox({ 
  post, 
  onClose,
  onDelete
}: { 
  post: AltarPost
  onClose: () => void
  onDelete?: () => void
}) {
  return (
    <div 
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      {/* Top controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-full glass-panel-dark hover:bg-red-500/50 text-white"
            title="Delete photo"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 rounded-full glass-panel-dark hover:bg-white/10"
          title="Close"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="max-w-4xl max-h-[80vh] p-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={post.image_url}
          alt={post.caption || 'Altar photo'}
          className="max-w-full max-h-[70vh] object-contain rounded-xl"
        />
        
        {post.caption && (
          <p className="text-white text-center mt-4">{post.caption}</p>
        )}
        
        <p className="text-white/60 text-center text-sm mt-2">
          by {post.author.tribe_name} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
