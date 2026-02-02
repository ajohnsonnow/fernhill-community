'use client'

/**
 * Feature Audit Page
 * 
 * Interactive demo and audit of all mobile features.
 * Use this page to test capabilities on any device.
 */

import { useEffect, useState } from 'react'
import { 
  detectCapabilities, 
  formatCapabilityReport, 
  getPWAScore, 
  getMobileScore,
  type Capabilities 
} from '@/lib/capabilities'
import { haptic, haptics } from '@/lib/haptics'
import { share, canShare } from '@/lib/share'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useLongPress } from '@/hooks/useLongPress'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { 
  Check, 
  X, 
  Smartphone, 
  Wifi, 
  WifiOff,
  Vibrate,
  Share2,
  Bell,
  Moon,
  Battery,
  RefreshCw,
  Hand,
  Copy,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { 
  Skeleton, 
  SkeletonPost, 
  SkeletonAvatar, 
  SkeletonText 
} from '@/components/ui/Skeleton'
import { SwipeableRow, deleteAction, archiveAction } from '@/components/ui/SwipeableRow'
import { ShareButton } from '@/components/social/ShareButton'

export default function AuditPage() {
  const [caps, setCaps] = useState<Capabilities | null>(null)
  const [activeDemo, setActiveDemo] = useState<string | null>(null)
  const [logMessages, setLogMessages] = useState<string[]>([])
  
  const { isOnline, effectiveType } = useNetworkStatus()
  const { isLocked, isSupported: wakeLockSupported, requestLock, releaseLock } = useWakeLock()
  const reducedMotion = useReducedMotion()
  
  // Swipe demo state
  const swipeGesture = useSwipeGesture({
    onSwipeLeft: () => log('👈 Swiped LEFT!'),
    onSwipeRight: () => log('👉 Swiped RIGHT!'),
  })
  
  // Long press demo
  const longPress = useLongPress({
    onLongPress: () => {
      log('👆 Long press detected!')
      haptic('success')
    },
    duration: 500,
  })

  const log = (msg: string) => {
    setLogMessages(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  useEffect(() => {
    setCaps(detectCapabilities())
    log('🔍 Capability scan complete')
  }, [])

  if (!caps) {
    return (
      <div className="min-h-screen bg-fernhill-dark p-4">
        <Skeleton height={200} className="mb-4" />
        <SkeletonText lines={5} />
      </div>
    )
  }

  const pwa = getPWAScore(caps)
  const mobile = getMobileScore(caps)

  // Feature test functions
  const testHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    const result = haptic(type)
    log(result ? `📳 Haptic: ${type}` : '❌ Haptic not supported')
  }

  const testShare = async () => {
    const result = await share({
      title: 'Fernhill Audit',
      text: 'Testing share from audit page',
      url: window.location.href
    })
    log(result.success ? `📤 Shared via ${result.method}` : `❌ Share failed: ${result.error}`)
  }

  const testWakeLock = async () => {
    if (isLocked) {
      await releaseLock()
      log('😴 Wake lock released')
    } else {
      const success = await requestLock()
      log(success ? '☀️ Wake lock acquired!' : '❌ Wake lock failed')
    }
  }

  const testNotification = async () => {
    if (!('Notification' in window)) {
      log('❌ Notifications not supported')
      return
    }
    
    if (Notification.permission === 'granted') {
      new Notification('Fernhill Test', { body: 'Notification working!' })
      log('🔔 Notification sent!')
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      log(`🔔 Permission: ${permission}`)
    } else {
      log('❌ Notifications denied')
    }
  }

  const copyReport = async () => {
    const report = formatCapabilityReport(caps)
    try {
      await navigator.clipboard.writeText(report)
      log('📋 Report copied to clipboard!')
      haptic('success')
    } catch {
      log('❌ Copy failed')
    }
  }

  return (
    <div className="min-h-screen bg-fernhill-dark text-fernhill-cream pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-fernhill-charcoal/95 backdrop-blur-sm border-b border-white/10 p-4">
        <h1 className="text-xl font-bold">🔍 Feature Audit</h1>
        <p className="text-sm text-fernhill-sand">v1.12.0 • Tap features to test</p>
      </header>

      <main className="p-4 space-y-6">
        {/* Scores */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-stone-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-fernhill-gold">{pwa.percentage}%</div>
            <div className="text-sm text-fernhill-sand">PWA Score</div>
            <div className="text-xs text-stone-500">{pwa.score}/{pwa.maxScore}</div>
          </div>
          <div className="bg-stone-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{mobile.percentage}%</div>
            <div className="text-sm text-fernhill-sand">Mobile Score</div>
            <div className="text-xs text-stone-500">{mobile.score}/{mobile.maxScore}</div>
          </div>
        </section>

        {/* Platform Info */}
        <section className="bg-stone-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Smartphone className="w-5 h-5" /> Platform
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Viewport: {caps.viewportWidth}×{caps.viewportHeight}</div>
            <div>DPR: {caps.devicePixelRatio}x</div>
            <div>Touch: {caps.touch ? `Yes (${caps.touchPoints}pt)` : 'No'}</div>
            <div>PWA: {caps.standalone ? '✓ Installed' : 'Browser'}</div>
          </div>
        </section>

        {/* Network Status */}
        <section className="bg-stone-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            {isOnline ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-red-400" />}
            Network
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {effectiveType && <span>Type: {effectiveType}</span>}
          </div>
        </section>

        {/* Feature Tests */}
        <section className="bg-stone-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3">🧪 Interactive Tests</h2>
          
          <div className="space-y-3">
            {/* Haptic Test */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Vibrate className="w-4 h-4" />
                Haptic Feedback
                {caps.vibration ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
              </span>
              <div className="flex gap-1">
                {['light', 'medium', 'heavy', 'success', 'error'].map((type) => (
                  <button
                    key={type}
                    onClick={() => testHaptic(type as 'light' | 'medium' | 'heavy' | 'success' | 'error')}
                    className="px-2 py-1 text-xs bg-stone-700 rounded hover:bg-stone-600"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Share Test */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Web Share
                {caps.webShare ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
              </span>
              <ShareButton variant="compact" />
            </div>

            {/* Wake Lock Test */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Battery className="w-4 h-4" />
                Wake Lock
                {wakeLockSupported ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
              </span>
              <button
                onClick={testWakeLock}
                className={`px-3 py-1 text-xs rounded ${isLocked ? 'bg-green-600' : 'bg-stone-700'}`}
              >
                {isLocked ? 'Release' : 'Lock Screen'}
              </button>
            </div>

            {/* Notification Test */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications ({caps.notificationPermission})
                {caps.notifications ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
              </span>
              <button
                onClick={testNotification}
                className="px-3 py-1 text-xs bg-stone-700 rounded hover:bg-stone-600"
              >
                Test
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Reduced Motion
              </span>
              <span className={reducedMotion ? 'text-yellow-400' : 'text-stone-500'}>
                {reducedMotion ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </section>

        {/* Gesture Tests */}
        <section className="bg-stone-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Hand className="w-5 h-5" /> Gesture Tests
          </h2>

          {/* Swipe Test */}
          <div className="mb-4">
            <p className="text-sm text-stone-400 mb-2">Swipe left or right:</p>
            <div 
              {...swipeGesture.handlers}
              className="bg-stone-700 rounded-lg p-6 text-center relative overflow-hidden touch-pan-y"
            >
              <div 
                className="absolute inset-y-0 left-0 bg-red-500/30"
                style={{ width: `${Math.max(0, swipeGesture.direction === 'left' ? swipeGesture.progress * 100 : 0)}%` }}
              />
              <div 
                className="absolute inset-y-0 right-0 bg-green-500/30"
                style={{ width: `${Math.max(0, swipeGesture.direction === 'right' ? swipeGesture.progress * 100 : 0)}%` }}
              />
              <div className="flex items-center justify-center gap-4 relative">
                <ChevronLeft className={`w-6 h-6 ${swipeGesture.direction === 'left' && swipeGesture.progress > 0.3 ? 'text-red-400' : 'text-stone-500'}`} />
                <span>Swipe Here</span>
                <ChevronRight className={`w-6 h-6 ${swipeGesture.direction === 'right' && swipeGesture.progress > 0.3 ? 'text-green-400' : 'text-stone-500'}`} />
              </div>
            </div>
          </div>

          {/* Long Press Test */}
          <div>
            <p className="text-sm text-stone-400 mb-2">Long press (hold 500ms):</p>
            <div 
              {...longPress.handlers}
              className={`bg-stone-700 rounded-lg p-6 text-center select-none cursor-pointer ${longPress.isPressed ? 'bg-stone-600' : ''}`}
            >
              {longPress.isPressed ? `${Math.round(longPress.progress * 100)}%` : 'Press and Hold'}
            </div>
          </div>
        </section>

        {/* Swipeable Row Demo */}
        <section className="bg-stone-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3">📱 Swipeable List Demo</h2>
          <div className="space-y-2">
            <SwipeableRow
              leftActions={[archiveAction]}
              rightActions={[deleteAction]}
              onAction={(action) => log(`Action: ${action}`)}
            >
              <div className="flex items-center gap-3 p-3 bg-stone-700 rounded">
                <SkeletonAvatar size={40} />
                <div>
                  <div className="font-medium">Swipe me!</div>
                  <div className="text-sm text-stone-400">← Archive | Delete →</div>
                </div>
              </div>
            </SwipeableRow>
          </div>
        </section>

        {/* Skeleton Demo */}
        <section className="bg-stone-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3">💀 Loading Skeletons</h2>
          <SkeletonPost />
        </section>

        {/* Feature Checklist */}
        <section className="bg-stone-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3">✓ Feature Support</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {mobile.features.map(({ name, supported }) => (
              <div key={name} className="flex items-center gap-2">
                {supported ? (
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span className={supported ? '' : 'text-stone-500'}>{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Log Output */}
        <section className="bg-stone-900 rounded-xl p-4 font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">📜 Event Log</h2>
            <button
              onClick={() => setLogMessages([])}
              className="text-stone-500 hover:text-stone-300"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {logMessages.length === 0 ? (
              <div className="text-stone-500">No events yet. Try the tests above!</div>
            ) : (
              logMessages.map((msg, i) => (
                <div key={i} className="text-green-400">{msg}</div>
              ))
            )}
          </div>
        </section>

        {/* Actions */}
        <section className="flex gap-3">
          <button
            onClick={copyReport}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-fernhill-gold text-fernhill-dark rounded-xl font-medium"
          >
            <Copy className="w-5 h-5" />
            Copy Report
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-3 bg-stone-700 rounded-xl"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </section>
      </main>
    </div>
  )
}
