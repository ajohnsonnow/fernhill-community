'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Settings as SettingsIcon, Edit3, Bug, Lightbulb, Heart, Camera, Loader2, X, Shield, Key, Bell, Eye, EyeOff, Smartphone, Monitor, Lock, Accessibility } from 'lucide-react'
import { toast } from 'sonner'
import { compressAvatar } from '@/lib/image-utils'
import NotificationManager from '@/components/notifications/NotificationManager'
import { exportPrivateKey, generateRecoveryPhrase } from '@/lib/crypto'
import { AccessibilitySettingsPanel } from '@/components/accessibility'

const VIBE_OPTIONS = [
  { value: 'offline', label: 'Offline', emoji: '⚫' },
  { value: 'flowing', label: 'Flowing', emoji: '🌊' },
  { value: 'staccato', label: 'Staccato', emoji: '⚡' },
  { value: 'chaos', label: 'In the Chaos', emoji: '🌀' },
  { value: 'lyrical', label: 'Lyrical', emoji: '✨' },
  { value: 'stillness', label: 'Stillness', emoji: '🕯️' },
  { value: 'open_to_dance', label: 'Open to Dance', emoji: '🤝' },
  { value: 'mycelial', label: 'Mycelial', emoji: '🍄' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showVibeSelector, setShowVibeSelector] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false)
  const [showDirectoryToggle, setShowDirectoryToggle] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Failed to log out')
    }
  }

  const handleVibeChange = async (vibe: string) => {
    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ vibe_status: vibe })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, vibe_status: vibe })
      setShowVibeSelector(false)
      toast.success('Vibe updated!')
    } catch (error) {
      toast.error('Failed to update vibe')
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sacred-gold">Loading...</div>
      </div>
    )
  }

  const currentVibe = VIBE_OPTIONS.find(v => v.value === profile.vibe_status) || VIBE_OPTIONS[0]

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gradient-gold mb-6">Profile</h1>

        <div className="glass-panel rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className={`w-20 h-20 rounded-full glass-panel-dark overflow-hidden ring-4 ${
                profile.vibe_status !== 'offline' ? 'ring-sacred-gold/50' : 'ring-transparent'
              }`}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover aspect-square" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sacred-gold font-bold text-2xl">
                    {profile.tribe_name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {/* Vibe Status Indicator */}
              <button
                onClick={() => setShowVibeSelector(true)}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full glass-panel flex items-center justify-center text-sm hover:scale-110 transition-transform border border-sacred-gold/30"
              >
                {currentVibe.emoji}
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{profile.tribe_name}</h2>
              <button
                onClick={() => setShowVibeSelector(true)}
                className="text-white/60 capitalize text-sm hover:text-sacred-gold transition-colors"
              >
                {currentVibe.label}
              </button>
            </div>
          </div>

          {profile.mycelial_gifts && (
            <div className="glass-panel-dark rounded-xl p-4 mb-4">
              <p className="text-white/50 text-sm mb-2">Gifts to the Mycelium:</p>
              <p className="text-white/80">{profile.mycelial_gifts}</p>
            </div>
          )}

          <div className="space-y-3">
            {profile.vouched_by_name && (
              <div>
                <p className="text-white/50 text-sm">Vouched by:</p>
                <p className="text-white">{profile.vouched_by_name}</p>
              </div>
            )}
            {profile.soundcloud_url && (
              <div>
                <p className="text-white/50 text-sm">SoundCloud:</p>
                <a href={profile.soundcloud_url} target="_blank" rel="noopener noreferrer" className="text-sacred-gold hover:underline">
                  {profile.soundcloud_url}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Community Links */}
        <div className="card-warm p-4 mb-4">
          <h3 className="text-sm font-medium text-fernhill-sand/60 mb-3 uppercase tracking-wider">Connect</h3>
          <div className="grid grid-cols-2 gap-2">
            <a 
              href="https://www.instagram.com/fernhill_dance_community/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 glass-panel-dark rounded-xl text-fernhill-sand hover:text-fernhill-gold transition-colors"
            >
              📸 Instagram
            </a>
            <a 
              href="https://www.facebook.com/groups/pdxsundayedanceitp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 glass-panel-dark rounded-xl text-fernhill-sand hover:text-fernhill-gold transition-colors"
            >
              👥 Facebook
            </a>
            <a 
              href="https://calendar.google.com/calendar/embed?src=fernhilldance%40gmail.com&ctz=America%2FLos_Angeles"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 glass-panel-dark rounded-xl text-fernhill-sand hover:text-fernhill-gold transition-colors"
            >
              📅 Calendar
            </a>
            <a 
              href="https://venmo.com/u/fernhill"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 glass-panel-dark rounded-xl text-fernhill-sand hover:text-fernhill-gold transition-colors"
            >
              💚 Venmo
            </a>
          </div>
        </div>

        {/* Volunteer Forms */}
        <div className="card-warm p-4 mb-4">
          <h3 className="text-sm font-medium text-fernhill-sand/60 mb-3 uppercase tracking-wider">Community Forms</h3>
          <div className="space-y-2">
            <a 
              href="https://docs.google.com/spreadsheets/d/1EcBHNAVFkNi79c1aAgaMMaQiqLjKhrewcTCWWgQGw1Q/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 glass-panel-dark rounded-xl text-fernhill-sand hover:text-fernhill-gold transition-colors"
            >
              🙋 Altar & Volunteer Sign-Up
            </a>
            <a 
              href="https://forms.gle/cbwu6x3jdyAAio6A7"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 glass-panel-dark rounded-xl text-fernhill-sand hover:text-fernhill-gold transition-colors"
            >
              🎵 DJ / Artist Submission
            </a>
            <a 
              href="https://forms.gle/9yXVS4MSwMP9CJnQ7"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 glass-panel-dark rounded-xl text-fernhill-sand hover:text-fernhill-gold transition-colors"
            >
              💬 General Feedback
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="w-full glass-panel rounded-xl p-4 flex items-center justify-between hover:bg-fernhill-brown/30 transition-colors"
          >
            <span className="flex items-center gap-3 text-fernhill-cream">
              <Edit3 className="w-5 h-5" />
              Edit Profile
            </span>
          </button>

          <button
            onClick={() => setShowFeedbackModal(true)}
            className="w-full glass-panel rounded-xl p-4 flex items-center justify-between hover:bg-fernhill-brown/30 transition-colors"
          >
            <span className="flex items-center gap-3 text-fernhill-cream">
              <Lightbulb className="w-5 h-5" />
              Send Feedback
            </span>
          </button>

          <button
            onClick={() => setShowAccessibilityModal(true)}
            className="w-full glass-panel rounded-xl p-4 flex items-center justify-between hover:bg-fernhill-brown/30 transition-colors"
          >
            <span className="flex items-center gap-3 text-fernhill-cream">
              <Accessibility className="w-5 h-5" />
              Accessibility
            </span>
          </button>

          <button
            onClick={() => setShowSecurityModal(true)}
            className="w-full glass-panel rounded-xl p-4 flex items-center justify-between hover:bg-fernhill-brown/30 transition-colors"
          >
            <span className="flex items-center gap-3 text-fernhill-cream">
              <Lock className="w-5 h-5" />
              Security & Privacy
            </span>
          </button>

          {profile.status === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="w-full glass-panel rounded-xl p-4 flex items-center justify-between hover:bg-fernhill-brown/30 transition-colors"
            >
              <span className="flex items-center gap-3 text-fernhill-gold">
                <Shield className="w-5 h-5" />
                Admin Dashboard
              </span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full glass-panel rounded-xl p-4 flex items-center justify-between hover:bg-red-500/20 transition-colors text-red-400"
          >
            <span className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              Log Out
            </span>
          </button>
        </div>
      </div>

      {/* Vibe Selector */}
      {showVibeSelector && (
        <VibeSelector
          currentVibe={profile.vibe_status}
          onSelect={handleVibeChange}
          onClose={() => setShowVibeSelector(false)}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchProfile()
          }}
        />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal onClose={() => setShowFeedbackModal(false)} />
      )}

      {/* Security Modal */}
      {showSecurityModal && (
        <SecurityModal 
          profile={profile}
          onClose={() => setShowSecurityModal(false)} 
        />
      )}

      {/* Accessibility Modal */}
      {showAccessibilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAccessibilityModal(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto animate-fade-in">
            <AccessibilitySettingsPanel 
              onClose={() => setShowAccessibilityModal(false)} 
              showCloseButton={true}
            />
            <button
              onClick={() => {
                localStorage.removeItem('accessibility-fab-dismissed')
                toast.success('Floating button restored!')
              }}
              className="mt-3 w-full text-center text-sm text-fernhill-sand/60 hover:text-fernhill-sand transition-colors"
            >
              Show floating accessibility button
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface VibeSelectorProps {
  currentVibe: string
  onSelect: (vibe: string) => void
  onClose: () => void
}

function VibeSelector({ currentVibe, onSelect, onClose }: VibeSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-panel rounded-2xl p-6 animate-fadeIn">
        <h3 className="text-lg font-bold text-white mb-4 text-center">Set Your Vibe</h3>
        <div className="grid grid-cols-2 gap-2">
          {VIBE_OPTIONS.map((vibe) => (
            <button
              key={vibe.value}
              onClick={() => onSelect(vibe.value)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentVibe === vibe.value
                  ? 'glass-panel text-sacred-gold ring-2 ring-sacred-gold'
                  : 'glass-panel-dark text-white/70 hover:bg-white/10'
              }`}
            >
              <span className="text-2xl">{vibe.emoji}</span>
              <span className="text-sm font-medium">{vibe.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface EditProfileModalProps {
  profile: any
  onClose: () => void
  onSuccess: () => void
}

function EditProfileModal({ profile, onClose, onSuccess }: EditProfileModalProps) {
  const [tribeName, setTribeName] = useState(profile.tribe_name || '')
  const [gifts, setGifts] = useState(profile.mycelial_gifts || '')
  const [soundcloud, setSoundcloud] = useState(profile.soundcloud_url || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Compress avatar (200KB, 400px, webp)
      const compressedFile = await compressAvatar(file)
      setAvatarFile(compressedFile)

      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      toast.error('Failed to process image')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let avatarUrl = profile.avatar_url

      if (avatarFile) {
        const fileName = `${profile.id}/${Date.now()}.webp`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true,
          })

        if (uploadError) throw uploadError

        // For private buckets, use createSignedUrl instead of getPublicUrl
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('avatars')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year expiry for avatars

        if (signedUrlError) throw signedUrlError
        avatarUrl = signedUrlData.signedUrl
      }

      const { error } = await (supabase
        .from('profiles') as any)
        .update({
          tribe_name: tribeName,
          mycelial_gifts: gifts || null,
          soundcloud_url: soundcloud || null,
          website: website || null,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Profile updated!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 my-8 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg glass-panel-dark hover:bg-white/10">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full glass-panel-dark overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-full h-full object-cover aspect-square" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sacred-gold font-bold text-3xl">
                    {tribeName?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                aria-label="Upload avatar image"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change avatar"
                className="absolute bottom-0 right-0 p-2 rounded-full glass-panel hover:bg-white/10"
              >
                <Camera className="w-4 h-4 text-sacred-gold" />
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="tribe-name" className="block text-sm font-medium text-white/80 mb-2">Tribe Name *</label>
            <input
              id="tribe-name"
              type="text"
              value={tribeName}
              onChange={(e) => setTribeName(e.target.value)}
              required
              placeholder="Your tribe name"
              className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Gifts to the Mycelium</label>
            <textarea
              value={gifts}
              onChange={(e) => setGifts(e.target.value)}
              placeholder="What do you bring to the tribe?"
              rows={3}
              className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">SoundCloud URL</label>
            <input
              type="url"
              value={soundcloud}
              onChange={(e) => setSoundcloud(e.target.value)}
              placeholder="https://soundcloud.com/..."
              className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !tribeName}
              className="flex-1 btn-primary bg-sacred-gold text-sacred-charcoal hover:bg-sacred-gold/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SecurityModal({ profile, onClose }: { profile: any; onClose: () => void }) {
  const [showInDirectory, setShowInDirectory] = useState(profile.show_in_directory ?? true)
  const [showBackupKey, setShowBackupKey] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const supabase = createClient()

  const handleDirectoryToggle = async () => {
    try {
      const newValue = !showInDirectory
      setShowInDirectory(newValue)

      const { error } = await (supabase
        .from('profiles') as any)
        .update({ show_in_directory: newValue })
        .eq('id', profile.id)

      if (error) throw error
      toast.success(newValue ? 'You are now visible in the directory' : 'You are now hidden from the directory')
    } catch (error) {
      setShowInDirectory(!showInDirectory) // Revert
      toast.error('Failed to update setting')
    }
  }

  const handleBackupKey = async () => {
    setLoading(true)
    try {
      // Get private key from IndexedDB
      const request = indexedDB.open('fernhill-keys', 1)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'userId' })
        }
      }
      
      request.onsuccess = async () => {
        const db = request.result
        
        // Check if keys store exists
        if (!db.objectStoreNames.contains('keys')) {
          toast.error('Encryption keys not initialized. Send a message first to generate keys.')
          setLoading(false)
          return
        }
        
        const tx = db.transaction('keys', 'readonly')
        const store = tx.objectStore('keys')
        const getRequest = store.get(profile.id)
        
        getRequest.onsuccess = async () => {
          const privateKey = getRequest.result?.privateKey
          if (privateKey) {
            const phrase = await generateRecoveryPhrase(privateKey)
            setRecoveryPhrase(phrase)
            setShowBackupKey(true)
          } else {
            toast.error('No encryption keys found. Send a message first to generate keys.')
          }
          setLoading(false)
        }
        
        getRequest.onerror = () => {
          toast.error('Failed to access encryption keys')
          setLoading(false)
        }
      }
      
      request.onerror = () => {
        toast.error('Failed to access key storage')
        setLoading(false)
      }
    } catch (error) {
      toast.error('Failed to generate backup')
      setLoading(false)
    }
  }

  const handleSignOutAllDevices = async () => {
    if (!confirm('This will sign you out of all devices. Continue?')) return
    
    try {
      await supabase.auth.signOut({ scope: 'global' })
      toast.success('Signed out of all devices')
      window.location.href = '/login'
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    setPasswordLoading(true)
    try {
      // Update password (Supabase handles encryption)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('Password changed successfully! 🔒')
      setShowChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 my-8 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-fernhill-cream">Security & Privacy</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg glass-panel-dark hover:bg-white/10">
            <X className="w-5 h-5 text-fernhill-sand" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Notifications */}
          <div>
            <h3 className="text-sm font-medium text-fernhill-sand/60 mb-2 uppercase tracking-wider">Notifications</h3>
            <NotificationManager />
          </div>

          {/* Directory Visibility */}
          <div>
            <h3 className="text-sm font-medium text-fernhill-sand/60 mb-2 uppercase tracking-wider">Directory Visibility</h3>
            <button
              onClick={handleDirectoryToggle}
              className={`flex items-center gap-3 p-4 rounded-xl w-full transition-colors ${
                showInDirectory
                  ? 'glass-panel text-fernhill-gold'
                  : 'glass-panel-dark text-fernhill-sand'
              }`}
            >
              {showInDirectory ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">
                  {showInDirectory ? 'Visible in Soul Gallery' : 'Hidden from Soul Gallery'}
                </p>
                <p className="text-xs opacity-60">
                  {showInDirectory ? 'Other members can find you' : 'You are not listed'}
                </p>
              </div>
            </button>
          </div>

          {/* E2EE Backup */}
          <div>
            <h3 className="text-sm font-medium text-fernhill-sand/60 mb-2 uppercase tracking-wider">Message Encryption</h3>
            {showBackupKey && recoveryPhrase ? (
              <div className="glass-panel-dark rounded-xl p-4">
                <p className="text-fernhill-sand text-sm mb-3">
                  ⚠️ Write this down and keep it safe. If you lose it, your encrypted messages cannot be recovered.
                </p>
                <div className="glass-panel rounded-xl p-3 font-mono text-xs text-fernhill-gold break-all">
                  {recoveryPhrase}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryPhrase)
                    toast.success('Recovery phrase copied')
                  }}
                  className="mt-3 px-4 py-2 rounded-lg glass-panel text-fernhill-gold text-sm"
                >
                  Copy to Clipboard
                </button>
              </div>
            ) : (
              <button
                onClick={handleBackupKey}
                disabled={loading}
                className="flex items-center gap-3 p-4 rounded-xl w-full glass-panel-dark text-fernhill-sand hover:bg-white/10 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Key className="w-5 h-5" />
                )}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">Backup Recovery Phrase</p>
                  <p className="text-xs opacity-60">Save your E2EE key for message recovery</p>
                </div>
              </button>
            )}
          </div>

          {/* Session Management */}
          <div>
            <h3 className="text-sm font-medium text-fernhill-sand/60 mb-2 uppercase tracking-wider">Sessions</h3>
            <button
              onClick={handleSignOutAllDevices}
              className="flex items-center gap-3 p-4 rounded-xl w-full glass-panel-dark text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Smartphone className="w-5 h-5" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">Sign Out All Devices</p>
                <p className="text-xs opacity-60">Revoke access from all sessions</p>
              </div>
            </button>
          </div>

          {/* Change Password */}
          <div>
            <h3 className="text-sm font-medium text-fernhill-sand/60 mb-2 uppercase tracking-wider">Password</h3>
            {showChangePassword ? (
              <form onSubmit={handleChangePassword} className="glass-panel-dark rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xs text-fernhill-sand/60 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fernhill-sand/40" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2 glass-panel rounded-lg text-fernhill-sand text-sm placeholder-fernhill-sand/30 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-fernhill-sand/40 hover:text-fernhill-sand"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-fernhill-sand/60 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fernhill-sand/40" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      minLength={6}
                      className="w-full pl-10 py-2 glass-panel rounded-lg text-fernhill-sand text-sm placeholder-fernhill-sand/30 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false)
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    className="flex-1 px-3 py-2 rounded-lg glass-panel text-fernhill-sand/60 text-sm hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 px-3 py-2 rounded-lg glass-panel text-fernhill-gold text-sm hover:bg-fernhill-gold/10 disabled:opacity-50"
                  >
                    {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowChangePassword(true)}
                className="flex items-center gap-3 p-4 rounded-xl w-full glass-panel-dark text-fernhill-sand hover:bg-white/10 transition-colors"
              >
                <Lock className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">Change Password</p>
                  <p className="text-xs opacity-60">Update your login password</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<'bug' | 'feature' | 'gratitude'>('feature')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [includeConsoleLogs, setIncludeConsoleLogs] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const supabase = createClient()

  // Capture console errors and warnings
  useEffect(() => {
    const logs: string[] = []
    const originalError = console.error
    const originalWarn = console.warn
    
    console.error = (...args: any[]) => {
      logs.push(`[ERROR] ${args.map(a => String(a)).join(' ')}`)
      originalError.apply(console, args)
    }
    
    console.warn = (...args: any[]) => {
      logs.push(`[WARN] ${args.map(a => String(a)).join(' ')}`)
      originalWarn.apply(console, args)
    }
    
    setConsoleLogs(logs)
    
    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get browser and device info
      const browserInfo = {
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        url: window.location.href
      }

      const feedbackData: any = {
        user_id: user.id,
        type,
        message,
        browser_info: browserInfo
      }

      // Include console logs only for bug reports if checkbox is checked
      if (type === 'bug' && includeConsoleLogs && consoleLogs.length > 0) {
        feedbackData.console_logs = consoleLogs.slice(-50).join('\n') // Last 50 logs
      }

      const { error } = await (supabase
        .from('feedback') as any)
        .insert(feedbackData)

      if (error) throw error

      toast.success('Feedback sent to the stewards! 🙏')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 animate-fadeIn">
        <h2 className="text-xl font-bold text-white mb-6">Voice of the Tribe</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('bug')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl transition-all ${
                type === 'bug' ? 'glass-panel text-red-400' : 'glass-panel-dark text-white/60'
              }`}
            >
              <Bug className="w-5 h-5" />
              Bug Report
            </button>
            <button
              type="button"
              onClick={() => setType('feature')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl transition-all ${
                type === 'feature' ? 'glass-panel text-sacred-gold' : 'glass-panel-dark text-white/60'
              }`}
            >
              <Lightbulb className="w-5 h-5" />
              Feature Idea
            </button>
            <button
              type="button"
              onClick={() => setType('gratitude')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl transition-all ${
                type === 'gratitude' ? 'glass-panel text-forest-green' : 'glass-panel-dark text-white/60'
              }`}
            >
              <Heart className="w-5 h-5" />
              Gratitude
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Your Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === 'bug' ? 'Describe what happened...' :
                type === 'feature' ? 'What would you love to see?' :
                'Share your gratitude...'
              }
              required
              rows={5}
              className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50 resize-none"
            />
          </div>

          {/* Console logs checkbox for bug reports */}
          {type === 'bug' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeConsoleLogs}
                onChange={(e) => setIncludeConsoleLogs(e.target.checked)}
                className="w-4 h-4 rounded border-fernhill-sand/40 bg-fernhill-dark text-sacred-gold focus:ring-sacred-gold"
              />
              <span className="text-sm text-white/70">
                Include console logs ({consoleLogs.length} captured) - helps us debug faster
              </span>
            </label>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !message}
              className="flex-1 btn-primary bg-sacred-gold text-sacred-charcoal hover:bg-sacred-gold/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
