'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Sparkles, Check, Camera, Shield } from 'lucide-react'
import FaceCapture from '@/components/verification/FaceCapture'

const COMMUNITY_AGREEMENTS = `# The Fernhill Sacred Container Agreements

## 1. The Dance Floor is a Sacred Space

**Move however you wish**: No judgment, no "right" way to dance.

**Talk-Free Zone**: We keep the vibration high by keeping the dance floor free of verbal conversation.

**Phone-Free Presence**: To remain fully present, phones stay tucked away. No photos or videos on the floor to protect the privacy of our tribe's expression.

## 2. Consent is Mandatory

**The Power of the Hand**: A hand at the heart means "I'm in my own space."

**Respect the "No"**: If someone moves away or signals "no," we respect it instantly and with grace.

**Ask First**: Before entering someone's physical dance space or offering a touch, ensure you have clear, enthusiastic non-verbal or verbal consent.

## 3. Sacred Privacy & Security

**Vouching for the Tribe**: By joining this app, you agree to only "vouch" for people you have met in person and trust within our physical circle.

**Digital Confidentiality**: What is shared in the "Mutual Aid" or "Gratitude" channels stays within this app. No screenshots of community members' personal posts.

## 4. Substance-Free Presence

We dance "clean." We come to the floor clear-headed to find the natural high within our own movement and breath.

---

By scrolling to the bottom and clicking "I Agree," you commit to upholding these sacred agreements.`

