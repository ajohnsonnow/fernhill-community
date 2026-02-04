'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Story,
  StoryRing,
  StoryType,
  StoryContent,
  TextStoryContent,
  PollStoryContent,
  MoodStoryContent,
  ShoutoutStoryContent,
  STORY_BACKGROUNDS,
  STORY_REACTIONS,
  isStoryActive,
  getStoryTimeRemaining,
  groupStoriesByUser,
  createTextStory,
  updatePollVotes,
} from '@/lib/stories';

// ============================================
// STORY RINGS BAR (Top of feed)
// ============================================

interface StoryRingsBarProps {
  stories: Story[];
  currentUserId: string;
  onCreateStory: () => void;
  onViewStory: (ring: StoryRing, index: number) => void;
}

export function StoryRingsBar({
  stories,
  currentUserId,
  onCreateStory,
  onViewStory,
}: StoryRingsBarProps) {
  const rings = groupStoriesByUser(stories, currentUserId);
  
  return (
    <div className="flex gap-3 overflow-x-auto py-3 px-4 scrollbar-hide">
      {/* Create Story Button */}
      <button
        onClick={onCreateStory}
        className="flex-shrink-0 flex flex-col items-center gap-1"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
          <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
            <span className="text-2xl">+</span>
          </div>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Your Story
        </span>
      </button>

      {/* Story Rings */}
      {rings.map((ring, index) => (
        <StoryRingAvatar
          key={ring.userId}
          ring={ring}
          onClick={() => onViewStory(ring, 0)}
        />
      ))}
    </div>
  );
}

// ============================================
// STORY RING AVATAR
// ============================================

interface StoryRingAvatarProps {
  ring: StoryRing;
  onClick: () => void;
}

