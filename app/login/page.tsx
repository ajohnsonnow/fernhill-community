'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Mail, Sparkles, Shield, MapPin, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { APP_VERSION } from '@/lib/version'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [devLoading, setDevLoading] = useState(false)
  const [isDev, setIsDev] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Check if we're in development mode on client side only
  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development')
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setSuccess(true)
      toast.success('Check your email for the magic link!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  // Dev login for local testing only
  const handleDevLogin = async () => {
    if (!isDev) return
    
    setDevLoading(true)
    try {
      // Try to sign in first
      const { error } = await supabase.auth.signInWithPassword({
        email: 'admin@fernhill.local',
        password: 'admin123',
      })

      if (error) {
        console.log('Sign in error:', error.message)
        
        // If user doesn't exist, create them
        if (error.message.includes('Invalid login credentials')) {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: 'admin@fernhill.local',
            password: 'admin123',
            options: {
              data: {
                tribe_name: 'Admin'
              }
            }
          })
          
          if (signUpError) {
            console.error('Sign up error:', signUpError)
            throw signUpError
          }
          
          // If email confirmation is disabled, user should be logged in
          if (data?.user && !data.user.identities?.length) {
            toast.error('Email already registered but not confirmed. Check Supabase settings.')
            setDevLoading(false)
            return
          }
          
          if (data?.session) {
            // User created and auto-logged in (email confirm disabled)
            toast.success('Dev admin created & logged in!')
            router.push('/hearth')
            return
          }
          
          toast.success('Dev admin created! Click again to login.')
          setDevLoading(false)
          return
        }
        throw error
      }

      toast.success('Dev admin login successful!')
      router.push('/hearth')
    } catch (error: any) {
      toast.error(error.message || 'Dev login failed')
    } finally {
      setDevLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sacred-charcoal via-forest-green/20 to-sacred-charcoal">
        <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center animate-fadeIn">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full glass-panel-dark flex items-center justify-center animate-pulse-glow">
            <Sparkles className="w-8 h-8 text-sacred-gold" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gradient-gold">
            Check Your Email
          </h2>
          <p className="text-white/70">
            We sent a magic link to <span className="text-sacred-gold font-semibold">{email}</span>
          </p>
          <p className="text-fernhill-sand/50 text-sm mt-4">
            Click the link in the email to join the dance
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-fernhill-dark via-fernhill-brown/20 to-fernhill-dark">
      <div className="glass-panel rounded-3xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 font-display">
            <span className="text-fernhill-cream">Fernhill</span>
          </h1>
          <p className="text-fernhill-gold text-lg font-display">
            Ecstatic Dance Community
          </p>
          <p className="text-fernhill-sand/60 mt-2 text-sm">
            Portland&apos;s Sunday Dance Gathering
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-fernhill-sand/80 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fernhill-sand/40" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="input-field pl-11"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⭕</span>
                Sending Magic Link...
              </span>
            ) : (
              'Enter the Dance'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-fernhill-sand/50 text-sm">
            No passwords. Just magic. ✨
          </p>
        </div>

        {/* Locations */}
        <div className="mt-6 pt-6 border-t border-fernhill-sand/10">
          <p className="text-fernhill-sand/40 text-xs text-center mb-3">Our Locations</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=Fernhill+Park+Portland+OR"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel-dark p-3 rounded-xl text-center hover:bg-fernhill-brown/30 transition-all group"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <MapPin className="w-3 h-3 text-fernhill-gold" />
                <p className="text-fernhill-gold font-medium">Fernhill Park</p>
                <ExternalLink className="w-3 h-3 text-fernhill-sand/40 group-hover:text-fernhill-gold transition-colors" />
              </div>
              <p className="text-fernhill-sand/60">Outdoor (By Donation)</p>
            </a>
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=Bridgespace+Portland+OR"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel-dark p-3 rounded-xl text-center hover:bg-fernhill-brown/30 transition-all group"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <MapPin className="w-3 h-3 text-fernhill-gold" />
                <p className="text-fernhill-gold font-medium">Bridgespace</p>
                <ExternalLink className="w-3 h-3 text-fernhill-sand/40 group-hover:text-fernhill-gold transition-colors" />
              </div>
              <p className="text-fernhill-sand/60">Indoor ($15-30)</p>
            </a>
          </div>
        </div>

        {/* Dev Login - Only shows in development */}
        {isDev && (
          <div className="mt-6 pt-6 border-t border-fernhill-sand/10">
            <button
              onClick={handleDevLogin}
              disabled={devLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 glass-panel-dark rounded-xl text-fernhill-sand/60 hover:text-fernhill-cream hover:bg-fernhill-brown/30 transition-all disabled:opacity-50"
            >
              <Shield className="w-5 h-5" />
              {devLoading ? 'Logging in...' : 'Dev Admin Login'}
            </button>
            <p className="text-fernhill-sand/30 text-xs text-center mt-2">
              admin@fernhill.local / admin123
            </p>
          </div>
        )}

        {/* Version */}
        <p className="text-center text-fernhill-sand/20 text-xs mt-6">
          v{APP_VERSION.version} • {APP_VERSION.codename}
        </p>
      </div>
    </div>
  )
}
