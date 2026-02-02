'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Wake Lock API Hook
 * 
 * Keeps the screen awake - perfect for:
 * - Watching event schedules
 * - Listening to music in Journey
 * - Reading long posts
 * - During live events
 * 
 * Think of it like "prevent sleep" on your phone.
 * Battery impact is minimal since the screen is on anyway.
 */

interface WakeLockState {
  /** Whether wake lock is currently active */
  isLocked: boolean
  /** Whether Wake Lock API is supported */
  isSupported: boolean
  /** Any error that occurred */
  error: string | null
}

interface UseWakeLockOptions {
  /** Automatically request wake lock on mount */
  autoLock?: boolean
  /** Callback when lock is acquired */
  onLock?: () => void
  /** Callback when lock is released */
  onRelease?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Check if Wake Lock API is supported
 */
export function supportsWakeLock(): boolean {
  if (typeof navigator === 'undefined') return false
  return 'wakeLock' in navigator
}

export function useWakeLock(options: UseWakeLockOptions = {}) {
  const { autoLock = false, onLock, onRelease, onError } = options
  
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const [state, setState] = useState<WakeLockState>({
    isLocked: false,
    isSupported: false,
    error: null,
  })

  // Check support on mount
  useEffect(() => {
    setState(prev => ({ ...prev, isSupported: supportsWakeLock() }))
  }, [])

  /**
   * Request wake lock (keep screen on)
   */
  const requestLock = useCallback(async () => {
    if (!supportsWakeLock()) {
      setState(prev => ({ ...prev, error: 'Wake Lock not supported' }))
      return false
    }

    try {
      // Release existing lock first
      if (wakeLockRef.current) {
        await wakeLockRef.current.release()
      }

      // Request new lock
      wakeLockRef.current = await navigator.wakeLock.request('screen')
      
      setState(prev => ({ ...prev, isLocked: true, error: null }))
      onLock?.()

      // Handle release (e.g., when tab becomes hidden)
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null
        setState(prev => ({ ...prev, isLocked: false }))
        onRelease?.()
      })

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to acquire wake lock'
      setState(prev => ({ ...prev, isLocked: false, error: errorMessage }))
      onError?.(error instanceof Error ? error : new Error(errorMessage))
      return false
    }
  }, [onLock, onRelease, onError])

  /**
   * Release wake lock (allow screen to sleep)
   */
  const releaseLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        setState(prev => ({ ...prev, isLocked: false, error: null }))
        return true
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to release wake lock'
        setState(prev => ({ ...prev, error: errorMessage }))
        return false
      }
    }
    return true
  }, [])

  /**
   * Toggle wake lock
   */
  const toggleLock = useCallback(async () => {
    if (state.isLocked) {
      return releaseLock()
    } else {
      return requestLock()
    }
  }, [state.isLocked, requestLock, releaseLock])

  // Auto-lock on mount if enabled
  useEffect(() => {
    if (autoLock && supportsWakeLock()) {
      requestLock()
    }
  }, [autoLock, requestLock])

  // Re-acquire lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && state.isLocked && !wakeLockRef.current) {
        // Re-acquire the lock
        await requestLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [state.isLocked, requestLock])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
      }
    }
  }, [])

  return {
    ...state,
    requestLock,
    releaseLock,
    toggleLock,
  }
}

/**
 * Keep screen awake while a condition is true
 * 
 * @example
 * // Keep screen on while music is playing
 * useWakeLockWhile(isPlaying)
 */
export function useWakeLockWhile(condition: boolean) {
  const { requestLock, releaseLock, isLocked, isSupported } = useWakeLock()

  useEffect(() => {
    if (condition && !isLocked) {
      requestLock()
    } else if (!condition && isLocked) {
      releaseLock()
    }
  }, [condition, isLocked, requestLock, releaseLock])

  return { isLocked, isSupported }
}

export default useWakeLock
