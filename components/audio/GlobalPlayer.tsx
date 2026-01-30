'use client'

import { useAudio } from './AudioContext'
import ReactPlayer from 'react-player/lazy'
import { Play, Pause, X, Music, ChevronUp, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function GlobalPlayer() {
  const { currentTrack, isPlaying, toggle, stop } = useAudio()
  const [expanded, setExpanded] = useState(false)
  const [progress, setProgress] = useState(0)

  if (!currentTrack) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40">
      {/* Minimized Player Bar */}
      <div 
        className={`glass-panel border-t border-white/10 transition-all duration-300 ${
          expanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={toggle}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-12 h-12 rounded-full glass-panel-dark flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-sacred-gold" />
            ) : (
              <Play className="w-5 h-5 text-sacred-gold ml-0.5" />
            )}
          </button>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(true)}>
            <p className="text-white font-medium truncate text-sm">{currentTrack.title}</p>
            <p className="text-white/50 text-xs truncate">{currentTrack.dj_name}</p>
          </div>

          <button
            onClick={() => setExpanded(true)}
            aria-label="Expand player"
            className="p-2 rounded-lg glass-panel-dark hover:bg-white/10 transition-colors"
          >
            <ChevronUp className="w-5 h-5 text-white/60" />
          </button>

          <button
            onClick={stop}
            aria-label="Stop playback"
            className="p-2 rounded-lg glass-panel-dark hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10">
          <div 
            className="h-full bg-sacred-gold transition-all duration-200"
            style={{ '--progress': `${progress * 100}%`, width: 'var(--progress)' } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col animate-fadeIn">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <button
              onClick={() => setExpanded(false)}
              aria-label="Collapse player"
              className="p-2 rounded-lg glass-panel-dark hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-6 h-6 text-white/60" />
            </button>
            <p className="text-white/50 text-sm">Now Playing</p>
            <button
              onClick={() => { stop(); setExpanded(false); }}
              aria-label="Close player"
              className="p-2 rounded-lg glass-panel-dark hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-white/60" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8">
            {/* Album Art Placeholder */}
            <div className="w-64 h-64 rounded-2xl glass-panel flex items-center justify-center mb-8">
              <Music className="w-24 h-24 text-sacred-gold/50" />
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-2">{currentTrack.title}</h2>
            <p className="text-white/60 mb-2">{currentTrack.dj_name}</p>
            
            {currentTrack.vibe_tags && currentTrack.vibe_tags.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-center mb-8">
                {currentTrack.vibe_tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full glass-panel-dark text-white/60 text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Progress Bar */}
            <div className="w-full max-w-md h-2 bg-white/10 rounded-full mb-6">
              <div 
                className="h-full bg-sacred-gold rounded-full transition-all duration-200"
                style={{ '--progress': `${progress * 100}%`, width: 'var(--progress)' } as React.CSSProperties}
              />
            </div>

            {/* Controls */}
            <button
              onClick={toggle}
              className="w-20 h-20 rounded-full bg-sacred-gold flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-sacred-charcoal" />
              ) : (
                <Play className="w-8 h-8 text-sacred-charcoal ml-1" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Hidden ReactPlayer */}
      <div className="hidden">
        <ReactPlayer
          url={currentTrack.url}
          playing={isPlaying}
          onProgress={({ played }) => setProgress(played)}
          onEnded={stop}
          width="0"
          height="0"
          config={{
            soundcloud: {
              options: {
                auto_play: true,
              }
            }
          }}
        />
      </div>
    </div>
  )
}
