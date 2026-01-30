'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Track {
  id: string
  title: string
  url: string
  dj_name: string
  vibe_tags?: string[]
}

interface AudioContextType {
  currentTrack: Track | null
  isPlaying: boolean
  play: (track: Track) => void
  pause: () => void
  toggle: () => void
  stop: () => void
}

const AudioContext = createContext<AudioContextType>({
  currentTrack: null,
  isPlaying: false,
  play: () => {},
  pause: () => {},
  toggle: () => {},
  stop: () => {},
})

export function useAudio() {
  return useContext(AudioContext)
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const play = (track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  const pause = () => {
    setIsPlaying(false)
  }

  const toggle = () => {
    setIsPlaying(!isPlaying)
  }

  const stop = () => {
    setCurrentTrack(null)
    setIsPlaying(false)
  }

  return (
    <AudioContext.Provider value={{ currentTrack, isPlaying, play, pause, toggle, stop }}>
      {children}
    </AudioContext.Provider>
  )
}
