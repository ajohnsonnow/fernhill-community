'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  Users, Shield, MessageSquare, Settings, FileText, 
  Search, ChevronDown, Ban, CheckCircle, Crown, UserX,
  Trash2, Eye, Filter, AlertTriangle, Clock, Activity,
  RefreshCw, Download, Upload, Lock, Unlock, Calendar,
  UserPlus, Loader2, Mail, ExternalLink
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

type TabType = 'users' | 'content' | 'queue' | 'events' | 'settings' | 'feedback' | 'logs'

interface Profile {
  id: string
  tribe_name: string
  full_name: string | null
  username: string | null
  status: 'pending' | 'active' | 'facilitator' | 'admin' | 'banned'
  created_at: string
  vouched_by_name: string | null
  requires_review?: boolean
}

interface ContentQueueItem {
  id: string
  user_id: string
  content_type: 'music_set' | 'vibe_tag_suggestion' | 'post' | 'altar_photo'
  content_data: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
  profiles?: { tribe_name: string } | null
}

interface Post {
  id: string
  content: string
  category: string
  created_at: string
  author_id: string
  profiles: { tribe_name: string } | null
}

interface Feedback {
  id: string
  type: 'bug' | 'feature' | 'gratitude'
  message: string
  created_at: string
  user_id: string
  profiles: { tribe_name: string } | null
  browser_info?: {
    userAgent: string
    viewport: string
    url: string
  }
  console_logs?: string
}

interface AuditLog {
  id: string
  action: string
  details: Record<string, unknown>
  created_at: string
  admin_id: string | null
}

interface EventSubmission {
  id: string
  user_id: string
  title: string
  description: string | null
  proposed_date: string
  proposed_location: string
  location_address: string | null
  event_type: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  profiles?: { tribe_name: string } | null
}

interface SystemSettings {
  id: string
  freeze_mode: boolean
  keyword_filters?: string[]
  updated_at: string
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Data states
  const [users, setUsers] = useState<Profile[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [contentQueue, setContentQueue] = useState<ContentQueueItem[]>([])
  const [eventSubmissions, setEventSubmissions] = useState<EventSubmission[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  
  // Filter states
  const [userSearch, setUserSearch] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all')
  const [contentSearch, setContentSearch] = useState('')
  const [queueFilter, setQueueFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  
  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{id: string, name: string} | null>(null)
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    bannedUsers: 0,
    totalPosts: 0,
    totalFeedback: 0,
    pendingEvents: 0,
    pendingQueue: 0
  })
  
  const supabase = createClient()

  useEffect(() => {
    // Get current user ID first
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    getCurrentUser()
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchUsers(),
      fetchPosts(),
      fetchContentQueue(),
      fetchEventSubmissions(),
      fetchFeedback(),
      fetchAuditLogs(),
      fetchSettings(),
      fetchStats()
    ])
    setLoading(false)
  }

  const fetchUsers = async () => {
    // Try with requires_review first, fall back to basic query
    const { data, error } = await supabase
      .from('profiles')
      .select('*, requires_review')
      .order('created_at', { ascending: false })
    
    if (error) {
      // requires_review column may not exist, try without it
      const { data: basicData, error: basicError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!basicError && basicData) setUsers(basicData)
    } else if (data) {
      setUsers(data)
    }
  }

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(tribe_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (!error && data) setPosts(data)
  }

  const fetchContentQueue = async () => {
    const { data, error } = await (supabase
      .from('content_queue') as any)
      .select('*, profiles(tribe_name)')
      .order('created_at', { ascending: false })
    
    // If error (table doesn't exist), ignore silently
    if (!error && data) {
      setContentQueue(data)
    } else {
      setContentQueue([])
    }
  }

  const fetchEventSubmissions = async () => {
    const { data, error } = await (supabase
      .from('event_submissions') as any)
      .select('*, profiles(tribe_name)')
      .order('created_at', { ascending: false })
    
    if (!error && data) setEventSubmissions(data)
  }

  const fetchFeedback = async () => {
    const { data, error } = await supabase
      .from('feedback')
      .select('*, profiles(tribe_name)')
      .order('created_at', { ascending: false })
    
    if (!error && data) setFeedback(data)
  }

