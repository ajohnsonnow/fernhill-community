/**
 * Offline Queue - IndexedDB-based queue for offline operations
 * 
 * Stores posts, messages, and other actions when offline,
 * then syncs them when the connection is restored.
 */

const DB_NAME = 'fernhill-offline'
const DB_VERSION = 1

// Store names
const STORES = {
  POSTS: 'offline-posts',
  MESSAGES: 'offline-messages',
  REACTIONS: 'offline-reactions',
  ACTIONS: 'offline-actions',
} as const

type StoreType = typeof STORES[keyof typeof STORES]

interface QueuedItem<T = unknown> {
  id: string
  type: string
  data: T
  timestamp: number
  retryCount: number
  maxRetries: number
  status: 'pending' | 'syncing' | 'failed' | 'synced'
}

interface QueuedPost {
  content: string
  mediaUrls?: string[]
  poll?: { question: string; options: string[] }
  userId: string
}

interface QueuedMessage {
  conversationId: string
  recipientId: string
  content: string
  encryptedContent?: string
  userId: string
}

interface QueuedReaction {
  postId: string
  emoji: string
  userId: string
  action: 'add' | 'remove'
}

/**
 * Initialize the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create stores if they don't exist
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      })
    }
  })
}

/**
 * Generate a unique ID for queued items
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Add an item to a queue
 */
async function addToQueue<T>(
  store: StoreType,
  type: string,
  data: T,
  maxRetries = 3
): Promise<string> {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const id = generateId()
    const item: QueuedItem<T> = {
      id,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
      status: 'pending',
    }

    const transaction = db.transaction(store, 'readwrite')
    const objectStore = transaction.objectStore(store)
    const request = objectStore.add(item)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      // Trigger sync if online
      if (navigator.onLine) {
        triggerSync(store)
      }
      resolve(id)
    }
  })
}

/**
 * Get all pending items from a queue
 */
async function getPendingItems<T>(store: StoreType): Promise<QueuedItem<T>[]> {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readonly')
    const objectStore = transaction.objectStore(store)
    const index = objectStore.index('status')
    const request = index.getAll(IDBKeyRange.only('pending'))

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

/**
 * Update an item's status
 */
async function updateItemStatus(
  store: StoreType,
  id: string,
  status: QueuedItem['status'],
  incrementRetry = false
): Promise<void> {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite')
    const objectStore = transaction.objectStore(store)
    const getRequest = objectStore.get(id)

    getRequest.onerror = () => reject(getRequest.error)
    getRequest.onsuccess = () => {
      const item = getRequest.result as QueuedItem
      if (!item) {
        resolve()
        return
      }

      item.status = status
      if (incrementRetry) {
        item.retryCount++
      }

      const putRequest = objectStore.put(item)
      putRequest.onerror = () => reject(putRequest.error)
      putRequest.onsuccess = () => resolve()
    }
  })
}

/**
 * Remove an item from the queue
 */
async function removeFromQueue(store: StoreType, id: string): Promise<void> {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite')
    const objectStore = transaction.objectStore(store)
    const request = objectStore.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Get queue statistics
 */
async function getQueueStats(): Promise<{
  posts: number
  messages: number
  reactions: number
  actions: number
  total: number
}> {
  const db = await openDatabase()
  
  const counts: Record<string, number> = {}
  
  for (const store of Object.values(STORES)) {
    counts[store] = await new Promise<number>((resolve, reject) => {
      const transaction = db.transaction(store, 'readonly')
      const objectStore = transaction.objectStore(store)
      const index = objectStore.index('status')
      const request = index.count(IDBKeyRange.only('pending'))
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }
  
  return {
    posts: counts[STORES.POSTS] || 0,
    messages: counts[STORES.MESSAGES] || 0,
    reactions: counts[STORES.REACTIONS] || 0,
    actions: counts[STORES.ACTIONS] || 0,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
  }
}

/**
 * Request background sync via service worker
 */
function triggerSync(tag: string): void {
  if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration?.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      // @ts-expect-error - Background Sync API
      registration.sync.register(`sync-${tag}`)
    }).catch(console.error)
  }
}

/**
 * Clear all synced items (cleanup)
 */
async function clearSyncedItems(): Promise<void> {
  const db = await openDatabase()
  
  for (const store of Object.values(STORES)) {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(store, 'readwrite')
      const objectStore = transaction.objectStore(store)
      const index = objectStore.index('status')
      const request = index.openCursor(IDBKeyRange.only('synced'))
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
    })
  }
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Queue a post for offline sync
 */
export async function queuePost(post: QueuedPost): Promise<string> {
  return addToQueue(STORES.POSTS, 'create-post', post)
}

/**
 * Queue a message for offline sync
 */
export async function queueMessage(message: QueuedMessage): Promise<string> {
  return addToQueue(STORES.MESSAGES, 'send-message', message)
}

/**
 * Queue a reaction for offline sync
 */
export async function queueReaction(reaction: QueuedReaction): Promise<string> {
  return addToQueue(STORES.REACTIONS, reaction.action === 'add' ? 'add-reaction' : 'remove-reaction', reaction)
}

/**
 * Queue a generic action for offline sync
 */
export async function queueAction<T>(type: string, data: T): Promise<string> {
  return addToQueue(STORES.ACTIONS, type, data)
}

/**
 * Get all pending posts
 */
export async function getPendingPosts(): Promise<QueuedItem<QueuedPost>[]> {
  return getPendingItems<QueuedPost>(STORES.POSTS)
}

/**
 * Get all pending messages
 */
export async function getPendingMessages(): Promise<QueuedItem<QueuedMessage>[]> {
  return getPendingItems<QueuedMessage>(STORES.MESSAGES)
}

/**
 * Mark item as synced and remove
 */
export async function markSynced(store: StoreType, id: string): Promise<void> {
  await removeFromQueue(store, id)
}

/**
 * Mark item as failed (will retry)
 */
export async function markFailed(store: StoreType, id: string): Promise<void> {
  await updateItemStatus(store, id, 'failed', true)
}

/**
 * Get offline queue statistics
 */
export { getQueueStats, clearSyncedItems }

/**
 * Store names for external use
 */
export { STORES }

export type { QueuedItem, QueuedPost, QueuedMessage, QueuedReaction }
