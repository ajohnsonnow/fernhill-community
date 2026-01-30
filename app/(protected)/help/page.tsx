'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  HelpCircle, 
  MessageSquare, 
  Bug, 
  AlertTriangle, 
  UserX, 
  Heart, 
  ChevronDown, 
  ChevronUp,
  Send,
  CheckCircle,
  ExternalLink,
  Home,
  Calendar,
  Music,
  Users,
  Image,
  Shield,
  Settings,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// FAQ items
const FAQ_ITEMS = [
  {
    question: "How do I update my profile?",
    answer: "Tap the Settings (gear) icon in the top header, or go to the Profile tab in the bottom navigation. From there you can edit your tribe name, bio, gifts to the mycelium, and upload a profile photo."
  },
  {
    question: "What is the Altar?",
    answer: "The Altar is our sacred community photo board. Members can share images that capture the spirit of our dance community. Images are initially blurred for consent - tap the eye icon to reveal them."
  },
  {
    question: "How do I find other dancers?",
    answer: "Use the Directory (people icon in the header) to browse community members. You can search by name, filter by vibe status, and start a private conversation with anyone."
  },
  {
    question: "What are Vibe Statuses?",
    answer: "Vibe statuses let others know how you're feeling. Options include: Flowing 🌊, Staccato ⚡, In the Chaos 🌀, Lyrical ✨, Stillness 🕯️, Open to Dance 🤝, and Mycelial 🍄. Set yours from your profile page."
  },
  {
    question: "How do private messages work?",
    answer: "Messages are end-to-end encrypted for privacy. Only you and the recipient can read them. To start a conversation, visit someone's profile from the Directory and tap 'Message'."
  },
  {
    question: "What is the Journey page?",
    answer: "Journey is where DJs share their recorded dance sets. You can listen to past events, discover new artists, and relive the magic of past gatherings."
  },
  {
    question: "How do I get notified about events?",
    answer: "Enable push notifications in your Profile settings. You'll receive alerts about upcoming events, schedule changes, and community announcements."
  },
  {
    question: "What does 'Vouched by' mean?",
    answer: "Our community uses a trust network. When you join, the person who invited you 'vouches' for you, connecting you to our web of trust."
  }
]

