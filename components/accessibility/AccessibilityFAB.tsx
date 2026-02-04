'use client'

import { useState, useEffect } from 'react'
import { Accessibility } from 'lucide-react'
import { useAccessibility } from './AccessibilityContext'
import AccessibilitySettings from './AccessibilitySettings'
import Link from 'next/link'

/**
 * Floating accessibility button that opens the settings panel
 * Can be dismissed - accessible from Profile settings
 */
export default function AccessibilityFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(true) // Start hidden until we check localStorage
  const { settings, speak } = useAccessibility()

  // Check if FAB was dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('accessibility-fab-dismissed')
    setIsDismissed(dismissed === 'true')
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    if (settings.textToSpeech) {
      speak('Opening accessibility settings')
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    if (settings.textToSpeech) {
      speak('Accessibility settings closed')
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('accessibility-fab-dismissed', 'true')
    setIsDismissed(true)
    if (settings.textToSpeech) {
      speak('Accessibility button hidden. Find it in Profile settings.')
    }
  }

  // Don't render if dismissed
  if (isDismissed) return null

  return (
    <>
      {/* Floating Action Button - positioned on the LEFT */}
      <div className="fixed z-40 left-4 bottom-20">
        <div className="flex flex-col items-center gap-1">
          {/* Main accessibility button */}
          <button
            onClick={handleOpen}
            className={`
              rounded-full shadow-lg transition-all
              bg-gradient-to-br from-sacred-gold to-amber-500 
              text-sacred-charcoal hover:scale-110 active:scale-95
              focus:outline-none focus:ring-4 focus:ring-sacred-gold/50
              ${settings.largeButtons ? 'p-4' : 'p-3'}
              ${settings.highContrast ? 'border-2 border-white' : ''}
            `}
            aria-label="Open accessibility settings"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
          >
            <Accessibility className={settings.largeButtons ? 'w-8 h-8' : 'w-6 h-6'} />
          </button>
          
          {/* Dismiss button BELOW main button - proper mobile touch target */}
          <button
            onClick={handleDismiss}
            className="px-2 py-1 text-[10px] rounded-full bg-fernhill-dark/80 text-fernhill-sand/50 hover:text-white hover:bg-red-500/80 transition-colors border border-fernhill-sand/20"
            aria-label="Hide accessibility button"
            title="Hide (find in Profile)"
          >
            hide
          </button>
        </div>
      </div>

      {/* Settings Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Accessibility settings"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto animate-fade-in">
            <AccessibilitySettings onClose={handleClose} showCloseButton={true} />
            
            {/* Dismiss hint */}
            <div className="mt-2 text-center">
              <button
                onClick={handleDismiss}
                className="text-sm text-fernhill-sand/60 hover:text-fernhill-sand transition-colors"
              >
                Hide floating button (find in Profile → Accessibility)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
