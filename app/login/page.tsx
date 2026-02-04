'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Mail, Sparkles, Shield, MapPin, ExternalLink, Lock, Eye, EyeOff } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { APP_VERSION } from '@/lib/version'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [createPasswordLoading, setCreatePasswordLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for mode=password query param (from auth error page)
  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'password') {
      setShowCreatePassword(true)
    } else if (mode === 'admin') {
      setShowAdminLogin(true)
    }
  }, [searchParams])

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

      if (error) {
        // Check for rate limit
        if (error.message.includes('rate') || error.status === 429) {
          toast.error('Too many requests. Please wait a few minutes before trying again.')
        } else {
          throw error
        }
        return
      }

      setSuccess(true)
      toast.success('Check your email for the magic link!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  // Admin password login (works in production)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    
    setAdminLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('Admin login successful!')
      router.push('/hearth')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setAdminLoading(false)
    }
  }

  // Create account with password (signup)
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter your email')
      return
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    setCreatePasswordLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        // Check for rate limit
        if (error.message.includes('rate') || error.status === 429) {
          toast.error('Too many requests. Please wait a few minutes.')
        } else if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Try signing in instead.')
        } else {
          throw error
        }
        return
      }

      toast.success('Account created! Check your email to confirm.')
      setSuccess(true)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setCreatePasswordLoading(false)
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

        {/* Toggle between Magic Link and Admin Login */}
        {!showAdminLogin ? (
          <>
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
                    autoComplete="email"
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

            <div className="mt-6 text-center">
              <p className="text-fernhill-sand/50 text-sm mb-3">
                No passwords. Just magic. ✨
              </p>
              <button
                onClick={() => setShowCreatePassword(true)}
                className="text-fernhill-gold/70 text-sm hover:text-fernhill-gold transition-colors underline underline-offset-2"
              >
                Magic link not working? Create a password instead
              </button>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fernhill-sand/40" />
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@email.com"
                    autoComplete="email"
                    required
                    className="input-field pl-11"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fernhill-sand/40" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const form = e.currentTarget.closest('form')
                        form?.requestSubmit()
                      }
                    }}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="input-field pl-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-fernhill-sand/40 hover:text-fernhill-sand"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adminLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⭕</span>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Admin Sign In
                  </span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAdminLogin(false)}
                className="text-fernhill-sand/50 text-sm hover:text-fernhill-gold transition-colors"
              >
                ← Back to Magic Link
              </button>
            </div>
          </>
        )}

        {/* Create Password Form - Modal Overlay */}
        {showCreatePassword && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="glass-panel rounded-3xl p-8 max-w-md w-full animate-fadeIn">
              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full glass-panel-dark flex items-center justify-center">
                  <Lock className="w-6 h-6 text-fernhill-gold" />
                </div>
                <h2 className="text-xl font-bold text-fernhill-cream">Create Password</h2>
                <p className="text-fernhill-sand/60 text-sm mt-1">
                  Set a password for your account
                </p>
              </div>

              <form onSubmit={handleCreatePassword} className="space-y-4">
                <div>
                  <label htmlFor="create-email" className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fernhill-sand/40" />
                    <input
                      id="create-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoComplete="email"
                      required
                      className="input-field pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="create-password" className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fernhill-sand/40" />
                    <input
                      id="create-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="input-field pl-11 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-fernhill-sand/40 hover:text-fernhill-sand"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fernhill-sand/40" />
                    <input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const form = e.currentTarget.closest('form')
                          form?.requestSubmit()
                        }
                      }}
                      placeholder="Confirm password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="input-field pl-11"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createPasswordLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createPasswordLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⭕</span>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowCreatePassword(false)
                    setShowAdminLogin(true)
                  }}
                  className="text-fernhill-gold/70 text-sm hover:text-fernhill-gold transition-colors"
                >
                  Already have a password? Sign in
                </button>
                <button
                  onClick={() => setShowCreatePassword(false)}
                  className="text-fernhill-sand/50 text-sm hover:text-fernhill-sand transition-colors"
                >
                  ← Back to Magic Link
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Admin Login Toggle - Only shows when NOT in admin mode */}
        {!showAdminLogin && (
          <div className="mt-6 pt-6 border-t border-fernhill-sand/10">
            <button
              onClick={() => setShowAdminLogin(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 glass-panel-dark rounded-xl text-fernhill-sand/40 hover:text-fernhill-sand hover:bg-fernhill-brown/20 transition-all text-sm"
            >
              <Shield className="w-4 h-4" />
              Admin Login
            </button>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-fernhill-dark">
        <div className="animate-pulse text-fernhill-gold">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