  const fetchAuditLogs = async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (!error && data) setAuditLogs(data)
  }

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single()
    
    if (!error && data) setSettings(data)
  }

  const fetchStats = async () => {
    // Core queries (tables that exist)
    const [total, active, pending, banned, posts, fb, pendingEvts] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).in('status', ['active', 'facilitator', 'admin']),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'banned'),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('feedback').select('*', { count: 'exact', head: true }),
      (supabase.from('event_submissions') as any).select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ])
    
    // content_queue might not exist yet (requires migration)
    let pendingQueueCount = 0
    try {
      const pendingQ = await (supabase.from('content_queue') as any).select('*', { count: 'exact', head: true }).eq('status', 'pending')
      pendingQueueCount = pendingQ.count || 0
    } catch {
      // Table doesn't exist yet - migration not run
    }
    
    setStats({
      totalUsers: total.count || 0,
      activeUsers: active.count || 0,
      pendingUsers: pending.count || 0,
      bannedUsers: banned.count || 0,
      totalPosts: posts.count || 0,
      totalFeedback: fb.count || 0,
      pendingEvents: pendingEvts.count || 0,
      pendingQueue: pendingQueueCount
    })
  }

  const logAction = async (action: string, details: Record<string, unknown>) => {
    const { data: { user } } = await supabase.auth.getUser()
    await (supabase.from('audit_logs') as any).insert({
      admin_id: user?.id,
      action,
      details
    })
    fetchAuditLogs()
  }

  // User Management Functions
  const updateUserStatus = async (userId: string, newStatus: string, userName: string) => {
    const { error } = await (supabase.from('profiles') as any)
      .update({ status: newStatus })
      .eq('id', userId)
    
    if (error) {
      toast.error('Failed to update user status')
      return
    }
    
    toast.success(`${userName} status updated to ${newStatus}`)
    await logAction('user_status_change', { userId, userName, newStatus })
    fetchUsers()
    fetchStats()
  }

  // Toggle trust level (requires_review)
  const toggleUserTrust = async (userId: string, userName: string, currentValue: boolean) => {
    const newValue = !currentValue
    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({ requires_review: newValue })
        .eq('id', userId)
      
      if (error) {
        // Column might not exist yet
        toast.error('Trust feature requires database migration')
        return
      }
      
      const trustLabel = newValue ? 'Review Required' : 'Trusted Poster'
      toast.success(`${userName} is now: ${trustLabel}`)
      await logAction('trust_status_change', { userId, userName, requires_review: newValue })
      fetchUsers()
    } catch {
      toast.error('Trust feature not available yet')
    }
  }

  const deleteUser = async (userId: string, userName: string) => {
    // Delete profile (auth user remains but can't access app)
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    
    if (error) {
      toast.error('Failed to delete user')
      return
    }
    
    toast.success(`${userName} has been removed`)
    await logAction('user_deleted', { userId, userName })
    setShowDeleteConfirm(null)
    fetchUsers()
    fetchStats()
  }

  // Add User Function - uses server-side API to create user properly
  const addUser = async (email: string, tribeName: string, status: string) => {
    setAddUserLoading(true)
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, tribeName, status }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      toast.success(data.message || `${tribeName} added successfully!`, {
        description: 'User can now sign in with their email'
      })
      setShowAddUserModal(false)
      fetchUsers()
      fetchStats()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add user')
    } finally {
      setAddUserLoading(false)
    }
  }

  // Content Moderation Functions
  const deletePost = async (postId: string, authorName: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    
    if (error) {
      toast.error('Failed to delete post')
      return
    }
    
    toast.success('Post deleted')
    await logAction('post_deleted', { postId, authorName })
    fetchPosts()
    fetchStats()
  }

  // Content Queue Functions
  const approveContent = async (item: ContentQueueItem) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // First, publish the content to the appropriate table
    let publishError = null
    
    if (item.content_type === 'music_set') {
      const { error } = await (supabase.from('music_sets') as any).insert({
        title: (item.content_data as any).title,
        url: (item.content_data as any).url,
        vibe_tags: (item.content_data as any).vibe_tags,
        tracklist: (item.content_data as any).tracklist,
        dj_id: item.user_id
      })
      publishError = error
    } else if (item.content_type === 'vibe_tag_suggestion') {
      const { error } = await (supabase.from('custom_vibe_tags') as any).upsert({
        value: (item.content_data as any).value,
        label: (item.content_data as any).label,
        emoji: (item.content_data as any).emoji,
        category: (item.content_data as any).category || 'custom',
        suggested_by: item.user_id,
        is_approved: true,
        approved_by: user?.id,
        approved_at: new Date().toISOString()
      })
      publishError = error
    }

    if (publishError) {
      toast.error('Failed to publish content')
      console.error(publishError)
      return
    }

    // Update queue status
    const { error: updateError } = await (supabase.from('content_queue') as any)
      .update({
        status: 'approved',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: reviewNotes || null
      })
      .eq('id', item.id)

    if (updateError) {
      toast.error('Failed to update queue status')
      return
    }

    toast.success('Content approved and published!')
    await logAction('content_approved', { 
      queueId: item.id, 
      contentType: item.content_type,
      title: (item.content_data as any).title || (item.content_data as any).label 
    })
    setReviewNotes('')
    fetchContentQueue()
    fetchStats()
  }

  const rejectContent = async (item: ContentQueueItem, notes?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await (supabase.from('content_queue') as any)
      .update({
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes || reviewNotes || null
      })
      .eq('id', item.id)

    if (error) {
      toast.error('Failed to reject content')
      return
    }

    toast.success('Content rejected')
    await logAction('content_rejected', { 
      queueId: item.id, 
      contentType: item.content_type,
      title: (item.content_data as any).title || (item.content_data as any).label,
      notes 
    })
    setReviewNotes('')
    fetchContentQueue()
    fetchStats()
  }

  // Filter content queue
  const filteredQueue = contentQueue.filter(item => 
    queueFilter === 'all' || item.status === queueFilter
  )

  // Settings Functions
  const toggleFreezeMode = async () => {
    if (!settings) return
    
    const newValue = !settings.freeze_mode
    const { error } = await (supabase.from('system_settings') as any)
      .update({ freeze_mode: newValue, updated_at: new Date().toISOString() })
      .eq('id', settings.id)
    
    if (error) {
      toast.error('Failed to update freeze mode')
      return
    }
    
    toast.success(newValue ? 'Community is now in freeze mode' : 'Freeze mode disabled')
    await logAction('freeze_mode_toggle', { enabled: newValue })
    fetchSettings()
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.tribe_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.username?.toLowerCase().includes(userSearch.toLowerCase())
    const matchesStatus = userStatusFilter === 'all' || user.status === userStatusFilter
    return matchesSearch && matchesStatus
  })

  // Filter posts
  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(contentSearch.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-300',
      active: 'bg-green-500/20 text-green-300',
      facilitator: 'bg-blue-500/20 text-blue-300',
      admin: 'bg-purple-500/20 text-purple-300',
      banned: 'bg-red-500/20 text-red-300'
    }
    return styles[status] || 'bg-gray-500/20 text-gray-300'
  }

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, count: stats.totalUsers },
    { id: 'queue', label: 'Queue', icon: Clock, count: stats.pendingQueue, highlight: stats.pendingQueue > 0 },
    { id: 'content', label: 'Content', icon: MessageSquare, count: stats.totalPosts },
    { id: 'events', label: 'Events', icon: Calendar, count: stats.pendingEvents, highlight: stats.pendingEvents > 0 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'feedback', label: 'Feedback', icon: FileText, count: stats.totalFeedback },
    { id: 'logs', label: 'Audit Logs', icon: Activity }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-fernhill-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 border-b border-fernhill-sand/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-fernhill-gold font-display">Admin Dashboard</h1>
            <p className="text-fernhill-sand/60 text-sm">Full community management</p>
          </div>
          <button 
            onClick={fetchAllData}
            className="p-2 rounded-lg glass-panel-dark hover:bg-fernhill-brown/30 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5 text-fernhill-sand/60" />
          </button>
        </div>
        
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="glass-panel-dark rounded-xl p-2">
            <p className="text-lg font-bold text-fernhill-gold">{stats.activeUsers}</p>
            <p className="text-xs text-fernhill-sand/50">Active</p>
          </div>
          <div className="glass-panel-dark rounded-xl p-2">
            <p className="text-lg font-bold text-yellow-400">{stats.pendingUsers}</p>
            <p className="text-xs text-fernhill-sand/50">Pending</p>
          </div>
          <div className="glass-panel-dark rounded-xl p-2">
            <p className="text-lg font-bold text-red-400">{stats.bannedUsers}</p>
            <p className="text-xs text-fernhill-sand/50">Banned</p>
          </div>
          <div className="glass-panel-dark rounded-xl p-2">
            <p className="text-lg font-bold text-fernhill-cream">{stats.totalPosts}</p>
            <p className="text-xs text-fernhill-sand/50">Posts</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-fernhill-sand/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'text-fernhill-gold border-b-2 border-fernhill-gold' 
                : 'text-fernhill-sand/60 hover:text-fernhill-sand'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-fernhill-sand/10">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Header with Add User button */}
            <div className="flex items-center justify-between">
              <p className="text-fernhill-sand/60 text-sm">{filteredUsers.length} users</p>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-fernhill-gold text-fernhill-dark rounded-xl font-medium hover:bg-fernhill-gold/90 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fernhill-sand/40" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 glass-panel-dark rounded-xl text-fernhill-cream placeholder:text-fernhill-sand/40 focus:outline-none focus:ring-1 focus:ring-fernhill-gold/50"
                />
              </div>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 glass-panel-dark rounded-xl text-fernhill-cream focus:outline-none focus:ring-1 focus:ring-fernhill-gold/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="facilitator">Facilitator</option>
                <option value="admin">Admin</option>
                <option value="banned">Banned</option>
              </select>
            </div>

            {/* Users List */}
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <div key={user.id} className="glass-panel rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {/* User Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-fernhill-brown/30">
                      {(user as any).avatar_url ? (
                        <img 
                          src={(user as any).avatar_url} 
                          alt={user.tribe_name || 'User'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-fernhill-sand/40">
                          <UserX className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-fernhill-cream">{user.tribe_name || 'Unnamed'}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(user.status)}`}>
                          {user.status}
                        </span>
                        {!(user as any).avatar_url && user.status === 'pending' && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
                            No photo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-fernhill-sand/50">
                        {user.full_name && `${user.full_name} • `}
                        Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </p>
                      {user.vouched_by_name && (
                        <p className="text-xs text-fernhill-sand/40 mt-1">
                          Vouched by: {user.vouched_by_name}
                        </p>
                      )}
                      {/* Trust Level Toggle */}
                      {user.status !== 'admin' && user.status !== 'banned' && user.status !== 'pending' && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => toggleUserTrust(user.id, user.tribe_name || 'User', user.requires_review ?? true)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
                              user.requires_review === false
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            }`}
                            title={user.requires_review === false ? 'Trusted poster - click to require review' : 'Requires review - click to mark as trusted'}
                          >
                            {user.requires_review === false ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Trusted
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" />
                                Review
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {user.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateUserStatus(user.id, 'active', user.tribe_name || 'User')}
                            className="p-2 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateUserStatus(user.id, 'banned', user.tribe_name || 'User')}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Reject"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {/* Status dropdown - show for all non-pending users except yourself */}
                      {user.status !== 'pending' && user.id !== currentUserId && (
                        <select
                          value={user.status}
                          onChange={(e) => updateUserStatus(user.id, e.target.value, user.tribe_name || 'User')}
                          className="px-2 py-1 text-xs glass-panel-dark rounded-lg text-fernhill-cream focus:outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="facilitator">Facilitator</option>
                          <option value="admin">Admin</option>
                          <option value="banned">Banned</option>
                        </select>
                      )}
                      
                      {/* Show "You" badge for current user */}
                      {user.id === currentUserId && (
                        <span className="px-2 py-1 text-xs rounded-lg bg-fernhill-gold/20 text-fernhill-gold">
                          You
                        </span>
                      )}
                      
                      {/* Delete button - don't allow deleting yourself */}
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => setShowDeleteConfirm({ id: user.id, name: user.tribe_name || 'User' })}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-colors"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredUsers.length === 0 && (
                <p className="text-center text-fernhill-sand/50 py-8">No users found</p>
              )}
            </div>
          </div>
        )}

        {/* QUEUE TAB - Content Moderation */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="glass-panel rounded-xl p-4 border border-fernhill-gold/20">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-fernhill-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-fernhill-cream font-medium">Content Moderation Queue</p>
                  <p className="text-xs text-fernhill-sand/60 mt-1">
                    Review and approve user-submitted music sets and vibe tag suggestions. 
                    Users with "Review Required" status have all their content sent here first.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {(['pending', 'approved', 'rejected', 'all'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setQueueFilter(filter)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
                    queueFilter === filter
                      ? 'bg-fernhill-gold text-fernhill-dark font-medium'
                      : 'glass-panel text-fernhill-sand/70 hover:text-fernhill-cream'
                  }`}
                >
                  {filter}
                  {filter === 'pending' && stats.pendingQueue > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-yellow-500/30 text-yellow-300">
                      {stats.pendingQueue}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Queue Items */}
            <div className="space-y-3">
              {filteredQueue.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-fernhill-sand/20 mx-auto mb-3" />
                  <p className="text-fernhill-sand/50">
                    {queueFilter === 'pending' ? 'No pending content to review' : `No ${queueFilter} items`}
                  </p>
                </div>
              ) : (
                filteredQueue.map(item => (
                  <div key={item.id} className="glass-panel rounded-xl p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            item.content_type === 'music_set' ? 'bg-purple-500/20 text-purple-300' :
                            item.content_type === 'vibe_tag_suggestion' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {item.content_type === 'music_set' ? '🎵 Music Set' :
                             item.content_type === 'vibe_tag_suggestion' ? '✨ Vibe Tag' :
                             item.content_type}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                            item.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-fernhill-sand/50">
                          From <span className="text-fernhill-gold">{item.profiles?.tribe_name || 'Unknown'}</span>
                          {' • '}{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="glass-panel-dark rounded-lg p-3 mb-3">
                      {item.content_type === 'music_set' && (
                        <div className="space-y-2">
                          <p className="text-fernhill-cream font-medium">
                            {(item.content_data as any).title}
                          </p>
                          <a 
                            href={(item.content_data as any).url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-fernhill-gold hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {(item.content_data as any).url?.substring(0, 50)}...
                          </a>
                          {(item.content_data as any).vibe_tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(item.content_data as any).vibe_tags.map((tag: string) => (
                                <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-fernhill-sand/10 text-fernhill-sand/70">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {item.content_type === 'vibe_tag_suggestion' && (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{(item.content_data as any).emoji}</span>
                          <div>
                            <p className="text-fernhill-cream font-medium">{(item.content_data as any).label}</p>
                            <p className="text-xs text-fernhill-sand/50">
                              Value: {(item.content_data as any).value} • Category: {(item.content_data as any).category || 'custom'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Admin Notes Input (for pending items) */}
                    {item.status === 'pending' && (
                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder="Add notes (optional)..."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          className="w-full px-3 py-2 text-sm glass-panel-dark rounded-lg text-fernhill-cream placeholder:text-fernhill-sand/40 focus:outline-none focus:ring-1 focus:ring-fernhill-gold/50"
                        />
                      </div>
                    )}

                    {/* Existing Admin Notes */}
                    {item.admin_notes && (
                      <p className="text-xs text-fernhill-sand/60 mb-3 italic">
                        Admin notes: {item.admin_notes}
                      </p>
                    )}

                    {/* Actions */}
                    {item.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveContent(item)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve & Publish
                        </button>
                        <button
                          onClick={() => rejectContent(item)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600/20 text-red-400 font-medium hover:bg-red-600/30 transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fernhill-sand/40" />
              <input
                type="text"
                placeholder="Search posts..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 glass-panel-dark rounded-xl text-fernhill-cream placeholder:text-fernhill-sand/40 focus:outline-none focus:ring-1 focus:ring-fernhill-gold/50"
              />
            </div>

            {/* Posts List */}
            <div className="space-y-2">
              {filteredPosts.map(post => (
                <div key={post.id} className="glass-panel rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-fernhill-gold">
                          {post.profiles?.tribe_name || 'Unknown'}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-fernhill-sand/10 text-fernhill-sand/60">
                          {post.category}
                        </span>
                      </div>
                      <p className="text-sm text-fernhill-cream/80 line-clamp-2">{post.content}</p>
                      <p className="text-xs text-fernhill-sand/40 mt-1">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={() => deletePost(post.id, post.profiles?.tribe_name || 'Unknown')}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredPosts.length === 0 && (
                <p className="text-center text-fernhill-sand/50 py-8">No posts found</p>
              )}
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {/* Quick link to full events admin */}
            <div className="flex items-center justify-between">
              <p className="text-fernhill-sand/60 text-sm">
                {stats.pendingEvents} pending event submissions
              </p>
              <a
                href="/admin/events"
                className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-fernhill-gold hover:bg-fernhill-brown/30 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Full Events Manager
              </a>
            </div>

            {/* Event Submissions List */}
            <div className="space-y-2">
              {eventSubmissions.length === 0 ? (
                <p className="text-center text-fernhill-sand/50 py-8">No event submissions yet</p>
              ) : (
                eventSubmissions.slice(0, 10).map(evt => (
                  <div key={evt.id} className="glass-panel rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-fernhill-cream">{evt.title}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            evt.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                            evt.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {evt.status}
                          </span>
                        </div>
                        <p className="text-xs text-fernhill-sand/60">
                          {evt.profiles?.tribe_name || 'Unknown'} • {format(new Date(evt.proposed_date), 'MMM d, yyyy')} • {evt.proposed_location}
                        </p>
                        {evt.description && (
                          <p className="text-sm text-fernhill-sand/80 mt-2 line-clamp-2">{evt.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {eventSubmissions.length > 10 && (
              <a
                href="/admin/events"
                className="block text-center text-fernhill-gold hover:underline"
              >
                View all {eventSubmissions.length} submissions →
              </a>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Freeze Mode */}
            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings?.freeze_mode ? (
                    <Lock className="w-6 h-6 text-red-400" />
                  ) : (
                    <Unlock className="w-6 h-6 text-green-400" />
                  )}
                  <div>
                    <h3 className="font-medium text-fernhill-cream">Freeze Mode</h3>
                    <p className="text-xs text-fernhill-sand/50">
                      {settings?.freeze_mode 
                        ? 'Community is frozen - only admins can post' 
                        : 'Community is active - all members can post'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleFreezeMode}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    settings?.freeze_mode
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  }`}
                >
                  {settings?.freeze_mode ? 'Unfreeze' : 'Freeze'}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-panel rounded-xl p-4">
              <h3 className="font-medium text-fernhill-cream mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href="/admin/gate"
                  className="flex items-center gap-2 p-3 glass-panel-dark rounded-xl hover:bg-fernhill-brown/30 transition-colors"
                >
                  <Users className="w-5 h-5 text-fernhill-gold" />
                  <span className="text-sm text-fernhill-cream">Review Pending ({stats.pendingUsers})</span>
                </a>
                <button 
                  onClick={() => setActiveTab('feedback')}
                  className="flex items-center gap-2 p-3 glass-panel-dark rounded-xl hover:bg-fernhill-brown/30 transition-colors"
                >
                  <FileText className="w-5 h-5 text-fernhill-gold" />
                  <span className="text-sm text-fernhill-cream">View Feedback ({stats.totalFeedback})</span>
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="glass-panel rounded-xl p-4">
              <h3 className="font-medium text-fernhill-cream mb-3">System Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-fernhill-sand/60">Database</span>
                  <span className="text-fernhill-cream">Supabase PostgreSQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fernhill-sand/60">Auto-purge</span>
                  <span className="text-fernhill-cream">Daily @ 3 AM UTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fernhill-sand/60">Post expiry</span>
                  <span className="text-fernhill-cream">30 days (mutual aid)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && (
          <div className="space-y-2">
            {feedback.length === 0 ? (
              <p className="text-center text-fernhill-sand/50 py-8">No feedback yet</p>
            ) : (
              feedback.map(fb => (
                <div key={fb.id} className="glass-panel rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      fb.type === 'bug' ? 'bg-red-500/20' :
                      fb.type === 'feature' ? 'bg-blue-500/20' :
                      'bg-green-500/20'
                    }`}>
                      {fb.type === 'bug' ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                       fb.type === 'feature' ? <FileText className="w-4 h-4 text-blue-400" /> :
                       <CheckCircle className="w-4 h-4 text-green-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-fernhill-gold">
                          {fb.profiles?.tribe_name || 'Anonymous'}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-fernhill-sand/10 text-fernhill-sand/60 capitalize">
                          {fb.type}
                        </span>
                      </div>
                      <p className="text-sm text-fernhill-cream/80">{fb.message}</p>
                      
                      {/* Browser info for bug reports */}
                      {fb.browser_info && (
                        <details className="mt-2">
                          <summary className="text-xs text-fernhill-sand/60 cursor-pointer hover:text-fernhill-sand">
                            📱 Device Info
                          </summary>
                          <div className="mt-1 p-2 glass-panel-dark rounded text-xs text-fernhill-sand/80 font-mono">
                            <div>URL: {fb.browser_info.url}</div>
                            <div>Viewport: {fb.browser_info.viewport}</div>
                            <div className="truncate">UA: {fb.browser_info.userAgent}</div>
                          </div>
                        </details>
                      )}
                      
                      {/* Console logs for bug reports */}
                      {fb.console_logs && (
                        <details className="mt-2">
                          <summary className="text-xs text-fernhill-sand/60 cursor-pointer hover:text-fernhill-sand">
                            🐛 Console Logs
                          </summary>
                          <pre className="mt-1 p-2 glass-panel-dark rounded text-xs text-fernhill-sand/80 font-mono overflow-x-auto whitespace-pre-wrap">
                            {fb.console_logs}
                          </pre>
                        </details>
                      )}
                      
                      <p className="text-xs text-fernhill-sand/40 mt-1">
                        {formatDistanceToNow(new Date(fb.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <p className="text-center text-fernhill-sand/50 py-8">No audit logs yet</p>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="glass-panel rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-fernhill-sand/40" />
                    <span className="text-xs text-fernhill-sand/40">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-fernhill-cream font-medium">{log.action.replace(/_/g, ' ')}</p>
                  {Object.keys(log.details).length > 0 && (
                    <p className="text-xs text-fernhill-sand/60 mt-1">
                      {JSON.stringify(log.details)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onAdd={addUser}
          loading={addUserLoading}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm glass-panel rounded-2xl p-6 animate-fadeIn">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-fernhill-cream mb-2">Delete User</h3>
              <p className="text-fernhill-sand/70 mb-6">
                Are you sure you want to permanently delete <strong className="text-fernhill-cream">{showDeleteConfirm.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl glass-panel text-fernhill-sand/80 hover:text-fernhill-cream transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUser(showDeleteConfirm.id, showDeleteConfirm.name)}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Add User Modal Component
interface AddUserModalProps {
  onClose: () => void
  onAdd: (email: string, tribeName: string, status: string) => Promise<void>
  loading: boolean
}

function AddUserModal({ onClose, onAdd, loading }: AddUserModalProps) {
  const [email, setEmail] = useState('')
  const [tribeName, setTribeName] = useState('')
  const [status, setStatus] = useState('active')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onAdd(email, tribeName, status)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 animate-fadeIn">
        <h2 className="text-xl font-bold text-fernhill-cream mb-2">Add New User</h2>
        <p className="text-fernhill-sand/60 text-sm mb-6">
          Create a profile for a new community member. They can sign up later to claim their account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fernhill-sand/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
              Tribe Name *
            </label>
            <input
              type="text"
              value={tribeName}
              onChange={(e) => setTribeName(e.target.value)}
              placeholder="e.g., Dancing Oak"
              required
              className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
            >
              <option value="pending">Pending (needs approval)</option>
              <option value="active">Active</option>
              <option value="facilitator">Facilitator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl glass-panel text-fernhill-sand/80 hover:text-fernhill-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email || !tribeName}
              className="flex-1 py-3 rounded-xl bg-fernhill-gold text-fernhill-dark font-semibold hover:bg-fernhill-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
