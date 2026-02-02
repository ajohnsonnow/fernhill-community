'use client'

import Image, { ImageProps } from 'next/image'
import { useState, useEffect } from 'react'

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  /** Fallback element when image fails to load */
  fallback?: React.ReactNode
  /** Show shimmer loading placeholder */
  showShimmer?: boolean
  /** Custom shimmer color */
  shimmerColor?: string
  /** Aspect ratio for placeholder (e.g., "16/9", "1/1", "4/3") */
  aspectRatio?: string
}

/**
 * Optimized Image Component
 * 
 * Wraps next/image with:
 * - Automatic WebP/AVIF conversion
 * - Blur placeholder generation
 * - Shimmer loading animation
 * - Error fallback
 * - Lazy loading by default
 * 
 * @example
 * <OptimizedImage
 *   src={user.avatar_url}
 *   alt={user.name}
 *   width={100}
 *   height={100}
 *   className="rounded-full"
 * />
 */
export function OptimizedImage({
  src,
  alt,
  fallback,
  showShimmer = true,
  shimmerColor,
  aspectRatio,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imgSrc, setImgSrc] = useState(src)

  // Reset state when src changes
  useEffect(() => {
    setImgSrc(src)
    setHasError(false)
    setIsLoading(true)
  }, [src])

  // Handle missing or invalid src
  if (!src || hasError) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Default fallback - gradient placeholder
    return (
      <div 
        className={`bg-gradient-to-br from-fernhill-charcoal to-fernhill-brown flex items-center justify-center ${className}`}
        style={aspectRatio ? { aspectRatio } : undefined}
        role="img"
        aria-label={alt || 'Image placeholder'}
      >
        <svg 
          className="w-1/3 h-1/3 text-fernhill-sand/30" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v8l4-4 3 3 5-5 4 4V6H4zm0 12h16v-1.17l-4-4-5 5-3-3-4 4V18zm13-7a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </div>
    )
  }

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Shimmer loading placeholder */}
      {isLoading && showShimmer && (
        <div 
          className="absolute inset-0 img-loading"
          style={shimmerColor ? { background: shimmerColor } : undefined}
          aria-hidden="true"
        />
      )}
      
      <Image
        src={imgSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
        loading="lazy"
        {...props}
      />
    </div>
  )
}

/**
 * Avatar Image Component
 * Optimized for circular profile images
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className = '',
  fallbackInitial,
}: {
  src: string | null | undefined
  alt: string
  size?: number
  className?: string
  fallbackInitial?: string
}) {
  const [hasError, setHasError] = useState(false)

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false)
  }, [src])

  if (!src || hasError) {
    // Fallback to initial or default icon
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br from-fernhill-forest to-fernhill-moss text-fernhill-cream font-semibold rounded-full ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        role="img"
        aria-label={alt}
      >
        {fallbackInitial || alt?.charAt(0)?.toUpperCase() || '?'}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  )
}

/**
 * Cover Image Component
 * For hero images, post images, etc.
 */
export function CoverImage({
  src,
  alt,
  priority = false,
  aspectRatio = '16/9',
  className = '',
}: {
  src: string | null | undefined
  alt: string
  priority?: boolean
  aspectRatio?: string
  className?: string
}) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [src])

  if (!src || hasError) {
    return (
      <div 
        className={`bg-gradient-to-br from-fernhill-charcoal to-fernhill-brown flex items-center justify-center ${className}`}
        style={{ aspectRatio }}
      >
        <svg 
          className="w-12 h-12 text-fernhill-sand/20" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v8l4-4 3 3 5-5 4 4V6H4zm0 12h16v-1.17l-4-4-5 5-3-3-4 4V18zm13-7a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio }}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setHasError(true)}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  )
}

export default OptimizedImage
