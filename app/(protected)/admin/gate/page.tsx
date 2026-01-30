'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check, X, Users, Clock, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PendingUser {
  id: string
  tribe_name: string
  vouched_by_name: string
  mycelial_gifts: string | null
  created_at: string
  full_name: string | null
}

export default function AdminGatePage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [stats, setStats] = useState({ pending: 0, active: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPendingUsers()
    fetchStats()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('pending-users')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'status=eq.pending'
      }, () => {
        fetchPendingUsers()
        fetchStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) throw error
      setPendingUsers(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch pending users')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { count: pendingCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'facilitator', 'admin'])

      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      setStats({
        pending: pendingCount || 0,
        active: activeCount || 0,
        total: totalCount || 0,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleApprove = async (userId: string, tribeName: string) => {
    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ status: 'active' })
        .eq('id', userId)

      if (error) throw error

      toast.success(`${tribeName} welcomed to the tribe! 🎉`)
      fetchPendingUsers()
      fetchStats()
    } catch (error: any) {
      toast.error('Failed to approve user')
    }
  }

  const handleReject = async (userId: string, tribeName: string) => {
    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ status: 'banned' })
        .eq('id', userId)

      if (error) throw error

      toast.success(`Request from ${tribeName} declined`)
      fetchPendingUsers()
      fetchStats()
    } catch (error: any) {
      toast.error('Failed to reject user')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sacred-gold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gradient-gold mb-2">Sacred Gate</h1>
          <p className="text-white/60">Review and approve new tribe members</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-panel rounded-2xl p-4 text-center">
            <Clock className="w-8 h-8 text-sacred-gold mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
            <p className="text-white/60 text-sm">Pending</p>
          </div>
          <div className="glass-panel rounded-2xl p-4 text-center">
            <Users className="w-8 h-8 text-forest-green mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.active}</p>
            <p className="text-white/60 text-sm">Active</p>
          </div>
          <div className="glass-panel rounded-2xl p-4 text-center">
            <Sparkles className="w-8 h-8 text-white/60 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-white/60 text-sm">Total</p>
          </div>
        </div>

        {/* Pending Users List */}
        {pendingUsers.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <Check className="w-12 h-12 text-forest-green mx-auto mb-4" />
            <p className="text-white/80 text-lg">No pending requests</p>
            <p className="text-white/50 text-sm mt-2">All caught up! ✨</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="glass-panel rounded-2xl p-6 animate-fadeIn">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {user.tribe_name}
                    </h3>
                    <p className="text-white/60 text-sm">
                      Applied {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="glass-panel-dark rounded-xl p-3">
                    <p className="text-white/50 text-xs mb-1">Vouched by:</p>
                    <p className="text-sacred-gold font-medium">{user.vouched_by_name}</p>
                  </div>
                  
                  {user.mycelial_gifts && (
                    <div className="glass-panel-dark rounded-xl p-3">
                      <p className="text-white/50 text-xs mb-1">Gifts to the Mycelium:</p>
                      <p className="text-white/80 text-sm">{user.mycelial_gifts}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(user.id, user.tribe_name)}
                    className="flex-1 flex items-center justify-center gap-2 bg-forest-green/30 hover:bg-forest-green/50 text-white font-medium px-4 py-3 rounded-xl transition-all active:scale-95"
                  >
                    <Check className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(user.id, user.tribe_name)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-white font-medium px-4 py-3 rounded-xl transition-all active:scale-95"
                  >
                    <X className="w-5 h-5" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
