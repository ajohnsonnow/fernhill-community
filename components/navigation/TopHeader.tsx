'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudRain, Sun, Wind, Settings, Image, Users, Shield, HelpCircle, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface TopHeaderProps {
  profile: any
}

export default function TopHeader({ profile }: TopHeaderProps) {
  const [weather, setWeather] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const isAdmin = profile.status === 'admin'

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('/api/weather')
        const data = await res.json()
        setWeather(data)
      } catch (error) {
        console.error('Failed to fetch weather:', error)
      }
    }

    fetchWeather()
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getWeatherIcon = () => {
    if (!weather) return <Cloud className="w-5 h-5" />
    const condition = weather.weather?.[0]?.main?.toLowerCase()
    
    if (condition?.includes('rain')) return <CloudRain className="w-5 h-5 text-blue-400" />
    if (condition?.includes('cloud')) return <Cloud className="w-5 h-5 text-fernhill-sand/60" />
    if (condition?.includes('wind')) return <Wind className="w-5 h-5 text-fernhill-sand/60" />
    return <Sun className="w-5 h-5 text-fernhill-gold" />
  }

  const menuItems = [
    { href: '/altar', icon: Image, label: 'The Altar', show: true },
    { href: '/directory', icon: Users, label: 'Soul Gallery', show: true },
    { href: '/admin', icon: Shield, label: 'Admin', show: isAdmin, highlight: true },
    { href: '/help', icon: HelpCircle, label: 'Help', show: true },
    { href: '/profile', icon: Settings, label: 'Settings', show: true },
  ].filter(item => item.show)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-fernhill-dark/95 backdrop-blur-lg border-b border-fernhill-sand/10 pt-safe z-40">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Left: Weather (compact on mobile) */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-fernhill-charcoal flex items-center justify-center flex-shrink-0">
              {getWeatherIcon()}
            </div>
            {weather && (
              <div className="text-xs sm:text-sm hidden xs:block">
                <p className="text-fernhill-cream font-medium">{Math.round(weather.main?.temp)}°F</p>
              </div>
            )}
          </div>

          {/* Center: Title (responsive) */}
          <h1 className="text-base sm:text-xl font-bold font-display text-fernhill-cream truncate px-2">
            Fernhill
          </h1>

          {/* Right: Desktop nav + Hamburger for mobile */}
          <div className="flex items-center gap-1">
            {/* Desktop: Show all buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {menuItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-2 rounded-xl bg-fernhill-charcoal hover:bg-fernhill-brown/50 transition-colors flex items-center justify-center ${
                    pathname === item.href ? 'ring-1 ring-fernhill-gold/50' : ''
                  }`}
                  title={item.label}
                >
                  <item.icon className={`w-5 h-5 ${item.highlight ? 'text-fernhill-gold' : 'text-fernhill-sand/60'}`} />
                </Link>
              ))}
            </div>

            {/* Mobile: Hamburger button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 rounded-xl bg-fernhill-charcoal hover:bg-fernhill-brown/50 transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-fernhill-cream" />
              ) : (
                <Menu className="w-5 h-5 text-fernhill-sand/60" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 sm:hidden" onClick={() => setMenuOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Menu panel */}
          <nav 
            className="absolute top-[calc(env(safe-area-inset-top)+56px)] right-0 w-56 m-2 bg-fernhill-dark/95 backdrop-blur-lg rounded-2xl border border-fernhill-sand/10 shadow-xl overflow-hidden animate-fadeIn"
            onClick={e => e.stopPropagation()}
          >
            <div className="py-2">
              {menuItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-fernhill-brown/30 transition-colors ${
                    pathname === item.href ? 'bg-fernhill-gold/10 text-fernhill-gold' : 'text-fernhill-cream'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <item.icon className={`w-5 h-5 ${item.highlight ? 'text-fernhill-gold' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
            
            {/* Weather in menu on mobile */}
            {weather && (
              <div className="border-t border-fernhill-sand/10 px-4 py-3">
                <div className="flex items-center gap-3 text-fernhill-sand/60">
                  {getWeatherIcon()}
                  <span className="text-sm">
                    {Math.round(weather.main?.temp)}°F in Portland
                  </span>
                </div>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
