'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

interface NetworkStatus {
  /** Whether the device is online */
  isOnline: boolean
  /** Whether the device was recently offline (within last 5 seconds) */
  wasOffline: boolean
  /** Time since last connection change in ms */
  timeSinceChange: number | null
  /** Connection type if available (4g, 3g, wifi, etc) */
  connectionType: string | null
  /** Effective connection type (slow-2g, 2g, 3g, 4g) */
  effectiveType: string | null
  /** Whether connection is metered (cellular data) */
  saveData: boolean
  /** Estimated downlink speed in Mbps */
  downlink: number | null
  /** Estimated round-trip time in ms */
  rtt: number | null
}

// For SSR compatibility
function getServerSnapshot(): boolean {
  return true // Assume online during SSR
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot(): boolean {
  return navigator.onLine
}

/**
 * Hook to track network connectivity status
 * 
 * @example
 * const { isOnline, wasOffline, connectionType } = useNetworkStatus()
 * 
 * if (!isOnline) {
 *   return <OfflineBanner />
 * }
 * 
 * if (wasOffline) {
 *   return <ReconnectedBanner />
 * }
 */
export function useNetworkStatus(): NetworkStatus {
  // Use useSyncExternalStore for SSR-safe subscription
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  
  const [wasOffline, setWasOffline] = useState(false)
  const [lastChangeTime, setLastChangeTime] = useState<number | null>(null)
  const [connectionInfo, setConnectionInfo] = useState<{
    type: string | null
    effectiveType: string | null
    saveData: boolean
    downlink: number | null
    rtt: number | null
  }>({
    type: null,
    effectiveType: null,
    saveData: false,
    downlink: null,
    rtt: null,
  })

  // Track "wasOffline" state for reconnection feedback
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
      setLastChangeTime(Date.now())
    } else if (wasOffline) {
      setLastChangeTime(Date.now())
      // Clear "wasOffline" after 5 seconds
      const timer = setTimeout(() => setWasOffline(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline])

  // Get detailed connection info (Network Information API)
  const updateConnectionInfo = useCallback(() => {
    // @ts-expect-error - Navigator.connection is not in TypeScript's lib
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      setConnectionInfo({
        type: connection.type || null,
        effectiveType: connection.effectiveType || null,
        saveData: connection.saveData || false,
        downlink: connection.downlink || null,
        rtt: connection.rtt || null,
      })
    }
  }, [])

  useEffect(() => {
    updateConnectionInfo()
    
    // @ts-expect-error - Navigator.connection is not in TypeScript's lib
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo)
      return () => connection.removeEventListener('change', updateConnectionInfo)
    }
  }, [updateConnectionInfo])

  return {
    isOnline,
    wasOffline,
    timeSinceChange: lastChangeTime ? Date.now() - lastChangeTime : null,
    connectionType: connectionInfo.type,
    effectiveType: connectionInfo.effectiveType,
    saveData: connectionInfo.saveData,
    downlink: connectionInfo.downlink,
    rtt: connectionInfo.rtt,
  }
}

/**
 * Simple hook that just returns online status
 */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export default useNetworkStatus
