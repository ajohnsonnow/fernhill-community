'use client'

import { useEffect, useState } from 'react'

/**
 * Reduced Motion Hook
 * 
 * Respects the user's system preference for reduced motion.
 * Some users experience motion sickness or have vestibular
 * disorders - this lets you disable or reduce animations
 * for them automatically.
 * 
 * @example
 * const prefersReducedMotion = useReducedMotion()
 * 
 * return (
 *   <div className={prefersReducedMotion ? '' : 'animate-bounce'}>
 *     ...
 *   </div>
 * )
 */

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Hook to track reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // Initial check
    setReducedMotion(prefersReducedMotion())

    // Listen for changes (user can change setting while app is open)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // Safari < 14
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  return reducedMotion
}

/**
 * Get animation duration based on reduced motion preference
 * 
 * @param normalDuration - Duration when motion is OK (ms)
 * @param reducedDuration - Duration when motion should be reduced (ms)
 * 
 * @example
 * const duration = useAnimationDuration(300, 0)
 * // Returns 300 if motion is OK, 0 if reduced motion preferred
 */
export function useAnimationDuration(
  normalDuration: number,
  reducedDuration: number = 0
): number {
  const prefersReduced = useReducedMotion()
  return prefersReduced ? reducedDuration : normalDuration
}

/**
 * Returns animation props conditionally based on motion preference
 * 
 * @example
 * const fadeIn = useAnimation({
 *   initial: { opacity: 0, y: 20 },
 *   animate: { opacity: 1, y: 0 },
 *   transition: { duration: 0.3 }
 * })
 * 
 * // When reduced motion: returns empty object
 * // When motion OK: returns the animation config
 */
export function useAnimation<T extends object>(
  animationConfig: T
): T | Record<string, never> {
  const prefersReduced = useReducedMotion()
  return prefersReduced ? {} : animationConfig
}

/**
 * Wrapper to conditionally apply animation class names
 * 
 * @example
 * const animClass = useAnimatedClass('animate-slide-in', 'opacity-100')
 * // Returns 'animate-slide-in' if motion OK
 * // Returns 'opacity-100' if reduced motion preferred
 */
export function useAnimatedClass(
  animatedClass: string,
  reducedClass: string = ''
): string {
  const prefersReduced = useReducedMotion()
  return prefersReduced ? reducedClass : animatedClass
}

export default useReducedMotion
