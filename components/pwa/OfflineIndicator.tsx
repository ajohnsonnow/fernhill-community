'use client'

import { useEffect, useState } from 'react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { haptic } from '@/lib/haptics'

/**
 * Offline Indicator Component
 * Shows a banner when the user goes offline, and a brief "back online" message on reconnection
 */
export function OfflineIndicator() {
  const { isOnline, wasOffline } = useNetworkStatus()
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')
  const [variant, setVariant] = useState<'offline' | 'online'>('offline')

  useEffect(() => {
    if (!isOnline) {
      // Offline
      setMessage("You're offline")
      setVariant('offline')
      setShow(true)
      haptic('warning')
    } else if (wasOffline) {
      // Just came back online
      setMessage('Back online!')
      setVariant('online')
      setShow(true)
      haptic('success')
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => setShow(false), 3000)
      return () => clearTimeout(timer)
    } else {
      setShow(false)
    }
  }, [isOnline, wasOffline])

  if (!show) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed top-0 left-0 right-0 z-[100]
        pt-safe
        transform transition-transform duration-300 ease-out
        ${show ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      <div
        className={`
          flex items-center justify-center gap-2
          px-4 py-3
          text-sm font-medium
          ${variant === 'offline' 
            ? 'bg-red-600 text-white' 
            : 'bg-green-600 text-white'
          }
        `}
      >
        {/* Status icon */}
        <span className="text-lg">
          {variant === 'offline' ? '📡' : '✅'}
        </span>
        
        {/* Message */}
        <span>{message}</span>
        
        {/* Offline: Show pulsing dot */}
        {variant === 'offline' && (
          <span className="relative flex h-2 w-2 ml-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Compact offline badge for use in navigation
 */
export function OfflineBadge() {
  const { isOnline } = useNetworkStatus()

  if (isOnline) return null

  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-600/20 text-red-400 rounded-full"
      title="You're currently offline"
    >
      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
      Offline
    </span>
  )
}

export default OfflineIndicator
