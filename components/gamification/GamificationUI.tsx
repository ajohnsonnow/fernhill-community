'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLevelInfo, getXPForNextLevel, LEVEL_COLORS } from '@/lib/gamification'
import { Zap, TrendingUp, Flame, Star } from 'lucide-react'

interface LevelBadgeProps {
  xp: number
  size?: 'sm' | 'md' | 'lg'
  showXP?: boolean
}

/**
 * Displays a user's level badge with optional XP info
 */
export function LevelBadge({ xp, size = 'md', showXP = false }: LevelBadgeProps) {
  const info = getLevelInfo(xp)
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
  }
  
  return (
    <div className="flex items-center gap-2">
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-lg`}
        style={{ backgroundColor: info.color }}
        title={`${info.title} - Level ${info.level}`}
      >
        {info.level}
      </div>
      {showXP && (
        <div className="text-xs text-stone-400">
          <div className="font-medium" style={{ color: info.color }}>{info.title}</div>
          <div>{xp.toLocaleString()} XP</div>
        </div>
      )}
    </div>
  )
}

interface XPProgressBarProps {
  xp: number
  showNumbers?: boolean
  className?: string
}

/**
 * Shows progress toward next level
 */
export function XPProgressBar({ xp, showNumbers = true, className = '' }: XPProgressBarProps) {
  const info = getLevelInfo(xp)
  const { needed, progress } = getXPForNextLevel(xp)
  
  return (
    <div className={className}>
      {showNumbers && (
        <div className="flex justify-between text-xs text-stone-400 mb-1">
          <span>Level {info.level}</span>
          {!info.isMaxLevel && <span>{needed.toLocaleString()} XP to Level {info.level + 1}</span>}
          {info.isMaxLevel && <span>Max Level! 🎉</span>}
        </div>
      )}
      <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${progress * 100}%`,
            backgroundColor: info.color,
          }}
        />
      </div>
    </div>
  )
}

interface XPGainToastProps {
  amount: number
  reason: string
  onComplete?: () => void
}

/**
 * Animated XP gain notification
 */
export function XPGainToast({ amount, reason, onComplete }: XPGainToastProps) {
  const [visible, setVisible] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])
  
  if (!visible) return null
  
  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
      <div className="bg-gradient-to-r from-fernhill-gold to-yellow-500 text-fernhill-dark px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <Zap className="w-5 h-5" />
        <span className="font-bold">+{amount} XP</span>
        <span className="text-sm opacity-80">{reason}</span>
      </div>
    </div>
  )
}

interface StreakDisplayProps {
  streak: number
  longestStreak: number
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Shows current login streak
 */
export function StreakDisplay({ streak, longestStreak, size = 'md' }: StreakDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }
  
  const getStreakColor = (s: number) => {
    if (s >= 100) return 'text-yellow-400'
    if (s >= 30) return 'text-purple-400'
    if (s >= 7) return 'text-blue-400'
    return 'text-orange-400'
  }
  
  return (
    <div className={`flex items-center gap-3 ${sizeClasses[size]}`}>
      <div className="flex items-center gap-1">
        <Flame className={`w-5 h-5 ${getStreakColor(streak)}`} />
        <span className={`font-bold ${getStreakColor(streak)}`}>{streak}</span>
        <span className="text-stone-400">day streak</span>
      </div>
      {longestStreak > streak && (
        <div className="flex items-center gap-1 text-stone-500 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span>Best: {longestStreak}</span>
        </div>
      )}
    </div>
  )
}

interface AchievementBadgeProps {
  id: string
  name: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  unlocked: boolean
  unlockedAt?: string
  size?: 'sm' | 'md' | 'lg'
}

const RARITY_BG = {
  common: 'bg-stone-600',
  uncommon: 'bg-green-600',
  rare: 'bg-blue-600',
  epic: 'bg-purple-600',
  legendary: 'bg-gradient-to-r from-yellow-500 to-orange-500',
}

const RARITY_BORDER = {
  common: 'border-stone-400',
  uncommon: 'border-green-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-yellow-400',
}

/**
 * Individual achievement badge
 */
