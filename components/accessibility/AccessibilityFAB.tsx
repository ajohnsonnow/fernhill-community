'use client'

import { useState } from 'react'
import { Accessibility, X } from 'lucide-react'
import { useAccessibility } from './AccessibilityContext'
import AccessibilitySettings from './AccessibilitySettings'

/**
 * Floating accessibility button that opens the settings panel
 * Always visible for quick access
 */
export default function AccessibilityFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const { settings, speak } = useAccessibility()

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

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpen}
        className={`
          fixed z-40 rounded-full shadow-lg transition-all
          bg-gradient-to-br from-sacred-gold to-amber-500 
          text-sacred-charcoal hover:scale-110 active:scale-95
          focus:outline-none focus:ring-4 focus:ring-sacred-gold/50
          ${settings.largeButtons ? 'bottom-24 right-6 p-4' : 'bottom-20 right-4 p-3'}
          ${settings.highContrast ? 'border-2 border-white' : ''}
        `}
        aria-label="Open accessibility settings"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Accessibility className={settings.largeButtons ? 'w-8 h-8' : 'w-6 h-6'} />
      </button>

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
          </div>
        </div>
      )}
    </>
  )
}
