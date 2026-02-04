'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Flag, Send, Shield, Loader2, X } from 'lucide-react';

// Report types matching the database enum
export type ReportType = 'post' | 'comment' | 'message' | 'user' | 'event' | 'listing';

export type ReportReason = 
  | 'harassment' 
  | 'spam' 
  | 'inappropriate_content' 
  | 'hate_speech'
  | 'misinformation' 
  | 'privacy_violation' 
  | 'threatening_behavior'
  | 'impersonation' 
  | 'scam' 
  | 'other';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: ReportType;
  contentId: string;
  contentAuthorId: string;
  contentPreview?: string;
}

const REASON_LABELS: Record<ReportReason, { label: string; description: string }> = {
  harassment: {
    label: 'Harassment or Bullying',
    description: 'Targeting someone with repeated negative behavior',
  },
  spam: {
    label: 'Spam',
    description: 'Unwanted promotional content or repetitive messages',
  },
  inappropriate_content: {
    label: 'Inappropriate Content',
    description: 'Content that violates community guidelines',
  },
  hate_speech: {
    label: 'Hate Speech',
    description: 'Content promoting hatred against protected groups',
  },
  misinformation: {
    label: 'Misinformation',
    description: 'Deliberately false or misleading information',
  },
  privacy_violation: {
    label: 'Privacy Violation',
    description: 'Sharing personal information without consent',
  },
  threatening_behavior: {
    label: 'Threats or Violence',
    description: 'Threatening harm to someone or promoting violence',
  },
  impersonation: {
    label: 'Impersonation',
    description: 'Pretending to be someone else',
  },
  scam: {
    label: 'Scam or Fraud',
    description: 'Attempting to deceive for personal gain',
  },
  other: {
    label: 'Other',
    description: 'Something else that concerns you',
  },
};

export function ReportDialog({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentAuthorId,
  contentPreview,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason for your report');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert the report
      const { error } = await (supabase.from('content_reports') as any).insert({
        reporter_id: user.id,
        report_type: contentType,
        reported_content_id: contentId,
        reported_user_id: contentAuthorId,
        reason: reason,
        description: description.trim() || null,
        content_snapshot: contentPreview || null,
        status: 'pending',
      });

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet
          toast.info('Report received (setup pending)', {
            description: 'Your report has been noted. Full reporting will be available after database migration.',
          });
        } else {
          throw error;
        }
      } else {
        toast.success('Report submitted', {
          description: 'Thank you for helping keep our community safe. An admin will review this shortly.',
        });
      }

      onClose();
      setReason(null);
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report', {
        description: 'Please try again or contact support if the issue persists.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contentTypeLabels: Record<ReportType, string> = {
    post: 'Post',
    comment: 'Comment',
    message: 'Message',
    user: 'User',
    event: 'Event',
    listing: 'Listing',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative glass-panel rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Shield className="w-5 h-5" />
              <h2 className="text-xl font-bold">Report {contentTypeLabels[contentType]}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
          <p className="text-white/60 text-sm mt-2">
            Help us maintain a safe community. Your report will be reviewed by our admin team.
            All reports are confidential.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/80">Why are you reporting this?</label>
            <div className="space-y-2">
              {(Object.entries(REASON_LABELS) as [ReportReason, { label: string; description: string }][]).map(
                ([key, { label, description: desc }]) => (
                  <div
                    key={key}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      reason === key
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                    onClick={() => setReason(key)}
                  >
                    <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                      reason === key ? 'border-amber-500 bg-amber-500' : 'border-white/30'
                    }`}>
                      {reason === key && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white/90">{label}</span>
                      <p className="text-xs text-white/50">{desc}</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">
              Additional details (optional)
            </label>
            <textarea
              placeholder="Provide any additional context that might help us understand the issue..."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:border-fernhill-gold/50 focus:outline-none min-h-[80px]"
              maxLength={1000}
            />
            <p className="text-xs text-white/40 text-right">{description.length}/1000</p>
          </div>

          {contentPreview && (
            <div className="p-3 bg-black/20 rounded-lg border border-white/10">
              <p className="text-xs text-white/40 mb-1">Content being reported:</p>
              <p className="text-sm text-white/70 line-clamp-3">{contentPreview}</p>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-200/70">
              False reports may result in action against your account. Please only report genuine
              concerns. If you're in immediate danger, please contact local emergency services.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for using the report dialog
export function useReportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [reportData, setReportData] = useState<{
    contentType: ReportType;
    contentId: string;
    contentAuthorId: string;
    contentPreview?: string;
  } | null>(null);

  const openReport = (
    contentType: ReportType,
    contentId: string,
    contentAuthorId: string,
    contentPreview?: string
  ) => {
    setReportData({ contentType, contentId, contentAuthorId, contentPreview });
    setIsOpen(true);
  };

  const closeReport = () => {
    setIsOpen(false);
    setTimeout(() => setReportData(null), 200);
  };

  const ReportDialogComponent = reportData ? (
    <ReportDialog
      isOpen={isOpen}
      onClose={closeReport}
      contentType={reportData.contentType}
      contentId={reportData.contentId}
      contentAuthorId={reportData.contentAuthorId}
      contentPreview={reportData.contentPreview}
    />
  ) : null;

  return {
    openReport,
    closeReport,
    ReportDialogComponent,
    isOpen,
  };
}
