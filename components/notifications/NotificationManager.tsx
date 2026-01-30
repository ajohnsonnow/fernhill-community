'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error('Error checking subscription:', error)
      }
    }
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser')
      return
    }

    setLoading(true)

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        await subscribeToPush()
        toast.success('Notifications enabled! 🔔')
      } else if (result === 'denied') {
        toast.error(
          'Notification permission denied. To enable: Go to browser settings → Site permissions → Notifications',
          { duration: 6000 }
        )
      }
    } catch (error) {
      console.error('Notification permission error:', error)
      toast.error('Failed to enable notifications. Check browser settings.')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported')
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    // Get VAPID public key from environment (would need to be set up)
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    
    if (!vapidPublicKey) {
      // For now, just mark as subscribed without actual push subscription
      setIsSubscribed(true)
      return
    }

    // Convert VAPID key to Uint8Array
    const urlBase64ToUint8Array = (base64String: string) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
      const rawData = window.atob(base64)
      const outputArray = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
      }
      return outputArray
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    // Save subscription to database
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await (supabase
        .from('push_subscriptions') as any)
        .upsert({
          user_id: user.id,
          subscription: JSON.stringify(subscription),
          created_at: new Date().toISOString(),
        })
    }

    setIsSubscribed(true)
  }

  const unsubscribe = async () => {
    setLoading(true)

    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        
        if (subscription) {
          await subscription.unsubscribe()
        }
      }

      // Remove from database
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
      }

      setIsSubscribed(false)
      toast.success('Notifications disabled')
    } catch (error) {
      toast.error('Failed to disable notifications')
    } finally {
      setLoading(false)
    }
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3 p-4 glass-panel-dark rounded-xl">
        <BellOff className="w-5 h-5 text-red-400" />
        <div className="flex-1">
          <p className="text-fernhill-cream text-sm font-medium">Notifications Blocked</p>
          <p className="text-fernhill-sand/60 text-xs">Enable in browser settings</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : requestPermission}
      disabled={loading}
      className={`flex items-center gap-3 p-4 rounded-xl w-full transition-colors ${
        isSubscribed
          ? 'glass-panel text-fernhill-gold'
          : 'glass-panel-dark text-fernhill-sand'
      }`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-5 h-5" />
      ) : (
        <BellOff className="w-5 h-5" />
      )}
      <div className="flex-1 text-left">
        <p className="text-sm font-medium">
          {isSubscribed ? 'Notifications On' : 'Enable Notifications'}
        </p>
        <p className="text-xs opacity-60">
          {isSubscribed ? 'Tap to disable' : 'Get updates from the tribe'}
        </p>
      </div>
    </button>
  )
}
