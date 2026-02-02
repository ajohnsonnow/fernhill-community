'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { haptic } from '@/lib/haptics'

/**
 * Edge Swipe Navigation Hook
 * 
 * Enables native app-like "swipe from edge to go back" gesture.
 * Like swiping from the left edge of an iPhone to go back.
 * 
 * Only activates when:
 * - Touch starts within 20px of left screen edge
 * - Swipes right (toward center)
 * - Exceeds threshold distance
 */

interface EdgeSwipeOptions {
  /** Edge detection zone width (px) */
  edgeWidth?: number
  /** Minimum swipe distance to trigger (px) */
  threshold?: number
  /** Max swipe distance for full progress */
  maxDistance?: number
  /** Enable haptic feedback */
  haptics?: boolean
  /** Custom back action (default: router.back()) */
  onBack?: () => void
  /** Disable the gesture */
  disabled?: boolean
}

interface EdgeSwipeState {
  /** Whether a swipe is in progress */
  isSwiping: boolean
  /** Swipe progress (0-1) */
  progress: number
  /** Starting X position */
  startX: number
  /** Current X position */
  currentX: number
}

export function useEdgeSwipe(options: EdgeSwipeOptions = {}) {
  const {
    edgeWidth = 20,
    threshold = 80,
    maxDistance = 200,
    haptics = true,
    onBack,
    disabled = false,
  } = options

  const router = useRouter()
  const stateRef = useRef<EdgeSwipeState>({
    isSwiping: false,
    progress: 0,
    startX: 0,
    currentX: 0,
  })
  const [progress, setProgress] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const hasHapticFeedback = useRef(false)

  const goBack = useCallback(() => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }, [onBack, router])

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      
      // Only start if touch begins at left edge
      if (touch.clientX > edgeWidth) return
      
      stateRef.current = {
        isSwiping: true,
        progress: 0,
        startX: touch.clientX,
        currentX: touch.clientX,
      }
      setIsSwiping(true)
      hasHapticFeedback.current = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!stateRef.current.isSwiping) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - stateRef.current.startX

      // Only track rightward swipes (positive delta)
      if (deltaX <= 0) {
        stateRef.current.progress = 0
        setProgress(0)
        return
      }

      // Calculate progress (0-1)
      const newProgress = Math.min(deltaX / maxDistance, 1)
      stateRef.current.currentX = touch.clientX
      stateRef.current.progress = newProgress
      setProgress(newProgress)

      // Haptic feedback at threshold
      if (deltaX >= threshold && !hasHapticFeedback.current) {
        if (haptics) haptic('light')
        hasHapticFeedback.current = true
      }

      // Prevent page scroll while swiping
      if (newProgress > 0.1) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      if (!stateRef.current.isSwiping) return

      const deltaX = stateRef.current.currentX - stateRef.current.startX

      // If swiped past threshold, go back
      if (deltaX >= threshold) {
        if (haptics) haptic('medium')
        goBack()
      }

      // Reset state
      stateRef.current = {
        isSwiping: false,
        progress: 0,
        startX: 0,
        currentX: 0,
      }
      setIsSwiping(false)
      setProgress(0)
    }

    const handleTouchCancel = () => {
      stateRef.current = {
        isSwiping: false,
        progress: 0,
        startX: 0,
        currentX: 0,
      }
      setIsSwiping(false)
      setProgress(0)
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [disabled, edgeWidth, threshold, maxDistance, haptics, goBack])

  return {
    isSwiping,
    progress,
  }
}

/**
 * Visual indicator for edge swipe
 */
export function EdgeSwipeIndicator({
  progress,
  isSwiping,
}: {
  progress: number
  isSwiping: boolean
}) {
  if (!isSwiping || progress === 0) return null

  return (
    <div
      className="fixed left-0 top-0 bottom-0 w-16 pointer-events-none z-50"
      style={{
        background: `linear-gradient(to right, rgba(255,255,255,${progress * 0.3}), transparent)`,
        transform: `translateX(${progress * 40 - 16}px)`,
        transition: 'transform 50ms ease-out',
      }}
    >
      {/* Arrow indicator */}
      <div
        className="absolute left-2 top-1/2 -translate-y-1/2"
        style={{
          opacity: progress,
          transform: `scale(${0.5 + progress * 0.5})`,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </div>
    </div>
  )
}

export default useEdgeSwipe
