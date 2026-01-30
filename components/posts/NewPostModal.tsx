'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { X, Image, Send, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'

type PostCategory = 'general' | 'mutual_aid_offer' | 'mutual_aid_request' | 'gratitude' | 'organizing'

interface NewPostModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES: { value: PostCategory; label: string; emoji: string }[] = [
  { value: 'general', label: 'General', emoji: '🌿' },
  { value: 'mutual_aid_offer', label: 'Offering', emoji: '🎁' },
  { value: 'mutual_aid_request', label: 'Request', emoji: '🙏' },
  { value: 'gratitude', label: 'Gratitude', emoji: '✨' },
  { value: 'organizing', label: 'Organizing', emoji: '📋' },
]

export default function NewPostModal({ isOpen, onClose }: NewPostModalProps) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PostCategory>('general')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Compress the image
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp' as const,
      }
      const compressedFile = await imageCompression(file, options)
      setImage(compressedFile)

      // Generate preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      toast.error('Failed to process image')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let imageUrl = null

      // Upload image if present
      if (image) {
        const fileName = `${user.id}/${Date.now()}.webp`
        const { error: uploadError, data } = await supabase.storage
          .from('post_images')
          .upload(fileName, image, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Create the post
      const { error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          content: content.trim(),
          category: category as 'general' | 'mutual_aid_offer' | 'mutual_aid_request' | 'gratitude' | 'organizing',
          image_url: imageUrl,
        } as any)

      if (error) throw error

      toast.success('Post shared with the tribe! ✨')
      setContent('')
      setCategory('general')
      setImage(null)
      setImagePreview(null)
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 glass-panel rounded-2xl p-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Share with the Tribe</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl glass-panel-dark hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selector */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  category === cat.value
                    ? 'glass-panel text-sacred-gold'
                    : 'glass-panel-dark text-white/60 hover:text-white'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Content Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your heart?"
            rows={4}
            maxLength={2000}
            className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50 resize-none"
          />
          <p className="text-white/40 text-xs text-right">{content.length}/2000</p>

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full rounded-xl max-h-64 object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                aria-label="Remove image"
                className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                id="post-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                aria-label="Upload image"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image"
                className="p-3 rounded-xl glass-panel-dark hover:bg-white/10 transition-colors"
              >
                <Image className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-sacred-gold text-sacred-charcoal font-semibold rounded-xl hover:bg-sacred-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Share
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
