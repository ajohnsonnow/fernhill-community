'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, RefreshCw, Mail, Lock } from 'lucide-react'
import { Suspense } from 'react'

function AuthErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Check if it's likely a rate limit or expiry issue
  const isRateLimit = error?.includes('rate') || errorDescription?.toLowerCase().includes('rate')
  const isExpired = errorDescription?.toLowerCase().includes('expired') || errorDescription?.toLowerCase().includes('invalid')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-fernhill-dark via-fernhill-brown/20 to-fernhill-dark">
      <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full glass-panel-dark flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-fernhill-cream">
          {isRateLimit ? 'Too Many Requests' : 'Magic Link Failed'}
        </h2>
        <p className="text-fernhill-sand/70 mb-4">
          {errorDescription || 'Something went wrong with the magic link.'}
        </p>
        
        <div className="glass-panel-dark rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-fernhill-sand/60 mb-2 font-medium">Common reasons:</p>
          <ul className="text-sm text-fernhill-sand/50 space-y-1">
            <li>• Magic link expired (valid for 1 hour)</li>
            <li>• Link already used</li>
            <li>• Too many login attempts (rate limited)</li>
            <li>• Browser cookies blocked</li>
          </ul>
        </div>

        {error && (
          <p className="text-xs text-red-400/60 mb-4 font-mono">
            Error: {error}
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.push('/login')}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Try Magic Link Again
          </button>
          
          {/* Recommend password option when magic link fails */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-fernhill-sand/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-fernhill-dark text-fernhill-sand/40">or</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/login?mode=password')}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Create Password Instead
          </button>
          
          <p className="text-xs text-fernhill-sand/40 mt-2">
            {isRateLimit 
              ? 'Password login bypasses rate limits' 
              : 'Passwords never expire like magic links'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-fernhill-dark">
        <div className="animate-pulse text-fernhill-gold">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
