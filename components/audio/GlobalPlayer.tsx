'use client'

import { useAudio } from './AudioContext'
import ReactPlayer from 'react-player/lazy'
import { 
  Play, 
  Pause, 
  X, 
  Music2, 
  ChevronUp, 
  ChevronDown,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Disc3,
  Radio
} from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { haptic } from '@/lib/haptics'

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Waveform animation bars
function WaveformAnimation({ isPlaying }: { isPlaying: boolean }) {
  const delayClasses = ['animate-delay-0', 'animate-delay-150', 'animate-delay-300', 'animate-delay-450', 'animate-delay-600'];
  
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-fernhill-gold transition-all ${
            isPlaying ? `animate-waveform ${delayClasses[i]}` : 'h-1'
          }`}
        />
      ))}
    </div>
  )
}

export default function GlobalPlayer() {
  const { currentTrack, isPlaying, toggle, stop } = useAudio()
  const [expanded, setExpanded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playedSeconds, setPlayedSeconds] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const playerRef = useRef<ReactPlayer>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const expandedProgressRef = useRef<HTMLDivElement>(null)

  // Reset state when track changes
  useEffect(() => {
    setProgress(0)
    setPlayedSeconds(0)
    setDuration(0)
  }, [currentTrack?.id])

  // Handle seeking via progress bar click/drag
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current || !playerRef.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    
    setProgress(percent)
    setPlayedSeconds(percent * duration)
    playerRef.current.seekTo(percent)
    haptic('light')
  }, [duration])

  const handleMiniSeekStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setSeeking(true)
    handleSeek(e, progressBarRef)
  }

  const handleMiniSeekMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (seeking) handleSeek(e, progressBarRef)
  }

  const handleExpandedSeekStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setSeeking(true)
    handleSeek(e, expandedProgressRef)
  }

  const handleExpandedSeekMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (seeking) handleSeek(e, expandedProgressRef)
  }

  const handleSeekEnd = () => {
    setSeeking(false)
  }

  // Skip forward/backward
  const skipForward = () => {
    if (!playerRef.current || !duration) return
    const newTime = Math.min(duration, playedSeconds + 15)
    playerRef.current.seekTo(newTime / duration)
    setPlayedSeconds(newTime)
    setProgress(newTime / duration)
    haptic('light')
  }

  const skipBackward = () => {
    if (!playerRef.current || !duration) return
    const newTime = Math.max(0, playedSeconds - 15)
    playerRef.current.seekTo(newTime / duration)
    setPlayedSeconds(newTime)
    setProgress(newTime / duration)
    haptic('light')
  }

  const handleToggle = () => {
    toggle()
    haptic('medium')
  }

  const handleExpand = () => {
    setExpanded(true)
    haptic('light')
  }

  const handleCollapse = () => {
    setExpanded(false)
    haptic('light')
  }

  const handleStop = () => {
    stop()
    setExpanded(false)
    haptic('medium')
  }

  const toggleMute = () => {
    setMuted(!muted)
    haptic('light')
  }

  if (!currentTrack) return null

  return (
    <>
      {/* Minimized Player Bar */}
      <div 
        className={`fixed bottom-20 left-0 right-0 z-40 transition-all duration-300 ${
          expanded ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100'
        }`}
      >
        <div className="mx-2 rounded-2xl bg-fernhill-charcoal/95 backdrop-blur-xl border border-fernhill-gold/20 shadow-lg shadow-black/20 overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-3">
            {/* Album Art / Playing Animation */}
            <div 
              className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-fernhill-gold/20 to-fernhill-terracotta/20 flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer"
              onClick={handleExpand}
            >
              {isPlaying ? (
                <Disc3 className="w-7 h-7 text-fernhill-gold animate-spin-slow" />
              ) : (
                <Music2 className="w-6 h-6 text-fernhill-gold" />
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={handleExpand}>
              <p className="text-fernhill-cream font-semibold truncate text-sm">{currentTrack.title}</p>
              <div className="flex items-center gap-2">
                <p className="text-fernhill-sand/60 text-xs truncate">{currentTrack.dj_name}</p>
                {isPlaying && <WaveformAnimation isPlaying={isPlaying} />}
              </div>
            </div>

            {/* Time Display */}
            <div className="text-xs text-fernhill-sand/50 tabular-nums hidden sm:block">
              {formatTime(playedSeconds)} / {formatTime(duration)}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggle}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-10 h-10 rounded-full bg-fernhill-gold flex items-center justify-center flex-shrink-0 hover:bg-fernhill-gold/90 transition-all active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-fernhill-dark" />
                ) : (
                  <Play className="w-5 h-5 text-fernhill-dark ml-0.5" />
                )}
              </button>

              <button
                onClick={handleExpand}
                aria-label="Expand player"
                className="p-2 rounded-lg hover:bg-fernhill-brown/30 transition-colors"
              >
                <ChevronUp className="w-5 h-5 text-fernhill-sand/60" />
              </button>

              <button
                onClick={handleStop}
                aria-label="Stop playback"
                className="p-2 rounded-lg hover:bg-fernhill-brown/30 transition-colors"
              >
                <X className="w-5 h-5 text-fernhill-sand/60" />
              </button>
            </div>
          </div>

          {/* Mini Progress Bar (seekable) */}
          <div 
            ref={progressBarRef}
            className="h-1.5 bg-fernhill-brown/30 cursor-pointer group"
            onMouseDown={handleMiniSeekStart}
            onMouseMove={handleMiniSeekMove}
            onMouseUp={handleSeekEnd}
            onMouseLeave={handleSeekEnd}
            onTouchStart={handleMiniSeekStart}
            onTouchMove={handleMiniSeekMove}
            onTouchEnd={handleSeekEnd}
          >
            <div 
              className="h-full bg-gradient-to-r from-fernhill-gold to-fernhill-terracotta relative transition-all duration-100 dynamic-width"
              style={{ '--dynamic-width': `${progress * 100}%` } as React.CSSProperties}
            >
              {/* Seek Handle */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-fernhill-gold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Full-Screen View */}
      {expanded && (
        <div className="fixed inset-0 bg-gradient-to-b from-fernhill-dark via-fernhill-charcoal to-fernhill-dark z-50 flex flex-col animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pt-safe">
            <button
              onClick={handleCollapse}
              aria-label="Collapse player"
              className="p-2 rounded-xl bg-fernhill-brown/20 hover:bg-fernhill-brown/30 transition-colors"
            >
              <ChevronDown className="w-6 h-6 text-fernhill-sand" />
            </button>
            <div className="flex items-center gap-2 text-fernhill-gold">
              <Radio className="w-4 h-4" />
              <span className="text-sm font-medium">Now Playing</span>
            </div>
            <button
              onClick={handleStop}
              aria-label="Close player"
              className="p-2 rounded-xl bg-fernhill-brown/20 hover:bg-fernhill-brown/30 transition-colors"
            >
              <X className="w-6 h-6 text-fernhill-sand" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
            {/* Album Art */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 mb-8">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-fernhill-gold/30 via-fernhill-terracotta/20 to-fernhill-brown/30 blur-2xl" />
              <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-fernhill-charcoal to-fernhill-brown/40 border border-fernhill-gold/20 flex items-center justify-center shadow-2xl overflow-hidden">
                {isPlaying ? (
                  <div className="relative">
                    <Disc3 className="w-32 h-32 text-fernhill-gold/60 animate-spin-slow" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Music2 className="w-12 h-12 text-fernhill-gold" />
                    </div>
                  </div>
                ) : (
                  <Music2 className="w-24 h-24 text-fernhill-gold/50" />
                )}
              </div>
            </div>

            {/* Track Info */}
            <h2 className="text-2xl sm:text-3xl font-bold text-fernhill-cream text-center mb-2 px-4">{currentTrack.title}</h2>
            <p className="text-fernhill-sand/70 text-lg mb-3">{currentTrack.dj_name}</p>
            
            {/* Vibe Tags */}
            {currentTrack.vibe_tags && currentTrack.vibe_tags.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-center mb-8 px-4">
                {currentTrack.vibe_tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-full bg-fernhill-brown/30 text-fernhill-sand text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Progress Bar (seekable) */}
            <div className="w-full max-w-md px-4 mb-4">
              <div 
                ref={expandedProgressRef}
                className="h-2 bg-fernhill-brown/40 rounded-full cursor-pointer relative group"
                onMouseDown={handleExpandedSeekStart}
                onMouseMove={handleExpandedSeekMove}
                onMouseUp={handleSeekEnd}
                onMouseLeave={handleSeekEnd}
                onTouchStart={handleExpandedSeekStart}
                onTouchMove={handleExpandedSeekMove}
                onTouchEnd={handleSeekEnd}
              >
                <div 
                  className="h-full bg-gradient-to-r from-fernhill-gold to-fernhill-terracotta rounded-full relative transition-all duration-100 dynamic-width"
                  style={{ '--dynamic-width': `${progress * 100}%` } as React.CSSProperties}
                >
                  {/* Seek Handle */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-fernhill-gold shadow-lg border-2 border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              {/* Time Labels */}
              <div className="flex justify-between mt-2 text-sm text-fernhill-sand/50 tabular-nums">
                <span>{formatTime(playedSeconds)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <button
                onClick={skipBackward}
                aria-label="Skip back 15 seconds"
                className="p-3 rounded-full bg-fernhill-brown/30 hover:bg-fernhill-brown/50 transition-colors active:scale-95"
              >
                <SkipBack className="w-6 h-6 text-fernhill-sand" />
              </button>

              <button
                onClick={handleToggle}
                className="w-20 h-20 rounded-full bg-fernhill-gold flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-fernhill-gold/20"
              >
                {isPlaying ? (
                  <Pause className="w-9 h-9 text-fernhill-dark" />
                ) : (
                  <Play className="w-9 h-9 text-fernhill-dark ml-1" />
                )}
              </button>

              <button
                onClick={skipForward}
                aria-label="Skip forward 15 seconds"
                className="p-3 rounded-full bg-fernhill-brown/30 hover:bg-fernhill-brown/50 transition-colors active:scale-95"
              >
                <SkipForward className="w-6 h-6 text-fernhill-sand" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 w-full max-w-xs px-4">
              <button
                onClick={toggleMute}
                aria-label={muted ? 'Unmute' : 'Mute'}
                className="p-2 rounded-lg hover:bg-fernhill-brown/30 transition-colors"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-fernhill-sand/60" />
                ) : (
                  <Volume2 className="w-5 h-5 text-fernhill-sand/60" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={muted ? 0 : volume}
                aria-label="Volume control"
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value))
                  if (muted) setMuted(false)
                }}
                className="flex-1 h-1.5 bg-fernhill-brown/40 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fernhill-gold [&::-webkit-slider-thumb]:shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden ReactPlayer */}
      <div className="hidden">
        <ReactPlayer
          ref={playerRef}
          url={currentTrack.url}
          playing={isPlaying}
          volume={muted ? 0 : volume}
          onProgress={({ played, playedSeconds: ps }) => {
            if (!seeking) {
              setProgress(played)
              setPlayedSeconds(ps)
            }
          }}
          onDuration={(d) => setDuration(d)}
          onEnded={stop}
          width="0"
          height="0"
          playsinline
          config={{
            soundcloud: {
              options: {
                auto_play: true,
                show_artwork: false,
                show_playcount: false,
                show_user: false,
              }
            },
            file: {
              attributes: {
                playsInline: true,
                crossOrigin: 'anonymous',
              },
              forceAudio: true,
            }
          }}
        />
      </div>

      {/* Waveform animation keyframes */}
      <style jsx global>{`
        @keyframes waveform {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .animate-waveform {
          animation: waveform 0.8s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>
    </>
  )
}