export default function WaitingRoomPage() {
  const [step, setStep] = useState(1) // 1: Agreements, 2: Face Capture, 3: Application Form, 4: Pending
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [tribeName, setTribeName] = useState('')
  const [voucher, setVoucher] = useState('')
  const [gifts, setGifts] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [facePhoto, setFacePhoto] = useState<string | null>(null)
  const [faceVerified, setFaceVerified] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data as any)

      // If already has tribe_name and avatar, they're waiting for approval
      if ((data as any)?.tribe_name && (data as any)?.avatar_url) {
        setStep(4)
      } else if ((data as any)?.avatar_url) {
        // Has photo but no tribe_name, go to form
        setFacePhoto((data as any).avatar_url)
        setFaceVerified(true)
        setStep(3)
      }
    }

    fetchProfile()
  }, [supabase, router])

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const isBottom = scrollTop + clientHeight >= scrollHeight - 10
      if (isBottom) {
        setScrolledToBottom(true)
      }
    }
  }

  // Handle face capture
  const handleFaceCapture = async (imageData: string, verified: boolean) => {
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Convert base64 to blob
      const response = await fetch(imageData)
      const blob = await response.blob()
      
      // Upload to Supabase Storage
      const fileName = `face_${user.id}_${Date.now()}.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with avatar URL
      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update({
          avatar_url: urlData.publicUrl,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setFacePhoto(urlData.publicUrl)
      setFaceVerified(verified)
      setStep(3)
      toast.success('Photo saved! Now complete your profile.')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload photo')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { error } = await (supabase
        .from('profiles') as any)
        .update({
          tribe_name: tribeName,
          vouched_by_name: voucher,
          mycelial_gifts: gifts,
        })
        .eq('id', user.id)

      if (error) throw error

      setStep(4)
      toast.success('Your request has been sent to the stewards')
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sacred-charcoal">
        <div className="animate-pulse text-sacred-gold">Loading...</div>
      </div>
    )
  }

  // Step 1: Read Agreements
  if (step === 1) {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-sacred-charcoal via-forest-green/20 to-sacred-charcoal">
        <div className="max-w-2xl mx-auto py-8">
          <div className="glass-panel rounded-3xl p-8">
            <h1 className="text-3xl font-bold text-gradient-gold mb-6 text-center">
              Sacred Container Agreements
            </h1>
            
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="prose prose-invert max-w-none h-96 overflow-y-auto no-scrollbar glass-panel-dark rounded-xl p-6 mb-6 scroll-smooth"
            >
              <div className="whitespace-pre-wrap text-white/80 leading-relaxed">
                {COMMUNITY_AGREEMENTS}
              </div>
            </div>

            {!scrolledToBottom && (
              <p className="text-white/50 text-sm text-center mb-4">
                ↓ Scroll to the bottom to continue ↓
              </p>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!scrolledToBottom}
              className="w-full btn-primary disabled:opacity-30"
            >
              {scrolledToBottom ? 'I Agree to These Agreements' : 'Please Read to Continue'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Face Capture (NEW)
  if (step === 2) {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-sacred-charcoal via-forest-green/20 to-sacred-charcoal">
        <div className="max-w-md mx-auto py-8">
          <div className="glass-panel rounded-3xl p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-panel-dark flex items-center justify-center">
                <Camera className="w-8 h-8 text-sacred-gold" />
              </div>
              <h2 className="text-2xl font-bold text-gradient-gold mb-2">
                Identity Verification
              </h2>
              <p className="text-white/70 text-sm">
                Take a clear photo of your face. This helps our stewards verify you're a real person.
              </p>
            </div>

            {/* Security notice */}
            <div className="glass-panel-dark rounded-xl p-3 mb-6 flex items-start gap-3">
              <Shield className="w-5 h-5 text-sacred-gold flex-shrink-0 mt-0.5" />
              <p className="text-white/60 text-xs">
                Your photo is stored securely and only visible to community stewards during the approval process. 
                It will be used as your profile picture if approved.
              </p>
            </div>

            <FaceCapture 
              onCapture={handleFaceCapture}
              required={true}
            />

            {loading && (
              <div className="mt-4 text-center">
                <p className="text-white/60 text-sm">Uploading photo...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Application Form
  if (step === 3) {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-sacred-charcoal via-forest-green/20 to-sacred-charcoal">
        <div className="max-w-2xl mx-auto py-8">
          <div className="glass-panel rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-panel-dark flex items-center justify-center">
                <Check className="w-8 h-8 text-sacred-gold" />
              </div>
              <h2 className="text-2xl font-bold text-gradient-gold mb-2">
                Join the Tribe
              </h2>
              <p className="text-white/70">
                Tell us about yourself
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="tribeName" className="block text-sm font-medium text-white/80 mb-2">
                  Your Tribe Name *
                </label>
                <input
                  id="tribeName"
                  type="text"
                  value={tribeName}
                  onChange={(e) => setTribeName(e.target.value)}
                  placeholder="The name you dance by..."
                  required
                  className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50"
                />
              </div>

              <div>
                <label htmlFor="voucher" className="block text-sm font-medium text-white/80 mb-2">
                  Who Vouches for You? *
                </label>
                <input
                  id="voucher"
                  type="text"
                  value={voucher}
                  onChange={(e) => setVoucher(e.target.value)}
                  placeholder="Name of a current Fernhill member..."
                  required
                  className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50"
                />
              </div>

              <div>
                <label htmlFor="gifts" className="block text-sm font-medium text-white/80 mb-2">
                  Your Gifts to the Mycelium (Optional)
                </label>
                <textarea
                  id="gifts"
                  value={gifts}
                  onChange={(e) => setGifts(e.target.value)}
                  placeholder="What skills, passions, or energy do you bring? (e.g., sound healing, gardening, tech support...)"
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 glass-panel-dark rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-gold/50 resize-none"
                />
                <p className="text-white/40 text-xs mt-1">{gifts.length}/500</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Step 4: Pending Approval
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sacred-charcoal via-forest-green/20 to-sacred-charcoal">
      <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden glass-panel-dark flex items-center justify-center animate-pulse-glow">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Your photo" className="w-full h-full object-cover" />
          ) : (
            <Sparkles className="w-10 h-10 text-sacred-gold" />
          )}
        </div>
        <h2 className="text-3xl font-bold mb-4 text-gradient-gold">
          Transmission Sent
        </h2>
        <p className="text-white/80 mb-6 leading-relaxed">
          Your request is being reviewed by the Fernhill stewards. You'll receive an email when you're welcomed into the tribe.
        </p>
        <div className="glass-panel-dark rounded-xl p-4 text-left">
          <p className="text-white/60 text-sm mb-2">Your Details:</p>
          <p className="text-white"><strong>Tribe Name:</strong> {profile?.tribe_name}</p>
          <p className="text-white"><strong>Vouched by:</strong> {profile?.vouched_by_name}</p>
        </div>
      </div>
    </div>
  )
}
