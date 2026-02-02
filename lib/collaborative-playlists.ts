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
  audioUrl: string
  artworkUrl?: string
  addedBy: {
    userId: string
    tribeName: string
  }
  addedAt: string
  votes: number
  vibe: string[]
}

export interface CollaborativePlaylist {
  id: string
  name: string
  description?: string
  coverImage?: string
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
  { id: 'warm-up', label: 'Warm Up', emoji: '🌅' },
  { id: 'building', label: 'Building', emoji: '📈' },
  { id: 'peak', label: 'Peak Energy', emoji: '🔥' },
  { id: 'release', label: 'Release', emoji: '💫' },
  { id: 'cool-down', label: 'Cool Down', emoji: '🌙' },
  { id: 'meditation', label: 'Meditation', emoji: '🧘' },
  { id: 'tribal', label: 'Tribal', emoji: '🥁' },
  { id: 'electronic', label: 'Electronic', emoji: '🎹' },
  { id: 'world', label: 'World', emoji: '🌍' },
  { id: 'ambient', label: 'Ambient', emoji: '☁️' },
]
