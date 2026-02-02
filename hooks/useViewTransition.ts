'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * View Transitions API hook for smooth page animations
 * 
 * The View Transitions API creates beautiful morphing animations
 * between pages - like native iOS/Android apps. Falls back gracefully
 * on unsupported browsers.
 * 
 * @example
 * const { navigate, isTransitioning } = useViewTransition()
 * 
 * <button onClick={() => navigate('/messages')}>
 *   Messages
 * </button>
 */

interface ViewTransitionOptions {
  /** Called before transition starts */
  onBefore?: () => void | Promise<void>
  /** Called after transition completes */
  onAfter?: () => void
  /** Fallback for browsers without View Transitions */
  fallbackDuration?: number
}

// Check if View Transitions API is available
export function supportsViewTransitions(): boolean {
  if (typeof document === 'undefined') return false
  return 'startViewTransition' in document
}

export function useViewTransition() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)

  /**
   * Navigate with a view transition animation
   */
  const navigate = useCallback(async (
    href: string, 
    options: ViewTransitionOptions = {}
  ) => {
    const { onBefore, onAfter, fallbackDuration = 300 } = options

    // Run pre-transition callback
    if (onBefore) {
      await onBefore()
    }

    setIsTransitioning(true)

    // If View Transitions supported, use it!
    if (supportsViewTransitions()) {
      try {
        const transition = (document as any).startViewTransition(() => {
          router.push(href)
        })

        await transition.finished
      } catch (error) {
        // Fallback if transition fails
        router.push(href)
      }
    } else {
      // Fallback: simple navigation with brief delay for any CSS transitions
      router.push(href)
      await new Promise(resolve => setTimeout(resolve, fallbackDuration))
    }

    setIsTransitioning(false)
    onAfter?.()
  }, [router])

  /**
   * Navigate back with transition
   */
  const goBack = useCallback(async (options: ViewTransitionOptions = {}) => {
    const { onBefore, onAfter } = options

    if (onBefore) await onBefore()
    setIsTransitioning(true)

    if (supportsViewTransitions()) {
      try {
        const transition = (document as any).startViewTransition(() => {
          router.back()
        })
        await transition.finished
      } catch {
        router.back()
      }
    } else {
      router.back()
    }

    setIsTransitioning(false)
    onAfter?.()
  }, [router])

  /**
   * Transition with custom DOM update (not navigation)
   */
  const transition = useCallback(async (
    updateDOM: () => void | Promise<void>,
    options: ViewTransitionOptions = {}
  ) => {
    const { onBefore, onAfter } = options

    if (onBefore) await onBefore()
    setIsTransitioning(true)

    if (supportsViewTransitions()) {
      try {
        const t = (document as any).startViewTransition(updateDOM)
        await t.finished
      } catch {
        await updateDOM()
      }
    } else {
      await updateDOM()
    }

    setIsTransitioning(false)
    onAfter?.()
  }, [])

  return {
    navigate,
    goBack,
    transition,
    isTransitioning,
    isSupported: supportsViewTransitions(),
  }
}

/**
 * Add view-transition-name to an element for morphing animations
 * 
 * Elements with the same view-transition-name on different pages
 * will smoothly morph into each other during navigation.
 * 
 * @example
 * <img style={viewTransitionStyle('avatar-123')} src={avatar} />
 */
export function viewTransitionStyle(name: string): React.CSSProperties {
  return {
    viewTransitionName: name,
  } as React.CSSProperties
}

/**
 * Hook to apply view transition name to a ref
 */
export function useViewTransitionName(name: string) {
  useEffect(() => {
    // This just returns the style object for use
  }, [name])

  return {
    style: viewTransitionStyle(name),
    name,
  }
}

export default useViewTransition
