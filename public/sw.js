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

// Background sync for offline posts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts())
  }
})

async function syncPosts() {
  // Get pending posts from IndexedDB and sync
  // This would be implemented based on your offline queue system
  console.log('Syncing offline posts...')
}
