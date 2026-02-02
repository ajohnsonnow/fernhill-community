'use client'

import { useState } from 'react'
import { Share2, Check, Copy, X } from 'lucide-react'
import { share, shareCurrentPage, shareFernhillContent, canShare } from '@/lib/share'
import { haptic } from '@/lib/haptics'

interface ShareButtonProps {
  /** Content to share */
  title?: string
  text?: string
  url?: string
  /** Pre-configured Fernhill content */
  fernhillContent?: {
    type: 'post' | 'event' | 'profile' | 'playlist'
    id: string
    title: string
    description?: string
  }
  /** Visual style */
  variant?: 'default' | 'compact' | 'text'
  /** Additional classes */
  className?: string
  /** Show toast feedback */
  showFeedback?: boolean
}

/**
 * Native Share Button
 * 
 * Opens the OS share sheet on mobile, falls back to clipboard on desktop.
 * Looks and feels like native app sharing.
 */
export function ShareButton({
  title,
  text,
  url,
  fernhillContent,
  variant = 'default',
  className = '',
  showFeedback = true,
}: ShareButtonProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleShare = async () => {
    haptic('light')
    
    let result
    
    if (fernhillContent) {
      result = await shareFernhillContent(fernhillContent)
    } else if (title || text || url) {
      result = await share({ title, text, url })
    } else {
      result = await shareCurrentPage()
    }

    if (result.success) {
      if (showFeedback) {
        setStatus('success')
        if (result.method === 'clipboard') {
          haptic('success')
        }
        setTimeout(() => setStatus('idle'), 2000)
      }
    } else if (result.error !== 'Cancelled') {
      setStatus('error')
      haptic('error')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  // Render based on variant
  if (variant === 'compact') {
    return (
      <button
        onClick={handleShare}
        className={`share-btn-compact ${className}`}
        aria-label="Share"
        title={canShare() ? 'Share' : 'Copy link'}
      >
        {status === 'success' ? (
          <Check className="w-5 h-5 text-green-400" />
        ) : status === 'error' ? (
          <X className="w-5 h-5 text-red-400" />
        ) : (
          <Share2 className="w-5 h-5" />
        )}
      </button>
    )
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleShare}
        className={`flex items-center gap-1.5 text-sm hover:underline ${className}`}
      >
        <Share2 className="w-4 h-4" />
        {status === 'success' ? 'Copied!' : 'Share'}
      </button>
    )
  }

  // Default button
  return (
    <button
      onClick={handleShare}
      className={`share-btn ${className}`}
    >
      {status === 'success' ? (
        <>
          <Check className="w-5 h-5" />
          <span>{canShare() ? 'Shared!' : 'Copied!'}</span>
        </>
      ) : status === 'error' ? (
        <>
          <X className="w-5 h-5" />
          <span>Failed</span>
        </>
      ) : (
        <>
          <Share2 className="w-5 h-5" />
          <span>{canShare() ? 'Share' : 'Copy Link'}</span>
        </>
      )}
    </button>
  )
}

/**
 * Share this Page button - shares current URL
 */
export function SharePageButton({ className = '' }: { className?: string }) {
  return <ShareButton className={className} />
}

/**
 * Copy Link button - simpler version
 */
export function CopyLinkButton({ 
  url,
  className = '' 
}: { 
  url?: string
  className?: string 
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const linkToCopy = url || (typeof window !== 'undefined' ? window.location.href : '')
    
    try {
      await navigator.clipboard.writeText(linkToCopy)
      setCopied(true)
      haptic('success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      haptic('error')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 text-sm ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Copy Link</span>
        </>
      )}
    </button>
  )
}

export default ShareButton
