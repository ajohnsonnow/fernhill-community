'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Music, MessageCircle, User } from 'lucide-react'

const navItems = [
  { href: '/hearth', icon: Home, label: 'Hearth' },
  { href: '/events', icon: Calendar, label: 'Events' },
  { href: '/journey', icon: Music, label: 'Music' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-fernhill-dark/95 backdrop-blur-lg border-t border-fernhill-sand/10 pb-safe z-50">
      <div className="flex justify-around items-center px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname?.startsWith(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[56px] px-3 py-2 rounded-xl transition-all touch-manipulation ${
                isActive
                  ? 'text-fernhill-gold bg-fernhill-gold/10'
                  : 'text-fernhill-sand/60 active:text-fernhill-cream active:bg-fernhill-brown/20'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
