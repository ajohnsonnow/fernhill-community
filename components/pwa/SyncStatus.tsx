'use client'

import { useEffect, useState } from 'react'
import { getQueueStats } from '@/lib/offline-queue'
import { useOnline } from '@/hooks/useNetworkStatus'
import { Cloud, CloudOff, RefreshCw, Check } from 'lucide-react'

interface SyncStatusProps {
  /** Show as compact badge */
  compact?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Sync Status Indicator
 * 
 * Shows the current sync status:
 * - Online with nothing pending: Green check
 * - Online with pending items: Syncing animation
 * - Offline: Orange offline icon
 * - Offline with pending: Count badge
 */
export function SyncStatus({ compact = false, className = '' }: SyncStatusProps) {
  const isOnline = useOnline()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // Poll for pending items
  useEffect(() => {
    const updateCount = async () => {
      try {
        const stats = await getQueueStats()
        setPendingCount(stats.total)
      } catch (error) {
        // IndexedDB not available (SSR)
        setPendingCount(0)
      }
    }

    updateCount()
    const interval = setInterval(updateCount, 5000)
    return () => clearInterval(interval)
  }, [])

  // Listen for sync complete messages
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        setIsSyncing(false)
        // Refresh count
        getQueueStats().then(stats => setPendingCount(stats.total))
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  // Trigger sync when coming online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      setIsSyncing(true)
    }
  }, [isOnline, pendingCount])

  if (compact) {
    // Compact badge version
    if (!isOnline) {
      return (
        <div className={`flex items-center gap-1 text-orange-400 ${className}`} title="You're offline">
          <CloudOff className="w-4 h-4" />
          {pendingCount > 0 && (
            <span className="text-xs font-medium">{pendingCount}</span>
          )}
        </div>
      )
    }

    if (isSyncing) {
      return (
        <div className={`flex items-center gap-1 text-blue-400 ${className}`} title="Syncing...">
          <RefreshCw className="w-4 h-4 animate-spin" />
        </div>
      )
    }

    if (pendingCount > 0) {
      return (
        <div className={`flex items-center gap-1 text-yellow-400 ${className}`} title={`${pendingCount} pending`}>
          <Cloud className="w-4 h-4" />
          <span className="text-xs font-medium">{pendingCount}</span>
        </div>
      )
    }

    return (
      <div className={`flex items-center text-green-400 ${className}`} title="All synced">
        <Check className="w-4 h-4" />
      </div>
    )
  }

  // Full status indicator
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${className}`}>
      {!isOnline ? (
        <>
          <CloudOff className="w-4 h-4 text-orange-400" />
          <span className="text-orange-400">Offline</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 bg-orange-500/20 rounded-full text-xs text-orange-300">
              {pendingCount} pending
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="text-blue-400">Syncing...</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <Cloud className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400">{pendingCount} to sync</span>
        </>
      ) : (
        <>
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-green-400">Synced</span>
        </>
      )}
    </div>
  )
}

/**
 * Pending Items Badge
 * Shows count of pending offline items
 */
export function PendingBadge({ className = '' }: { className?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const updateCount = async () => {
      try {
        const stats = await getQueueStats()
        setCount(stats.total)
      } catch {
        setCount(0)
      }
    }

    updateCount()
    const interval = setInterval(updateCount, 5000)
    return () => clearInterval(interval)
  }, [])

  if (count === 0) return null

  return (
    <span className={`badge-counter ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default SyncStatus
