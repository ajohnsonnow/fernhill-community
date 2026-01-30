'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface AccessibilitySettings {
  // Visual
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  
  // Audio
  screenReaderMode: boolean
  textToSpeech: boolean
  speechRate: number // 0.5 to 2.0
  
  // Input
  voiceInput: boolean
  wordPrediction: boolean
  largeButtons: boolean
  
  // Simplified mode (combines several settings)
  simplifiedMode: boolean
}

export const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReaderMode: false,
  textToSpeech: false,
  speechRate: 1.0,
  voiceInput: false,
  wordPrediction: false,
  largeButtons: false,
  simplifiedMode: false,
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void
  toggleSetting: (key: keyof AccessibilitySettings) => void
  enableSimplifiedMode: () => void
  disableSimplifiedMode: () => void
  speak: (text: string, priority?: boolean) => void
  stopSpeaking: () => void
  isSpeaking: boolean
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

const STORAGE_KEY = 'fernhill-accessibility-settings'

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (e) {
        console.error('Failed to parse accessibility settings:', e)
      }
    }

    // Check for system preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }))
    }
    if (window.matchMedia('(prefers-contrast: more)').matches) {
      setSettings(prev => ({ ...prev, highContrast: true }))
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      
      // Apply data attributes to body for CSS targeting
      const body = document.body
      body.dataset.highContrast = String(settings.highContrast)
      body.dataset.largeText = String(settings.largeText)
      body.dataset.reducedMotion = String(settings.reducedMotion)
      body.dataset.largeButtons = String(settings.largeButtons)
      body.dataset.simplifiedMode = String(settings.simplifiedMode)
    }
  }, [settings, mounted])

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      
      // If enabling simplified mode, also enable related settings
      if (newSettings.simplifiedMode === true) {
        return {
          ...updated,
          largeText: true,
          largeButtons: true,
          wordPrediction: true,
          textToSpeech: true,
          voiceInput: true,
        }
      }
      
      return updated
    })
  }

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const enableSimplifiedMode = () => {
    setSettings(prev => ({
      ...prev,
      simplifiedMode: true,
      largeText: true,
      largeButtons: true,
      wordPrediction: true,
      reducedMotion: true,
    }))
  }

  const disableSimplifiedMode = () => {
    setSettings(prev => ({
      ...prev,
      simplifiedMode: false,
    }))
  }

  // Text-to-speech function
  const speak = (text: string, priority = false) => {
    if (!settings.textToSpeech || typeof window === 'undefined') return
    
    const synth = window.speechSynthesis
    if (!synth) return

    if (priority) {
      synth.cancel() // Stop current speech for priority messages
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = settings.speechRate
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synth.speak(utterance)
  }

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        updateSettings,
        toggleSetting,
        enableSimplifiedMode,
        disableSimplifiedMode,
        speak,
        stopSpeaking,
        isSpeaking,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// Hook for text-to-speech on component mount (for screen readers)
export function useAnnounce() {
  const { speak, settings } = useAccessibility()
  
  const announce = (text: string, priority = false) => {
    if (settings.textToSpeech || settings.screenReaderMode) {
      speak(text, priority)
    }
  }

  return announce
}
