'use client'

import { useState, useRef, useEffect, forwardRef } from 'react'
import { Mic, Volume2, VolumeX, Keyboard, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useAccessibility } from './AccessibilityContext'
import SpeechInput from './SpeechInput'
import WordPrediction from './WordPrediction'

interface AccessibleTextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  multiline?: boolean
  rows?: number
  maxLength?: number
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
  name?: string
  autoFocus?: boolean
}

const AccessibleTextInput = forwardRef<HTMLTextAreaElement | HTMLInputElement, AccessibleTextInputProps>(
  function AccessibleTextInput(
    {
      value,
      onChange,
      placeholder = '',
      label,
      multiline = false,
      rows = 4,
      maxLength,
      disabled = false,
      required = false,
      className = '',
      id,
      name,
      autoFocus = false,
    },
    ref
  ) {
    const [showWordPrediction, setShowWordPrediction] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const { settings, speak, stopSpeaking, isSpeaking } = useAccessibility()
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Combine refs
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(inputRef.current)
        } else {
          ref.current = inputRef.current
        }
      }
    }, [ref])

    // Auto-show word prediction in simplified mode
    useEffect(() => {
      if (settings.wordPrediction && isFocused) {
        setShowWordPrediction(true)
      }
    }, [settings.wordPrediction, isFocused])

    const handleVoiceResult = (text: string) => {
      onChange(value + text)
    }

    const handleWordSelect = (word: string) => {
      onChange(value + word)
      inputRef.current?.focus()
    }

    const handleReadAloud = () => {
      if (isSpeaking) {
        stopSpeaking()
      } else if (value) {
        speak(value, true)
      }
    }

    const handleClear = () => {
      onChange('')
      inputRef.current?.focus()
    }

    const inputClasses = `
      w-full px-4 py-3 glass-panel-dark rounded-xl text-white 
      placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50
      ${settings.largeText ? 'text-lg' : 'text-base'}
      ${settings.highContrast ? 'bg-black border-2 border-white' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${className}
    `

    const buttonSize = settings.largeButtons ? 'p-3' : 'p-2'
    const iconSize = settings.largeButtons ? 'w-6 h-6' : 'w-5 h-5'

    return (
      <div ref={containerRef} className="space-y-2">
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className={`block font-medium text-white/80 ${settings.largeText ? 'text-lg' : 'text-sm'}`}
          >
            {label}
            {required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        {/* Input with toolbar */}
        <div className="relative">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              id={id}
              name={name}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={rows}
              maxLength={maxLength}
              disabled={disabled}
              required={required}
              autoFocus={autoFocus}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className={`${inputClasses} resize-none`}
              aria-describedby={maxLength ? `${id}-count` : undefined}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              id={id}
              name={name}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={disabled}
              required={required}
              autoFocus={autoFocus}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className={inputClasses}
              aria-describedby={maxLength ? `${id}-count` : undefined}
            />
          )}

          {/* Clear button */}
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Character count */}
        {maxLength && (
          <p 
            id={`${id}-count`}
            className={`text-white/40 ${settings.largeText ? 'text-base' : 'text-xs'}`}
            aria-live="polite"
          >
            {value.length}/{maxLength}
          </p>
        )}

        {/* Accessibility toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Voice input */}
          {settings.voiceInput && (
            <SpeechInput
              onResult={handleVoiceResult}
              onInterimResult={(text) => {}}
              disabled={disabled}
              buttonClassName={buttonSize}
            />
          )}

          {/* Read aloud */}
          {settings.textToSpeech && value && (
            <button
              type="button"
              onClick={handleReadAloud}
              className={`
                ${buttonSize} rounded-full flex items-center justify-center
                ${isSpeaking ? 'bg-sacred-gold text-sacred-charcoal' : 'bg-white/10 text-white/70 hover:bg-white/20'}
                focus:outline-none focus:ring-2 focus:ring-sacred-gold/50
              `}
              aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
              aria-pressed={isSpeaking}
            >
              {isSpeaking ? (
                <VolumeX className={iconSize} />
              ) : (
                <Volume2 className={iconSize} />
              )}
            </button>
          )}

          {/* Toggle word prediction */}
          {settings.wordPrediction && (
            <button
              type="button"
              onClick={() => setShowWordPrediction(!showWordPrediction)}
              className={`
                ${buttonSize} rounded-full flex items-center gap-1
                ${showWordPrediction ? 'bg-sacred-gold text-sacred-charcoal' : 'bg-white/10 text-white/70 hover:bg-white/20'}
                focus:outline-none focus:ring-2 focus:ring-sacred-gold/50
              `}
              aria-label={showWordPrediction ? 'Hide word buttons' : 'Show word buttons'}
              aria-expanded={showWordPrediction}
            >
              <Keyboard className={iconSize} />
              {showWordPrediction ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Word prediction panel */}
        {settings.wordPrediction && showWordPrediction && (
          <div className="glass-panel rounded-xl p-4 mt-2">
            <WordPrediction
              onWordSelect={handleWordSelect}
              currentInput={value}
            />
          </div>
        )}
      </div>
    )
  }
)

export default AccessibleTextInput
