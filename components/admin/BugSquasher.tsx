'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Bug,
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
  Tag,
  XCircle,
  PlayCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BugReport {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'in_progress' | 'resolved' | 'closed';
  affected_area: string;
  steps_to_reproduce?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  browser_info?: Record<string, unknown>;
  admin_notes?: string;
  assigned_to?: string;
  resolved_at?: string;
  resolution?: string;
  reporter?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface BugStats {
  total: number;
  open: number;
  investigating: number;
  in_progress: number;
  resolved: number;
  closed: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  resolved_this_week: number;
}

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-gray-500', icon: AlertCircle },
  investigating: { label: 'Investigating', color: 'bg-blue-500', icon: Search },
  in_progress: { label: 'In Progress', color: 'bg-amber-500', icon: PlayCircle },
  resolved: { label: 'Resolved', color: 'bg-green-500', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-slate-600', icon: XCircle },
};

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-600', icon: AlertTriangle, priority: 1 },
  high: { label: 'High', color: 'bg-orange-500', icon: ArrowUp, priority: 2 },
  medium: { label: 'Medium', color: 'bg-yellow-500', icon: Minus, priority: 3 },
  low: { label: 'Low', color: 'bg-blue-400', icon: ArrowDown, priority: 4 },
};

export function BugSquasher() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [stats, setStats] = useState<BugStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [resolution, setResolution] = useState('');

  const supabase = createClient();

  const fetchBugs = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase.from('bug_reports') as any)
        .select(`
          *,
          reporter:profiles!bug_reports_user_id_fkey(id, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') {
          setBugs([]);
          return;
        }
        throw error;
      }
      setBugs(data || []);
    } catch (error) {
      console.error('Error fetching bugs:', error);
      toast.error('Failed to load bug reports');
    } finally {
      setLoading(false);
    }
  }, [activeTab, severityFilter, searchQuery, supabase]);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await (supabase.from('bug_reports') as any).select('status, severity, resolved_at');

      if (error) {
        if (error.code === '42P01') return;
        throw error;
      }

      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      interface BugRecord {
        status: string;
        severity: string;
        resolved_at: string | null;
      }

      const calculatedStats: BugStats = {
        total: data?.length || 0,
        open: data?.filter((b: BugRecord) => b.status === 'open').length || 0,
        investigating: data?.filter((b: BugRecord) => b.status === 'investigating').length || 0,
        in_progress: data?.filter((b: BugRecord) => b.status === 'in_progress').length || 0,
        resolved: data?.filter((b: BugRecord) => b.status === 'resolved').length || 0,
        closed: data?.filter((b: BugRecord) => b.status === 'closed').length || 0,
        by_severity: {
          critical: data?.filter((b: BugRecord) => b.severity === 'critical').length || 0,
          high: data?.filter((b: BugRecord) => b.severity === 'high').length || 0,
          medium: data?.filter((b: BugRecord) => b.severity === 'medium').length || 0,
          low: data?.filter((b: BugRecord) => b.severity === 'low').length || 0,
        },
        resolved_this_week:
          data?.filter(
            (b: BugRecord) => b.resolved_at && new Date(b.resolved_at) >= weekStart
          ).length || 0,
      };

      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBugs();
    fetchStats();
  }, [fetchBugs, fetchStats]);

  const updateBugStatus = async (bugId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await (supabase.from('bug_reports') as any).update(updates).eq('id', bugId);

      if (error) throw error;

      toast.success(`Bug status updated to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}`);
      fetchBugs();
      fetchStats();
    } catch (error) {
      console.error('Error updating bug:', error);
      toast.error('Failed to update bug status');
    } finally {
      setIsUpdating(false);
    }
  };

  const addAdminNote = async (bugId: string) => {
    if (!adminNote.trim()) return;
    
    setIsUpdating(true);
    try {
      const { data: existing } = await (supabase.from('bug_reports') as any)
        .select('admin_notes')
        .eq('id', bugId)
        .single();

      const existingNotes = (existing?.admin_notes as string) || '';
      const timestamp = new Date().toLocaleString();
      const newNotes = existingNotes
        ? `${existingNotes}\n\n[${timestamp}]\n${adminNote.trim()}`
        : `[${timestamp}]\n${adminNote.trim()}`;

      const { error } = await (supabase.from('bug_reports') as any)
        .update({
          admin_notes: newNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bugId);

      if (error) throw error;

      toast.success('Admin note added');
      setAdminNote('');
      fetchBugs();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsUpdating(false);
    }
  };

  const resolveBug = async (bugId: string) => {
    if (!resolution.trim()) {
      toast.error('Please provide a resolution');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await (supabase.from('bug_reports') as any)
        .update({
          status: 'resolved',
          resolution: resolution.trim(),
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bugId);

      if (error) throw error;

      toast.success('Bug marked as resolved!');
      setResolution('');
      setSelectedBug(null);
      fetchBugs();
      fetchStats();
    } catch (error) {
      console.error('Error resolving bug:', error);
      toast.error('Failed to resolve bug');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredBugs = bugs.sort((a, b) => {
    const severityDiff =
      (SEVERITY_CONFIG[a.severity]?.priority || 999) -
      (SEVERITY_CONFIG[b.severity]?.priority || 999);
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const tabs = ['all', 'open', 'investigating', 'in_progress', 'resolved'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <Bug className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Bug Squasher</h2>
            <p className="text-white/60 text-sm">Manage and resolve bug reports</p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchBugs();
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
            <div className="text-sm text-white/60">Total</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center border-red-500/30">
            <div className="text-3xl font-bold text-red-400">{stats.by_severity.critical}</div>
            <div className="text-sm text-white/60">Critical</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center border-orange-500/30">
            <div className="text-3xl font-bold text-orange-400">{stats.open}</div>
            <div className="text-sm text-white/60">Open</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center border-amber-500/30">
            <div className="text-3xl font-bold text-amber-400">{stats.in_progress}</div>
            <div className="text-sm text-white/60">In Progress</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center border-green-500/30">
            <div className="text-3xl font-bold text-green-400">{stats.resolved}</div>
            <div className="text-sm text-white/60">Resolved</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center border-blue-500/30">
            <div className="text-3xl font-bold text-blue-400">{stats.resolved_this_week}</div>
            <div className="text-sm text-white/60">This Week</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search bugs..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:border-fernhill-gold/50 focus:outline-none"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeverityFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:border-fernhill-gold/50 focus:outline-none"
          aria-label="Filter by severity"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
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
            {tab === 'all' ? 'All' : tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {stats && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/10">
                {tab === 'all' ? stats.total : 
              tab === 'open' ? stats.open :
              tab === 'investigating' ? stats.investigating :
              tab === 'in_progress' ? stats.in_progress :
              tab === 'resolved' ? stats.resolved : 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bug List */}
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        ) : filteredBugs.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Bug className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No bugs found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBugs.map((bug) => {
              const severityConfig = SEVERITY_CONFIG[bug.severity];
              const statusConfig = STATUS_CONFIG[bug.status];
              const SeverityIcon = severityConfig?.icon || Minus;

              return (
                <div
                  key={bug.id}
                  className={`glass-panel rounded-xl p-4 cursor-pointer hover:border-white/30 transition-colors ${
                    selectedBug?.id === bug.id ? 'border-fernhill-gold/50' : ''
                  }`}
                  onClick={() => setSelectedBug(selectedBug?.id === bug.id ? null : bug)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${severityConfig?.color || 'bg-gray-500'}`}>
                      <SeverityIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-white truncate">{bug.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-white text-xs ${severityConfig?.color || 'bg-gray-500'}`}>
                          {severityConfig?.label || bug.severity}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-white text-xs ${statusConfig?.color || 'bg-gray-500'}`}>
                          {statusConfig?.label || bug.status}
                        </span>
                      </div>
                      <p className="text-sm text-white/60 line-clamp-2 mb-2">{bug.description}</p>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {bug.reporter?.display_name || 'Anonymous'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(bug.created_at), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {bug.affected_area}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {bug.status === 'open' && (
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            updateBugStatus(bug.id, 'investigating');
                          }}
                          disabled={isUpdating}
                          className="px-3 py-1 text-sm rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
                        >
                          Investigate
                        </button>
                      )}
                      {bug.status === 'investigating' && (
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            updateBugStatus(bug.id, 'in_progress');
                          }}
                          disabled={isUpdating}
                          className="px-3 py-1 text-sm rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
                        >
                          Start Working
                        </button>
                      )}
                      {bug.status === 'in_progress' && (
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setSelectedBug(bug);
                          }}
                          className="px-3 py-1 text-sm rounded-lg bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {selectedBug?.id === bug.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                      {bug.steps_to_reproduce && (
                        <div>
                          <h4 className="text-sm font-medium text-white/80 mb-1">Steps to Reproduce</h4>
                          <p className="text-sm text-white/60 whitespace-pre-wrap">{bug.steps_to_reproduce}</p>
                        </div>
                      )}
                      
                      {bug.expected_behavior && (
                        <div>
                          <h4 className="text-sm font-medium text-green-400 mb-1">Expected Behavior</h4>
                          <p className="text-sm text-white/60">{bug.expected_behavior}</p>
                        </div>
                      )}
                      
                      {bug.actual_behavior && (
                        <div>
                          <h4 className="text-sm font-medium text-red-400 mb-1">Actual Behavior</h4>
                          <p className="text-sm text-white/60">{bug.actual_behavior}</p>
                        </div>
                      )}

                      {bug.admin_notes && (
                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <h4 className="text-sm font-medium text-amber-400 mb-1">Admin Notes</h4>
                          <pre className="text-sm text-white/70 whitespace-pre-wrap font-sans">{bug.admin_notes}</pre>
                        </div>
                      )}

                      {/* Add note */}
                      {bug.status !== 'resolved' && bug.status !== 'closed' && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white/80">Add Admin Note</h4>
                          <textarea
                            placeholder="Add internal notes..."
                            value={adminNote}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminNote(e.target.value)}
                            className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:border-fernhill-gold/50 focus:outline-none min-h-[80px]"
                          />
                          <button
                            onClick={() => addAdminNote(bug.id)}
                            disabled={!adminNote.trim() || isUpdating}
                            className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Add Note
                          </button>
                        </div>
                      )}

                      {/* Resolution */}
                      {bug.resolution && (
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                          <h4 className="text-sm font-medium text-green-400 mb-1">Resolution</h4>
                          <p className="text-sm text-white/70">{bug.resolution}</p>
                        </div>
                      )}

                      {/* Resolve bug */}
                      {(bug.status === 'in_progress' || bug.status === 'investigating') && (
                        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 space-y-3">
                          <h4 className="text-sm font-medium text-green-400">Mark as Resolved</h4>
                          <textarea
                            placeholder="Describe how this bug was fixed..."
                            value={resolution}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResolution(e.target.value)}
                            className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:border-fernhill-gold/50 focus:outline-none min-h-[80px]"
                          />
                          <button
                            onClick={() => resolveBug(bug.id)}
                            disabled={!resolution.trim() || isUpdating}
                            className="w-full px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Resolve Bug
                          </button>
                        </div>
                      )}

                      {/* Status selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/60">Change Status:</span>
                        <select
                          value={bug.status}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            updateBugStatus(bug.id, e.target.value);
                          }}
                          disabled={isUpdating}
                          className="px-3 py-1 text-sm rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none"
                          aria-label="Change bug status"
                        >
                          <option value="open">Open</option>
                          <option value="investigating">Investigating</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BugSquasher;
