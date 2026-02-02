// ============================================================
// Fernhill Community - Progressive Web App Service Worker
// Version: 2.0.0 (Phase D Mobile Excellence)
// ============================================================

// Cache versions - increment on deploy
const CACHE_VERSION = 'v2'
const STATIC_CACHE = `fernhill-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `fernhill-dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `fernhill-images-${CACHE_VERSION}`
const API_CACHE = `fernhill-api-${CACHE_VERSION}`

const OFFLINE_URL = '/offline.html'

// ============================================================
// STATIC ASSETS - Precached on install
// ============================================================
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/hearth',
  '/events',
  '/messages',
  '/profile',
]

// ============================================================
// CACHE STRATEGIES
// ============================================================

/**
 * Cache-First: Static assets (JS, CSS, fonts)
 * Fast loading, updates on new service worker
 */
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  const cached = await caches.match(request)
  if (cached) return cached
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return caches.match(OFFLINE_URL)
  }
}

/**
 * Network-First: API requests, dynamic content
 * Fresh data when online, cached fallback offline
 */
async function networkFirst(request, cacheName = API_CACHE, timeout = 3000) {
  const cache = await caches.open(cacheName)
  
  try {
    // Race between network and timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(request, { signal: controller.signal })
    clearTimeout(timeoutId)
    
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Network failed, try cache
    const cached = await cache.match(request)
    if (cached) return cached
    
    // Return offline response for navigation
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL)
    }
    
    // Return error response for API calls
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * Stale-While-Revalidate: Images, non-critical assets
 * Instant from cache, background refresh
 */
async function staleWhileRevalidate(request, cacheName = IMAGE_CACHE) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  // Background fetch to update cache
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => null)
  
  // Return cached immediately if available
  return cached || fetchPromise || caches.match(OFFLINE_URL)
}

// ============================================================
// URL MATCHERS
// ============================================================
const isNavigationRequest = (request) => request.mode === 'navigate'
const isStaticAsset = (url) => /\.(js|css|woff2?|ttf|eot)$/i.test(url.pathname)
const isImageRequest = (url) => /\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i.test(url.pathname)
const isAPIRequest = (url) => url.pathname.startsWith('/api/')
const isSupabaseRequest = (url) => url.hostname.includes('supabase')

// ============================================================
// INSTALL EVENT
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2.0...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Precaching static assets')
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// ============================================================
// ACTIVATE EVENT - Clean old caches
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2.0...')
  
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE]
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('fernhill-') && !currentCaches.includes(name))
            .map(name => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => self.clients.claim())
  )
})

// ============================================================
// FETCH EVENT - Route requests to appropriate strategy
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip cross-origin requests (except Supabase)
  if (!url.origin.includes(self.location.origin) && !isSupabaseRequest(url)) return
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) return
  
  // Route to appropriate caching strategy
  if (isNavigationRequest(request)) {
    // Navigation: Network-first with offline fallback
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
  } else if (isStaticAsset(url)) {
    // Static assets: Cache-first
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (isImageRequest(url)) {
    // Images: Stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
  } else if (isAPIRequest(url) || isSupabaseRequest(url)) {
    // API calls: Network-first with short timeout
    event.respondWith(networkFirst(request, API_CACHE, 5000))
  } else {
    // Default: Network-first
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
  }
})

// Push event - show notification
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: data.tag || 'fernhill-notification',
    renotify: true,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Fernhill Community', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})

// ============================================================
// BACKGROUND SYNC
// ============================================================

const OFFLINE_DB_NAME = 'fernhill-offline'
const OFFLINE_STORES = {
  POSTS: 'offline-posts',
  MESSAGES: 'offline-messages',
  REACTIONS: 'offline-reactions',
  ACTIONS: 'offline-actions',
}

