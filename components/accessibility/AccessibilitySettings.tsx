'use client'

import { useState } from 'react'
import { 
  Settings, 
  Eye, 
  Ear, 
  Hand, 
  Volume2, 
  Mic, 
  Type, 
  Sun, 
  Moon,
  Zap,
  Keyboard,
  X,
  Check,
  RotateCcw
} from 'lucide-react'
import { useAccessibility, defaultSettings, type AccessibilitySettings as SettingsType } from './AccessibilityContext'

interface AccessibilitySettingsProps {
  onClose?: () => void
  showCloseButton?: boolean
}

export default function AccessibilitySettings({ onClose, showCloseButton = true }: AccessibilitySettingsProps) {
  const { settings, updateSettings, speak } = useAccessibility()
  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'input'>('visual')

  const handleToggle = (key: keyof SettingsType, label: string) => {
    const newValue = !settings[key]
    updateSettings({ [key]: newValue })
    
    // Announce changes with text-to-speech
    if (settings.textToSpeech) {
      speak(`${label} ${newValue ? 'enabled' : 'disabled'}`)
    }
  }

  const handleSliderChange = (key: 'speechRate', value: number) => {
    updateSettings({ [key]: value })
  }

  const handleReset = () => {
    updateSettings(defaultSettings)
    if (settings.textToSpeech) {
      speak('Settings reset to defaults')
    }
  }

  const handleSimplifiedMode = () => {
    const newValue = !settings.simplifiedMode
    updateSettings({ simplifiedMode: newValue })
    if (settings.textToSpeech || newValue) {
      speak(newValue 
        ? 'Simplified mode enabled. Large buttons, word prediction, and text-to-speech are now on.' 
        : 'Simplified mode disabled'
      )
    }
  }

  const tabs = [
    { id: 'visual' as const, label: 'Visual', icon: Eye },
    { id: 'audio' as const, label: 'Audio', icon: Ear },
    { id: 'input' as const, label: 'Input', icon: Hand },
  ]

  const ToggleSwitch = ({ 
    checked, 
    onChange, 
    label, 
    description,
    icon: Icon 
  }: { 
    checked: boolean
    onChange: () => void
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
  }) => (
    <button
      onClick={onChange}
      className={`
        w-full p-4 rounded-xl text-left transition-all flex items-start gap-4
        ${checked 
          ? 'bg-sacred-gold/20 border-2 border-sacred-gold' 
          : 'glass-panel border-2 border-transparent hover:border-white/20'
        }
        focus:outline-none focus:ring-2 focus:ring-sacred-gold/50
        ${settings.largeButtons ? 'min-h-[100px]' : ''}
      `}
      role="switch"
      aria-checked={checked}
      aria-label={`${label}: ${checked ? 'enabled' : 'disabled'}`}
    >
      <div className={`
        p-2 rounded-lg shrink-0
        ${checked ? 'bg-sacred-gold text-sacred-charcoal' : 'bg-white/10 text-white/70'}
      `}>
        <Icon className={settings.largeButtons ? 'w-8 h-8' : 'w-6 h-6'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-semibold text-white ${settings.largeText ? 'text-xl' : 'text-base'}`}>
            {label}
          </span>
          <div className={`
            w-12 h-7 rounded-full relative transition-colors
            ${checked ? 'bg-sacred-gold' : 'bg-white/20'}
          `}>
            <div className={`
              absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform
              ${checked ? 'translate-x-6' : 'translate-x-1'}
            `}>
              {checked && <Check className="w-3 h-3 absolute top-1 left-1 text-sacred-gold" />}
            </div>
          </div>
        </div>
        <p className={`text-white/60 mt-1 ${settings.largeText ? 'text-base' : 'text-sm'}`}>
          {description}
        </p>
      </div>
    </button>
  )

  return (
    <div className="glass-panel rounded-2xl overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sacred-gold/20 rounded-lg">
            <Settings className="w-6 h-6 text-sacred-gold" />
          </div>
          <h2 className={`font-bold text-white ${settings.largeText ? 'text-2xl' : 'text-xl'}`}>
            Accessibility
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
            aria-label="Reset to defaults"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Simplified Mode Banner */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={handleSimplifiedMode}
          className={`
            w-full p-4 rounded-xl flex items-center gap-4 transition-all
            ${settings.simplifiedMode 
              ? 'bg-gradient-to-r from-sacred-gold/30 to-sacred-gold/10 border-2 border-sacred-gold' 
              : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-500/50 hover:border-purple-500'
            }
            focus:outline-none focus:ring-2 focus:ring-sacred-gold/50
          `}
          role="switch"
          aria-checked={settings.simplifiedMode}
        >
          <div className={`
            p-3 rounded-full
            ${settings.simplifiedMode ? 'bg-sacred-gold text-sacred-charcoal' : 'bg-purple-500/30 text-purple-300'}
          `}>
            <Zap className={settings.largeButtons ? 'w-8 h-8' : 'w-6 h-6'} />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-white ${settings.largeText ? 'text-xl' : 'text-lg'}`}>
                Easy Mode
              </span>
              {settings.simplifiedMode && (
                <span className="px-2 py-0.5 bg-sacred-gold text-sacred-charcoal text-xs font-bold rounded-full">
                  ON
                </span>
              )}
            </div>
            <p className={`text-white/60 ${settings.largeText ? 'text-base' : 'text-sm'}`}>
              Large buttons, word prediction, voice input & text-to-speech all at once
            </p>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors
              ${activeTab === tab.id 
                ? 'bg-white/10 text-sacred-gold border-b-2 border-sacred-gold' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }
              focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sacred-gold/50
              ${settings.largeButtons ? 'py-4' : ''}
            `}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            <tab.icon className={settings.largeButtons ? 'w-6 h-6' : 'w-5 h-5'} />
            <span className={settings.largeText ? 'text-lg' : 'text-sm'}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto" role="tabpanel">
        {/* Visual Settings */}
        {activeTab === 'visual' && (
          <div className="space-y-4">
            <ToggleSwitch
              checked={settings.highContrast}
              onChange={() => handleToggle('highContrast', 'High contrast')}
              label="High Contrast"
              description="Stronger colors and borders for better visibility"
              icon={Sun}
            />
            <ToggleSwitch
              checked={settings.largeText}
              onChange={() => handleToggle('largeText', 'Large text')}
              label="Large Text"
              description="Bigger text throughout the app"
              icon={Type}
            />
            <ToggleSwitch
              checked={settings.reducedMotion}
              onChange={() => handleToggle('reducedMotion', 'Reduced motion')}
              label="Reduced Motion"
              description="Less animations for comfort"
              icon={Moon}
            />
          </div>
        )}

        {/* Audio Settings */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <ToggleSwitch
              checked={settings.textToSpeech}
              onChange={() => handleToggle('textToSpeech', 'Text-to-speech')}
              label="Text-to-Speech"
              description="Have content read aloud to you"
              icon={Volume2}
            />
            
            {settings.textToSpeech && (
              <div className="glass-panel p-4 rounded-xl space-y-3">
                <label 
                  htmlFor="speech-rate" 
                  className={`block text-white/80 ${settings.largeText ? 'text-lg' : 'text-sm'}`}
                >
                  Speech Speed: {settings.speechRate}x
                </label>
                <input
                  id="speech-rate"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.speechRate}
                  onChange={(e) => handleSliderChange('speechRate', parseFloat(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none bg-white/20 cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 
                    [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-sacred-gold [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="flex justify-between text-white/40 text-sm">
                  <span>Slower</span>
                  <span>Faster</span>
                </div>
              </div>
            )}

            <ToggleSwitch
              checked={settings.screenReaderMode}
              onChange={() => handleToggle('screenReaderMode', 'Screen reader mode')}
              label="Screen Reader Mode"
              description="Enhanced labels and descriptions for screen readers"
              icon={Ear}
            />
          </div>
        )}

        {/* Input Settings */}
        {activeTab === 'input' && (
          <div className="space-y-4">
            <ToggleSwitch
              checked={settings.voiceInput}
              onChange={() => handleToggle('voiceInput', 'Voice input')}
              label="Voice Input"
              description="Speak instead of typing"
              icon={Mic}
            />
            <ToggleSwitch
              checked={settings.wordPrediction}
              onChange={() => handleToggle('wordPrediction', 'Word prediction')}
              label="Word Buttons"
              description="Tap words instead of typing them"
              icon={Keyboard}
            />
            <ToggleSwitch
              checked={settings.largeButtons}
              onChange={() => handleToggle('largeButtons', 'Large buttons')}
              label="Large Buttons"
              description="Bigger buttons easier to tap"
              icon={Hand}
            />
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-white/10 text-center">
        <p className={`text-white/40 ${settings.largeText ? 'text-base' : 'text-xs'}`}>
          Settings are saved automatically on this device
        </p>
      </div>
    </div>
  )
}
