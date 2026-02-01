/**
 * E2EE Cryptography utilities using Web Crypto API
 * RSA-OAEP for key exchange, messages encrypted with recipient's public key
 */

// Generate a new RSA-OAEP key pair
export async function generateKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
  
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  }
}

// Export public key to base64 string for storage
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', publicKey)
  return btoa(String.fromCharCode(...new Uint8Array(exported)))
}

// Import public key from base64 string
export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  const binaryString = atob(base64Key)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  return crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  )
}

// Export private key to base64 (for backup)
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('pkcs8', privateKey)
  return btoa(String.fromCharCode(...new Uint8Array(exported)))
}

// Import private key from base64 (for restore)
export async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
  const binaryString = atob(base64Key)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  return crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  )
}

// Encrypt a message with recipient's public key
export async function encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  
  // RSA-OAEP has size limits, so we use hybrid encryption for longer messages
  // For simplicity, we'll chunk if needed, but most DMs should be short
  if (data.length > 190) { // RSA-OAEP with 2048-bit key and SHA-256 has ~190 byte limit
    // For longer messages, use AES with RSA-wrapped key
    return await encryptLongMessage(message, publicKey)
  }
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    data
  )
  
  return 'v1:' + btoa(String.fromCharCode(...new Uint8Array(encrypted)))
}

// Decrypt a message with our private key
export async function decryptMessage(encryptedMessage: string, privateKey: CryptoKey): Promise<string> {
  // Check version prefix
  if (encryptedMessage.startsWith('v2:')) {
    return await decryptLongMessage(encryptedMessage, privateKey)
  }
  
  const base64 = encryptedMessage.replace('v1:', '')
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    bytes.buffer
  )
  
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

// Hybrid encryption for longer messages (AES-GCM + RSA-OAEP key wrap)
async function encryptLongMessage(message: string, publicKey: CryptoKey): Promise<string> {
  // Generate a random AES key
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  
  // Export AES key
  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey)
  
  // Encrypt AES key with RSA
  const encryptedAesKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    rawAesKey
  )
  
  // Encrypt message with AES
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encryptedMessage = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoder.encode(message)
  )
  
  // Combine: encryptedAesKey + iv + encryptedMessage
  const combined = new Uint8Array(
    encryptedAesKey.byteLength + iv.byteLength + encryptedMessage.byteLength + 4
  )
  
  // Store lengths for parsing
  const view = new DataView(combined.buffer)
  view.setUint16(0, encryptedAesKey.byteLength)
  view.setUint16(2, iv.byteLength)
  
  combined.set(new Uint8Array(encryptedAesKey), 4)
  combined.set(iv, 4 + encryptedAesKey.byteLength)
  combined.set(new Uint8Array(encryptedMessage), 4 + encryptedAesKey.byteLength + iv.byteLength)
  
  return 'v2:' + btoa(String.fromCharCode(...combined))
}

async function decryptLongMessage(encryptedMessage: string, privateKey: CryptoKey): Promise<string> {
  const base64 = encryptedMessage.replace('v2:', '')
  const binaryString = atob(base64)
  const combined = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    combined[i] = binaryString.charCodeAt(i)
  }
  
  // Parse lengths
  const view = new DataView(combined.buffer)
  const aesKeyLength = view.getUint16(0)
  const ivLength = view.getUint16(2)
  
  // Extract parts
  const encryptedAesKey = combined.slice(4, 4 + aesKeyLength)
  const iv = combined.slice(4 + aesKeyLength, 4 + aesKeyLength + ivLength)
  const encryptedContent = combined.slice(4 + aesKeyLength + ivLength)
  
  // Decrypt AES key with RSA
  const rawAesKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedAesKey
  )
  
  // Import AES key
  const aesKey = await crypto.subtle.importKey(
    'raw',
    rawAesKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
  
  // Decrypt message
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encryptedContent
  )
  
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

// Generate mnemonic recovery phrase from private key
export async function generateRecoveryPhrase(privateKey: CryptoKey): Promise<string> {
  const exported = await exportPrivateKey(privateKey)
  // Simple approach: split base64 into words (in production, use BIP39)
  const words = []
  const wordList = getWordList()
  
  // Convert base64 to indices
  for (let i = 0; i < exported.length; i += 2) {
    const chunk = exported.slice(i, i + 2)
    const index = (chunk.charCodeAt(0) + (chunk.charCodeAt(1) || 0)) % wordList.length
    words.push(wordList[index])
  }
  
  return words.slice(0, 24).join(' ')
}

// Simple word list for recovery phrase (in production, use BIP39 word list)
function getWordList(): string[] {
  return [
    'dance', 'flow', 'rhythm', 'heart', 'soul', 'breath', 'move', 'sacred',
    'tribe', 'circle', 'gather', 'pulse', 'wave', 'spiral', 'earth', 'fire',
    'water', 'air', 'spirit', 'unity', 'peace', 'love', 'joy', 'grace',
    'light', 'sound', 'vibration', 'harmony', 'balance', 'center', 'ground', 'rise',
    'expand', 'release', 'surrender', 'trust', 'open', 'receive', 'give', 'share',
    'connect', 'embrace', 'honor', 'respect', 'listen', 'speak', 'silence', 'presence',
    'moment', 'eternal', 'infinite', 'cosmic', 'divine', 'human', 'nature', 'wild',
    'free', 'authentic', 'true', 'real', 'deep', 'wide', 'high', 'vast'
  ]
}

// IndexedDB helper functions for encryption key storage
const DB_NAME = 'fernhill-keys';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

async function openKeysDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getStoredPrivateKey(userId: string): Promise<CryptoKey | null> {
  try {
    const db = await openKeysDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(userId);
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result?.privateKey || null);
      };
      getRequest.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function storePrivateKey(userId: string, privateKey: CryptoKey): Promise<void> {
  const db = await openKeysDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ userId, privateKey });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error('Failed to store key'));
  });
}

// Initialize E2EE keys - call this at app startup
// Returns true if keys were initialized (either existing or newly created)
export async function initializeEncryption(
  userId: string, 
  updatePublicKey: (key: string) => Promise<void>
): Promise<{ success: boolean; privateKey: CryptoKey | null }> {
  try {
    // Check if we already have keys stored
    const existingKey = await getStoredPrivateKey(userId);
    if (existingKey) {
      return { success: true, privateKey: existingKey };
    }

    // Generate new key pair
    const { publicKey, privateKey } = await generateKeyPair();
    const exportedPublicKey = await exportPublicKey(publicKey);

    // Store private key in IndexedDB
    await storePrivateKey(userId, privateKey);

    // Update profile with public key (callback to handle Supabase update)
    await updatePublicKey(exportedPublicKey);

    return { success: true, privateKey };
  } catch (error) {
    console.error('E2EE initialization failed:', error);
    return { success: false, privateKey: null };
  }
}
