'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  MessageSquare,
  RefreshCw,
  Loader2,
  User,
  Calendar,
  FileText,
  XCircle,
  Flag,
  Send,
  ChevronRight,
  UserX,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ContentReport {
  id: string;
  created_at: string;
  updated_at: string;
  reporter_id: string;
  report_type: 'post' | 'comment' | 'message' | 'user' | 'event' | 'listing';
  reported_content_id: string;
  reported_user_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed' | 'escalated';
  admin_notes?: string;
  resolution?: string;
  resolved_at?: string;
  action_taken?: string;
  content_snapshot?: string;
  reporter?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  reported_user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    status?: string;
  };
}

interface ReportStats {
  total: number;
  pending: number;
  reviewing: number;
  resolved: number;
  dismissed: number;
  escalated: number;
  today: number;
}

const REASON_LABELS: Record<string, string> = {
  harassment: 'Harassment or Bullying',
  spam: 'Spam',
  inappropriate_content: 'Inappropriate Content',
  hate_speech: 'Hate Speech',
  misinformation: 'Misinformation',
  privacy_violation: 'Privacy Violation',
  threatening_behavior: 'Threats or Violence',
  impersonation: 'Impersonation',
  scam: 'Scam or Fraud',
  other: 'Other',
};

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', color: 'bg-amber-500', icon: Clock },
  reviewing: { label: 'Under Review', color: 'bg-blue-500', icon: Search },
  resolved: { label: 'Resolved', color: 'bg-green-500', icon: CheckCircle2 },
  dismissed: { label: 'Dismissed', color: 'bg-gray-500', icon: XCircle },
  escalated: { label: 'Escalated', color: 'bg-red-500', icon: AlertTriangle },
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  post: FileText,
  comment: MessageSquare,
  message: Send,
  user: User,
  event: Calendar,
};

const ACTIONS = [
  { value: 'warning_issued', label: 'Issue Warning' },
  { value: 'content_removed', label: 'Remove Content' },
  { value: 'content_hidden', label: 'Hide Content' },
  { value: 'user_warned', label: 'Warn User' },
  { value: 'user_suspended', label: 'Suspend User (7 days)' },
  { value: 'user_banned', label: 'Ban User' },
  { value: 'no_action', label: 'No Action Needed' },
];

