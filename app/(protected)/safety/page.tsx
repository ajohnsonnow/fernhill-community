'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  Shield, 
  ChevronRight, 
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  Loader2,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Users,
  MessageSquare,
  Heart,
  Lock
} from 'lucide-react'
import Link from 'next/link'

// Form steps
type FormStep = 1 | 2 | 3 | 4

// Violation types
const VIOLATION_TYPES = [
  { value: 'physical', label: 'Physical' },
  { value: 'verbal', label: 'Verbal' },
  { value: 'both', label: 'Both Physical & Verbal' },
]

// Feeling options matching the Google Form
const FEELING_OPTIONS = [
  { value: 'unsafe', label: 'Unsafe', emoji: '😰' },
  { value: 'angry', label: 'Angry', emoji: '😠' },
  { value: 'scared', label: 'Scared', emoji: '😨' },
  { value: 'humiliated', label: 'Humiliated', emoji: '😔' },
  { value: 'confused', label: 'Confused', emoji: '😕' },
  { value: 'other', label: 'Other', emoji: '💭' },
]

interface FormData {
  // Page 1 - Contact Info
  name: string
  phone: string
  email: string
  
  // Page 2 - Incident Details
  incidentDate: string
  incidentTime: string
  incidentLocation: string
  description: string
  violationType: string
  feelings: string[]
  feelingsOther: string
  
  // Page 3 - Witnesses & History
  witnessesPresent: 'yes' | 'no' | ''
  witnessNames: string
  reportedElsewhere: string
  previousViolations: 'yes' | 'no' | ''
  previousDescription: string
  
  // Page 4 - Resolution
  desiredResolution: string
  additionalComments: string
}

