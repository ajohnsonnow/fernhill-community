'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Keyboard-Aware Hook
 * 
 * Handles virtual keyboard visibility on mobile devices.
 * Useful for:
 * - Adjusting layouts when keyboard opens
 * - Keeping input fields visible above keyboard
 * - Showing/hiding elements based on keyboard state
 * 
 * Mobile keyboards are tricky - they resize the viewport
 * on some browsers and overlay on others. This hook
 * provides a consistent API across platforms.
 */

interface KeyboardState {
  /** Whether virtual keyboard is visible */
  isOpen: boolean
  /** Estimated keyboard height (if available) */
  height: number
  /** Original viewport height (before keyboard) */
  originalHeight: number
}

interface UseKeyboardAwareOptions {
  /** Callback when keyboard opens */
  onOpen?: (height: number) => void
  /** Callback when keyboard closes */
  onClose?: () => void
  /** Minimum height difference to consider keyboard open */
  threshold?: number
}

export function useKeyboardAware(options: UseKeyboardAwareOptions = {}) {
  const { onOpen, onClose, threshold = 150 } = options

  const [state, setState] = useState<KeyboardState>({
    isOpen: false,
    height: 0,
    originalHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  // Method 1: Visual Viewport API (best support)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const visualViewport = window.visualViewport
    if (!visualViewport) return

    const initialHeight = visualViewport.height
    let wasOpen = false

    const handleResize = () => {
      const currentHeight = visualViewport.height
      const diff = initialHeight - currentHeight

      // Keyboard is open if viewport shrunk significantly
      const isOpen = diff > threshold

      if (isOpen && !wasOpen) {
        // Keyboard opened
        setState(prev => ({
          ...prev,
          isOpen: true,
          height: diff,
        }))
        onOpen?.(diff)
        wasOpen = true
      } else if (!isOpen && wasOpen) {
        // Keyboard closed
        setState(prev => ({
          ...prev,
          isOpen: false,
          height: 0,
        }))
        onClose?.()
        wasOpen = false
      } else if (isOpen) {
        // Keyboard height changed
        setState(prev => ({
          ...prev,
          height: diff,
        }))
      }
    }

    visualViewport.addEventListener('resize', handleResize)
    visualViewport.addEventListener('scroll', handleResize)

    return () => {
      visualViewport.removeEventListener('resize', handleResize)
      visualViewport.removeEventListener('scroll', handleResize)
    }
  }, [onOpen, onClose, threshold])

  // Method 2: Fallback for browsers without Visual Viewport API
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.visualViewport) return // Skip if using Visual Viewport API

    const initialHeight = window.innerHeight
    let wasOpen = false

    const handleResize = () => {
      const currentHeight = window.innerHeight
      const diff = initialHeight - currentHeight
      const isOpen = diff > threshold

      if (isOpen !== wasOpen) {
        setState(prev => ({
          ...prev,
          isOpen,
          height: isOpen ? diff : 0,
        }))
        
        if (isOpen) {
          onOpen?.(diff)
        } else {
          onClose?.()
        }
        wasOpen = isOpen
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [onOpen, onClose, threshold])

  // Track focus on input elements as hint
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Input focused - keyboard likely opening
        // (Visual Viewport will give us the actual state)
      }
    }

    const handleFocusOut = () => {
      // Input blurred - keyboard likely closing
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  /**
   * Scroll an element into view, accounting for keyboard
   */
  const scrollIntoView = useCallback((element: HTMLElement | null) => {
    if (!element) return

    // Wait a tick for keyboard to fully open
    setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 100)
  }, [])

  /**
   * Get padding to add to bottom of container
   */
  const bottomPadding = state.isOpen ? state.height : 0

  return {
    ...state,
    bottomPadding,
    scrollIntoView,
  }
}

/**
 * Hook to keep a specific element visible above keyboard
 */
export function useKeepAboveKeyboard(elementRef: React.RefObject<HTMLElement | null>) {
  const { isOpen, scrollIntoView } = useKeyboardAware()

  useEffect(() => {
    if (isOpen && elementRef.current) {
      scrollIntoView(elementRef.current)
    }
  }, [isOpen, elementRef, scrollIntoView])

  return { isKeyboardOpen: isOpen }
}

export default useKeyboardAware
