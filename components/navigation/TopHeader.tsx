'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudRain, Sun, Wind, Settings, Image, Users, Shield, HelpCircle } from 'lucide-react'
import Link from 'next/link'

interface TopHeaderProps {
  profile: any
}

export default function TopHeader({ profile }: TopHeaderProps) {
  const [weather, setWeather] = useState<any>(null)
  const isAdmin = profile.status === 'admin'

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

  return (
    <header className="fixed top-0 left-0 right-0 bg-fernhill-dark/95 backdrop-blur-lg border-b border-fernhill-sand/10 pt-safe z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-fernhill-charcoal flex items-center justify-center">
            {getWeatherIcon()}
          </div>
          {weather && (
            <div className="text-sm">
              <p className="text-fernhill-cream font-medium">{Math.round(weather.main?.temp)}°F</p>
              <p className="text-fernhill-sand/50 text-xs">Portland</p>
            </div>
          )}
        </div>

        <h1 className="text-xl font-bold font-display text-fernhill-cream">
          Fernhill Community
        </h1>

        <div className="flex items-center gap-2">
          <Link
            href="/altar"
            className="p-2 rounded-xl bg-fernhill-charcoal hover:bg-fernhill-brown/50 transition-colors flex items-center justify-center"
            title="The Altar"
          >
            <Image className="w-5 h-5 text-fernhill-sand/60" />
          </Link>
          <Link
            href="/directory"
            className="p-2 rounded-xl bg-fernhill-charcoal hover:bg-fernhill-brown/50 transition-colors flex items-center justify-center"
            title="Soul Gallery"
          >
            <Users className="w-5 h-5 text-fernhill-sand/60" />
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-fernhill-charcoal hover:bg-fernhill-brown/50 transition-colors flex items-center justify-center"
              title="Admin Dashboard"
            >
              <Shield className="w-5 h-5 text-fernhill-gold" />
            </Link>
          )}
          <Link
            href="/help"
            className="p-2 rounded-xl bg-fernhill-charcoal hover:bg-fernhill-brown/50 transition-colors flex items-center justify-center"
            title="Help & Support"
          >
            <HelpCircle className="w-5 h-5 text-fernhill-sand/60" />
          </Link>
          <Link
            href="/profile"
            className="p-2 rounded-xl bg-fernhill-charcoal hover:bg-fernhill-brown/50 transition-colors flex items-center justify-center"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-fernhill-sand/60" />
          </Link>
        </div>
      </div>
    </header>
  )
}
