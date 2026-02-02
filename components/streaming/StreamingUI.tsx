'use client';

// ==============================================
// Live Streaming UI Components
// Phase J: Supernova v1.16.0
// ==============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  formatViewerCount,
  formatStreamDuration,
  getTimeUntilStream,
  STREAM_REACTIONS,
  STREAM_STATUS_BADGES,
  QUALITY_PRESETS,
  moderateMessage,
  generateReactionPosition,
  type LiveStream,
  type StreamChatMessage,
  type StreamReaction,
  type StreamQuality,
  type StreamStatus,
} from '@/lib/live-streaming';

interface StreamPlayerProps {
  stream: LiveStream;
  onClose?: () => void;
}

export function StreamPlayer({ stream, onClose }: StreamPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(stream.status === 'live');
  const [isMuted, setIsMuted] = useState(false);
  const [quality, setQuality] = useState<StreamQuality>('auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls
  useEffect(() => {
    if (!showControls) return;
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls]);

  // Watch time tracker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => setWatchTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const statusBadge = STREAM_STATUS_BADGES[stream.status];

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden aspect-video"
      onMouseMove={() => setShowControls(true)}
      onClick={() => setShowControls(true)}
    >
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay={stream.status === 'live'}
        muted={isMuted}
        playsInline
      >
        {stream.playbackUrl && (
          <source src={stream.playbackUrl} type="application/x-mpegURL" />
        )}
      </video>

      {/* Status badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span
          className={`px-2 py-1 rounded text-xs font-bold text-white ${statusBadge.color} ${
            statusBadge.pulse ? 'animate-pulse' : ''
          }`}
        >
          {statusBadge.label}
        </span>
        <span className="px-2 py-1 rounded bg-black/50 text-white text-xs">
          {formatViewerCount(stream.currentViewers)}
        </span>
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
        >
          ✕
        </button>
      )}

      {/* Floating reactions */}
      <FloatingReactions streamId={stream.id} />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Mute */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            {/* Watch time */}
            <span className="text-white text-sm">
              {formatStreamDuration(watchTime)}
            </span>

            <div className="flex-1" />

            {/* Quality */}
            <select
              value={quality}
              onChange={e => setQuality(e.target.value as StreamQuality)}
              className="bg-white/20 text-white text-sm rounded px-2 py-1"
            >
              {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.label}
                </option>
              ))}
            </select>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
            >
              {isFullscreen ? '⊙' : '⛶'}
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled/ended overlay */}
      {stream.status === 'scheduled' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
          <span className="text-5xl mb-4">📅</span>
          <h3 className="text-xl font-bold">{stream.title}</h3>
          <p className="text-gray-400 mt-2">{getTimeUntilStream(stream.scheduledStart)}</p>
          <button className="mt-4 px-6 py-2 bg-purple-500 rounded-full text-sm font-medium">
            Set Reminder
          </button>
        </div>
      )}

      {stream.status === 'ended' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
          <span className="text-5xl mb-4">🎬</span>
          <h3 className="text-xl font-bold">Stream Ended</h3>
          <p className="text-gray-400 mt-2">Thanks for dancing with us! 💃</p>
        </div>
      )}
    </div>
  );
}

interface StreamChatProps {
  streamId: string;
  messages: StreamChatMessage[];
  onSendMessage: (content: string) => void;
  moderationLevel: 'none' | 'basic' | 'strict';
}

export function StreamChat({ streamId, messages, onSendMessage, moderationLevel }: StreamChatProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const modResult = moderateMessage(input, moderationLevel);
    if (!modResult.allowed) {
      setError(modResult.reason || 'Message blocked');
      return;
    }

    onSendMessage(input.trim());
    setInput('');
    setError('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold">Live Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map(msg => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700">
        {error && (
          <p className="text-xs text-red-500 mb-2">{error}</p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Say something..."
            className="flex-1 px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            maxLength={200}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-500 text-white rounded-full text-sm hover:bg-purple-600"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function ChatMessageItem({ message }: { message: StreamChatMessage }) {
  return (
    <div className={`flex gap-2 ${message.isPinned ? 'bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg' : ''}`}>
      <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
        {message.userAvatarUrl ? (
          <img src={message.userAvatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-purple-400 to-pink-400 text-white">
            {message.userName.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className={`text-sm font-medium ${message.isHost ? 'text-purple-600' : ''}`}>
            {message.userName}
          </span>
          {message.isHost && (
            <span className="px-1 py-0.5 bg-purple-500 text-white text-[10px] rounded">HOST</span>
          )}
          {message.isModerator && (
            <span className="px-1 py-0.5 bg-green-500 text-white text-[10px] rounded">MOD</span>
          )}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
          {message.content}
        </p>
      </div>
    </div>
  );
}

interface ReactionBarProps {
  streamId: string;
  onReact: (emoji: string) => void;
}

export function ReactionBar({ streamId, onReact }: ReactionBarProps) {
  return (
    <div className="flex gap-2 p-2">
      {STREAM_REACTIONS.map(reaction => (
        <button
          key={reaction.emoji}
          onClick={() => onReact(reaction.emoji)}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl hover:scale-125 transition-transform"
          title={reaction.label}
        >
          {reaction.emoji}
        </button>
      ))}
    </div>
  );
}

function FloatingReactions({ streamId }: { streamId: string }) {
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; x: number; y: number }>>([]);

  // In a real app, this would listen to realtime reactions
  useEffect(() => {
    // Demo: Add random reactions
    const interval = setInterval(() => {
      const randomReaction = STREAM_REACTIONS[Math.floor(Math.random() * STREAM_REACTIONS.length)];
      const pos = generateReactionPosition();
      
      const newReaction = {
        id: Date.now().toString(),
        emoji: randomReaction.emoji,
        x: pos.x,
        y: pos.y,
      };
      
      setReactions(prev => [...prev.slice(-10), newReaction]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {reactions.map(reaction => (
        <div
          key={reaction.id}
          className="absolute text-3xl animate-float-up"
          style={{
            left: `${reaction.x}%`,
            bottom: 0,
          }}
        >
          {reaction.emoji}
        </div>
      ))}

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-300px) scale(1.5);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

interface StreamCardProps {
  stream: LiveStream;
  onClick: () => void;
}

export function StreamCard({ stream, onClick }: StreamCardProps) {
  const statusBadge = STREAM_STATUS_BADGES[stream.status];

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
        {stream.thumbnailUrl ? (
          <img src={stream.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🎥
          </div>
        )}
        
        <span
          className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold text-white ${statusBadge.color}`}
        >
          {statusBadge.label}
        </span>

        {stream.status === 'live' && (
          <span className="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 text-white text-xs">
            {formatViewerCount(stream.currentViewers)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold truncate">{stream.title}</h3>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
            {stream.hostAvatarUrl ? (
              <img src={stream.hostAvatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                {stream.hostName.charAt(0)}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500">{stream.hostName}</span>
        </div>
        
        {stream.status === 'scheduled' && (
          <p className="text-sm text-purple-500 mt-2">
            {getTimeUntilStream(stream.scheduledStart)}
          </p>
        )}
      </div>
    </div>
  );
}

export default StreamPlayer;
