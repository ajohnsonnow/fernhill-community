'use client'

import { useState, useEffect } from 'react'
import { MOODS, getMood, getSupportMessage, type Mood } from '@/lib/mood-system'
import { haptic } from '@/lib/haptics'
import { toast } from 'sonner'
import { X, Sparkles, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MoodPickerProps {
  onSelect: (mood: Mood, note?: string) => void
  isOpen: boolean
  onClose: () => void
}

/**
 * Modal mood picker for daily check-in
 */
export function MoodPicker({ onSelect, isOpen, onClose }: MoodPickerProps) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [note, setNote] = useState('')
  const [step, setStep] = useState<'pick' | 'note'>('pick')
  const [isPublic, setIsPublic] = useState(true)
  
  if (!isOpen) return null
  
  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood)
    haptic('light')
    setStep('note')
  }
  
  const handleSubmit = () => {
    if (selectedMood) {
      haptic('success')
      onSelect(selectedMood, note || undefined)
      toast.success(getSupportMessage(selectedMood.id))
      
      // Reset for next time
      setSelectedMood(null)
      setNote('')
      setStep('pick')
      onClose()
    }
  }
  
  const handleBack = () => {
    setStep('pick')
    setSelectedMood(null)
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-stone-900 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-stone-400"
        >
          <X className="w-5 h-5" />
        </button>
        
        {step === 'pick' && (
          <>
            <div className="text-center mb-6">
              <Sparkles className="w-8 h-8 text-fernhill-gold mx-auto mb-2" />
              <h2 className="text-xl font-bold text-white">How are you feeling?</h2>
              <p className="text-stone-400 text-sm">Share your vibe with the community</p>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-stone-800 hover:bg-stone-700 transition-all active:scale-95"
                  style={{ borderColor: mood.color, borderWidth: '2px', borderStyle: 'solid', borderOpacity: 0.3 }}
                >
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="text-xs text-stone-400">{mood.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
        
        {step === 'note' && selectedMood && (
          <>
            <button
              onClick={handleBack}
              className="text-stone-400 text-sm mb-4 hover:text-white"
            >
              ← Back
            </button>
            
            <div className="text-center mb-6">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-4xl mx-auto mb-3"
                style={{ backgroundColor: `${selectedMood.color}20` }}
              >
                {selectedMood.emoji}
              </div>
              <h2 className="text-xl font-bold text-white">Feeling {selectedMood.label}</h2>
              <p className="text-stone-400 text-sm">Add a note (optional)</p>
            </div>
            
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 rounded-xl bg-stone-800 border border-stone-700 text-white placeholder:text-stone-500 resize-none"
              rows={3}
              maxLength={200}
            />
            
            <div className="flex items-center justify-between mt-4 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded accent-fernhill-gold"
                />
                <span className="text-sm text-stone-400">Share with community</span>
              </label>
              <span className="text-xs text-stone-500">{note.length}/200</span>
            </div>
            
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-fernhill-gold text-fernhill-dark font-bold hover:opacity-90 transition-opacity"
            >
              Check In
            </button>
          </>
        )}
      </div>
    </div>
  )
}

interface CommunityVibeCardProps {
  totalCheckins: number
  topMoods: { moodId: string; count: number; percentage: number }[]
  averageEnergy: number
  vibeShift: 'up' | 'down' | 'stable'
  onCheckIn: () => void
  hasCheckedInToday: boolean
}

/**
 * Shows community-wide mood stats
 */
export function CommunityVibeCard({
  totalCheckins,
  topMoods,
  averageEnergy,
  vibeShift,
  onCheckIn,
  hasCheckedInToday,
}: CommunityVibeCardProps) {
  const getShiftIcon = () => {
    switch (vibeShift) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />
      default: return <Minus className="w-4 h-4 text-stone-400" />
    }
  }
  
  return (
    <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-5 border border-stone-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-fernhill-gold" />
          <span className="font-semibold text-white">Community Vibe</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-stone-400">
          {getShiftIcon()}
          <span>{totalCheckins} check-ins today</span>
        </div>
      </div>
      
      {/* Top Moods */}
      <div className="flex items-center gap-2 mb-4">
        {topMoods.slice(0, 4).map(({ moodId, percentage }) => {
          const mood = getMood(moodId)
          if (!mood) return null
          return (
            <div 
              key={moodId}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
              style={{ backgroundColor: `${mood.color}20` }}
            >
              <span>{mood.emoji}</span>
              <span className="text-stone-300">{percentage}%</span>
            </div>
          )
        })}
      </div>
      
      {/* Energy Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-stone-400 mb-1">
          <span>Community Energy</span>
          <span>{averageEnergy}%</span>
        </div>
        <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500"
            style={{ width: `${averageEnergy}%` }}
          />
        </div>
      </div>
      
      {/* Check-in Button */}
      <button
        onClick={onCheckIn}
        disabled={hasCheckedInToday}
        className={`
          w-full py-3 rounded-xl font-medium transition-all
          ${hasCheckedInToday 
            ? 'bg-stone-700 text-stone-400 cursor-not-allowed' 
            : 'bg-fernhill-gold text-fernhill-dark hover:opacity-90 active:scale-98'
          }
        `}
      >
        {hasCheckedInToday ? '✓ You\'ve checked in today' : 'Share Your Vibe'}
      </button>
    </div>
  )
}

interface MoodHistoryProps {
  entries: { moodId: string; createdAt: string; note?: string }[]
}

/**
 * Shows user's mood history
 */
export function MoodHistory({ entries }: MoodHistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-stone-500">
        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No mood entries yet</p>
        <p className="text-sm">Start tracking your vibes!</p>
      </div>
    )
  }
  
  // Group by date
  const grouped = entries.reduce((acc, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {} as Record<string, typeof entries>)
  
  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, dayEntries]) => (
        <div key={date}>
          <h4 className="text-sm text-stone-400 mb-2">{date}</h4>
          <div className="flex flex-wrap gap-2">
            {dayEntries.map((entry, i) => {
              const mood = getMood(entry.moodId)
              if (!mood) return null
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-800"
                  title={entry.note || mood.label}
                >
                  <span className="text-xl">{mood.emoji}</span>
                  <span className="text-sm text-stone-300">{mood.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
