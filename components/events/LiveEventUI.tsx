'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  type EventPresence, 
  type LiveChatMessage,
  PRESENCE_STATUSES, 
  LIVE_REACTIONS,
  calculateEnergyLevel,
  groupByStatus 
} from '@/lib/live-event'
import { haptic } from '@/lib/haptics'
import { 
  Users, 
  Zap, 
  MessageCircle, 
  Send, 
  Radio,
  Music,
  Sparkles
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface LiveEventHeaderProps {
  eventName: string
  attendeeCount: number
  energyLevel: number
  isLive: boolean
}

/**
 * Header bar showing live event status
 */
export function LiveEventHeader({ 
  eventName, 
  attendeeCount, 
  energyLevel, 
  isLive 
}: LiveEventHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-red-900/80 to-orange-900/80 rounded-xl p-4 border border-red-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLive && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500 rounded-full animate-pulse">
              <Radio className="w-3 h-3" />
              <span className="text-xs font-bold">LIVE</span>
            </div>
          )}
          <div>
            <h3 className="font-bold text-white">{eventName}</h3>
            <div className="flex items-center gap-2 text-sm text-stone-300">
              <Users className="w-4 h-4" />
              <span>{attendeeCount} dancing</span>
            </div>
          </div>
        </div>
        
        {/* Energy Meter */}
        <div className="text-center">
          <div className="flex items-center gap-1 mb-1">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-stone-300">Energy</span>
          </div>
          <div className="w-24 h-2 bg-stone-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-500"
              style={{ width: `${energyLevel}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface WhosDancingProps {
  attendees: EventPresence[]
  maxDisplay?: number
}

/**
 * Shows who's currently at the event
 */
export function WhosDancing({ attendees, maxDisplay = 20 }: WhosDancingProps) {
  const grouped = groupByStatus(attendees)
  const displayAttendees = attendees.slice(0, maxDisplay)
  const overflow = Math.max(0, attendees.length - maxDisplay)
  
  return (
    <div className="bg-stone-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-fernhill-gold" />
        <h3 className="font-semibold text-white">Who's Dancing</h3>
        <span className="text-stone-400 text-sm">({attendees.length})</span>
      </div>
      
      {/* Status Summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESENCE_STATUSES.map(status => {
          const count = grouped[status.id]?.length || 0
          if (count === 0) return null
          return (
            <div 
              key={status.id}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-stone-700 text-sm"
            >
              <span>{status.emoji}</span>
              <span className="text-stone-300">{count}</span>
            </div>
          )
        })}
      </div>
      
      {/* Avatar Grid */}
      <div className="flex flex-wrap gap-2">
        {displayAttendees.map((attendee) => (
          <div 
            key={attendee.userId}
            className="relative group"
            title={`${attendee.tribeName} - ${PRESENCE_STATUSES.find(s => s.id === attendee.status)?.label}`}
          >
            <div className="w-10 h-10 rounded-full bg-stone-700 overflow-hidden border-2 border-stone-600">
              {attendee.avatarUrl ? (
                <img src={attendee.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-fernhill-gold font-bold">
                  {attendee.tribeName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {/* Status indicator */}
            <span className="absolute -bottom-1 -right-1 text-sm">
              {PRESENCE_STATUSES.find(s => s.id === attendee.status)?.emoji}
            </span>
          </div>
        ))}
        
        {overflow > 0 && (
          <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center text-stone-400 text-sm font-medium">
            +{overflow}
          </div>
        )}
      </div>
    </div>
  )
}

interface StatusSelectorProps {
  currentStatus: string
  onChange: (status: string) => void
}

/**
 * Let user set their presence status
 */
export function StatusSelector({ currentStatus, onChange }: StatusSelectorProps) {
  return (
    <div className="bg-stone-800 rounded-xl p-4">
      <h4 className="text-sm text-stone-400 mb-2">What are you doing?</h4>
      <div className="flex flex-wrap gap-2">
        {PRESENCE_STATUSES.map((status) => (
          <button
            key={status.id}
            onClick={() => {
              haptic('light')
              onChange(status.id)
            }}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all
              ${currentStatus === status.id 
                ? 'bg-fernhill-gold text-fernhill-dark' 
                : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
              }
            `}
          >
            <span className="text-lg">{status.emoji}</span>
            <span className="text-sm">{status.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface LiveChatProps {
  messages: LiveChatMessage[]
  onSend: (content: string) => void
  onReaction: (emoji: string) => void
  disabled?: boolean
}

/**
 * Live event chat with reactions
 */
export function LiveChat({ messages, onSend, onReaction, disabled }: LiveChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSend = () => {
    if (!input.trim() || disabled) return
    haptic('light')
    onSend(input.trim())
    setInput('')
  }
  
  const handleReaction = (emoji: string) => {
    haptic('light')
    onReaction(emoji)
  }
  
  return (
    <div className="bg-stone-800 rounded-xl overflow-hidden flex flex-col" style={{ height: '400px' }}>
      {/* Header */}
      <div className="px-4 py-3 bg-stone-900/50 border-b border-stone-700 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-fernhill-gold" />
        <span className="font-semibold text-white">Live Chat</span>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`
              ${msg.type === 'reaction' 
                ? 'text-center' 
                : msg.type === 'system'
                  ? 'text-center text-stone-500 text-sm italic'
                  : 'flex items-start gap-2'
              }
            `}
          >
            {msg.type === 'reaction' ? (
              <span className="text-2xl animate-bounce">{msg.content}</span>
            ) : msg.type === 'system' ? (
              <span>{msg.content}</span>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-stone-700 overflow-hidden flex-shrink-0">
                  {msg.avatarUrl ? (
                    <img src={msg.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-fernhill-gold text-sm font-bold">
                      {msg.tribeName?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-stone-200 text-sm">{msg.tribeName}</span>
                    <span className="text-xs text-stone-500">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-stone-300 text-sm break-words">{msg.content}</p>
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick Reactions */}
      <div className="px-3 py-2 border-t border-stone-700 flex gap-1 overflow-x-auto no-scrollbar">
        {LIVE_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            disabled={disabled}
            className="text-xl hover:scale-125 transition-transform disabled:opacity-50"
          >
            {emoji}
          </button>
        ))}
      </div>
      
      {/* Input */}
      <div className="p-3 border-t border-stone-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Say something..."
          disabled={disabled}
          className="flex-1 px-3 py-2 rounded-lg bg-stone-700 border border-stone-600 text-white placeholder:text-stone-500 text-sm disabled:opacity-50"
          maxLength={200}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="p-2 rounded-lg bg-fernhill-gold text-fernhill-dark disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

interface NowPlayingProps {
  track?: {
    title: string
    artist: string
    artworkUrl?: string
  }
}

/**
 * Shows what's currently playing at the event
 */
export function NowPlaying({ track }: NowPlayingProps) {
  if (!track) return null
  
  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4 border border-purple-500/30">
      <div className="flex items-center gap-3">
        {track.artworkUrl ? (
          <img 
            src={track.artworkUrl} 
            alt="" 
            className="w-14 h-14 rounded-lg object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-stone-700 flex items-center justify-center">
            <Music className="w-6 h-6 text-stone-400" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-purple-400 uppercase tracking-wide">Now Playing</span>
            <span className="flex gap-0.5">
              <span className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
          <h4 className="font-bold text-white truncate">{track.title}</h4>
          <p className="text-sm text-stone-300 truncate">{track.artist}</p>
        </div>
      </div>
    </div>
  )
}