function StoryRingAvatar({ ring, onClick }: StoryRingAvatarProps) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex flex-col items-center gap-1"
    >
      <div 
        className={`w-16 h-16 rounded-full p-0.5 ${
          ring.hasUnviewed
            ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
          {ring.userAvatar ? (
            <img
              src={ring.userAvatar}
              alt={ring.userName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium">
              {ring.userName.charAt(0)}
            </div>
          )}
        </div>
      </div>
      <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[64px]">
        {ring.isOwnStory ? 'You' : ring.userName.split(' ')[0]}
      </span>
    </button>
  );
}

// ============================================
// STORY VIEWER
// ============================================

interface StoryViewerProps {
  ring: StoryRing;
  initialIndex?: number;
  onClose: () => void;
  onReact?: (storyId: string, emoji: string) => void;
  onVotePoll?: (storyId: string, optionId: string) => void;
}

export function StoryViewer({
  ring,
  initialIndex = 0,
  onClose,
  onReact,
  onVotePoll,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  const currentStory = ring.stories[currentIndex];
  const storyDuration = 5000; // 5 seconds per story

  useEffect(() => {
    if (isPaused) return;
    
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next story
          if (currentIndex < ring.stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + (100 / (storyDuration / 50));
      });
    }, 50);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, isPaused, ring.stories.length, onClose]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const goToNext = () => {
    if (currentIndex < ring.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
        {ring.stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-50"
              style={{
                width: index < currentIndex
                  ? '100%'
                  : index === currentIndex
                  ? `${progress}%`
                  : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          {ring.userAvatar ? (
            <img
              src={ring.userAvatar}
              alt={ring.userName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium border-2 border-white">
              {ring.userName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-white font-medium text-sm">{ring.userName}</p>
            <p className="text-white/70 text-xs">
              {getStoryTimeRemaining(currentStory)}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-white text-2xl"
        >
          ×
        </button>
      </div>

      {/* Story Content */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <StoryContentRenderer 
          story={currentStory} 
          onVotePoll={onVotePoll}
        />
      </div>

      {/* Navigation Zones */}
      <div className="absolute inset-0 flex">
        <button
          onClick={goToPrevious}
          className="w-1/3 h-full focus:outline-none"
          aria-label="Previous story"
        />
        <div className="w-1/3" />
        <button
          onClick={goToNext}
          className="w-1/3 h-full focus:outline-none"
          aria-label="Next story"
        />
      </div>

      {/* Reactions */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 px-4">
        {STORY_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReact?.(currentStory.id, emoji)}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-2xl hover:bg-white/20 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// STORY CONTENT RENDERER
// ============================================

interface StoryContentRendererProps {
  story: Story;
  onVotePoll?: (storyId: string, optionId: string) => void;
}

function StoryContentRenderer({ story, onVotePoll }: StoryContentRendererProps) {
  switch (story.type) {
    case 'text':
      return <TextStoryView content={story.content as TextStoryContent} />;
    case 'poll':
      return (
        <PollStoryView 
          content={story.content as PollStoryContent} 
          storyId={story.id}
          onVote={onVotePoll}
        />
      );
    case 'mood':
      return <MoodStoryView content={story.content as MoodStoryContent} />;
    case 'shoutout':
      return <ShoutoutStoryView content={story.content as ShoutoutStoryContent} />;
    case 'photo':
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <img
            src={(story.content as { imageUrl: string }).imageUrl}
            alt="Story"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              console.error('Story image failed to load:', (story.content as { imageUrl: string }).imageUrl);
              e.currentTarget.src = '/placeholder-image.png';
            }}
          />
        </div>
      );
    default:
      return null;
  }
}

function TextStoryView({ content }: { content: TextStoryContent }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center p-8"
      style={{ background: content.backgroundColor }}
    >
      <p
        className="text-2xl md:text-3xl font-medium"
        style={{
          color: content.textColor,
          textAlign: content.alignment,
          fontWeight: content.fontStyle === 'bold' ? 700 : 400,
        }}
      >
        {content.text}
      </p>
    </div>
  );
}

function PollStoryView({ 
  content, 
  storyId,
  onVote 
}: { 
  content: PollStoryContent;
  storyId: string;
  onVote?: (storyId: string, optionId: string) => void;
}) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-8"
      style={{ background: content.backgroundColor }}
    >
      <h2 className="text-2xl font-bold text-white mb-8 text-center">
        {content.question}
      </h2>
      
      <div className="w-full max-w-sm space-y-3">
        {content.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onVote?.(storyId, option.id)}
            className="w-full p-4 bg-white/20 backdrop-blur rounded-xl text-white font-medium flex items-center justify-between hover:bg-white/30 transition-colors"
          >
            <span>{option.emoji} {option.text}</span>
            {content.totalVotes > 0 && (
              <span>{option.percentage}%</span>
            )}
          </button>
        ))}
      </div>
      
      {content.totalVotes > 0 && (
        <p className="mt-4 text-white/70 text-sm">
          {content.totalVotes} vote{content.totalVotes !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

function MoodStoryView({ content }: { content: MoodStoryContent }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-8"
      style={{ background: content.backgroundColor }}
    >
      <span className="text-8xl mb-4">{content.moodEmoji}</span>
      <h2 className="text-3xl font-bold text-white mb-2">
        Feeling {content.mood}
      </h2>
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`w-3 h-8 rounded-full ${
              level <= content.energy
                ? 'bg-white'
                : 'bg-white/30'
            }`}
          />
        ))}
      </div>
      {content.message && (
        <p className="text-white/90 text-lg text-center">
          {content.message}
        </p>
      )}
    </div>
  );
}

function ShoutoutStoryView({ content }: { content: ShoutoutStoryContent }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-8"
      style={{ background: content.backgroundColor }}
    >
      <span className="text-6xl mb-4">{content.emoji}</span>
      <p className="text-white/70 text-sm mb-2">Shoutout to</p>
      
      {content.recipientAvatar ? (
        <img
          src={content.recipientAvatar}
          alt={content.recipientName}
          className="w-20 h-20 rounded-full object-cover border-4 border-white mb-3"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center text-3xl text-white font-bold mb-3">
          {content.recipientName.charAt(0)}
        </div>
      )}
      
      <h2 className="text-2xl font-bold text-white mb-4">
        {content.recipientName}
      </h2>
      
      <p className="text-white text-lg text-center max-w-xs">
        "{content.message}"
      </p>
    </div>
  );
}

// ============================================
// CREATE STORY MODAL
// ============================================

interface CreateStoryModalProps {
  onClose: () => void;
  onCreateStory: (type: StoryType, content: StoryContent) => void;
}

export function CreateStoryModal({ onClose, onCreateStory }: CreateStoryModalProps) {
  const [storyType, setStoryType] = useState<StoryType>('text');
  const [text, setText] = useState('');
  const [selectedBg, setSelectedBg] = useState(STORY_BACKGROUNDS.gradients[0]);

  const handleCreate = () => {
    if (storyType === 'text' && text.trim()) {
      onCreateStory('text', createTextStory(text, { backgroundColor: selectedBg }));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <button onClick={onClose} className="text-white text-lg">
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!text.trim()}
          className="px-4 py-2 bg-white text-black rounded-full font-medium disabled:opacity-50"
        >
          Share
        </button>
      </div>

      {/* Preview */}
      <div
        className="w-full h-full flex items-center justify-center p-8"
        style={{ background: selectedBg }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full max-w-md text-2xl text-white text-center bg-transparent border-none outline-none resize-none placeholder-white/50"
          rows={4}
          maxLength={200}
        />
      </div>

      {/* Background Picker */}
      <div className="absolute bottom-8 left-0 right-0 flex gap-2 overflow-x-auto px-4 pb-safe">
        {STORY_BACKGROUNDS.gradients.map((bg, index) => (
          <button
            key={index}
            onClick={() => setSelectedBg(bg)}
            className={`w-10 h-10 rounded-full flex-shrink-0 ${
              selectedBg === bg ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''
            }`}
            style={{ background: bg }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXPORT
// ============================================

export default StoryRingsBar;
