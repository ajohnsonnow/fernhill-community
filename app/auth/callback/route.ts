import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/hearth'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Determine the correct redirect URL
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      // Use NEXT_PUBLIC_APP_URL if set, otherwise determine from request
      const appUrl = process.env.NEXT_PUBLIC_APP_URL
      
      let redirectUrl: string
      if (appUrl && !isLocalEnv) {
        // Production: use configured app URL
        redirectUrl = `${appUrl}${next}`
      } else if (isLocalEnv) {
        // Development: use origin (localhost)
        redirectUrl = `${origin}${next}`
      } else if (forwardedHost) {
        // Behind proxy: use forwarded host
        redirectUrl = `https://${forwardedHost}${next}`
      } else {
        // Fallback: use request origin
        redirectUrl = `${origin}${next}`
      }
      
      return NextResponse.redirect(redirectUrl)
    }
    
    // Log error for debugging (won't be visible in production)
    console.error('Auth callback error:', error.message)
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
