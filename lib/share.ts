/**
 * Web Share API Utility
 * 
 * Native sharing on mobile devices - opens the OS share sheet
 * just like native apps. Falls back to clipboard copy on desktop.
 * 
 * Think of it like the share button in any native app - it opens
 * the same menu with Messages, Email, Twitter, etc.
 */

export interface ShareData {
  /** Title of the shared content */
  title?: string
  /** Description/text to share */
  text?: string
  /** URL to share */
  url?: string
  /** Files to share (images, etc.) */
  files?: File[]
}

export interface ShareResult {
  success: boolean
  method: 'native' | 'clipboard' | 'none'
  error?: string
}

/**
 * Check if Web Share API is available
 */
export function canShare(data?: ShareData): boolean {
  if (typeof navigator === 'undefined') return false
  
  if (!navigator.share) return false
  
  // If we have files, check if file sharing is supported
  if (data?.files?.length) {
    return navigator.canShare?.(data) ?? false
  }
  
  return true
}

/**
 * Check if we can share files
 */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined') return false
  return typeof navigator.canShare === 'function' && typeof navigator.share === 'function'
}

/**
 * Share content using native share sheet or clipboard fallback
 * 
 * @example
 * // Share a post
 * await share({
 *   title: 'Check out this event!',
 *   text: 'Sunday Ecstatic Dance at Fernhill',
 *   url: 'https://fernhill.community/events/123'
 * })
 * 
 * @example
 * // Share an image
 * const file = new File([blob], 'dance.jpg', { type: 'image/jpeg' })
 * await share({ files: [file], title: 'Great moment!' })
 */
export async function share(data: ShareData): Promise<ShareResult> {
  // Try native share first
  if (canShare(data)) {
    try {
      await navigator.share(data)
      return { success: true, method: 'native' }
    } catch (error) {
      // User cancelled - not an error
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, method: 'native', error: 'Cancelled' }
      }
      // Fall through to clipboard
    }
  }

  // Fallback: copy to clipboard
  const textToCopy = [data.title, data.text, data.url]
    .filter(Boolean)
    .join('\n')

  if (textToCopy && typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(textToCopy)
      return { success: true, method: 'clipboard' }
    } catch (error) {
      return { 
        success: false, 
        method: 'clipboard', 
        error: 'Failed to copy to clipboard' 
      }
    }
  }

  return { success: false, method: 'none', error: 'Sharing not available' }
}

/**
 * Share the current page
 */
export async function shareCurrentPage(customText?: string): Promise<ShareResult> {
  if (typeof window === 'undefined') {
    return { success: false, method: 'none', error: 'Not in browser' }
  }

  return share({
    title: document.title,
    text: customText,
    url: window.location.href,
  })
}

/**
 * Share a post/event from Fernhill
 */
export async function shareFernhillContent(options: {
  type: 'post' | 'event' | 'profile' | 'playlist'
  id: string
  title: string
  description?: string
}): Promise<ShareResult> {
  const { type, id, title, description } = options
  
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://fernhill.community'
  
  const paths = {
    post: `/hearth?post=${id}`,
    event: `/events?id=${id}`,
    profile: `/directory?member=${id}`,
    playlist: `/journey?playlist=${id}`,
  }
  
  return share({
    title: `${title} | Fernhill Community`,
    text: description || `Check out "${title}" on Fernhill`,
    url: `${baseUrl}${paths[type]}`,
  })
}

/**
 * Share an image file
 */
export async function shareImage(
  imageBlob: Blob, 
  filename: string = 'fernhill-photo.jpg',
  caption?: string
): Promise<ShareResult> {
  if (!canShareFiles()) {
    return { success: false, method: 'none', error: 'File sharing not supported' }
  }

  const file = new File([imageBlob], filename, { type: imageBlob.type })
  
  return share({
    files: [file],
    title: 'Fernhill Community',
    text: caption,
  })
}

export default share
