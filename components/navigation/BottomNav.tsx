'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, MessageCircle, User, Music2, Users } from 'lucide-react'
import { haptic } from '@/lib/haptics'
import { useAudio } from '@/components/audio/AudioContext'

const navItems = [
  { href: '/hearth', icon: Home, label: 'Hearth' },
  { href: '/events', icon: Calendar, label: 'Events' },
  { href: '/community', icon: Users, label: 'Community' },
  { href: '/journey', icon: Music2, label: 'DJ Sets', featured: true },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { currentTrack, isPlaying } = useAudio()

  const handleNavClick = () => {
    haptic('selection')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-fernhill-dark/95 backdrop-blur-lg border-t border-fernhill-sand/10 pb-safe z-40">
      <div className="flex justify-around items-center px-0.5 py-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname?.startsWith(item.href)
          const isFeatured = item.featured
          const isPlayingJourney = item.href === '/journey' && isPlaying && currentTrack
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] min-h-[52px] px-1.5 py-1.5 rounded-xl transition-all touch-manipulation touch-feedback ${
                isActive
                  ? isFeatured 
                    ? 'text-fernhill-gold bg-fernhill-gold/20'
                    : 'text-fernhill-gold bg-fernhill-gold/10'
                  : isFeatured
                    ? 'text-fernhill-gold/80 active:text-fernhill-gold active:bg-fernhill-gold/20'
                    : 'text-fernhill-sand/60 active:text-fernhill-cream active:bg-fernhill-brown/20'
              }`}
            >
              {/* Playing indicator pulse */}
              {isPlayingJourney && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fernhill-gold opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-fernhill-gold"></span>
                </span>
              )}
              <Icon className={`w-5 h-5 ${isFeatured ? 'drop-shadow-[0_0_6px_rgba(212,168,85,0.4)]' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[9px] font-medium leading-tight ${isFeatured ? 'font-semibold' : ''}`}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
