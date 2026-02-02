'use client';

// ==============================================
// Live Presence UI Components
// Phase J: Supernova v1.16.0
// ==============================================

import React, { useState, useEffect } from 'react';
import {
  formatViewerCount,
  formatTypingIndicator,
  getViewerSummary,
  ACTIVITY_PULSE,
  getPresenceMessage,
  type UserPresence,
  type PresenceStatus,
} from '@/lib/live-presence';

interface PresenceBadgeProps {
  viewers: UserPresence[];
  showAvatars?: boolean;
  maxAvatars?: number;
}

export function PresenceBadge({
  viewers,
  showAvatars = true,
  maxAvatars = 3,
}: PresenceBadgeProps) {
  const summary = getViewerSummary(viewers);
  const displayedViewers = viewers.slice(0, maxAvatars);
  const overflow = viewers.length - maxAvatars;

  return (
    <div className="flex items-center gap-2">
      {/* Live dot */}
      <div className="relative">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
      </div>

      {/* Avatar stack */}
      {showAvatars && displayedViewers.length > 0 && (
        <div className="flex -space-x-2">
          {displayedViewers.map((viewer, idx) => (
            <div
              key={viewer.id}
              className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 overflow-hidden"
              style={{ zIndex: maxAvatars - idx }}
              title={viewer.name}
            >
              {viewer.avatarUrl ? (
                <img
                  src={viewer.avatarUrl}
                  alt={viewer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                  {viewer.name.charAt(0)}
                </div>
              )}
            </div>
          ))}
          {overflow > 0 && (
            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
              +{overflow}
            </div>
          )}
        </div>
      )}

      {/* Count text */}
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {summary.text}
      </span>
    </div>
  );
}

interface PresenceListProps {
  viewers: UserPresence[];
  onViewerClick?: (viewer: UserPresence) => void;
}

export function PresenceList({ viewers, onViewerClick }: PresenceListProps) {
  const sortedViewers = [...viewers].sort((a, b) => {
    // Sort by status: typing > engaged > viewing > away
    const order: Record<PresenceStatus, number> = {
      typing: 0,
      engaged: 1,
      viewing: 2,
      away: 3,
      offline: 4,
    };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {formatViewerCount(viewers.length)}
      </h3>
      <ul className="space-y-1 max-h-60 overflow-y-auto">
        {sortedViewers.map(viewer => (
          <li
            key={viewer.id}
            onClick={() => onViewerClick?.(viewer)}
            className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
              onViewerClick ? 'cursor-pointer' : ''
            }`}
          >
            <StatusIndicator status={viewer.status} />
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {viewer.avatarUrl ? (
                <img
                  src={viewer.avatarUrl}
                  alt={viewer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                  {viewer.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{viewer.name}</p>
              <p className="text-xs text-gray-500">
                {viewer.isTyping ? 'typing...' : ACTIVITY_PULSE[viewer.status].label}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusIndicator({ status }: { status: PresenceStatus }) {
  const config = ACTIVITY_PULSE[status];
  return (
    <div className="relative">
      <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
      {config.animation && (
        <div
          className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${config.color} ${config.animation} opacity-75`}
        />
      )}
    </div>
  );
}

interface TypingIndicatorProps {
  typingUsers: UserPresence[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{formatTypingIndicator(typingUsers)}</span>
    </div>
  );
}

interface JoinNotificationProps {
  user: UserPresence;
  type: 'join' | 'leave' | 'return';
  onDismiss: () => void;
}

export function JoinNotification({ user, type, onDismiss }: JoinNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="animate-slide-in-right bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center gap-3 max-w-xs">
      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-purple-400 to-pink-400 text-white">
            {user.name.charAt(0)}
          </div>
        )}
      </div>
      <p className="text-sm flex-1">{getPresenceMessage(type, user.name)}</p>
    </div>
  );
}

// Real-time presence hook (mock implementation)
export function usePresence(roomId: string) {
  const [viewers, setViewers] = useState<UserPresence[]>([]);
  const [typingUsers, setTypingUsers] = useState<UserPresence[]>([]);

  // In a real app, this would connect to Supabase Realtime
  useEffect(() => {
    // Mock data for demo
    const mockViewers: UserPresence[] = [
      {
        id: '1',
        name: 'Luna',
        status: 'engaged',
        lastSeen: new Date(),
        currentPage: '/events/123',
        isTyping: false,
        joinedAt: new Date(),
        device: 'mobile',
      },
      {
        id: '2',
        name: 'River',
        status: 'viewing',
        lastSeen: new Date(),
        currentPage: '/events/123',
        isTyping: false,
        joinedAt: new Date(),
        device: 'desktop',
      },
    ];
    setViewers(mockViewers);
  }, [roomId]);

  const startTyping = () => {
    // Send typing indicator
  };

  const stopTyping = () => {
    // Stop typing indicator
  };

  return {
    viewers,
    typingUsers,
    viewerCount: viewers.length,
    startTyping,
    stopTyping,
  };
}

export default PresenceBadge;
