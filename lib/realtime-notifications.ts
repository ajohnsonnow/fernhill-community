'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { haptic } from '@/lib/haptics'

type NotificationType = 
  | 'message' 
  | 'reaction' 
  | 'comment' 
  | 'mention' 
  | 'event' 
  | 'announcement'
  | 'follow'
  | 'approval'

interface RealtimeNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  url?: string
  data?: Record<string, unknown>
  timestamp: number
}

interface UseRealtimeNotificationsOptions {
  userId: string | null
  enabled?: boolean
  onNotification?: (notification: RealtimeNotification) => void
  playSound?: boolean
  showBrowserNotification?: boolean
}

/**
 * Hook for real-time notifications from Supabase
 * 
 * Subscribes to:
 * - Direct messages
 * - Post reactions/comments
 * - Mentions
 * - Event updates
 * - Announcements
 * 
 * @example
 * const { unreadCount, notifications, markAsRead } = useRealtimeNotifications({
 *   userId: user.id,
 *   onNotification: (n) => toast(n.title)
 * })
 */
export function useRealtimeNotifications({
  userId,
  enabled = true,
  onNotification,
  playSound = true,
  showBrowserNotification = true,
}: UseRealtimeNotificationsOptions) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient()

  // Initialize notification sound
  useEffect(() => {
    if (typeof window !== 'undefined' && playSound) {
      audioRef.current = new Audio('/sounds/notification.mp3')
      audioRef.current.volume = 0.3
    }
  }, [playSound])

  // Request browser notification permission
  useEffect(() => {
    if (showBrowserNotification && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [showBrowserNotification])

  // Subscribe to real-time changes
  useEffect(() => {
    if (!userId || !enabled) return

    // Subscribe to direct messages
    const messagesChannel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          handleNotification({
            type: 'message',
            title: 'New Message',
            body: 'You have a new message',
            url: '/messages',
            data: payload.new,
          })
        }
      )
      .subscribe()

    // Subscribe to notifications table
    const notificationsChannel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as any
          handleNotification({
            type: notif.type || 'mention',
            title: getNotificationTitle(notif.type),
            body: notif.content || 'You have a new notification',
            url: notif.link || '/hearth',
            data: notif,
          })
        }
      )
      .subscribe()

    // Subscribe to announcements
    const announcementsChannel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
          filter: 'status=eq.published',
        },
        (payload) => {
          const announcement = payload.new as any
          handleNotification({
            type: 'announcement',
            title: '📢 ' + announcement.title,
            body: announcement.content?.substring(0, 100) || 'New announcement',
            url: '/hearth',
            data: announcement,
          })
        }
      )
      .subscribe()

    // Subscribe to event updates (for RSVPed events)
    const eventsChannel = supabase
      .channel('events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'event_submissions',
        },
        (payload) => {
          // Only notify if significant change (time, location, cancellation)
          const event = payload.new as any
          const old = payload.old as any
          
          if (event.status === 'cancelled' && old.status !== 'cancelled') {
            handleNotification({
              type: 'event',
              title: '⚠️ Event Cancelled',
              body: `${event.title} has been cancelled`,
              url: '/events',
              data: event,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(notificationsChannel)
      supabase.removeChannel(announcementsChannel)
      supabase.removeChannel(eventsChannel)
    }
  }, [userId, enabled, supabase])

  function handleNotification(notif: Omit<RealtimeNotification, 'id' | 'timestamp'>) {
    const notification: RealtimeNotification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
    }

    // Add to state
    setNotifications(prev => [notification, ...prev].slice(0, 50))
    setUnreadCount(prev => prev + 1)

    // Haptic feedback
    haptic('medium')

    // Play sound
    if (playSound && audioRef.current) {
      audioRef.current.play().catch(() => {})
    }

    // Browser notification (if permitted and tab not focused)
    if (
      showBrowserNotification &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.hidden
    ) {
      const browserNotif = new Notification(notification.title, {
        body: notification.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: notification.id,
        data: { url: notification.url },
      })

      browserNotif.onclick = () => {
        window.focus()
        if (notification.url) {
          window.location.href = notification.url
        }
        browserNotif.close()
      }

      // Auto-close after 5 seconds
      setTimeout(() => browserNotif.close(), 5000)
    }

    // Callback
    onNotification?.(notification)
  }

  function markAsRead(id?: string) {
    if (id) {
      setNotifications(prev => prev.filter(n => n.id !== id))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } else {
      // Mark all as read
      setNotifications([])
      setUnreadCount(0)
    }
  }

  function clearAll() {
    setNotifications([])
    setUnreadCount(0)
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
  }
}

function getNotificationTitle(type: string): string {
  const titles: Record<string, string> = {
    message: '💬 New Message',
    reaction: '❤️ New Reaction',
    comment: '💭 New Comment',
    mention: '📣 You were mentioned',
    event: '📅 Event Update',
    announcement: '📢 Announcement',
    follow: '👋 New Follower',
    approval: '✅ Application Update',
  }
  return titles[type] || '🔔 Notification'
}

/**
 * Update app badge count (PWA feature)
 */
export async function updateBadgeCount(count: number): Promise<void> {
  if ('setAppBadge' in navigator) {
    try {
      if (count > 0) {
        // @ts-expect-error - Badge API not in TypeScript yet
        await navigator.setAppBadge(count)
      } else {
        // @ts-expect-error - Badge API not in TypeScript yet
        await navigator.clearAppBadge()
      }
    } catch (error) {
      console.error('Failed to update badge:', error)
    }
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  return await Notification.requestPermission()
}

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator
}

export default useRealtimeNotifications
