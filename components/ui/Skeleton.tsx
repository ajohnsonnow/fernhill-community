'use client'

/**
 * Skeleton Loading Components
 * 
 * Skeleton loaders (also called "shimmer" or "placeholder" UI)
 * show the shape of content before it loads. This feels faster
 * than spinners because users can see WHERE content will appear.
 */

import { ReactNode } from 'react'

interface SkeletonProps {
  /** Width of skeleton (CSS value) */
  width?: string | number
  /** Height of skeleton (CSS value) */
  height?: string | number
  /** Make it circular (for avatars) */
  circle?: boolean
  /** Additional class names */
  className?: string
  /** Number of skeleton lines to render */
  count?: number
}

/**
 * Basic skeleton shape with shimmer animation
 */
export function Skeleton({
  width,
  height = '1em',
  circle = false,
  className = '',
  count = 1,
}: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: circle ? '50%' : undefined,
  }

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`skeleton ${className}`}
            style={style}
          />
        ))}
      </div>
    )
  }

  return <div className={`skeleton ${className}`} style={style} />
}

/**
 * Skeleton for text lines with varying widths
 */
export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  // Vary line widths for more natural look
  const widths = ['100%', '92%', '85%', '95%', '70%']

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  )
}

/**
 * Avatar skeleton (circular)
 */
export function SkeletonAvatar({
  size = 40,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <div
      className={`skeleton rounded-full flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

/**
 * Post card skeleton - matches the Hearth post layout
 */
export function SkeletonPost({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-stone-800 rounded-xl p-4 ${className}`}>
      {/* Header: Avatar + Name + Time */}
      <div className="flex items-center gap-3 mb-4">
        <SkeletonAvatar size={40} />
        <div className="flex-1">
          <Skeleton width="40%" height={16} className="mb-2" />
          <Skeleton width="25%" height={12} />
        </div>
      </div>

      {/* Content */}
      <SkeletonText lines={3} className="mb-4" />

      {/* Optional image */}
      <Skeleton height={200} className="rounded-lg mb-4" />

      {/* Actions bar */}
      <div className="flex gap-4">
        <Skeleton width={60} height={24} className="rounded-full" />
        <Skeleton width={60} height={24} className="rounded-full" />
        <Skeleton width={60} height={24} className="rounded-full" />
      </div>
    </div>
  )
}

/**
 * Event card skeleton
 */
export function SkeletonEvent({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-stone-800 rounded-xl overflow-hidden ${className}`}>
      {/* Cover image */}
      <Skeleton height={120} />
      
      {/* Content */}
      <div className="p-4">
        <Skeleton width="70%" height={20} className="mb-2" />
        <Skeleton width="50%" height={14} className="mb-3" />
        
        {/* Date/time row */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton width={16} height={16} circle />
          <Skeleton width="40%" height={14} />
        </div>
        
        {/* RSVP button */}
        <Skeleton height={36} className="rounded-lg" />
      </div>
    </div>
  )
}

/**
 * Message skeleton
 */
export function SkeletonMessage({
  isOwn = false,
  className = '',
}: {
  isOwn?: boolean
  className?: string
}) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className="flex gap-2 max-w-[80%]">
        {!isOwn && <SkeletonAvatar size={32} />}
        <div className={`${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
          <Skeleton 
            width={Math.random() * 100 + 100} 
            height={36} 
            className="rounded-2xl" 
          />
          <Skeleton width={40} height={10} />
        </div>
      </div>
    </div>
  )
}

/**
 * List item skeleton (for directory, etc.)
 */
export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 ${className}`}>
      <SkeletonAvatar size={48} />
      <div className="flex-1">
        <Skeleton width="60%" height={16} className="mb-2" />
        <Skeleton width="40%" height={12} />
      </div>
      <Skeleton width={24} height={24} className="rounded" />
    </div>
  )
}

/**
 * Profile header skeleton
 */
export function SkeletonProfile({ className = '' }: { className?: string }) {
  return (
    <div className={`text-center p-6 ${className}`}>
      <SkeletonAvatar size={96} className="mx-auto mb-4" />
      <Skeleton width="50%" height={24} className="mx-auto mb-2" />
      <Skeleton width="30%" height={16} className="mx-auto mb-4" />
      <SkeletonText lines={2} className="max-w-xs mx-auto" />
    </div>
  )
}

/**
 * Generic card skeleton
 */
export function SkeletonCard({
  hasImage = true,
  className = '',
}: {
  hasImage?: boolean
  className?: string
}) {
  return (
    <div className={`bg-stone-800 rounded-xl overflow-hidden ${className}`}>
      {hasImage && <Skeleton height={160} />}
      <div className="p-4">
        <Skeleton width="80%" height={18} className="mb-2" />
        <SkeletonText lines={2} />
      </div>
    </div>
  )
}

/**
 * Music player skeleton (for Journey)
 */
export function SkeletonPlayer({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-stone-800 rounded-xl p-4 ${className}`}>
      <div className="flex gap-4">
        <Skeleton width={64} height={64} className="rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <Skeleton width="70%" height={18} className="mb-2" />
          <Skeleton width="50%" height={14} className="mb-4" />
          {/* Progress bar */}
          <Skeleton height={4} className="rounded-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Wrapper that shows skeleton while loading
 */
export function SkeletonWrapper({
  isLoading,
  skeleton,
  children,
}: {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
}) {
  return <>{isLoading ? skeleton : children}</>
}

/**
 * Multiple skeletons for a feed
 */
export function SkeletonFeed({
  count = 3,
  type = 'post',
}: {
  count?: number
  type?: 'post' | 'event' | 'message' | 'listItem'
}) {
  const Skeleton = {
    post: SkeletonPost,
    event: SkeletonEvent,
    message: SkeletonMessage,
    listItem: SkeletonListItem,
  }[type]

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  )
}

export default Skeleton
