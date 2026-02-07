import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
  // During build or if env vars missing, return a dummy client that won't crash
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'undefined') {
    console.warn('Supabase credentials not found - using placeholder client')
    // Return a mock client for build time (non-JWT placeholder to avoid secret scanning alerts)
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'build-time-placeholder-anon-key'
    )
  }
  
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}
