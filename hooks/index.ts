/**
 * Custom React Hooks
 * Reusable hooks for common patterns
 */

// PWA & Mobile
export { usePullToRefresh } from './usePullToRefresh'
export { useNetworkStatus, useOnline } from './useNetworkStatus'

// Gestures
export { useSwipeGesture } from './useSwipeGesture'
export { useLongPress } from './useLongPress'
export { useEdgeSwipe, EdgeSwipeIndicator } from './useEdgeSwipe'

// Navigation & Transitions
export { useViewTransition, viewTransitionStyle, supportsViewTransitions } from './useViewTransition'

// Device APIs
export { useWakeLock, useWakeLockWhile } from './useWakeLock'
export { useKeyboardAware, useKeepAboveKeyboard } from './useKeyboardAware'

// Accessibility
export { useReducedMotion, useAnimationDuration, useAnimation, useAnimatedClass } from './useReducedMotion'
