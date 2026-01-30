'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useAccessibility } from './AccessibilityContext'

interface SpeechInputProps {
  onResult: (text: string) => void
  onInterimResult?: (text: string) => void
  continuous?: boolean
  className?: string
  buttonClassName?: string
  disabled?: boolean
  placeholder?: string
}

// Check if speech recognition is available
const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  )
}

export default function SpeechInput({
  onResult,
  onInterimResult,
  continuous = false,
  className = '',
  buttonClassName = '',
  disabled = false,
  placeholder = 'Press to speak...',
}: SpeechInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const { settings } = useAccessibility()

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported())
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported || disabled) return

    setError(null)
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = continuous
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (interimTranscript) {
        setInterimText(interimTranscript)
        onInterimResult?.(interimTranscript)
      }

      if (finalTranscript) {
        setInterimText('')
        onResult(finalTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setError(event.error === 'not-allowed' 
        ? 'Microphone access denied' 
        : 'Speech recognition error')
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
    }

    recognition.start()
  }, [isSupported, disabled, continuous, onResult, onInterimResult])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  if (!isSupported) {
    return null // Don't render if not supported
  }

  const buttonSize = settings.largeButtons ? 'w-14 h-14' : 'w-10 h-10'
  const iconSize = settings.largeButtons ? 'w-7 h-7' : 'w-5 h-5'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`
          ${buttonSize} rounded-full flex items-center justify-center transition-all
          ${isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-sacred-gold/20 text-sacred-gold hover:bg-sacred-gold/30'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-sacred-gold/50 focus:ring-offset-2 focus:ring-offset-sacred-charcoal
          ${buttonClassName}
        `}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        aria-pressed={isListening}
      >
        {isListening ? (
          <MicOff className={iconSize} />
        ) : (
          <Mic className={iconSize} />
        )}
      </button>

      {isListening && interimText && (
        <div className="flex items-center gap-2 px-3 py-2 glass-panel-dark rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin text-sacred-gold" />
          <span className="text-white/70 text-sm italic">{interimText}</span>
        </div>
      )}

      {error && (
        <span className="text-red-400 text-sm">{error}</span>
      )}
    </div>
  )
}

// Standalone hook for voice input
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported())
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript
      setTranscript(result)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
    setIsListening(true)
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    clearTranscript: () => setTranscript(''),
  }
}