export default function SafetyReportPage() {
  const [step, setStep] = useState<FormStep>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    incidentDate: '',
    incidentTime: '',
    incidentLocation: '',
    description: '',
    violationType: '',
    feelings: [],
    feelingsOther: '',
    witnessesPresent: '',
    witnessNames: '',
    reportedElsewhere: '',
    previousViolations: '',
    previousDescription: '',
    desiredResolution: '',
    additionalComments: '',
  })
  
  const supabase = createClient()

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleFeeling = (feeling: string) => {
    setFormData(prev => ({
      ...prev,
      feelings: prev.feelings.includes(feeling)
        ? prev.feelings.filter(f => f !== feeling)
        : [...prev.feelings, feeling]
    }))
  }

  const canProceed = () => {
    switch(step) {
      case 1:
        return formData.name.trim().length > 0 // Name is required
      case 2:
        return formData.description.trim().length > 0 && formData.violationType
      case 3:
        return formData.witnessesPresent !== ''
      case 4:
        return true
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (submitting) return
    
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Save to boundary_reports table
      const { error } = await (supabase
        .from('boundary_reports') as any)
        .insert({
          user_id: user?.id || null,
          reporter_name: formData.name,
          reporter_phone: formData.phone || null,
          reporter_email: formData.email || null,
          incident_date: formData.incidentDate || null,
          incident_time: formData.incidentTime || null,
          incident_location: formData.incidentLocation || null,
          description: formData.description,
          violation_type: formData.violationType,
          feelings: formData.feelings,
          feelings_other: formData.feelingsOther || null,
          witnesses_present: formData.witnessesPresent === 'yes',
          witness_names: formData.witnessNames || null,
          reported_elsewhere: formData.reportedElsewhere || null,
          previous_violations: formData.previousViolations === 'yes',
          previous_description: formData.previousDescription || null,
          desired_resolution: formData.desiredResolution || null,
          additional_comments: formData.additionalComments || null,
          status: 'new',
          created_at: new Date().toISOString()
        })

      if (error) throw error

      setSubmitted(true)
      toast.success('Report submitted. Thank you for helping keep our community safe.')
    } catch (error: any) {
      console.error('Failed to submit report:', error)
      toast.error(error.message || 'Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-fernhill-cream mb-4">Report Submitted</h1>
          <p className="text-fernhill-sand/70 mb-6">
            Thank you for bringing this to our attention. Your report has been received 
            and will be reviewed by our community safety team. We take all reports seriously 
            and will handle this with care and confidentiality.
          </p>
          <p className="text-fernhill-sand/60 text-sm mb-8">
            If you need immediate support, please reach out to <a href="mailto:fernhilldance@gmail.com" className="text-fernhill-gold hover:underline">fernhilldance@gmail.com</a>
          </p>
          <Link
            href="/hearth"
            className="inline-block px-6 py-3 bg-fernhill-gold text-fernhill-dark rounded-xl font-semibold hover:bg-fernhill-gold/90 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 border-b border-fernhill-sand/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-fernhill-cream">Boundary Violation Report</h1>
            <p className="text-fernhill-sand/60 text-sm">Your safety matters to us</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="flex gap-2 mt-4">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s <= step ? 'bg-fernhill-gold' : 'bg-fernhill-sand/20'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-fernhill-sand/50 mt-2">Step {step} of 4</p>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Confidentiality Notice */}
        <div className="glass-panel rounded-xl p-4 mb-6 border border-fernhill-gold/20">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-fernhill-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-fernhill-cream font-medium">Your report is confidential</p>
              <p className="text-xs text-fernhill-sand/60 mt-1">
                All information will be kept strictly confidential and only shared with designated 
                community safety team members. If you need assistance, contact{' '}
                <a href="mailto:fernhilldance@gmail.com" className="text-fernhill-gold hover:underline">
                  fernhilldance@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* STEP 1: Contact Information */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-fernhill-cream">Your Contact Information</h2>
            <p className="text-fernhill-sand/70 text-sm">
              Please note that your identity will be kept confidential, but we do need to know who you are. 
              Anonymous reports are extremely difficult to resolve and are more likely to result in other people being harmed.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Your name"
                required
                className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number (optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(503) 555-0000"
                className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Incident Details */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-fernhill-cream">Incident Details</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date of Incident
                </label>
                <input
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => updateField('incidentDate', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={formData.incidentTime}
                  onChange={(e) => updateField('incidentTime', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Location (including event name if applicable)
              </label>
              <input
                type="text"
                value={formData.incidentLocation}
                onChange={(e) => updateField('incidentLocation', e.target.value)}
                placeholder="e.g., Bridgespace - Sunday Dance"
                className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Description <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-fernhill-sand/50 mb-2">
                Please provide a detailed description of the incident, including what occurred and how you felt it violated your boundaries
              </p>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="What happened? Please be as specific as you can..."
                rows={6}
                required
                className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                Was the violation physical, verbal, or both? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VIOLATION_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateField('violationType', type.value)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      formData.violationType === type.value
                        ? 'bg-fernhill-gold text-fernhill-dark'
                        : 'glass-panel-dark text-fernhill-sand/80 hover:text-fernhill-cream'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                How did the violation make you feel? (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FEELING_OPTIONS.map(feeling => (
                  <button
                    key={feeling.value}
                    type="button"
                    onClick={() => toggleFeeling(feeling.value)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      formData.feelings.includes(feeling.value)
                        ? 'bg-fernhill-gold/20 text-fernhill-gold ring-2 ring-fernhill-gold'
                        : 'glass-panel-dark text-fernhill-sand/80 hover:text-fernhill-cream'
                    }`}
                  >
                    <span>{feeling.emoji}</span>
                    {feeling.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.feelings.includes('other') && (
              <div>
                <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                  If "Other", please specify
                </label>
                <input
                  type="text"
                  value={formData.feelingsOther}
                  onChange={(e) => updateField('feelingsOther', e.target.value)}
                  placeholder="Describe how you felt..."
                  className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Witnesses & History */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-fernhill-cream">Witnesses & History</h2>
            
            <div>
              <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Was there anyone else present during the incident? <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => updateField('witnessesPresent', 'yes')}
                  className={`flex-1 p-3 rounded-xl font-medium transition-all ${
                    formData.witnessesPresent === 'yes'
                      ? 'bg-fernhill-gold text-fernhill-dark'
                      : 'glass-panel-dark text-fernhill-sand/80 hover:text-fernhill-cream'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => updateField('witnessesPresent', 'no')}
                  className={`flex-1 p-3 rounded-xl font-medium transition-all ${
                    formData.witnessesPresent === 'no'
                      ? 'bg-fernhill-gold text-fernhill-dark'
                      : 'glass-panel-dark text-fernhill-sand/80 hover:text-fernhill-cream'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {formData.witnessesPresent === 'yes' && (
              <div>
                <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                  If yes, please provide their name(s) if known
                </label>
                <input
                  type="text"
                  value={formData.witnessNames}
                  onChange={(e) => updateField('witnessNames', e.target.value)}
                  placeholder="Names of witnesses..."
                  className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Did you report this incident to anyone else?
              </label>
              <p className="text-xs text-fernhill-sand/50 mb-2">If so, who, when, where?</p>
              <textarea
                value={formData.reportedElsewhere}
                onChange={(e) => updateField('reportedElsewhere', e.target.value)}
                placeholder="Leave blank if not applicable..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                Have you experienced similar violations in the past, with this same person?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => updateField('previousViolations', 'yes')}
                  className={`flex-1 p-3 rounded-xl font-medium transition-all ${
                    formData.previousViolations === 'yes'
                      ? 'bg-fernhill-gold text-fernhill-dark'
                      : 'glass-panel-dark text-fernhill-sand/80 hover:text-fernhill-cream'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => updateField('previousViolations', 'no')}
                  className={`flex-1 p-3 rounded-xl font-medium transition-all ${
                    formData.previousViolations === 'no'
                      ? 'bg-fernhill-gold text-fernhill-dark'
                      : 'glass-panel-dark text-fernhill-sand/80 hover:text-fernhill-cream'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {formData.previousViolations === 'yes' && (
              <div>
                <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                  If yes, please describe
                </label>
                <textarea
                  value={formData.previousDescription}
                  onChange={(e) => updateField('previousDescription', e.target.value)}
                  placeholder="Describe previous incidents..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50 resize-none"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Resolution */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-fernhill-cream">Resolution & Additional Info</h2>
            
            <div>
              <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                <Heart className="w-4 h-4 inline mr-2" />
                What action or resolution would you like to see?
              </label>
              <p className="text-xs text-fernhill-sand/50 mb-2">What would give you closure?</p>
              <textarea
                value={formData.desiredResolution}
                onChange={(e) => updateField('desiredResolution', e.target.value)}
                placeholder="Describe what outcome would help you feel safe and heard..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-sand/80 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Additional comments or information
              </label>
              <p className="text-xs text-fernhill-sand/50 mb-2">
                If you have any other information that may be relevant to your report, please include it here
              </p>
              <textarea
                value={formData.additionalComments}
                onChange={(e) => updateField('additionalComments', e.target.value)}
                placeholder="Anything else we should know..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl glass-panel-dark border border-fernhill-sand/20 text-white placeholder-fernhill-sand/40 focus:outline-none focus:ring-2 focus:ring-fernhill-gold/50 resize-none"
              />
            </div>

            {/* Summary Box */}
            <div className="glass-panel-dark rounded-xl p-4">
              <h3 className="text-sm font-medium text-fernhill-cream mb-3">Ready to Submit</h3>
              <p className="text-xs text-fernhill-sand/60">
                By submitting this report, you acknowledge that the information provided is accurate 
                to the best of your knowledge. Our community safety team will review your report 
                and may reach out for additional information if needed.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((step - 1) as FormStep)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass-panel text-fernhill-sand/80 hover:text-fernhill-cream transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as FormStep)}
              disabled={!canProceed()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-fernhill-gold text-fernhill-dark font-semibold hover:bg-fernhill-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-fernhill-gold text-fernhill-dark font-semibold hover:bg-fernhill-gold/90 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Report
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
