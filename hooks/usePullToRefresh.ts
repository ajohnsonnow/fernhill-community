'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haptic } from '@/lib/haptics'

interface UsePullToRefreshOptions {
  /** Callback to execute on refresh */
  onRefresh: () => Promise<void>
  /** Minimum pull distance to trigger refresh (default: 80px) */
  pullThreshold?: number
  /** Maximum pull distance (default: 150px) */
  maxPull?: number
  /** Resistance factor for overscroll (default: 0.5) */
  resistance?: number
  /** Whether to disable the hook */
  disabled?: boolean
}

interface UsePullToRefreshReturn {
  /** Whether currently refreshing */
  isRefreshing: boolean
  /** Current pull distance (0 to maxPull) */
  pullDistance: number
  /** Pull progress from 0 to 1 */
  pullProgress: number
  /** Whether pull threshold has been reached */
  canRelease: boolean
  /** Props to spread on the container element */
  containerProps: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
}

/**
 * Pull-to-refresh hook for mobile devices
 * 
 * @example
 * const { isRefreshing, pullProgress, containerProps } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await fetchLatestPosts()
 *   }
 * })
 * 
 * return (
 *   <div {...containerProps}>
 *     {pullProgress > 0 && (
 *       <RefreshIndicator progress={pullProgress} />
 *     )}
 *     <PostsList />
 *   </div>
 * )
 */
export function usePullToRefresh({
  onRefresh,
  pullThreshold = 80,
  maxPull = 150,
  resistance = 0.5,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  
  const startY = useRef(0)
  const currentY = useRef(0)
  const isPulling = useRef(false)
  const hasTriggeredHaptic = useRef(false)

  // Reset state on refresh complete
  useEffect(() => {
    if (!isRefreshing) {
      setPullDistance(0)
      hasTriggeredHaptic.current = false
    }
  }, [isRefreshing])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return
    
    // Only start pull if at top of page
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    if (scrollTop > 0) return
    
    startY.current = e.touches[0].clientY
    isPulling.current = true
    hasTriggeredHaptic.current = false
  }, [disabled, isRefreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return
    
    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current
    
    // Only allow downward pull
    if (diff < 0) {
      setPullDistance(0)
      return
    }
    
    // Apply resistance to make it feel natural
    const resistedDiff = Math.min(diff * resistance, maxPull)
    setPullDistance(resistedDiff)
    
    // Haptic feedback when threshold is crossed
    if (resistedDiff >= pullThreshold && !hasTriggeredHaptic.current) {
      haptic('medium')
      hasTriggeredHaptic.current = true
    } else if (resistedDiff < pullThreshold && hasTriggeredHaptic.current) {
      // Reset if pulled back below threshold
      hasTriggeredHaptic.current = false
    }
  }, [disabled, isRefreshing, maxPull, pullThreshold, resistance])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || disabled) return
    
    isPulling.current = false
    
    // Check if we should trigger refresh
    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true)
      haptic('success')
      
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
        haptic('error')
      } finally {
        setIsRefreshing(false)
      }
    } else {
      // Snap back
      setPullDistance(0)
    }
  }, [disabled, isRefreshing, onRefresh, pullDistance, pullThreshold])

  const pullProgress = Math.min(pullDistance / pullThreshold, 1)
  const canRelease = pullDistance >= pullThreshold

  return {
    isRefreshing,
    pullDistance,
    pullProgress,
    canRelease,
    containerProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

export default usePullToRefresh
