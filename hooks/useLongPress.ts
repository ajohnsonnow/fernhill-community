'use client'

import { useCallback, useRef, useState } from 'react'
import { haptic } from '@/lib/haptics'

interface UseLongPressOptions {
  /** Callback when long press is triggered */
  onLongPress: () => void
  /** Optional callback for regular tap/click */
  onClick?: () => void
  /** Duration to hold before triggering (default: 500ms) */
  duration?: number
  /** Disable the hook */
  disabled?: boolean
  /** Movement tolerance before canceling (default: 10px) */
  moveTolerance?: number
}

interface UseLongPressReturn {
  /** Whether currently pressing */
  isPressed: boolean
  /** Progress from 0 to 1 during press */
  progress: number
  /** Handlers to spread on the element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
    onTouchCancel: () => void
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
    onContextMenu: (e: React.MouseEvent) => void
  }
}

/**
 * Long press gesture hook
 * 
 * Detects when user holds down on an element for a specified duration.
 * Useful for context menus, drag-to-reorder, etc.
 * 
 * @example
 * const { isPressed, progress, handlers } = useLongPress({
 *   onLongPress: () => setShowContextMenu(true),
 *   onClick: () => handleRegularTap(),
 *   duration: 500,
 * })
 * 
 * return (
 *   <div {...handlers} className={isPressed ? 'pressing' : ''}>
 *     {progress > 0 && <ProgressRing progress={progress} />}
 *     Content
 *   </div>
 * )
 */
export function useLongPress({
  onLongPress,
  onClick,
  duration = 500,
  disabled = false,
  moveTolerance = 10,
}: UseLongPressOptions): UseLongPressReturn {
  const [isPressed, setIsPressed] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const isLongPressRef = useRef(false)
  const isPressedRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    setIsPressed(false)
    setProgress(0)
    isLongPressRef.current = false
    isPressedRef.current = false
  }, [clearTimers])

  const animateProgress = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current
    const newProgress = Math.min(elapsed / duration, 1)
    
    setProgress(newProgress)
    
    if (newProgress < 1 && isPressedRef.current) {
      animationRef.current = requestAnimationFrame(animateProgress)
    }
  }, [duration])

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (disabled) return

    clearTimers()
    startTimeRef.current = Date.now()
    startPosRef.current = { x: clientX, y: clientY }
    isLongPressRef.current = false
    isPressedRef.current = true
    setIsPressed(true)
    setProgress(0)

    // Start progress animation
    animationRef.current = requestAnimationFrame(animateProgress)

    // Set timer for long press
    timerRef.current = setTimeout(() => {
      if (isPressedRef.current) {
        isLongPressRef.current = true
        haptic('heavy')
        onLongPress()
        reset()
      }
    }, duration)
  }, [disabled, duration, onLongPress, clearTimers, animateProgress, reset])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isPressedRef.current) return

    const deltaX = Math.abs(clientX - startPosRef.current.x)
    const deltaY = Math.abs(clientY - startPosRef.current.y)

    // Cancel if moved too much
    if (deltaX > moveTolerance || deltaY > moveTolerance) {
      reset()
    }
  }, [moveTolerance, reset])

  const handleEnd = useCallback(() => {
    if (!isPressedRef.current) return

    const wasLongPress = isLongPressRef.current
    reset()

    // If it was a short press, trigger onClick
    if (!wasLongPress && onClick) {
      haptic('light')
      onClick()
    }
  }, [onClick, reset])

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

  const onTouchCancel = useCallback(() => {
    reset()
  }, [reset])

  // Mouse handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
  }, [handleStart])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }, [handleMove])

  const onMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  const onMouseLeave = useCallback(() => {
    if (isPressedRef.current) {
      reset()
    }
  }, [reset])

  // Prevent default context menu
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  return {
    isPressed,
    progress,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onContextMenu,
    },
  }
}

export default useLongPress
