'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudRain, Sun, Wind, Settings, Image, Users, Shield, HelpCircle, Menu, X, Droplets, Thermometer } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationCenter from '@/components/notifications/NotificationCenter'

interface WeatherData {
  current: {
    main: { temp: number; humidity: number; feels_like: number }
    weather: Array<{ main: string; description: string; icon: string }>
    wind?: { speed: number }
    name: string
  }
  hourly: Array<{
    dt: number
    main: { temp: number }
    weather: Array<{ main: string; icon: string }>
  }>
  forecast: Array<{
    dt: number
    main: { temp_max: number; temp_min: number }
    weather: Array<{ main: string; icon: string }>
  }>
}

interface TopHeaderProps {
  profile: any
}

export default function TopHeader({ profile }: TopHeaderProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [weatherModalOpen, setWeatherModalOpen] = useState(false)
  const pathname = usePathname()
  const isAdmin = profile.status === 'admin'

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
    setWeatherModalOpen(false)
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

  const getWeatherIcon = (condition?: string, size: string = 'w-5 h-5') => {
    const cond = condition?.toLowerCase() || ''
    
    if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain className={`${size} text-blue-400`} />
    if (cond.includes('cloud')) return <Cloud className={`${size} text-fernhill-sand/60`} />
    if (cond.includes('wind')) return <Wind className={`${size} text-fernhill-sand/60`} />
    if (cond.includes('clear') || cond.includes('sun')) return <Sun className={`${size} text-fernhill-gold`} />
    return <Cloud className={size} />
  }

  const getDayName = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  const getHourLabel = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    if (diffHours <= 1) return 'Now'
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
  }

  const menuItems = [
    { href: '/altar', icon: Image, label: 'The Altar', show: true },
    { href: '/directory', icon: Users, label: 'Soul Gallery', show: true },
    { href: '/community', icon: Users, label: 'Community', show: true },
    { href: '/admin', icon: Shield, label: 'Admin', show: isAdmin, highlight: true },
    { href: '/help', icon: HelpCircle, label: 'Help', show: true },
    { href: '/profile', icon: Settings, label: 'Settings', show: true },
  ].filter(item => item.show)

  const currentWeather = weather?.current

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-fernhill-dark/95 backdrop-blur-lg border-b border-fernhill-sand/10 pt-safe z-40">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Left: Weather (clickable for forecast) */}
          <button
            onClick={() => setWeatherModalOpen(true)}
            className="flex items-center gap-2 min-w-0 p-1 -m-1 rounded-xl hover:bg-fernhill-charcoal/50 transition-colors"
            aria-label="View weather forecast"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-fernhill-charcoal flex items-center justify-center flex-shrink-0">
              {getWeatherIcon(currentWeather?.weather?.[0]?.main)}
            </div>
            {currentWeather && (
              <div className="text-xs sm:text-sm text-left">
                <p className="text-fernhill-cream font-medium">{Math.round(currentWeather.main?.temp)}°F</p>
                <p className="text-fernhill-sand/50 text-xs hidden sm:block capitalize">
                  {currentWeather.weather?.[0]?.description || 'Portland'}
                </p>
              </div>
            )}
          </button>

          {/* Center: Title (responsive) */}
          <h1 className="text-base sm:text-xl font-bold font-display text-fernhill-cream truncate px-2">
            Fernhill
          </h1>

          {/* Right: Desktop nav + Hamburger for mobile */}
          <div className="flex items-center gap-1">
            {/* Notification Bell */}
            <NotificationCenter />

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

      {/* Weather Forecast Modal */}
      {weatherModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          onClick={() => setWeatherModalOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Modal */}
          <div 
            className="relative w-full max-w-md bg-fernhill-dark/95 backdrop-blur-lg rounded-2xl border border-fernhill-sand/10 shadow-2xl overflow-hidden animate-fadeIn"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-fernhill-sand/10">
              <h2 className="text-lg font-bold text-fernhill-cream">Portland Weather</h2>
              <button
                onClick={() => setWeatherModalOpen(false)}
                className="p-2 rounded-lg hover:bg-fernhill-charcoal transition-colors"
                aria-label="Close weather"
              >
                <X className="w-5 h-5 text-fernhill-sand/60" />
              </button>
            </div>

            {/* Current Weather */}
            {currentWeather && (
              <div className="p-4 border-b border-fernhill-sand/10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-fernhill-charcoal flex items-center justify-center">
                    {getWeatherIcon(currentWeather.weather?.[0]?.main, 'w-10 h-10')}
                  </div>
                  <div className="flex-1">
                    <p className="text-4xl font-bold text-fernhill-cream">
                      {Math.round(currentWeather.main?.temp)}°F
                    </p>
                    <p className="text-fernhill-sand/60 capitalize">
                      {currentWeather.weather?.[0]?.description}
                    </p>
                  </div>
                </div>
                
                {/* Extra details */}
                <div className="flex gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-fernhill-sand/60">
                    <Thermometer className="w-4 h-4" />
                    <span>Feels {Math.round(currentWeather.main?.feels_like)}°F</span>
                  </div>
                  <div className="flex items-center gap-2 text-fernhill-sand/60">
                    <Droplets className="w-4 h-4" />
                    <span>{currentWeather.main?.humidity}% humidity</span>
                  </div>
                  {currentWeather.wind && (
                    <div className="flex items-center gap-2 text-fernhill-sand/60">
                      <Wind className="w-4 h-4" />
                      <span>{Math.round(currentWeather.wind.speed)} mph</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hourly Forecast */}
            {weather?.hourly && weather.hourly.length > 0 && (
              <div className="p-4 border-b border-fernhill-sand/10">
                <h3 className="text-sm font-medium text-fernhill-sand/60 mb-3">Today&apos;s Forecast</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {weather.hourly.map((hour, idx) => (
                    <div 
                      key={idx}
                      className="flex flex-col items-center min-w-[60px] p-2 rounded-xl bg-fernhill-charcoal/50"
                    >
                      <span className="text-xs text-fernhill-sand/60 mb-1">
                        {getHourLabel(hour.dt)}
                      </span>
                      {getWeatherIcon(hour.weather?.[0]?.main, 'w-6 h-6')}
                      <span className="text-fernhill-cream font-medium mt-1">
                        {Math.round(hour.main?.temp)}°
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5-Day Forecast */}
            {weather?.forecast && weather.forecast.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-fernhill-sand/60 mb-3">5-Day Forecast</h3>
                <div className="space-y-2">
                  {weather.forecast.map((day, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-fernhill-charcoal/50"
                    >
                      <span className="text-fernhill-cream font-medium w-16">
                        {getDayName(day.dt)}
                      </span>
                      <div className="flex items-center gap-2">
                        {getWeatherIcon(day.weather?.[0]?.main, 'w-5 h-5')}
                        <span className="text-fernhill-sand/60 text-sm capitalize w-20 truncate">
                          {day.weather?.[0]?.main}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-fernhill-cream font-medium">
                          {Math.round(day.main?.temp_max)}°
                        </span>
                        <span className="text-fernhill-sand/40 ml-1">
                          {Math.round(day.main?.temp_min)}°
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dance day hint */}
            <div className="px-4 pb-4">
              <p className="text-xs text-fernhill-gold/60 text-center">
                🌿 Plan your Sunday dance with the forecast!
              </p>
            </div>
          </div>
        </div>
      )}

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
            
            {/* Weather in menu on mobile - clickable */}
            {currentWeather && (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setWeatherModalOpen(true)
                }}
                className="w-full border-t border-fernhill-sand/10 px-4 py-3 hover:bg-fernhill-brown/30 transition-colors"
              >
                <div className="flex items-center gap-3 text-fernhill-sand/60">
                  {getWeatherIcon(currentWeather.weather?.[0]?.main)}
                  <span className="text-sm">
                    {Math.round(currentWeather.main?.temp)}°F in Portland
                  </span>
                  <span className="text-xs text-fernhill-gold/60 ml-auto">Tap for forecast</span>
                </div>
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
