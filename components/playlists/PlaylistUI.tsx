'use client'

import { useState } from 'react'
import { 
  type CollaborativePlaylist, 
  type PlaylistTrack,
  PLAYLIST_VIBES,
  formatDuration,
  shufflePlaylist
} from '@/lib/collaborative-playlists'
import { haptic } from '@/lib/haptics'
import { 
  Music2, 
  Play, 
  Pause, 
  ThumbsUp, 
  Plus,
  Shuffle,
  ListMusic,
  Clock,
  Users,
  Sparkles,
  ExternalLink,
  Search
} from 'lucide-react'

interface PlaylistHeaderProps {
  playlist: CollaborativePlaylist
  onShuffle: () => void
  isPlaying?: boolean
  onPlayToggle?: () => void
}

/**
 * Header for a collaborative playlist
 */
export function PlaylistHeader({ 
  playlist, 
  onShuffle, 
  isPlaying, 
  onPlayToggle 
}: PlaylistHeaderProps) {
  const vibe = PLAYLIST_VIBES.find(v => v.id === playlist.vibe)
  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.durationMs ?? t.duration * 1000), 0)
  
  return (
    <div 
      className="relative rounded-xl overflow-hidden p-6 dynamic-gradient"
      style={{ 
        '--gradient-from': vibe?.gradient[0] || '#1a1a2e',
        '--gradient-to': vibe?.gradient[1] || '#16213e'
      } as React.CSSProperties}
    >
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          {/* Playlist Cover */}
          <div className="w-24 h-24 rounded-lg bg-black/30 backdrop-blur flex items-center justify-center shadow-lg">
            {(playlist.coverUrl ?? playlist.coverImage) ? (
              <img src={playlist.coverUrl ?? playlist.coverImage} alt="" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <ListMusic className="w-10 h-10 text-white/80" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <span className="text-xs uppercase tracking-wide text-white/70 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Community Playlist
            </span>
            <h2 className="text-2xl font-bold text-white mt-1 truncate">{playlist.name}</h2>
            {playlist.description && (
              <p className="text-sm text-white/80 mt-1 line-clamp-2">{playlist.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <Music2 className="w-4 h-4" />
                {playlist.tracks.length} tracks
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(totalDuration)}
              </span>
              {vibe && (
                <span className="flex items-center gap-1">
                  <span>{vibe.emoji}</span>
                  {vibe.label}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {onPlayToggle && (
            <button
              onClick={() => {
                haptic('medium')
                onPlayToggle()
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          )}
          <button
            onClick={() => {
              haptic('light')
              onShuffle()
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </button>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
    </div>
  )
}

interface TrackRowProps {
  track: PlaylistTrack
  index: number
  onVote: (trackId: string) => void
  isPlaying?: boolean
  userVoted?: boolean
}

/**
 * Single track row in playlist
 */
export function TrackRow({ track, index, onVote, isPlaying, userVoted }: TrackRowProps) {
  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-lg transition-colors
        ${isPlaying ? 'bg-fernhill-gold/20 border border-fernhill-gold/30' : 'hover:bg-stone-800'}
      `}
    >
      {/* Track Number/Playing Indicator */}
      <div className="w-6 text-center">
        {isPlaying ? (
          <span className="flex justify-center gap-0.5">
            <span className="w-0.5 h-3 bg-fernhill-gold rounded-full animate-pulse animate-delay-0" />
            <span className="w-0.5 h-3 bg-fernhill-gold rounded-full animate-pulse animate-delay-150" />
            <span className="w-0.5 h-3 bg-fernhill-gold rounded-full animate-pulse animate-delay-300" />
          </span>
        ) : (
          <span className="text-stone-500 text-sm">{index + 1}</span>
        )}
      </div>
      
      {/* Artwork */}
      <div className="w-12 h-12 rounded bg-stone-800 overflow-hidden flex-shrink-0">
        {track.artworkUrl ? (
          <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 className="w-5 h-5 text-stone-500" />
          </div>
        )}
      </div>
      
      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium truncate ${isPlaying ? 'text-fernhill-gold' : 'text-white'}`}>
          {track.title}
        </h4>
        <p className="text-sm text-stone-400 truncate">{track.artist}</p>
        {track.addedByName && (
          <p className="text-xs text-stone-500 truncate">Added by {track.addedByName}</p>
        )}
      </div>
      
      {/* Duration */}
      <span className="text-sm text-stone-400 hidden sm:block">
        {formatDuration(track.durationMs ?? track.duration * 1000)}
      </span>
      
      {/* Vote Button */}
      <button
        onClick={() => {
          haptic('light')
          onVote(track.id)
        }}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-full transition-colors
          ${userVoted 
            ? 'bg-fernhill-gold text-fernhill-dark' 
            : 'text-stone-400 hover:text-white hover:bg-stone-700'
          }
        `}
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="text-sm">{track.votes}</span>
      </button>
      
      {/* External Link */}
      {track.spotifyUrl && (
        <a
          href={track.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-stone-500 hover:text-green-500 transition-colors"
          onClick={(e) => e.stopPropagation()}
          aria-label="Open track in Spotify"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  )
}

interface AddTrackModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (track: Partial<PlaylistTrack>) => void
}

/**
 * Modal for adding tracks to playlist
 */
export function AddTrackModal({ isOpen, onClose, onAdd }: AddTrackModalProps) {
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  
  if (!isOpen) return null
  
  const handleSubmit = () => {
    if (!title.trim() || !artist.trim()) return
    haptic('success')
    onAdd({
      title: title.trim(),
      artist: artist.trim(),
      spotifyUrl: spotifyUrl.trim() || undefined,
      duration: 180 // Default 3 min (in seconds)
    })
    setTitle('')
    setArtist('')
    setSpotifyUrl('')
    onClose()
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
      <div 
        className="w-full max-w-md bg-stone-900 rounded-t-2xl sm:rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-stone-700 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Add Track</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white">✕</button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Manual Entry */}
          <div>
            <label className="block text-sm text-stone-400 mb-1">Track Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Uptown Funk"
              className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white placeholder:text-stone-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-stone-400 mb-1">Artist *</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g., Bruno Mars"
              className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white placeholder:text-stone-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-stone-400 mb-1">Spotify Link (optional)</label>
            <input
              type="url"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/track/..."
              className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white placeholder:text-stone-500"
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-stone-800 text-stone-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !artist.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-fernhill-gold text-fernhill-dark font-bold disabled:opacity-50"
            >
              Add Track
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface VibePickerProps {
  selectedVibe: string
  onChange: (vibe: string) => void
}

/**
 * Picker for playlist vibe/mood
 */
export function VibePicker({ selectedVibe, onChange }: VibePickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLAYLIST_VIBES.map((vibe) => (
        <button
          key={vibe.id}
          onClick={() => {
            haptic('light')
            onChange(vibe.id)
          }}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-full transition-all
            ${selectedVibe === vibe.id 
              ? 'ring-2 ring-white ring-offset-2 ring-offset-stone-900' 
              : ''
            }
          `}
          className="dynamic-gradient"
          style={{
            '--gradient-from': vibe.gradient[0],
            '--gradient-to': vibe.gradient[1]
          } as React.CSSProperties}
        >
          <span className="text-lg">{vibe.emoji}</span>
          <span className="text-sm font-medium text-white">{vibe.label}</span>
        </button>
      ))}
    </div>
  )
}

interface PlaylistCardProps {
  playlist: CollaborativePlaylist
  onClick: () => void
}

/**
 * Card preview of a playlist
 */
export function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  const vibe = PLAYLIST_VIBES.find(v => v.id === playlist.vibe)
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl overflow-hidden hover:scale-[1.02] transition-transform"
    >
      <div 
        className="p-4 h-32 dynamic-gradient"
        style={{ 
          '--gradient-from': vibe?.gradient[0] || '#1a1a2e',
          '--gradient-to': vibe?.gradient[1] || '#16213e'
        } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 mb-2">
          {vibe && <span className="text-lg">{vibe.emoji}</span>}
          <span className="text-xs uppercase text-white/70">
            {playlist.tracks.length} tracks
          </span>
        </div>
        <h3 className="font-bold text-white text-lg truncate">{playlist.name}</h3>
        {playlist.description && (
          <p className="text-sm text-white/80 line-clamp-2 mt-1">{playlist.description}</p>
        )}
      </div>
    </button>
  )
}
