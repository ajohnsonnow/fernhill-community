'use client'

import { useCallback, useRef, useState } from 'react'
import { haptic } from '@/lib/haptics'

interface SwipeState {
  /** Whether currently swiping */
  isSwiping: boolean
  /** Swipe direction */
  direction: 'left' | 'right' | null
  /** Current swipe distance in pixels */
  distance: number
  /** Swipe progress from 0 to 1 */
  progress: number
}

interface UseSwipeGestureOptions {
  /** Callback when swiped left past threshold */
  onSwipeLeft?: () => void
  /** Callback when swiped right past threshold */
  onSwipeRight?: () => void
  /** Minimum distance to trigger swipe action (default: 100px) */
  threshold?: number
  /** Maximum swipe distance (default: 150px) */
  maxDistance?: number
  /** Disable left swipe */
  disableLeft?: boolean
  /** Disable right swipe */
  disableRight?: boolean
  /** Disable the hook entirely */
  disabled?: boolean
}

interface UseSwipeGestureReturn extends SwipeState {
  /** Handlers to spread on the swipeable element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
  }
  /** Reset swipe state */
  reset: () => void
}

/**
 * Swipe gesture hook for touch interactions
 * 
 * @example
 * const { handlers, distance, direction, isSwiping } = useSwipeGesture({
 *   onSwipeLeft: () => archiveMessage(),
 *   onSwipeRight: () => deleteMessage(),
 *   threshold: 80,
 * })
 * 
 * return (
 *   <div 
 *     {...handlers}
 *     style={{ transform: `translateX(${distance}px)` }}
 *   >
 *     Message content
 *   </div>
 * )
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
  maxDistance = 150,
  disableLeft = false,
  disableRight = false,
  disabled = false,
}: UseSwipeGestureOptions = {}): UseSwipeGestureReturn {
  const [state, setState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    distance: 0,
    progress: 0,
  })

  const startX = useRef(0)
  const startY = useRef(0)
  const isTracking = useRef(false)
  const hasTriggeredHaptic = useRef(false)

  const reset = useCallback(() => {
    setState({
      isSwiping: false,
      direction: null,
      distance: 0,
      progress: 0,
    })
    isTracking.current = false
    hasTriggeredHaptic.current = false
  }, [])

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (disabled) return
    
    startX.current = clientX
    startY.current = clientY
    isTracking.current = true
    hasTriggeredHaptic.current = false
  }, [disabled])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isTracking.current || disabled) return

    const deltaX = clientX - startX.current
    const deltaY = clientY - startY.current

    // Ignore if more vertical than horizontal (scrolling)
    if (Math.abs(deltaY) > Math.abs(deltaX) && !state.isSwiping) {
      return
    }

    // Determine direction and apply constraints
    let distance = deltaX
    let direction: 'left' | 'right' | null = null

    if (deltaX < 0 && !disableLeft) {
      direction = 'left'
      distance = Math.max(deltaX, -maxDistance)
    } else if (deltaX > 0 && !disableRight) {
      direction = 'right'
      distance = Math.min(deltaX, maxDistance)
    } else {
      distance = 0
    }

    const absDistance = Math.abs(distance)
    const progress = Math.min(absDistance / threshold, 1)

    // Haptic feedback when threshold is reached
    if (absDistance >= threshold && !hasTriggeredHaptic.current) {
      haptic('medium')
      hasTriggeredHaptic.current = true
    } else if (absDistance < threshold && hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = false
    }

    setState({
      isSwiping: absDistance > 10,
      direction,
      distance,
      progress,
    })
  }, [disabled, disableLeft, disableRight, maxDistance, threshold, state.isSwiping])

  const handleEnd = useCallback(() => {
    if (!isTracking.current || disabled) return

    const { distance, direction } = state
    const absDistance = Math.abs(distance)

    if (absDistance >= threshold) {
      // Trigger action
      haptic('success')
      
      if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft()
      } else if (direction === 'right' && onSwipeRight) {
        onSwipeRight()
      }
    }

    // Reset with slight delay for animation
    setTimeout(reset, 200)
  }, [disabled, state, threshold, onSwipeLeft, onSwipeRight, reset])

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY)
  }, [handleStart])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX, e.touches[0].clientY)
  }, [handleMove])

  const onTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Mouse handlers (for desktop testing)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
  }, [handleStart])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isTracking.current) {
      handleMove(e.clientX, e.clientY)
    }
  }, [handleMove])

  const onMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  const onMouseLeave = useCallback(() => {
    if (isTracking.current) {
      reset()
    }
  }, [reset])

  return {
    ...state,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
    reset,
  }
}

export default useSwipeGesture
