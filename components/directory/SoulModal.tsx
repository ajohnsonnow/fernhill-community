'use client'

import { X, MessageCircle, Music, ExternalLink, MapPin, Instagram, Sparkles } from 'lucide-react'
import Link from 'next/link'

// Social media icons as simple components
const SocialIcons = {
  instagram: () => <Instagram className="w-5 h-5" />,
  facebook: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  twitter: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  tiktok: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  spotify: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  ),
  bandcamp: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z"/>
    </svg>
  ),
  linkedin: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  soundcloud: () => <Music className="w-5 h-5" />,
}

interface SocialLink {
  platform: keyof typeof SocialIcons
  url: string
  label: string
  color: string
}

interface MemberProfile {
  id: string
  tribe_name: string
  avatar_url: string | null
  mycelial_gifts: string | null
  bio: string | null
  pronouns: string | null
  location: string | null
  soundcloud_url: string | null
  website: string | null
  instagram_url: string | null
  facebook_url: string | null
  twitter_url: string | null
  tiktok_url: string | null
  spotify_url: string | null
  bandcamp_url: string | null
  linkedin_url: string | null
  vibe_status: string | null
  status: string | null
}

interface SoulModalProps {
  member: MemberProfile
  currentUserId: string | null
  onClose: () => void
  vibeInfo: { emoji: string; label: string } | null
}

export default function SoulModal({ member, currentUserId, onClose, vibeInfo }: SoulModalProps) {
  // Build social links array from available URLs
  const socialLinks: SocialLink[] = []
  
  if (member.instagram_url) {
    socialLinks.push({ platform: 'instagram', url: member.instagram_url, label: 'Instagram', color: 'hover:text-pink-400' })
  }
  if (member.facebook_url) {
    socialLinks.push({ platform: 'facebook', url: member.facebook_url, label: 'Facebook', color: 'hover:text-blue-400' })
  }
  if (member.twitter_url) {
    socialLinks.push({ platform: 'twitter', url: member.twitter_url, label: 'X (Twitter)', color: 'hover:text-white' })
  }
  if (member.tiktok_url) {
    socialLinks.push({ platform: 'tiktok', url: member.tiktok_url, label: 'TikTok', color: 'hover:text-pink-300' })
  }
  if (member.soundcloud_url) {
    socialLinks.push({ platform: 'soundcloud', url: member.soundcloud_url, label: 'SoundCloud', color: 'hover:text-orange-400' })
  }
  if (member.spotify_url) {
    socialLinks.push({ platform: 'spotify', url: member.spotify_url, label: 'Spotify', color: 'hover:text-green-400' })
  }
  if (member.bandcamp_url) {
    socialLinks.push({ platform: 'bandcamp', url: member.bandcamp_url, label: 'Bandcamp', color: 'hover:text-cyan-400' })
  }
  if (member.linkedin_url) {
    socialLinks.push({ platform: 'linkedin', url: member.linkedin_url, label: 'LinkedIn', color: 'hover:text-blue-500' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md glass-panel rounded-2xl overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full glass-panel-dark hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>

        {/* Header with Avatar */}
        <div className="relative pt-8 pb-6 px-6 text-center">
          {/* Avatar */}
          <div className="relative inline-block mb-4">
            <div className={`w-24 h-24 rounded-full glass-panel-dark overflow-hidden mx-auto ${
              vibeInfo ? 'ring-4 ring-fernhill-gold/50' : 'ring-2 ring-white/10'
            }`}>
              {member.avatar_url ? (
                <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-fernhill-gold text-3xl font-bold">
                  {member.tribe_name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {vibeInfo && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full glass-panel flex items-center justify-center text-lg border border-fernhill-gold/30">
                {vibeInfo.emoji}
              </div>
            )}
          </div>

          {/* Name & Pronouns */}
          <h2 className="text-2xl font-bold text-fernhill-cream mb-1">
            {member.tribe_name}
          </h2>
          {member.pronouns && (
            <p className="text-fernhill-sand/60 text-sm mb-2">({member.pronouns})</p>
          )}
          
          {/* Vibe Status */}
          {vibeInfo && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel-dark text-sm">
              <span>{vibeInfo.emoji}</span>
              <span className="text-fernhill-gold">{vibeInfo.label}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          {/* Location */}
          {member.location && (
            <div className="flex items-center gap-2 text-fernhill-sand/80 text-sm">
              <MapPin className="w-4 h-4 text-fernhill-gold" />
              <span>{member.location}</span>
            </div>
          )}

          {/* Bio */}
          {member.bio && (
            <div className="glass-panel-dark rounded-xl p-4">
              <p className="text-fernhill-sand/90 text-sm leading-relaxed whitespace-pre-wrap">
                {member.bio}
              </p>
            </div>
          )}

          {/* Gifts to Mycelium */}
          {member.mycelial_gifts && (
            <div className="glass-panel-dark rounded-xl p-4">
              <div className="flex items-center gap-2 text-fernhill-gold text-sm font-medium mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Gifts to the Mycelium</span>
              </div>
              <p className="text-fernhill-sand/80 text-sm">{member.mycelial_gifts}</p>
            </div>
          )}

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="space-y-2">
              <p className="text-fernhill-sand/60 text-xs uppercase tracking-wider font-medium">Connect</p>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((social) => {
                  const Icon = SocialIcons[social.platform]
                  return (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-xl glass-panel-dark text-fernhill-sand/70 ${social.color} transition-colors`}
                      aria-label={social.label}
                      title={social.label}
                    >
                      <Icon />
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Website */}
          {member.website && (
            <a
              href={member.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl glass-panel-dark text-fernhill-sand hover:text-fernhill-gold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm truncate">{member.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {member.id !== currentUserId && (
              <Link
                href={`/messages?user=${member.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-fernhill-gold text-fernhill-dark font-medium hover:bg-fernhill-gold/90 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Message</span>
              </Link>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl glass-panel-dark text-fernhill-sand font-medium hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
