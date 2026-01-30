'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminName, setAdminName] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Please sign in to access admin panel')
        router.push('/login')
        return
      }

      // Check user's status in profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('status, tribe_name')
        .eq('id', user.id)
        .single() as { data: { status: string; tribe_name: string } | null; error: any }

      if (error || !profile) {
        console.error('Error checking admin status:', error)
        toast.error('Failed to verify admin access')
        router.push('/hearth')
        return
      }

      if (profile.status !== 'admin') {
        toast.error('Admin access required')
        router.push('/hearth')
        return
      }

      // User is admin
      setIsAdmin(true)
      setAdminName(profile.tribe_name)
    } catch (error) {
      console.error('Admin access check error:', error)
      toast.error('Access denied')
      router.push('/hearth')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fernhill-dark">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-fernhill-gold mx-auto mb-4" />
          <p className="text-fernhill-sand/60">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fernhill-dark p-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-fernhill-cream mb-2">Access Denied</h1>
          <p className="text-fernhill-sand/60 mb-6">
            This area is restricted to administrators only.
          </p>
          <button
            onClick={() => router.push('/hearth')}
            className="btn-primary bg-fernhill-gold text-fernhill-dark"
          >
            Return to Hearth
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fernhill-dark">
      {/* Admin Header */}
      <div className="glass-panel border-b border-fernhill-gold/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-fernhill-gold/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-fernhill-gold" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-fernhill-cream">Admin Dashboard</h1>
              <p className="text-xs text-fernhill-sand/60">Logged in as {adminName}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/hearth')}
            className="text-sm text-fernhill-sand/60 hover:text-fernhill-cream transition-colors"
          >
            Exit Admin
          </button>
        </div>
      </div>
      
      {/* Admin Content */}
      {children}
    </div>
  )
}
