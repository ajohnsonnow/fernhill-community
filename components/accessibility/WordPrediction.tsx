'use client'

import { useState, useMemo } from 'react'
import { useAccessibility } from './AccessibilityContext'

interface WordPredictionProps {
  onWordSelect: (word: string) => void
  currentInput?: string
  category?: 'general' | 'greetings' | 'dance' | 'feelings' | 'actions' | 'questions'
  className?: string
}

// Common word banks organized by category
const WORD_BANKS = {
  general: [
    'I', 'you', 'we', 'the', 'a', 'is', 'are', 'was', 'were', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'and', 'or', 'but', 'if', 'then', 'so', 'because', 'when', 'where',
    'this', 'that', 'these', 'those', 'here', 'there', 'now', 'today',
    'tomorrow', 'yesterday', 'always', 'never', 'sometimes', 'maybe',
    'yes', 'no', 'please', 'thanks', 'sorry', 'okay', 'good', 'great',
    'love', 'like', 'want', 'need', 'help', 'know', 'think', 'feel',
    'see', 'hear', 'go', 'come', 'get', 'make', 'take', 'give',
  ],
  greetings: [
    'Hello', 'Hi', 'Hey', 'Good morning', 'Good evening', 'Welcome',
    'How are you', 'Nice to see you', 'Thank you', 'Thanks so much',
    'You\'re welcome', 'Take care', 'See you', 'Goodbye', 'Bye',
    'Have a great day', 'Blessings', 'Peace', 'Love to you', 'Namaste',
  ],
  dance: [
    'dance', 'dancing', 'music', 'rhythm', 'beat', 'flow', 'move',
    'movement', 'energy', 'vibe', 'DJ', 'set', 'song', 'track',
    'wave', 'opening', 'closing', 'peak', 'stillness', 'chaos',
    'staccato', 'lyrical', 'ecstatic', 'Fernhill', 'Sunday', 'gathering',
    'circle', 'space', 'floor', 'breath', 'body', 'soul', 'spirit',
  ],
  feelings: [
    'happy', 'joyful', 'grateful', 'thankful', 'excited', 'peaceful',
    'calm', 'relaxed', 'energized', 'tired', 'sad', 'worried', 'anxious',
    'hopeful', 'inspired', 'creative', 'connected', 'grounded', 'free',
    'alive', 'present', 'open', 'loving', 'kind', 'gentle', 'strong',
  ],
  actions: [
    'coming', 'going', 'bringing', 'sharing', 'helping', 'offering',
    'asking', 'looking for', 'need', 'want', 'giving', 'receiving',
    'attending', 'joining', 'participating', 'volunteering', 'creating',
    'making', 'cooking', 'driving', 'riding', 'walking', 'sitting',
  ],
  questions: [
    'What', 'When', 'Where', 'Who', 'Why', 'How', 'Which', 'Can',
    'Could', 'Would', 'Will', 'Is', 'Are', 'Do', 'Does', 'Have',
    'What time', 'How much', 'How many', 'Is anyone', 'Does anyone',
    'Can someone', 'Who wants', 'Who needs', 'Where is', 'When is',
  ],
}

// Quick phrases for common interactions
const QUICK_PHRASES = [
  'I\'ll be there!',
  'Can\'t make it this time',
  'Looking forward to it!',
  'Thank you for sharing',
  'That sounds wonderful',
  'I can help with that',
  'See you on the dance floor',
  'Sending love',
  'Beautiful!',
  'Yes please',
  'No thank you',
  'I need a ride',
  'I can offer a ride',
  'What time does it start?',
  'Where is it?',
]

