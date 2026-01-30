'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, RefreshCw, Mail } from 'lucide-react'
import { Suspense } from 'react'

function AuthErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sacred-charcoal via-forest-green/20 to-sacred-charcoal">
      <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full glass-panel-dark flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-white">
          Authentication Error
        </h2>
        <p className="text-white/70 mb-4">
          {errorDescription || 'Something went wrong with the magic link.'}
        </p>
        
        <div className="glass-panel-dark rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-white/60 mb-2 font-medium">Common reasons:</p>
          <ul className="text-sm text-white/50 space-y-1">
            <li>• Magic link expired (valid for 1 hour)</li>
            <li>• Link already used</li>
            <li>• Browser cookies blocked</li>
            <li>• URL was modified or incomplete</li>
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
            Request New Magic Link
          </button>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-sacred-charcoal">
        <div className="animate-pulse text-sacred-gold">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