// Background sync event handler
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  switch (event.tag) {
    case 'sync-offline-posts':
      event.waitUntil(syncOfflineItems(OFFLINE_STORES.POSTS))
      break
    case 'sync-offline-messages':
      event.waitUntil(syncOfflineItems(OFFLINE_STORES.MESSAGES))
      break
    case 'sync-offline-reactions':
      event.waitUntil(syncOfflineItems(OFFLINE_STORES.REACTIONS))
      break
    case 'sync-offline-actions':
      event.waitUntil(syncOfflineItems(OFFLINE_STORES.ACTIONS))
      break
    default:
      console.log('[SW] Unknown sync tag:', event.tag)
  }
})

/**
 * Open IndexedDB database
 */
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

/**
 * Get pending items from a store
 */
async function getPendingFromStore(storeName) {
  try {
    const db = await openOfflineDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index('status')
      const request = index.getAll(IDBKeyRange.only('pending'))
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  } catch (error) {
    console.error('[SW] Failed to get pending items:', error)
    return []
  }
}

/**
 * Update item status in store
 */
async function updateItemInStore(storeName, id, status) {
  try {
    const db = await openOfflineDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const getRequest = store.get(id)
      
      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (item) {
          item.status = status
          const putRequest = store.put(item)
          putRequest.onerror = () => reject(putRequest.error)
          putRequest.onsuccess = () => resolve()
        } else {
          resolve()
        }
      }
    })
  } catch (error) {
    console.error('[SW] Failed to update item:', error)
  }
}

/**
 * Remove item from store
 */
async function removeFromStore(storeName, id) {
  try {
    const db = await openOfflineDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('[SW] Failed to remove item:', error)
  }
}

/**
 * Sync offline items from a store
 */
async function syncOfflineItems(storeName) {
  console.log(`[SW] Syncing ${storeName}...`)
  
  const items = await getPendingFromStore(storeName)
  console.log(`[SW] Found ${items.length} pending items in ${storeName}`)
  
  for (const item of items) {
    try {
      // Mark as syncing
      await updateItemInStore(storeName, item.id, 'syncing')
      
      // Attempt to sync based on type
      const success = await syncItem(storeName, item)
      
      if (success) {
        // Remove from queue on success
        await removeFromStore(storeName, item.id)
        console.log(`[SW] Successfully synced item ${item.id}`)
      } else {
        // Mark as failed for retry
        item.retryCount = (item.retryCount || 0) + 1
        if (item.retryCount >= (item.maxRetries || 3)) {
          await updateItemInStore(storeName, item.id, 'failed')
          console.log(`[SW] Item ${item.id} failed after max retries`)
        } else {
          await updateItemInStore(storeName, item.id, 'pending')
          console.log(`[SW] Item ${item.id} will retry (attempt ${item.retryCount})`)
        }
      }
    } catch (error) {
      console.error(`[SW] Error syncing item ${item.id}:`, error)
      await updateItemInStore(storeName, item.id, 'pending')
    }
  }
  
  // Notify clients that sync is complete
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      store: storeName,
      count: items.length,
    })
  })
}

/**
 * Sync individual item (placeholder - actual API calls would go here)
 */
async function syncItem(storeName, item) {
  // This is where you'd make actual API calls
  // For now, we'll simulate success
  console.log(`[SW] Would sync ${item.type} from ${storeName}:`, item.data)
  
  // In production, you'd do something like:
  // const response = await fetch('/api/posts', {
  //   method: 'POST',
  //   body: JSON.stringify(item.data),
  //   headers: { 'Content-Type': 'application/json' }
  // })
  // return response.ok
  
  return true
}

// ============================================================
// BADGE MANAGEMENT
// ============================================================

/**
 * Update app badge with unread count
 */
async function updateBadge(count) {
  if ('setAppBadge' in navigator) {
    try {
      if (count > 0) {
        await navigator.setAppBadge(count)
      } else {
        await navigator.clearAppBadge()
      }
    } catch (error) {
      console.error('[SW] Badge update failed:', error)
    }
  }
}

// Listen for badge update messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_BADGE') {
    updateBadge(event.data.count)
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

