/**
 * Device & Browser Capability Detection
 * 
 * Detects what features are available on the current device.
 * Useful for:
 * - Showing/hiding features based on support
 * - Debugging on different devices
 * - Audit reports
 */

export interface Capabilities {
  // Core PWA
  serviceWorker: boolean
  pushNotifications: boolean
  backgroundSync: boolean
  periodicBackgroundSync: boolean
  
  // Storage
  indexedDB: boolean
  localStorage: boolean
  sessionStorage: boolean
  cacheStorage: boolean
  storageEstimate: boolean
  
  // Media
  mediaSession: boolean
  pictureInPicture: boolean
  webAudio: boolean
  mediaRecorder: boolean
  
  // Device APIs
  vibration: boolean
  wakeLock: boolean
  bluetooth: boolean
  usb: boolean
  nfc: boolean
  geolocation: boolean
  deviceOrientation: boolean
  accelerometer: boolean
  
  // Display & Graphics
  webGL: boolean
  webGL2: boolean
  webGPU: boolean
  hdr: boolean
  wideGamut: boolean
  
  // Input
  touch: boolean
  pointer: boolean
  multiTouch: boolean
  gamepad: boolean
  
  // Network
  online: boolean
  connectionType: string | null
  downlink: number | null
  effectiveType: string | null
  
  // Sharing & Clipboard
  webShare: boolean
  webShareFiles: boolean
  clipboard: boolean
  clipboardRead: boolean
  
  // Notifications & Badges
  notifications: boolean
  notificationPermission: NotificationPermission | 'unsupported'
  badging: boolean
  
  // View & Navigation
  viewTransitions: boolean
  popover: boolean
  dialog: boolean
  
  // Performance
  performanceObserver: boolean
  reportingObserver: boolean
  
  // Security
  secureContext: boolean
  crossOriginIsolated: boolean
  credentialManagement: boolean
  webAuthn: boolean
  
  // Accessibility
  prefersReducedMotion: boolean
  prefersColorScheme: 'light' | 'dark' | 'no-preference'
  prefersContrast: 'more' | 'less' | 'no-preference'
  forcedColors: boolean
  
  // Platform
  standalone: boolean
  platform: string
  userAgent: string
  language: string
  languages: string[]
  cookiesEnabled: boolean
  doNotTrack: boolean
  
  // Viewport
  viewportWidth: number
  viewportHeight: number
  devicePixelRatio: number
  touchPoints: number
}

/**
 * Detect all browser capabilities
 */
