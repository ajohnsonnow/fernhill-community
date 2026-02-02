/**
 * Fernhill Community - Collaborative Playlist System
 * 
 * Community-curated playlists with voting, suggestions,
 * and collaborative curation.
 */

export interface PlaylistTrack {
  id: string
  title: string
  artist: string
  album?: string
  duration: number // seconds
  durationMs?: number // milliseconds (optional, for external APIs)
  audioUrl: string
  artworkUrl?: string
  spotifyUrl?: string
  addedBy: {
    userId: string
    tribeName: string
  }
  addedByName?: string
  addedAt: string
  votes: number
  vibe: string[]
}

export interface CollaborativePlaylist {
  id: string
  name: string
  description?: string
  coverImage?: string
  coverUrl?: string
  vibe?: string
  createdBy: {
    userId: string
    tribeName: string
  }
  createdAt: string
  isPublic: boolean
  allowSuggestions: boolean
  tracks: PlaylistTrack[]
  followers: number
  totalDuration: number // seconds
}

export interface TrackSuggestion {
  id: string
  playlistId: string
  track: Omit<PlaylistTrack, 'id' | 'addedAt' | 'votes'>
  suggestedBy: {
    userId: string
    tribeName: string
  }
  suggestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  votes: number
}

/**
 * Calculate playlist total duration
 */
export function calculatePlaylistDuration(tracks: PlaylistTrack[]): number {
  return tracks.reduce((total, track) => total + track.duration, 0)
}

/**
 * Format duration in seconds to mm:ss or hh:mm:ss
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Sort tracks by votes (for community-ranked playlists)
 */
export function sortTracksByVotes(tracks: PlaylistTrack[]): PlaylistTrack[] {
  return [...tracks].sort((a, b) => b.votes - a.votes)
}

/**
 * Filter tracks by vibe
 */
export function filterTracksByVibe(tracks: PlaylistTrack[], vibe: string): PlaylistTrack[] {
  return tracks.filter(track => track.vibe.includes(vibe))
}

/**
 * Shuffle playlist (Fisher-Yates algorithm)
 */
export function shufflePlaylist(tracks: PlaylistTrack[]): PlaylistTrack[] {
  const shuffled = [...tracks]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Vibe categories for collaborative playlists
export const PLAYLIST_VIBES = [
  { id: 'warm-up', label: 'Warm Up', emoji: '🌅', name: 'Warm Up', gradient: ['#f97316', '#eab308'] },
  { id: 'building', label: 'Building', emoji: '📈', name: 'Building', gradient: ['#22c55e', '#10b981'] },
  { id: 'peak', label: 'Peak Energy', emoji: '🔥', name: 'Peak Energy', gradient: ['#ef4444', '#f97316'] },
  { id: 'release', label: 'Release', emoji: '💫', name: 'Release', gradient: ['#a855f7', '#ec4899'] },
  { id: 'cool-down', label: 'Cool Down', emoji: '🌙', name: 'Cool Down', gradient: ['#6366f1', '#8b5cf6'] },
  { id: 'meditation', label: 'Meditation', emoji: '🧘', name: 'Meditation', gradient: ['#14b8a6', '#06b6d4'] },
  { id: 'tribal', label: 'Tribal', emoji: '🥁', name: 'Tribal', gradient: ['#b45309', '#92400e'] },
  { id: 'electronic', label: 'Electronic', emoji: '🎹', name: 'Electronic', gradient: ['#0ea5e9', '#3b82f6'] },
  { id: 'world', label: 'World', emoji: '🌍', name: 'World', gradient: ['#22c55e', '#16a34a'] },
  { id: 'ambient', label: 'Ambient', emoji: '☁️', name: 'Ambient', gradient: ['#94a3b8', '#64748b'] },
]
