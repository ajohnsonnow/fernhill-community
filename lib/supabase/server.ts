import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Build-time placeholder (not a real key)
const PLACEHOLDER_KEY = 'build-time-placeholder-key'

interface CookieToSet {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function createClient() {
  const cookieStore = await cookies()
  
  const url = SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = SUPABASE_ANON_KEY || PLACEHOLDER_KEY

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
