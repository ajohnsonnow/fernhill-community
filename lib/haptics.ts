/**
 * Haptic Feedback Utility
 * Provides tactile feedback on mobile devices for better UX
 * 
 * Uses the Vibration API which is supported on:
 * - Android Chrome ✅
 * - iOS Safari (limited) ⚠️
 * - Most modern mobile browsers ✅
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection'

// Vibration patterns in milliseconds [vibrate, pause, vibrate, pause, ...]
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  // Simple taps
  light: 10,
  medium: 20,
  heavy: 30,
  
  // Feedback patterns
  success: [10, 30, 10, 30, 20], // Short-short-medium
  error: [50, 30, 50, 30, 50],   // Three strong pulses
  warning: [30, 50, 30],         // Two medium pulses
  selection: 5,                   // Very light tap
}

/**
 * Trigger haptic feedback on the device
 * Fails silently if vibration is not supported
 * 
 * @param type - The type of haptic feedback
 * @returns true if vibration was triggered, false otherwise
 * 
 * @example
 * // On button tap
 * <button onClick={() => haptic('light')}>Tap me</button>
 * 
 * // On successful action
 * haptic('success')
 * 
 * // On error
 * haptic('error')
 */
export function haptic(type: HapticPattern = 'light'): boolean {
  // Check if vibration API is available
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return false
  }

  try {
    const pattern = HAPTIC_PATTERNS[type]
    navigator.vibrate(pattern)
    return true
  } catch {
    // Vibration failed (permissions, hardware, etc.)
    return false
  }
}

/**
 * Cancel any ongoing vibration
 */
export function cancelHaptic(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(0)
  }
}

/**
 * Check if haptic feedback is available on this device
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

/**
 * Custom haptic pattern
 * 
 * @param pattern - Array of [vibrate, pause, vibrate, pause, ...] in ms
 * 
 * @example
 * customHaptic([100, 50, 100, 50, 200]) // SOS pattern
 */
export function customHaptic(pattern: number[]): boolean {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return false
  }

  try {
    navigator.vibrate(pattern)
    return true
  } catch {
    return false
  }
}

/**
 * React hook-friendly wrapper that returns memoizable handlers
 * 
 * @example
 * const haptics = useHaptics()
 * <button onClick={() => haptics.light()}>Tap</button>
 */
export const haptics = {
  light: () => haptic('light'),
  medium: () => haptic('medium'),
  heavy: () => haptic('heavy'),
  success: () => haptic('success'),
  error: () => haptic('error'),
  warning: () => haptic('warning'),
  selection: () => haptic('selection'),
  cancel: cancelHaptic,
  isSupported: isHapticSupported,
  custom: customHaptic,
}

export default haptics
