/**
 * Fernhill Community - QR Code Event Check-in System
 * 
 * Generate QR codes for events, scan to check in,
 * track live attendance.
 */

/**
 * Generate a check-in URL for an event
 */
export function generateCheckInUrl(eventId: string, secret: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://fernhill-community.onrender.com'
  
  return `${baseUrl}/events/checkin?e=${eventId}&s=${secret}`
}

/**
 * Generate a random secret for event check-in
 * This prevents people from checking in without being physically present
 */
export function generateCheckInSecret(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let secret = ''
  for (let i = 0; i < 8; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

/**
 * Validate a check-in attempt
 */
export function validateCheckIn(
  providedSecret: string,
  expectedSecret: string,
  eventStartTime: Date,
  eventEndTime: Date
): { valid: boolean; error?: string } {
  const now = new Date()
  
  // Check if secrets match
  if (providedSecret !== expectedSecret) {
    return { valid: false, error: 'Invalid check-in code' }
  }
  
  // Check if event is currently happening (with 30 min buffer on each side)
  const bufferMs = 30 * 60 * 1000
  const windowStart = new Date(eventStartTime.getTime() - bufferMs)
  const windowEnd = new Date(eventEndTime.getTime() + bufferMs)
  
  if (now < windowStart) {
    return { valid: false, error: 'Check-in opens 30 minutes before the event' }
  }
  
  if (now > windowEnd) {
    return { valid: false, error: 'Check-in has closed for this event' }
  }
  
  return { valid: true }
}

/**
 * Generate SVG QR code data for an event
 * Uses a simple QR encoding approach
 */
export function generateQRCodeDataUrl(data: string): Promise<string> {
  // In production, we'd use a proper QR library like qrcode
  // For now, return a placeholder that links to a QR API
  const encoded = encodeURIComponent(data)
  return Promise.resolve(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`)
}

export interface CheckInStats {
  totalCheckedIn: number
  recentCheckins: {
    tribeName: string
    avatarUrl: string | null
    checkedInAt: string
  }[]
  firstTimeAttendees: number
  returningAttendees: number
}

/**
 * Calculate check-in statistics
 */
export function calculateCheckInStats(
  checkins: { userId: string; tribeName: string; avatarUrl: string | null; checkedInAt: string; isFirstTime: boolean }[]
): CheckInStats {
  return {
    totalCheckedIn: checkins.length,
    recentCheckins: checkins
      .sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime())
      .slice(0, 10)
      .map(c => ({
        tribeName: c.tribeName,
        avatarUrl: c.avatarUrl,
        checkedInAt: c.checkedInAt,
      })),
    firstTimeAttendees: checkins.filter(c => c.isFirstTime).length,
    returningAttendees: checkins.filter(c => !c.isFirstTime).length,
  }
}