export function AchievementBadge({ 
  name, 
  icon, 
  rarity, 
  unlocked, 
  size = 'md' 
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl',
  }
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={`
          ${sizeClasses[size]} 
          ${unlocked ? RARITY_BG[rarity] : 'bg-stone-800'} 
          ${unlocked ? RARITY_BORDER[rarity] : 'border-stone-700'}
          border-2 rounded-full flex items-center justify-center
          ${unlocked ? 'shadow-lg' : 'opacity-50'}
          transition-all duration-300
        `}
        title={name}
      >
        <span className={unlocked ? '' : 'grayscale opacity-50'}>{icon}</span>
      </div>
      {size !== 'sm' && (
        <span className={`text-xs text-center ${unlocked ? 'text-stone-300' : 'text-stone-600'}`}>
          {name}
        </span>
      )}
    </div>
  )
}

interface LeaderboardRowProps {
  rank: number
  tribeName: string
  avatarUrl: string | null
  xp: number
  level: number
  isCurrentUser?: boolean
}

/**
 * Single row in the leaderboard
 */
export function LeaderboardRow({ 
  rank, 
  tribeName, 
  avatarUrl, 
  xp, 
  level, 
  isCurrentUser 
}: LeaderboardRowProps) {
  const getRankDisplay = () => {
    switch (rank) {
      case 1: return <span className="text-2xl">🥇</span>
      case 2: return <span className="text-2xl">🥈</span>
      case 3: return <span className="text-2xl">🥉</span>
      default: return <span className="text-stone-400 font-mono">#{rank}</span>
    }
  }
  
  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-lg
        ${isCurrentUser ? 'bg-fernhill-gold/20 border border-fernhill-gold/40' : 'bg-stone-800/50'}
      `}
    >
      <div className="w-10 text-center">{getRankDisplay()}</div>
      
      <div className="w-10 h-10 rounded-full bg-stone-700 overflow-hidden flex-shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-fernhill-gold font-bold">
            {tribeName?.[0]?.toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-stone-100 truncate">
          {tribeName}
          {isCurrentUser && <span className="text-fernhill-gold ml-2">(You)</span>}
        </div>
        <div className="text-sm text-stone-400">{xp.toLocaleString()} XP</div>
      </div>
      
      <LevelBadge xp={xp} size="sm" />
    </div>
  )
}

interface GamificationStatsProps {
  userId?: string
}

/**
 * Full gamification stats panel
 */
export function GamificationStats({ userId }: GamificationStatsProps) {
  const [stats, setStats] = useState<{
    xp: number
    streak: number
    longestStreak: number
    achievementCount: number
    totalAchievements: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // In a real implementation, this would fetch from the database
    // For now, using placeholder data
    setStats({
      xp: 1250,
      streak: 12,
      longestStreak: 23,
      achievementCount: 7,
      totalAchievements: 20,
    })
    setLoading(false)
  }, [userId])
  
  if (loading || !stats) {
    return <div className="animate-pulse bg-stone-800 rounded-xl h-40" />
  }
  
  const levelInfo = getLevelInfo(stats.xp)
  
  return (
    <div className="bg-stone-800 rounded-xl p-4 space-y-4">
      {/* Level & XP */}
      <div className="flex items-center gap-4">
        <LevelBadge xp={stats.xp} size="lg" showXP />
        <div className="flex-1">
          <XPProgressBar xp={stats.xp} />
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-stone-700/50 rounded-lg p-3 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="font-bold text-lg">{stats.streak}</div>
          <div className="text-xs text-stone-400">Day Streak</div>
        </div>
        
        <div className="bg-stone-700/50 rounded-lg p-3 text-center">
          <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="font-bold text-lg">{stats.achievementCount}</div>
          <div className="text-xs text-stone-400">Achievements</div>
        </div>
        
        <div className="bg-stone-700/50 rounded-lg p-3 text-center">
          <Zap className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="font-bold text-lg">{stats.xp.toLocaleString()}</div>
          <div className="text-xs text-stone-400">Total XP</div>
        </div>
      </div>
    </div>
  )
}