export function detectCapabilities(): Capabilities {
  const nav = typeof navigator !== 'undefined' ? navigator : null
  const win = typeof window !== 'undefined' ? window : null
  const doc = typeof document !== 'undefined' ? document : null

  // Helper to safely check features
  const has = (obj: unknown, prop: string): boolean => {
    try {
      return obj != null && prop in (obj as Record<string, unknown>)
    } catch {
      return false
    }
  }

  // Network info
  const connection = nav && ('connection' in nav || 'mozConnection' in nav || 'webkitConnection' in nav)
    ? (nav as Navigator & { connection?: NetworkInformation }).connection
    : null

  return {
    // Core PWA
    serviceWorker: has(nav, 'serviceWorker'),
    pushNotifications: has(win, 'PushManager'),
    backgroundSync: has(win, 'SyncManager'),
    periodicBackgroundSync: has(win, 'PeriodicSyncManager'),
    
    // Storage
    indexedDB: has(win, 'indexedDB'),
    localStorage: has(win, 'localStorage'),
    sessionStorage: has(win, 'sessionStorage'),
    cacheStorage: has(win, 'caches'),
    storageEstimate: has(nav, 'storage') && has(nav?.storage, 'estimate'),
    
    // Media
    mediaSession: has(nav, 'mediaSession'),
    pictureInPicture: has(doc, 'pictureInPictureEnabled'),
    webAudio: has(win, 'AudioContext') || has(win, 'webkitAudioContext'),
    mediaRecorder: has(win, 'MediaRecorder'),
    
    // Device APIs
    vibration: has(nav, 'vibrate'),
    wakeLock: has(nav, 'wakeLock'),
    bluetooth: has(nav, 'bluetooth'),
    usb: has(nav, 'usb'),
    nfc: has(nav, 'ndi'),
    geolocation: has(nav, 'geolocation'),
    deviceOrientation: has(win, 'DeviceOrientationEvent'),
    accelerometer: has(win, 'Accelerometer'),
    
    // Display & Graphics
    webGL: (() => {
      try {
        const canvas = doc?.createElement('canvas')
        return !!(canvas?.getContext('webgl') || canvas?.getContext('experimental-webgl'))
      } catch { return false }
    })(),
    webGL2: (() => {
      try {
        const canvas = doc?.createElement('canvas')
        return !!canvas?.getContext('webgl2')
      } catch { return false }
    })(),
    webGPU: has(nav, 'gpu'),
    hdr: win?.matchMedia?.('(dynamic-range: high)')?.matches ?? false,
    wideGamut: win?.matchMedia?.('(color-gamut: p3)')?.matches ?? false,
    
    // Input
    touch: has(win, 'ontouchstart') || (nav?.maxTouchPoints ?? 0) > 0,
    pointer: has(win, 'PointerEvent'),
    multiTouch: (nav?.maxTouchPoints ?? 0) > 1,
    gamepad: has(nav, 'getGamepads'),
    
    // Network
    online: nav?.onLine ?? true,
    connectionType: connection?.type ?? null,
    downlink: connection?.downlink ?? null,
    effectiveType: connection?.effectiveType ?? null,
    
    // Sharing & Clipboard
    webShare: has(nav, 'share'),
    webShareFiles: has(nav, 'canShare'),
    clipboard: has(nav, 'clipboard'),
    clipboardRead: has(nav?.clipboard, 'read'),
    
    // Notifications & Badges
    notifications: has(win, 'Notification'),
    notificationPermission: has(win, 'Notification') 
      ? Notification.permission 
      : 'unsupported',
    badging: has(nav, 'setAppBadge'),
    
    // View & Navigation
    viewTransitions: has(doc, 'startViewTransition'),
    popover: has(HTMLElement.prototype, 'popover'),
    dialog: has(win, 'HTMLDialogElement'),
    
    // Performance
    performanceObserver: has(win, 'PerformanceObserver'),
    reportingObserver: has(win, 'ReportingObserver'),
    
    // Security
    secureContext: win?.isSecureContext ?? false,
    crossOriginIsolated: win?.crossOriginIsolated ?? false,
    credentialManagement: has(nav, 'credentials'),
    webAuthn: has(win, 'PublicKeyCredential'),
    
    // Accessibility
    prefersReducedMotion: win?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
    prefersColorScheme: win?.matchMedia?.('(prefers-color-scheme: dark)')?.matches 
      ? 'dark' 
      : win?.matchMedia?.('(prefers-color-scheme: light)')?.matches 
        ? 'light' 
        : 'no-preference',
    prefersContrast: win?.matchMedia?.('(prefers-contrast: more)')?.matches
      ? 'more'
      : win?.matchMedia?.('(prefers-contrast: less)')?.matches
        ? 'less'
        : 'no-preference',
    forcedColors: win?.matchMedia?.('(forced-colors: active)')?.matches ?? false,
    
    // Platform
    standalone: win?.matchMedia?.('(display-mode: standalone)')?.matches ?? false,
    platform: nav?.platform ?? 'unknown',
    userAgent: nav?.userAgent ?? 'unknown',
    language: nav?.language ?? 'en',
    languages: nav?.languages ? [...nav.languages] : ['en'],
    cookiesEnabled: nav?.cookieEnabled ?? false,
    doNotTrack: nav?.doNotTrack === '1',
    
    // Viewport
    viewportWidth: win?.innerWidth ?? 0,
    viewportHeight: win?.innerHeight ?? 0,
    devicePixelRatio: win?.devicePixelRatio ?? 1,
    touchPoints: nav?.maxTouchPoints ?? 0,
  }
}

interface NetworkInformation {
  type?: string
  downlink?: number
  effectiveType?: string
}

/**
 * Get a summary score for PWA readiness
 */
