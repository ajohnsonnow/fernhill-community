import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'

interface CookieToSet {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function proxy(request: NextRequest) {
  // Update session
  const response = await updateSession(request)
  
  // Create Supabase client
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ONLY these routes are public (everything else requires login)
  const publicPaths = [
    '/login',
    '/auth/callback',
    '/auth/auth-code-error',
  ]
  
  const isPublicRoute = publicPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  )

  // NOT LOGGED IN - Redirect to login (except for public routes)
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()

    // Check freeze mode for non-admins
    const { data: settings } = await supabase
      .from('system_settings')
      .select('freeze_mode')
      .single()

    const isAdmin = (profile as any)?.status === 'admin'
    const isPending = (profile as any)?.status === 'pending'
    const isActive = (profile as any)?.status === 'active' || (profile as any)?.status === 'facilitator'

    // Redirect pending users to waiting room
    if (isPending && !request.nextUrl.pathname.startsWith('/waiting-room')) {
      return NextResponse.redirect(new URL('/waiting-room', request.url))
    }

    // Prevent pending users from accessing protected routes
    if (isPending && request.nextUrl.pathname.startsWith('/waiting-room')) {
      return response
    }

    // Admin-only routes
    if (request.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
      return NextResponse.redirect(new URL('/hearth', request.url))
    }

    // Block non-admin writes during freeze mode
    if ((settings as any)?.freeze_mode && !isAdmin && request.method !== 'GET') {
      return new NextResponse(
        JSON.stringify({ error: 'The community is currently in rest mode. Posting is temporarily disabled.' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    }

    // Redirect authenticated users away from login
    if (isPublicRoute && (isActive || isAdmin)) {
      return NextResponse.redirect(new URL('/hearth', request.url))
    }
  }

  return response
}

// Protect ALL routes except static assets needed for the login page
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - Public assets needed for login page only (icons, manifest)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json).*)',
  ],
}
