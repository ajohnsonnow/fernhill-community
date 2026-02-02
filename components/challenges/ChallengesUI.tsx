'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Challenge, 
  UserChallenge, 
  selectDailyChallenges,
  formatTimeRemaining,
  checkChallengeProgress,
  getChallengeStreakMultiplier,
  WEEKLY_CHALLENGES 
} from '@/lib/daily-challenges';

// ============================================
// DAILY CHALLENGES CARD
// ============================================

interface DailyChallengesProps {
  userId: string;
  challenges: UserChallenge[];
  streak: number;
  onChallengeComplete?: (challenge: UserChallenge) => void;
}

export function DailyChallengesCard({ 
  challenges, 
  streak,
  onChallengeComplete 
}: DailyChallengesProps) {
  const completedCount = challenges.filter(c => c.isCompleted).length;
  const totalCount = challenges.length;
  const allCompleted = completedCount === totalCount;
  const multiplier = getChallengeStreakMultiplier(streak);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Daily Challenges
            </h3>
            <p className="text-xs text-gray-500">
              {completedCount}/{totalCount} completed
            </p>
          </div>
        </div>
        
        {/* Streak Badge */}
        {streak > 0 && (
          <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
            <span className="text-sm">🔥</span>
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
              {streak} day{streak !== 1 ? 's' : ''}
            </span>
            {multiplier > 1 && (
              <span className="text-xs text-orange-500">
                ({multiplier}x)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            allCompleted 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
              : 'bg-gradient-to-r from-blue-400 to-purple-500'
          }`}
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Challenges List */}
      <div className="space-y-3">
        {challenges.map((userChallenge) => (
          <ChallengeItem 
            key={userChallenge.id} 
            userChallenge={userChallenge}
            onComplete={onChallengeComplete}
          />
        ))}
      </div>

      {/* Bonus XP Message */}
      {allCompleted && (
        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎉</span>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                All Challenges Complete!
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                +25 Bonus XP earned
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// CHALLENGE ITEM
// ============================================

interface ChallengeItemProps {
  userChallenge: UserChallenge;
  onComplete?: (challenge: UserChallenge) => void;
}

function ChallengeItem({ userChallenge, onComplete }: ChallengeItemProps) {
  const { challenge, progress, isCompleted, expiresAt } = userChallenge;
  const { isComplete, remaining } = checkChallengeProgress(challenge, progress);

  return (
    <div 
      className={`p-3 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`text-2xl ${isCompleted ? 'grayscale-0' : ''}`}>
          {isCompleted ? '✅' : challenge.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium ${
              isCompleted 
                ? 'text-green-800 dark:text-green-200 line-through' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {challenge.title}
            </h4>
            <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
              +{challenge.xpReward} XP
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {challenge.description}
          </p>

          {/* Progress */}
          {!isCompleted && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{progress}/{challenge.requirement.count}</span>
                <span>{formatTimeRemaining(expiresAt)}</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${(progress / challenge.requirement.count) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// WEEKLY CHALLENGES SECTION
// ============================================

interface WeeklyChallengesProps {
  challenges: UserChallenge[];
}

export function WeeklyChallengesCard({ challenges }: WeeklyChallengesProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">⚔️</span>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Weekly Challenges
          </h3>
          <p className="text-xs text-gray-500">
            Bigger rewards, bigger goals
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {challenges.map((userChallenge) => (
          <ChallengeItem 
            key={userChallenge.id} 
            userChallenge={userChallenge}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// CHALLENGE COMPLETION MODAL
// ============================================

interface ChallengeCompleteModalProps {
  challenge: Challenge;
  xpEarned: number;
  bonusXp?: number;
  onClose: () => void;
}

export function ChallengeCompleteModal({
  challenge,
  xpEarned,
  bonusXp = 0,
  onClose,
}: ChallengeCompleteModalProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-xl animate-scaleIn">
        <div className="text-5xl mb-4">{challenge.icon}</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Challenge Complete!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {challenge.title}
        </p>
        
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            +{xpEarned} XP
          </span>
          {bonusXp > 0 && (
            <span className="text-lg font-medium text-yellow-600 dark:text-yellow-400">
              +{bonusXp} bonus
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPORT
// ============================================

export default DailyChallengesCard;