export function getPWAScore(caps: Capabilities): {
  score: number
  maxScore: number
  percentage: number
  missing: string[]
} {
  const required = [
    { key: 'serviceWorker', name: 'Service Worker' },
    { key: 'secureContext', name: 'HTTPS' },
    { key: 'indexedDB', name: 'IndexedDB' },
    { key: 'cacheStorage', name: 'Cache Storage' },
  ]

  const recommended = [
    { key: 'pushNotifications', name: 'Push Notifications' },
    { key: 'backgroundSync', name: 'Background Sync' },
    { key: 'webShare', name: 'Web Share' },
    { key: 'notifications', name: 'Notifications' },
    { key: 'badging', name: 'App Badging' },
    { key: 'wakeLock', name: 'Wake Lock' },
    { key: 'viewTransitions', name: 'View Transitions' },
  ]

  let score = 0
  const missing: string[] = []

  // Required features (2 points each)
  for (const { key, name } of required) {
    if (caps[key as keyof Capabilities]) {
      score += 2
    } else {
      missing.push(`${name} (required)`)
    }
  }

  // Recommended features (1 point each)
  for (const { key, name } of recommended) {
    if (caps[key as keyof Capabilities]) {
      score += 1
    } else {
      missing.push(`${name} (recommended)`)
    }
  }

  const maxScore = required.length * 2 + recommended.length
  
  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    missing,
  }
}

/**
 * Get mobile-specific capability assessment
 */
export function getMobileScore(caps: Capabilities): {
  score: number
  maxScore: number
  percentage: number
  features: { name: string; supported: boolean }[]
} {
  const mobileFeatures = [
    { key: 'touch', name: 'Touch Events' },
    { key: 'vibration', name: 'Haptic Feedback' },
    { key: 'standalone', name: 'Installed as PWA' },
    { key: 'webShare', name: 'Native Share Sheet' },
    { key: 'wakeLock', name: 'Screen Wake Lock' },
    { key: 'backgroundSync', name: 'Background Sync' },
    { key: 'notifications', name: 'Push Notifications' },
    { key: 'badging', name: 'App Badge' },
    { key: 'viewTransitions', name: 'View Transitions' },
    { key: 'geolocation', name: 'Geolocation' },
  ]

  const features = mobileFeatures.map(({ key, name }) => ({
    name,
    supported: !!caps[key as keyof Capabilities],
  }))

  const score = features.filter(f => f.supported).length

  return {
    score,
    maxScore: features.length,
    percentage: Math.round((score / features.length) * 100),
    features,
  }
}

/**
 * Format capabilities as a readable report
 */
export function formatCapabilityReport(caps: Capabilities): string {
  const pwa = getPWAScore(caps)
  const mobile = getMobileScore(caps)

  const lines = [
    '╔══════════════════════════════════════════════╗',
    '║     FERNHILL CAPABILITY AUDIT REPORT         ║',
    '╠══════════════════════════════════════════════╣',
    `║ PWA Score:    ${pwa.percentage}% (${pwa.score}/${pwa.maxScore})`.padEnd(47) + '║',
    `║ Mobile Score: ${mobile.percentage}% (${mobile.score}/${mobile.maxScore})`.padEnd(47) + '║',
    '╠══════════════════════════════════════════════╣',
    '║ PLATFORM                                     ║',
    `║ • Device: ${caps.platform}`.padEnd(47) + '║',
    `║ • Viewport: ${caps.viewportWidth}x${caps.viewportHeight}`.padEnd(47) + '║',
    `║ • Touch: ${caps.touch ? 'Yes' : 'No'} (${caps.touchPoints} points)`.padEnd(47) + '║',
    `║ • Standalone: ${caps.standalone ? 'Yes (PWA)' : 'No (Browser)'}`.padEnd(47) + '║',
    '╠══════════════════════════════════════════════╣',
    '║ MOBILE FEATURES                              ║',
  ]

  for (const feature of mobile.features) {
    const icon = feature.supported ? '✓' : '✗'
    lines.push(`║ ${icon} ${feature.name}`.padEnd(47) + '║')
  }

  lines.push('╠══════════════════════════════════════════════╣')
  lines.push('║ ACCESSIBILITY                                ║')
  lines.push(`║ • Reduced Motion: ${caps.prefersReducedMotion ? 'Preferred' : 'No preference'}`.padEnd(47) + '║')
  lines.push(`║ • Color Scheme: ${caps.prefersColorScheme}`.padEnd(47) + '║')
  lines.push(`║ • High Contrast: ${caps.prefersContrast}`.padEnd(47) + '║')
  lines.push('╠══════════════════════════════════════════════╣')
  lines.push('║ NETWORK                                      ║')
  lines.push(`║ • Online: ${caps.online ? 'Yes' : 'No'}`.padEnd(47) + '║')
  lines.push(`║ • Connection: ${caps.effectiveType || 'Unknown'}`.padEnd(47) + '║')
  lines.push('╚══════════════════════════════════════════════╝')

  return lines.join('\n')
}

export default detectCapabilities
