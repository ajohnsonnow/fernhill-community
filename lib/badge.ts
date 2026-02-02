/**
 * App Badge API Utility
 * 
 * Shows notification counts on the app icon - like the red
 * badge on iOS showing "3 unread messages".
 * 
 * Works on:
 * - Android PWAs (installed to home screen)
 * - Windows PWAs
 * - macOS PWAs (Safari 17+)
 * - Chrome on desktop
 */

/**
 * Check if App Badge API is supported
 */
export function supportsBadge(): boolean {
  if (typeof navigator === 'undefined') return false
  return 'setAppBadge' in navigator
}

/**
 * Set the app badge count
 * 
 * @param count - Number to display (0 or undefined clears badge)
 * 
 * @example
 * // Show 5 unread messages
 * await setBadge(5)
 * 
 * // Clear the badge
 * await setBadge(0)
 */
export async function setBadge(count?: number): Promise<boolean> {
  if (!supportsBadge()) return false

  try {
    if (count === undefined || count === 0) {
      await navigator.clearAppBadge()
    } else {
      await navigator.setAppBadge(count)
    }
    return true
  } catch (error) {
    console.warn('Failed to set app badge:', error)
    return false
  }
}

/**
 * Clear the app badge
 */
export async function clearBadge(): Promise<boolean> {
  if (!supportsBadge()) return false

  try {
    await navigator.clearAppBadge()
    return true
  } catch (error) {
    console.warn('Failed to clear app badge:', error)
    return false
  }
}

/**
 * Badge manager with internal state tracking
 * 
 * Useful for incrementing/decrementing badge counts
 * without needing to track the count yourself.
 */
class BadgeManager {
  private count: number = 0

  /** Get current badge count */
  getCount(): number {
    return this.count
  }

  /** Set badge to specific count */
  async set(count: number): Promise<boolean> {
    this.count = Math.max(0, count)
    return setBadge(this.count)
  }

  /** Increment badge by amount (default 1) */
  async increment(amount: number = 1): Promise<boolean> {
    this.count = Math.max(0, this.count + amount)
    return setBadge(this.count)
  }

  /** Decrement badge by amount (default 1) */
  async decrement(amount: number = 1): Promise<boolean> {
    this.count = Math.max(0, this.count - amount)
    return setBadge(this.count)
  }

  /** Clear the badge */
  async clear(): Promise<boolean> {
    this.count = 0
    return clearBadge()
  }
}

// Singleton badge manager instance
export const badgeManager = new BadgeManager()

/**
 * Update badge from notification counts
 * 
 * @example
 * // Called when fetching notifications
 * updateBadgeFromNotifications({
 *   unreadMessages: 3,
 *   pendingRequests: 2,
 *   newAnnouncements: 1
 * })
 */
export async function updateBadgeFromNotifications(counts: {
  unreadMessages?: number
  pendingRequests?: number
  newAnnouncements?: number
  pendingSync?: number
}): Promise<boolean> {
  const total = Object.values(counts).reduce((sum, count) => sum + (count || 0), 0)
  return setBadge(total)
}

export default setBadge
