'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Send, 
  Lock, 
  Unlock,
  Search,
  Loader2,
  MessageSquare,
  Shield
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { encryptMessage, decryptMessage, generateKeyPair, exportPublicKey, importPublicKey } from '@/lib/crypto'
import TypingIndicator from '@/components/social/TypingIndicator'

interface Conversation {
  user_id: string
  tribe_name: string
  avatar_url: string | null
  last_message_at: string
  unread_count: number
}

interface Message {
  id: string
  created_at: string
  sender_id: string
  recipient_id: string
  encrypted_content: string
  sender_public_key: string
  decrypted_content?: string
  is_read: boolean
  is_encrypted?: boolean
}

interface Profile {
  id: string
  tribe_name: string
  avatar_url: string | null
  public_key: string | null
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    initializeE2EE()
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id)
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`dm-${selectedUser.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, () => {
          fetchMessages(selectedUser.id)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedUser])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initializeE2EE = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      // Check if we have keys stored in IndexedDB
      const storedKey = await getStoredPrivateKey(user.id)
      if (storedKey) {
        setPrivateKey(storedKey)
        return
      }

      // Generate new key pair
      const { publicKey, privateKey } = await generateKeyPair()
      const exportedPublicKey = await exportPublicKey(publicKey)

      // Store private key in IndexedDB
      await storePrivateKey(user.id, privateKey)
      setPrivateKey(privateKey)

      // Update profile with public key
      await (supabase
        .from('profiles') as any)
        .update({ public_key: exportedPublicKey })
        .eq('id', user.id)

    } catch (error) {
      console.error('E2EE initialization failed:', error)
      toast.error('Failed to initialize secure messaging')
    }
  }

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all messages where user is sender or recipient
      const { data: messages, error } = await supabase
        .from('messages')
        .select('sender_id, recipient_id, created_at, is_read')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group by conversation partner
      const conversationMap = new Map<string, { last_message_at: string; unread_count: number }>()
      
      messages?.forEach((msg: any) => {
        const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
        const existing = conversationMap.get(partnerId)
        
        if (!existing || new Date(msg.created_at) > new Date(existing.last_message_at)) {
          conversationMap.set(partnerId, {
            last_message_at: msg.created_at,
            unread_count: existing?.unread_count || 0,
          })
        }
        
        if (msg.recipient_id === user.id && !msg.is_read) {
          const current = conversationMap.get(partnerId)
          if (current) {
            current.unread_count++
          }
        }
      })

      // Fetch profiles for conversation partners
      const partnerIds = Array.from(conversationMap.keys())
      if (partnerIds.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, tribe_name, avatar_url')
        .in('id', partnerIds)

      const convos: Conversation[] = (profiles || []).map((profile: any) => ({
        user_id: profile.id,
        tribe_name: profile.tribe_name,
        avatar_url: profile.avatar_url,
        ...conversationMap.get(profile.id)!,
      }))

      convos.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      setConversations(convos)
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (partnerId: string) => {
    if (!currentUserId || !privateKey) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Decrypt messages
      const decryptedMessages = await Promise.all(
        (data || []).map(async (msg: Message) => {
          try {
            // Check if message is plain text (marked with PLAIN: prefix)
            if (msg.encrypted_content.startsWith('PLAIN:')) {
              return { 
                ...msg, 
                decrypted_content: msg.encrypted_content.slice(6),
                is_encrypted: false 
              }
            }
            
            // Only decrypt messages sent to us
            if (msg.recipient_id === currentUserId && privateKey) {
              const decrypted = await decryptMessage(msg.encrypted_content, privateKey)
              return { ...msg, decrypted_content: decrypted, is_encrypted: true }
            }
            // For sent messages, we stored them unencrypted locally (we can't decrypt them)
            return { ...msg, decrypted_content: '[Sent message - encrypted]', is_encrypted: true }
          } catch {
            return { ...msg, decrypted_content: '[Unable to decrypt]', is_encrypted: true }
          }
        })
      )

      setMessages(decryptedMessages)

      // Mark messages as read
      await (supabase
        .from('messages') as any)
        .update({ is_read: true })
        .eq('recipient_id', currentUserId)
        .eq('sender_id', partnerId)

    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUserId) return
    setSendingMessage(true)

    try {
      // Get recipient's public key
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('public_key')
        .eq('id', selectedUser.id)
        .single() as { data: { public_key: string | null } | null }

      let contentToSend: string

      if (recipientProfile?.public_key) {
        // Recipient has encryption set up - encrypt the message
        const recipientPublicKey = await importPublicKey(recipientProfile.public_key)
        contentToSend = await encryptMessage(newMessage, recipientPublicKey)
      } else {
        // No encryption - send as plain text with PLAIN: prefix marker
        contentToSend = `PLAIN:${newMessage}`
      }

      // Send message
      const { error } = await (supabase
        .from('messages') as any)
        .insert({
          sender_id: currentUserId,
          recipient_id: selectedUser.id,
          encrypted_content: contentToSend,
        })

      if (error) throw error

      setNewMessage('')
      fetchMessages(selectedUser.id)
    } catch (error: any) {
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, tribe_name, avatar_url, public_key')
        .ilike('tribe_name', `%${query}%`)
        .neq('id', currentUserId)
        .in('status', ['active', 'facilitator', 'admin'])
        .limit(10)

      setSearchResults(data || [])
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const startConversation = (profile: Profile) => {
    setSelectedUser(profile)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  // Conversation List View
  if (!selectedUser) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold font-display text-fernhill-cream">Messages</h1>
              <div className="flex items-center gap-2 text-fernhill-sand/60 text-sm">
                <Lock className="w-4 h-4" />
                <span>End-to-end encrypted</span>
              </div>
            </div>
            <button
              onClick={() => setShowSearch(true)}
              className="p-3 rounded-full glass-panel text-fernhill-gold"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
          </div>

          {/* Search Modal */}
          {showSearch && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4 animate-fadeIn">
              <div className="glass-panel rounded-2xl p-4 w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                  <Search className="w-5 h-5 text-fernhill-sand/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search tribe members..."
                    autoFocus
                    className="flex-1 bg-transparent text-fernhill-cream placeholder-fernhill-sand/40 border-none focus:outline-none"
                  />
                  <button onClick={() => setShowSearch(false)} className="text-fernhill-sand/60">
                    Cancel
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => startConversation(profile)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl glass-panel-dark hover:bg-white/10 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full glass-panel-dark overflow-hidden flex-shrink-0">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-fernhill-gold">
                              {profile.tribe_name?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-fernhill-cream font-medium">{profile.tribe_name}</span>
                        {profile.public_key && (
                          <Shield className="w-4 h-4 text-green-400 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversations List */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-fernhill-gold mx-auto" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <Lock className="w-12 h-12 text-fernhill-gold/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-fernhill-cream mb-2">Secure Messaging</h3>
              <p className="text-fernhill-sand/60 mb-6">
                Messages are encrypted end-to-end. Only you and your conversation partner can read them.
              </p>
              <button
                onClick={() => setShowSearch(true)}
                className="px-6 py-3 rounded-xl bg-fernhill-gold/20 text-fernhill-gold font-medium"
              >
                Start a Conversation
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((convo) => (
                <button
                  key={convo.user_id}
                  onClick={() => startConversation({
                    id: convo.user_id,
                    tribe_name: convo.tribe_name,
                    avatar_url: convo.avatar_url,
                    public_key: null,
                  })}
                  className="w-full flex items-center gap-3 p-4 rounded-xl glass-panel hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full glass-panel-dark overflow-hidden flex-shrink-0">
                    {convo.avatar_url ? (
                      <img src={convo.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-fernhill-gold font-bold">
                        {convo.tribe_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-fernhill-cream font-medium">{convo.tribe_name}</p>
                    <p className="text-fernhill-sand/60 text-sm">
                      {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true })}
                    </p>
                  </div>
                  {convo.unread_count > 0 && (
                    <div className="w-6 h-6 rounded-full bg-fernhill-gold flex items-center justify-center">
                      <span className="text-fernhill-dark text-xs font-bold">{convo.unread_count}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Chat View
  return (
    <div className="min-h-screen flex flex-col">
      {/* Chat Header */}
      <div className="glass-panel p-4 flex items-center gap-3">
        <button
          onClick={() => setSelectedUser(null)}
          className="p-2 rounded-lg glass-panel-dark"
        >
          <ArrowLeft className="w-5 h-5 text-fernhill-sand" />
        </button>
        <div className="w-10 h-10 rounded-full glass-panel-dark overflow-hidden">
          {selectedUser.avatar_url ? (
            <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-fernhill-gold">
              {selectedUser.tribe_name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-fernhill-cream font-medium">{selectedUser.tribe_name}</p>
          <div className="flex items-center gap-1 text-fernhill-sand/60 text-xs">
            <Lock className="w-3 h-3" />
            <span>Encrypted</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.sender_id === currentUserId
                  ? 'bg-fernhill-gold text-fernhill-dark'
                  : 'glass-panel text-fernhill-cream'
              }`}
            >
              <p>{msg.decrypted_content || msg.encrypted_content}</p>
              <div className={`flex items-center gap-1 text-xs mt-1 ${
                msg.sender_id === currentUserId ? 'text-fernhill-dark/60' : 'text-fernhill-sand/60'
              }`}>
                {msg.is_encrypted === false && (
                  <span title="Not encrypted"><Unlock className="w-3 h-3" /></span>
                )}
                <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="glass-panel p-4">
        {/* Typing Indicator */}
        {selectedUser && (
          <TypingIndicator conversationType="dm" conversationId={selectedUser.id} />
        )}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-xl glass-panel-dark text-fernhill-cream placeholder-fernhill-sand/40 border-none focus:ring-2 focus:ring-fernhill-gold/50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            className="p-3 rounded-xl bg-fernhill-gold text-fernhill-dark disabled:opacity-50"
          >
            {sendingMessage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// IndexedDB helpers for private key storage
async function getStoredPrivateKey(userId: string): Promise<CryptoKey | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open('fernhill-keys', 1)
    
    request.onerror = () => resolve(null)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'userId' })
      }
    }
    
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('keys', 'readonly')
      const store = tx.objectStore('keys')
      const getRequest = store.get(userId)
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result?.privateKey || null)
      }
      getRequest.onerror = () => resolve(null)
    }
  })
}

async function storePrivateKey(userId: string, privateKey: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('fernhill-keys', 1)
    
    request.onerror = () => reject(new Error('Failed to open IndexedDB'))
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'userId' })
      }
    }
    
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('keys', 'readwrite')
      const store = tx.objectStore('keys')
      store.put({ userId, privateKey })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(new Error('Failed to store key'))
    }
  })
}