// Feedback categories
const FEEDBACK_CATEGORIES = [
  { id: 'feedback', label: 'General Feedback', icon: MessageSquare, color: 'text-blue-400', description: 'Share ideas or suggestions' },
  { id: 'bug', label: 'Report a Bug', icon: Bug, color: 'text-orange-400', description: 'Something not working right?' },
  { id: 'issue', label: 'App Issue', icon: AlertTriangle, color: 'text-yellow-400', description: 'Problems with the app' },
  { id: 'appreciation', label: 'Show Appreciation', icon: Heart, color: 'text-pink-400', description: 'Share gratitude ❤️' },
]

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [reportedUser, setReportedUser] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!message.trim() || !selectedCategory) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user profile for context
      const { data: profile } = await supabase
        .from('profiles')
        .select('tribe_name, email')
        .eq('id', user.id)
        .single()

      // Insert into feedback table
      const { error } = await (supabase
        .from('feedback') as any)
        .insert({
          user_id: user.id,
          category: selectedCategory,
          message: message.trim(),
          reported_user: reportedUser.trim() || null,
          status: 'new',
          created_at: new Date().toISOString()
        })

      if (error) throw error

      setSent(true)
      toast.success('Message sent! Our team will review it shortly.')
      
      // Reset after a delay
      setTimeout(() => {
        setShowContactForm(false)
        setSelectedCategory(null)
        setMessage('')
        setReportedUser('')
        setSent(false)
      }, 2000)

    } catch (error: any) {
      console.error('Failed to send feedback:', error)
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const needsUserReport = selectedCategory === 'violation' || selectedCategory === 'bad_actor'
  const selectedCategoryInfo = FEEDBACK_CATEGORIES.find(c => c.id === selectedCategory)

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-fernhill-gold/20 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-fernhill-gold" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-gold">Help & Support</h1>
            <p className="text-fernhill-sand/60">We're here to help you dance better</p>
          </div>
        </div>

        {/* Quick Navigation Guide */}
        <div className="glass-panel rounded-2xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-fernhill-cream mb-4">App Navigation</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-fernhill-sand/80">
              <Home className="w-4 h-4 text-fernhill-gold" />
              <span>Hearth - Home feed</span>
            </div>
            <div className="flex items-center gap-2 text-fernhill-sand/80">
              <Calendar className="w-4 h-4 text-fernhill-gold" />
              <span>Events - Schedule</span>
            </div>
            <div className="flex items-center gap-2 text-fernhill-sand/80">
              <Music className="w-4 h-4 text-fernhill-gold" />
              <span>Journey - DJ Sets</span>
            </div>
            <div className="flex items-center gap-2 text-fernhill-sand/80">
              <MessageSquare className="w-4 h-4 text-fernhill-gold" />
              <span>Messages - Chat</span>
            </div>
            <div className="flex items-center gap-2 text-fernhill-sand/80">
              <Image className="w-4 h-4 text-fernhill-gold" />
              <span>Altar - Photo board</span>
            </div>
            <div className="flex items-center gap-2 text-fernhill-sand/80">
              <Users className="w-4 h-4 text-fernhill-gold" />
              <span>Directory - Members</span>
            </div>
            <div className="flex items-center gap-2 text-fernhill-sand/80">
              <Settings className="w-4 h-4 text-fernhill-gold" />
              <span>Settings - Profile</span>
            </div>
            <div className="flex items-center gap-2 text-fernhill-sand/80">
              <HelpCircle className="w-4 h-4 text-fernhill-gold" />
              <span>Help - This page</span>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="glass-panel rounded-2xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-fernhill-cream mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className="glass-panel-dark rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-fernhill-cream font-medium">{item.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-fernhill-gold flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-fernhill-sand/60 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4 text-fernhill-sand/80 text-sm leading-relaxed border-t border-fernhill-sand/10 pt-3">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Safety & Boundary Violations */}
        <div className="glass-panel rounded-2xl p-5 mb-6 border border-red-500/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-fernhill-cream mb-1">Safety & Boundary Concerns</h2>
              <p className="text-fernhill-sand/60 text-sm mb-4">
                Experienced or witnessed inappropriate behavior? Your safety matters. 
                All reports are confidential and taken seriously.
              </p>
              <Link
                href="/safety"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Report a Boundary Violation
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Admin Section */}
        <div className="glass-panel rounded-2xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-fernhill-cream mb-2">Contact the Admins</h2>
          <p className="text-fernhill-sand/60 text-sm mb-4">
            Need to report something or have feedback? We're listening.
          </p>

          {!showContactForm ? (
            <button
              onClick={() => setShowContactForm(true)}
              className="w-full py-3 rounded-xl bg-fernhill-gold text-fernhill-dark font-semibold hover:bg-fernhill-gold/90 transition-colors"
            >
              Send a Message
            </button>
          ) : (
            <div className="space-y-4">
              {/* Category Selection */}
              {!selectedCategory ? (
                <div className="grid grid-cols-2 gap-3">
                  {FEEDBACK_CATEGORIES.map((category) => {
                    const Icon = category.icon
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className="glass-panel-dark rounded-xl p-4 text-left hover:ring-2 hover:ring-fernhill-gold/50 transition-all"
                      >
                        <Icon className={`w-6 h-6 ${category.color} mb-2`} />
                        <p className="text-fernhill-cream font-medium text-sm">{category.label}</p>
                        <p className="text-fernhill-sand/50 text-xs">{category.description}</p>
                      </button>
                    )
                  })}
                </div>
              ) : sent ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-fernhill-cream font-semibold text-lg">Message Sent!</p>
                  <p className="text-fernhill-sand/60 text-sm">Our team will review it shortly.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedCategoryInfo && (
                        <>
                          <selectedCategoryInfo.icon className={`w-5 h-5 ${selectedCategoryInfo.color}`} />
                          <span className="text-fernhill-cream font-medium">{selectedCategoryInfo.label}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-fernhill-sand/60 hover:text-fernhill-cream text-sm"
                    >
                      Change
                    </button>
                  </div>

                  {/* User Report Field (for violations/bad actors) */}
                  {needsUserReport && (
                    <div>
                      <label className="block text-fernhill-sand/80 text-sm mb-2">
                        Username or description of person (optional)
                      </label>
                      <input
                        type="text"
                        value={reportedUser}
                        onChange={(e) => setReportedUser(e.target.value)}
                        placeholder="Enter their tribe name or describe them"
                        className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
                      />
                    </div>
                  )}

                  {/* Message Field */}
                  <div>
                    <label className="block text-fernhill-sand/80 text-sm mb-2">
                      {needsUserReport ? 'Describe what happened' : 'Your message'}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        selectedCategory === 'bug' 
                          ? "What happened? What did you expect to happen?"
                          : selectedCategory === 'violation' || selectedCategory === 'bad_actor'
                          ? "Please describe the situation in detail..."
                          : "Write your message here..."
                      }
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50 resize-none"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowContactForm(false)
                        setSelectedCategory(null)
                        setMessage('')
                        setReportedUser('')
                      }}
                      className="flex-1 py-3 rounded-xl glass-panel text-fernhill-sand/80 hover:text-fernhill-cream transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!message.trim() || sending}
                      className="flex-1 py-3 rounded-xl bg-fernhill-gold text-fernhill-dark font-semibold hover:bg-fernhill-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Community Guidelines Link */}
        <div className="glass-panel rounded-2xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-fernhill-cream mb-2">Community Guidelines</h2>
          <p className="text-fernhill-sand/60 text-sm mb-4">
            Our dance community is built on respect, consent, and connection. 
            Please review our guidelines to help keep this space sacred.
          </p>
          <div className="space-y-3">
            <div className="glass-panel-dark rounded-xl p-4">
              <h3 className="text-fernhill-cream font-medium mb-2">🕊️ Core Principles</h3>
              <ul className="text-fernhill-sand/80 text-sm space-y-1">
                <li>• Respect everyone's boundaries</li>
                <li>• Ask before physical contact or photography</li>
                <li>• Keep the space substance-free</li>
                <li>• Honor others' privacy online and offline</li>
                <li>• Support a judgment-free environment</li>
              </ul>
            </div>
            <div className="glass-panel-dark rounded-xl p-4">
              <h3 className="text-fernhill-cream font-medium mb-2">🚫 Not Tolerated</h3>
              <ul className="text-fernhill-sand/80 text-sm space-y-1">
                <li>• Harassment or unwanted advances</li>
                <li>• Recording without explicit consent</li>
                <li>• Sharing others' content without permission</li>
                <li>• Discrimination of any kind</li>
                <li>• Disruptive behavior</li>
              </ul>
            </div>
          </div>
        </div>

        {/* External Links */}
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-fernhill-cream mb-4">Useful Links</h2>
          <div className="space-y-3">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Fernhill+Park+Portland+OR"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 glass-panel-dark rounded-xl hover:ring-2 hover:ring-fernhill-gold/50 transition-all"
            >
              <span className="text-fernhill-cream">📍 Directions to Fernhill Park</span>
              <ExternalLink className="w-4 h-4 text-fernhill-sand/60" />
            </a>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Bridgespace+SE+7th+Portland+OR"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 glass-panel-dark rounded-xl hover:ring-2 hover:ring-fernhill-gold/50 transition-all"
            >
              <span className="text-fernhill-cream">📍 Directions to Bridgespace</span>
              <ExternalLink className="w-4 h-4 text-fernhill-sand/60" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