export default function WordPrediction({
  onWordSelect,
  currentInput = '',
  category = 'general',
  className = '',
}: WordPredictionProps) {
  const [activeCategory, setActiveCategory] = useState<string>(category)
  const [showPhrases, setShowPhrases] = useState(false)
  const { settings } = useAccessibility()

  // Filter words based on current input
  const filteredWords = useMemo(() => {
    const words = WORD_BANKS[activeCategory as keyof typeof WORD_BANKS] || WORD_BANKS.general
    if (!currentInput.trim()) return words.slice(0, 20)
    
    const lastWord = currentInput.split(' ').pop()?.toLowerCase() || ''
    if (!lastWord) return words.slice(0, 20)

    return words
      .filter(word => word.toLowerCase().startsWith(lastWord))
      .slice(0, 15)
  }, [currentInput, activeCategory])

  const buttonSize = settings.largeButtons 
    ? 'px-4 py-3 text-base min-h-[48px]' 
    : 'px-3 py-2 text-sm min-h-[40px]'

  const categoryButtonSize = settings.largeButtons
    ? 'px-3 py-2 text-sm'
    : 'px-2 py-1 text-xs'

  return (
    <div className={`space-y-3 ${className}`} role="region" aria-label="Word prediction">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1" role="tablist">
        {Object.keys(WORD_BANKS).map(cat => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat}
            onClick={() => {
              setActiveCategory(cat)
              setShowPhrases(false)
            }}
            className={`
              ${categoryButtonSize} rounded-full transition-colors capitalize
              ${activeCategory === cat && !showPhrases
                ? 'bg-sacred-gold text-sacred-charcoal font-medium'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
              }
            `}
          >
            {cat}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={showPhrases}
          onClick={() => setShowPhrases(!showPhrases)}
          className={`
            ${categoryButtonSize} rounded-full transition-colors
            ${showPhrases
              ? 'bg-sacred-gold text-sacred-charcoal font-medium'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
            }
          `}
        >
          Quick Phrases
        </button>
      </div>

      {/* Word/Phrase buttons */}
      <div 
        className="flex flex-wrap gap-2" 
        role="listbox" 
        aria-label={showPhrases ? 'Quick phrases' : `${activeCategory} words`}
      >
        {showPhrases ? (
          QUICK_PHRASES.map((phrase, index) => (
            <button
              key={index}
              type="button"
              role="option"
              onClick={() => onWordSelect(phrase)}
              className={`
                ${buttonSize} rounded-xl glass-panel-dark text-white
                hover:bg-white/20 active:bg-sacred-gold/30
                focus:outline-none focus:ring-2 focus:ring-sacred-gold/50
                transition-colors
              `}
            >
              {phrase}
            </button>
          ))
        ) : (
          filteredWords.map((word, index) => (
            <button
              key={index}
              type="button"
              role="option"
              onClick={() => onWordSelect(word + ' ')}
              className={`
                ${buttonSize} rounded-xl glass-panel-dark text-white
                hover:bg-white/20 active:bg-sacred-gold/30
                focus:outline-none focus:ring-2 focus:ring-sacred-gold/50
                transition-colors
              `}
            >
              {word}
            </button>
          ))
        )}
      </div>

      {/* Punctuation and special characters */}
      <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
        {['.', ',', '!', '?', "'", '"', '-', ':', ';', '(', ')'].map(char => (
          <button
            key={char}
            type="button"
            onClick={() => onWordSelect(char)}
            className={`
              w-10 h-10 rounded-lg glass-panel-dark text-white text-lg
              hover:bg-white/20 active:bg-sacred-gold/30
              focus:outline-none focus:ring-2 focus:ring-sacred-gold/50
            `}
            aria-label={`Add ${char === '.' ? 'period' : char === ',' ? 'comma' : char === '!' ? 'exclamation' : char === '?' ? 'question mark' : char}`}
          >
            {char}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onWordSelect(' ')}
          className={`
            px-6 h-10 rounded-lg glass-panel-dark text-white text-sm
            hover:bg-white/20 active:bg-sacred-gold/30
            focus:outline-none focus:ring-2 focus:ring-sacred-gold/50
          `}
          aria-label="Add space"
        >
          Space
        </button>
        <button
          type="button"
          onClick={() => onWordSelect('\n')}
          className={`
            px-4 h-10 rounded-lg glass-panel-dark text-white text-sm
            hover:bg-white/20 active:bg-sacred-gold/30
            focus:outline-none focus:ring-2 focus:ring-sacred-gold/50
          `}
          aria-label="New line"
        >
          Enter
        </button>
      </div>
    </div>
  )
}