export function ContentModerator() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [resolution, setResolution] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('');

  const supabase = createClient();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase.from('content_reports') as any)
        .select(`
          *,
          reporter:profiles!content_reports_reporter_id_fkey(id, display_name, avatar_url),
          reported_user:profiles!content_reports_reported_user_id_fkey(id, display_name, avatar_url, status)
        `)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      if (typeFilter !== 'all') {
        query = query.eq('report_type', typeFilter);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') {
          setReports([]);
          return;
        }
        throw error;
      }
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [activeTab, typeFilter, supabase]);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await (supabase.from('content_reports') as any).select('status, created_at');

      if (error) {
        if (error.code === '42P01') return;
        throw error;
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      interface ReportRecord {
        status: string;
        created_at: string;
      }

      const calculatedStats: ReportStats = {
        total: data?.length || 0,
        pending: data?.filter((r: ReportRecord) => r.status === 'pending').length || 0,
        reviewing: data?.filter((r: ReportRecord) => r.status === 'reviewing').length || 0,
        resolved: data?.filter((r: ReportRecord) => r.status === 'resolved').length || 0,
        dismissed: data?.filter((r: ReportRecord) => r.status === 'dismissed').length || 0,
        escalated: data?.filter((r: ReportRecord) => r.status === 'escalated').length || 0,
        today: data?.filter((r: ReportRecord) => new Date(r.created_at) >= todayStart).length || 0,
      };

      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [fetchReports, fetchStats]);

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await (supabase.from('content_reports') as any)
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      toast.success(`Report status updated`);
      fetchReports();
      fetchStats();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report status');
    } finally {
      setIsUpdating(false);
    }
  };

  const resolveReport = async () => {
    if (!selectedReport || !resolution.trim() || !selectedAction) {
      toast.error('Please provide a resolution and action');
      return;
    }

    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await (supabase.from('content_reports') as any)
        .update({
          status: 'resolved',
          resolution: resolution.trim(),
          action_taken: selectedAction,
          admin_notes: adminNote.trim() || null,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      // If action involves banning, update user status
      if (selectedAction === 'user_banned' && selectedReport.reported_user_id) {
        await (supabase.from('profiles') as any)
          .update({ status: 'banned' })
          .eq('id', selectedReport.reported_user_id);
      }

      // Log the action
      await (supabase.from('audit_logs') as any).insert({
        admin_id: user?.id,
        action: 'resolve_content_report',
        details: {
          report_id: selectedReport.id,
          report_type: selectedReport.report_type,
          action_taken: selectedAction,
          reported_user: selectedReport.reported_user_id,
        },
      });

      toast.success('Report resolved successfully');
      setShowActionModal(false);
      setSelectedReport(null);
      setResolution('');
      setSelectedAction('');
      setAdminNote('');
      fetchReports();
      fetchStats();
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
    } finally {
      setIsUpdating(false);
    }
  };

  const dismissReport = async (reportId: string) => {
    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await (supabase.from('content_reports') as any)
        .update({
          status: 'dismissed',
          resolution: 'Report dismissed - no violation found',
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      toast.success('Report dismissed');
      fetchReports();
      fetchStats();
    } catch (error) {
      console.error('Error dismissing report:', error);
      toast.error('Failed to dismiss report');
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs = ['all', 'pending', 'reviewing', 'escalated', 'resolved'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Content Moderator</h2>
            <p className="text-white/60 text-sm">Review and action user reports</p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchReports();
            fetchStats();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="glass-panel rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-white/60">Total Reports</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center border-amber-500/30">
            <div className="text-3xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-sm text-white/60">Pending</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center border-blue-500/30">
            <div className="text-3xl font-bold text-blue-400">{stats.reviewing}</div>
            <div className="text-sm text-white/60">Reviewing</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center border-red-500/30">
            <div className="text-3xl font-bold text-red-400">{stats.escalated}</div>
            <div className="text-sm text-white/60">Escalated</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center border-green-500/30">
            <div className="text-3xl font-bold text-green-400">{stats.resolved}</div>
            <div className="text-sm text-white/60">Resolved</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center border-purple-500/30">
            <div className="text-3xl font-bold text-purple-400">{stats.today}</div>
            <div className="text-sm text-white/60">Today</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <select
          value={typeFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:border-fernhill-gold/50 focus:outline-none"
          aria-label="Filter by type"
        >
          <option value="all">All Types</option>
          <option value="post">Posts</option>
          <option value="comment">Comments</option>
          <option value="message">Messages</option>
          <option value="user">Users</option>
        </select>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all ${
              activeTab === tab
                ? 'bg-fernhill-moss/40 text-fernhill-gold border-b-2 border-fernhill-gold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'all' ? 'All' : tab.replace(/\b\w/g, l => l.toUpperCase())}
            {stats && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/10">
                {tab === 'all' ? stats.total : stats[tab as keyof ReportStats] || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No reports found</p>
            <p className="text-sm mt-2">Great news! The community is behaving well.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const statusConfig = STATUS_CONFIG[report.status];
              const StatusIcon = statusConfig?.icon || Clock;
              const TypeIcon = TYPE_ICONS[report.report_type] || FileText;

              return (
                <div
                  key={report.id}
                  className="glass-panel rounded-xl p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${statusConfig?.color || 'bg-gray-500'}`}>
                      <StatusIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2 py-0.5 rounded-full border border-white/20 text-white text-xs flex items-center gap-1 capitalize">
                          <TypeIcon className="w-3 h-3" />
                          {report.report_type}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-white text-xs ${statusConfig?.color || 'bg-gray-500'}`}>
                          {statusConfig?.label || report.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs">
                          {REASON_LABELS[report.reason] || report.reason}
                        </span>
                      </div>
                      
                      {report.content_snapshot && (
                        <p className="text-sm text-white/60 line-clamp-2 mb-2 italic">
                          "{report.content_snapshot}"
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-white/40 mb-2">
                        <span className="flex items-center gap-1">
                          <Flag className="w-3 h-3" />
                          Reported by {report.reporter?.display_name || 'Anonymous'}
                        </span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="flex items-center gap-1">
                          <UserX className="w-3 h-3" />
                          Against {report.reported_user?.display_name || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      {report.description && (
                        <p className="text-sm text-white/50 line-clamp-2">{report.description}</p>
                      )}

                      {report.resolution && (
                        <div className="mt-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                          <p className="text-xs text-green-400">Resolution: {report.resolution}</p>
                          {report.action_taken && (
                            <span className="text-xs text-white/60">{report.action_taken.replace(/_/g, ' ')}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateReportStatus(report.id, 'reviewing')}
                            disabled={isUpdating}
                            className="px-3 py-1 text-sm rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => dismissReport(report.id)}
                            disabled={isUpdating}
                            className="px-3 py-1 text-sm rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      {(report.status === 'reviewing' || report.status === 'escalated') && (
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowActionModal(true);
                          }}
                          className="px-3 py-1 text-sm rounded-lg bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          Take Action
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowActionModal(false)}
          />
          <div className="relative glass-panel rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Take Action on Report</h2>
                <button 
                  onClick={() => setShowActionModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <p className="text-white/60 text-sm mt-2">
                Choose an action and provide a resolution for this report.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Action to Take</label>
                <select
                  value={selectedAction}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAction(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:border-fernhill-gold/50 focus:outline-none"
                  aria-label="Select action"
                >
                  <option value="">Select action...</option>
                  {ACTIONS.map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Resolution</label>
                <textarea
                  placeholder="Describe the resolution..."
                  value={resolution}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResolution(e.target.value)}
                  className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:border-fernhill-gold/50 focus:outline-none min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Admin Notes (Internal)</label>
                <textarea
                  placeholder="Optional internal notes..."
                  value={adminNote}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminNote(e.target.value)}
                  className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:border-fernhill-gold/50 focus:outline-none"
                />
              </div>

              {selectedAction === 'user_banned' && (
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Warning</span>
                  </div>
                  <p className="text-xs text-red-200/70 mt-1">
                    This will permanently ban the user from the community. This action is logged and audited.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
              <button 
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={resolveReport}
                disabled={!selectedAction || !resolution.trim() || isUpdating}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Resolve Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentModerator;
