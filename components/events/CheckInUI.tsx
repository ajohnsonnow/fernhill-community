'use client'

import { useState, useEffect } from 'react'
import { generateQRCodeDataUrl, type CheckInStats } from '@/lib/qr-checkin'
import { haptic } from '@/lib/haptics'
import { toast } from 'sonner'
import { QrCode, Users, UserPlus, RefreshCw, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface QRCodeDisplayProps {
  checkInUrl: string
  eventName: string
  eventTime: string
}

/**
 * Displays QR code for event check-in
 */
export function QRCodeDisplay({ checkInUrl, eventName, eventTime }: QRCodeDisplayProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    generateQRCodeDataUrl(checkInUrl).then(url => {
      setQrUrl(url)
      setLoading(false)
    })
  }, [checkInUrl])
  
  return (
    <div className="bg-white rounded-2xl p-6 text-center">
      <h3 className="text-stone-900 font-bold text-lg mb-1">{eventName}</h3>
      <p className="text-stone-500 text-sm mb-4">{eventTime}</p>
      
      {loading ? (
        <div className="w-64 h-64 mx-auto bg-stone-100 rounded-xl flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-stone-400 animate-spin" />
        </div>
      ) : qrUrl ? (
        <img 
          src={qrUrl} 
          alt="Event Check-in QR Code"
          className="w-64 h-64 mx-auto rounded-xl"
        />
      ) : (
        <div className="w-64 h-64 mx-auto bg-stone-100 rounded-xl flex items-center justify-center">
          <QrCode className="w-16 h-16 text-stone-300" />
        </div>
      )}
      
      <p className="text-stone-600 text-sm mt-4">
        Scan to check in at the event
      </p>
    </div>
  )
}

interface LiveAttendanceCounterProps {
  stats: CheckInStats
  onRefresh: () => void
  isRefreshing: boolean
}

/**
 * Shows live attendance count and recent check-ins
 */
export function LiveAttendanceCounter({ stats, onRefresh, isRefreshing }: LiveAttendanceCounterProps) {
  return (
    <div className="bg-gradient-to-br from-fernhill-moss to-fernhill-dark rounded-2xl p-5 border border-fernhill-gold/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-fernhill-gold" />
          <span className="font-semibold text-white">Live Attendance</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-stone-800/50 text-stone-400 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Big Number */}
      <div className="text-center mb-4">
        <div className="text-6xl font-bold text-fernhill-gold">{stats.totalCheckedIn}</div>
        <div className="text-stone-400">dancers checked in</div>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-stone-800/50 rounded-xl p-3 text-center">
          <UserPlus className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-white">{stats.firstTimeAttendees}</div>
          <div className="text-xs text-stone-400">First-timers</div>
        </div>
        <div className="bg-stone-800/50 rounded-xl p-3 text-center">
          <Sparkles className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-white">{stats.returningAttendees}</div>
          <div className="text-xs text-stone-400">Returning</div>
        </div>
      </div>
      
      {/* Recent Check-ins */}
      {stats.recentCheckins.length > 0 && (
        <div>
          <h4 className="text-sm text-stone-400 mb-2">Recent arrivals</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.recentCheckins.map((checkin, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg bg-stone-800/30 animate-fadeIn"
              >
                <div className="w-8 h-8 rounded-full bg-stone-700 overflow-hidden flex-shrink-0">
                  {checkin.avatarUrl ? (
                    <img src={checkin.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-fernhill-gold text-sm font-bold">
                      {checkin.tribeName?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{checkin.tribeName}</div>
                  <div className="text-xs text-stone-500">
                    {formatDistanceToNow(new Date(checkin.checkedInAt), { addSuffix: true })}
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface CheckInButtonProps {
  eventId: string
  eventSecret: string
  onCheckIn: () => Promise<void>
  isCheckedIn: boolean
  isLoading: boolean
}

/**
 * Button for manual check-in (when scanning QR)
 */
export function CheckInButton({ 
  onCheckIn, 
  isCheckedIn, 
  isLoading 
}: CheckInButtonProps) {
  const handleCheckIn = async () => {
    if (isCheckedIn || isLoading) return
    
    haptic('success')
    await onCheckIn()
    toast.success('🎉 You\'re checked in! Enjoy the dance!')
  }
  
  return (
    <button
      onClick={handleCheckIn}
      disabled={isCheckedIn || isLoading}
      className={`
        w-full py-4 rounded-2xl font-bold text-lg transition-all
        flex items-center justify-center gap-2
        ${isCheckedIn 
          ? 'bg-green-600 text-white cursor-default' 
          : 'bg-fernhill-gold text-fernhill-dark hover:opacity-90 active:scale-98'
        }
        ${isLoading ? 'opacity-70' : ''}
      `}
    >
      {isLoading ? (
        <>
          <RefreshCw className="w-5 h-5 animate-spin" />
          Checking in...
        </>
      ) : isCheckedIn ? (
        <>
          <CheckCircle2 className="w-5 h-5" />
          You're Checked In!
        </>
      ) : (
        <>
          <QrCode className="w-5 h-5" />
          Check In to Event
        </>
      )}
    </button>
  )
}

interface CheckInSuccessProps {
  eventName: string
  xpEarned: number
  streak?: number
  onClose: () => void
}

/**
 * Success animation/modal after check-in
 */
export function CheckInSuccess({ eventName, xpEarned, streak, onClose }: CheckInSuccessProps) {
  useEffect(() => {
    haptic('success')
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      <div className="relative bg-gradient-to-br from-fernhill-moss to-fernhill-dark rounded-3xl p-8 text-center animate-scale-in">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">You're In!</h2>
        <p className="text-stone-300 mb-4">{eventName}</p>
        
        <div className="bg-stone-800/50 rounded-xl p-4 mb-4">
          <div className="text-3xl font-bold text-fernhill-gold">+{xpEarned} XP</div>
          <div className="text-sm text-stone-400">Event check-in bonus</div>
        </div>
        
        {streak && streak > 1 && (
          <div className="text-sm text-orange-400">
            🔥 {streak} events in a row! Keep the streak going!
          </div>
        )}
        
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 rounded-full bg-stone-700 text-white hover:bg-stone-600"
        >
          Let's Dance!
        </button>
      </div>
    </div>
  )
}
