'use client'

import { useState, useRef } from 'react'
import { Upload, User, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { compressImage } from '@/lib/image-utils'

interface PhotoUploadProps {
  onUpload: (imageData: string) => void
  maxSizeKB?: number
}

export default function PhotoUpload({ onUpload, maxSizeKB = 500 }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setIsProcessing(true)

    try {
      // Compress the image using options object
      const compressedFile = await compressImage(file, {
        maxSizeMB: maxSizeKB / 1000,
        maxWidthOrHeight: 800,
        fileType: 'image/webp'
      })
      
      // Convert to base64 for preview
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setPreview(base64)
        setIsProcessing(false)
      }
      reader.onerror = () => {
        toast.error('Failed to read image')
        setIsProcessing(false)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error: any) {
      console.error('Image processing error:', error)
      toast.error(error.message || 'Failed to process image')
      setIsProcessing(false)
    }
  }

  const handleConfirm = () => {
    if (preview) {
      onUpload(preview)
    }
  }

  const handleRetake = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!preview ? (
        // Upload area
        <div 
          onClick={triggerFileSelect}
          className="relative aspect-square rounded-2xl overflow-hidden glass-panel-dark border-2 border-dashed border-white/20 hover:border-sacred-gold/50 transition-colors cursor-pointer"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            {isProcessing ? (
              <>
                <Loader2 className="w-12 h-12 text-sacred-gold animate-spin mb-4" />
                <p className="text-white/70">Processing image...</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-sacred-gold/20 flex items-center justify-center mb-4">
                  <Upload className="w-10 h-10 text-sacred-gold" />
                </div>
                <p className="text-white font-medium mb-2">Upload a Photo</p>
                <p className="text-white/50 text-sm">
                  Choose a clear photo of your face
                </p>
                <p className="text-white/40 text-xs mt-2">
                  JPG, PNG, or WebP • Max {maxSizeKB}KB
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        // Preview area
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden glass-panel-dark">
            <img 
              src={preview} 
              alt="Photo preview" 
              className="w-full h-full object-cover"
            />
            
            {/* Success indicator */}
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-green-500/90 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Ready</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 py-3 px-4 rounded-xl glass-panel-dark text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Choose Different
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 rounded-xl bg-sacred-gold text-sacred-charcoal font-semibold hover:bg-sacred-gold/90 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Use This Photo
            </button>
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="glass-panel-dark rounded-xl p-4">
        <p className="text-white/70 text-sm font-medium mb-2">Photo Guidelines:</p>
        <ul className="text-white/50 text-xs space-y-1">
          <li>• Your face should be clearly visible</li>
          <li>• Good lighting helps stewards verify you</li>
          <li>• This will become your profile picture</li>
          <li>• No filters or heavy editing please</li>
        </ul>
      </div>
    </div>
  )
}
