'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)
    
    if (standalone) return // Don't show if already installed

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if user has dismissed before (within last 30 days)
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 30) return // Don't nag for 30 days after dismiss
    }

    // Check if already shown this session (don't spam on every page navigation)
    const shownThisSession = sessionStorage.getItem('pwa-prompt-shown-session')
    if (shownThisSession) return // Only show once per session

    // For Android/Chrome - listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show prompt after user has had time to explore (2 minutes)
      setTimeout(() => {
        setShowPrompt(true)
        sessionStorage.setItem('pwa-prompt-shown-session', 'true')
      }, 120000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // For iOS - show manual instructions after delay (3 minutes)
    if (iOS) {
      setTimeout(() => {
        setShowPrompt(true)
        sessionStorage.setItem('pwa-prompt-shown-session', 'true')
      }, 180000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  if (!showPrompt || isStandalone) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-fadeIn">
      <div className="glass-panel rounded-2xl p-4 shadow-2xl border border-sacred-gold/20">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-sacred-gold/20 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-sacred-gold" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">Add to Home Screen</h3>
            {isIOS ? (
              <p className="text-white/60 text-xs mt-1">
                Tap <span className="inline-flex items-center px-1 py-0.5 rounded bg-white/10 text-white/80">
                  Share
                </span> then <span className="inline-flex items-center px-1 py-0.5 rounded bg-white/10 text-white/80">
                  Add to Home Screen
                </span>
              </p>
            ) : (
              <p className="text-white/60 text-xs mt-1">
                Install the app for quick access and offline support
              </p>
            )}
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="p-2 -mr-2 -mt-2 rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
          >
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-sacred-gold text-sacred-charcoal font-semibold rounded-xl active:scale-95 transition-transform touch-manipulation"
          >
            <Download className="w-5 h-5" />
            Install App
          </button>
        )}
      </div>
    </div>
  )
}
