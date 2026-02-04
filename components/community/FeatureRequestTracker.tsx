'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Lightbulb, Bug, ChevronUp, PlusCircle, MessageSquare, 
  Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight,
  Filter, Search, Tag, User, Calendar, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

type FeatureStatus = 'submitted' | 'under_review' | 'accepted' | 'in_progress' | 'completed' | 'declined' | 'duplicate';
type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
type BugStatus = 'reported' | 'confirmed' | 'in_progress' | 'fixed' | 'wont_fix' | 'cannot_reproduce';
type FeatureCategory = 'social' | 'events' | 'messaging' | 'community' | 'admin' | 'mobile' | 'accessibility' | 'performance' | 'security' | 'other';

type FeatureRequest = {
  id: string;
  title: string;
  description: string;
  category: FeatureCategory;
  status: FeatureStatus;
  upvotes: number;
  created_at: string;
  admin_notes: string | null;
  profiles: { display_name: string; avatar_url: string | null } | null;
};

type BugReport = {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  created_at: string;
  affected_page: string | null;
  admin_notes: string | null;
  fixed_in_version: string | null;
  profiles: { display_name: string; avatar_url: string | null } | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  is_admin_response: boolean;
  profiles: { display_name: string; avatar_url: string | null };
};

const FEATURE_STATUS_CONFIG: Record<FeatureStatus, { label: string; color: string; icon: typeof Clock }> = {
  submitted: { label: 'Submitted', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700', icon: Clock },
  under_review: { label: 'Under Review', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-green-500 bg-green-100 dark:bg-green-900/30', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30', icon: ArrowRight },
  completed: { label: 'Completed', color: 'text-green-600 bg-green-100 dark:bg-green-900/30', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'text-red-500 bg-red-100 dark:bg-red-900/30', icon: XCircle },
  duplicate: { label: 'Duplicate', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700', icon: XCircle }
};

const BUG_SEVERITY_CONFIG: Record<BugSeverity, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
  medium: { label: 'Medium', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
  high: { label: 'High', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  critical: { label: 'Critical', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' }
};

const BUG_STATUS_CONFIG: Record<BugStatus, { label: string; color: string }> = {
  reported: { label: 'Reported', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
  confirmed: { label: 'Confirmed', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  in_progress: { label: 'In Progress', color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
  fixed: { label: 'Fixed', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  wont_fix: { label: "Won't Fix", color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
  cannot_reproduce: { label: 'Cannot Reproduce', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' }
};

const CATEGORY_CONFIG: Record<FeatureCategory, { label: string; emoji: string }> = {
  social: { label: 'Social', emoji: '👥' },
  events: { label: 'Events', emoji: '📅' },
  messaging: { label: 'Messaging', emoji: '💬' },
  community: { label: 'Community', emoji: '🏘️' },
  admin: { label: 'Admin', emoji: '⚙️' },
  mobile: { label: 'Mobile', emoji: '📱' },
  accessibility: { label: 'Accessibility', emoji: '♿' },
  performance: { label: 'Performance', emoji: '⚡' },
  security: { label: 'Security', emoji: '🔒' },
  other: { label: 'Other', emoji: '✨' }
};

type TabType = 'features' | 'bugs';

export default function FeatureRequestTracker() {
  const [activeTab, setActiveTab] = useState<TabType>('features');
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [showNewFeature, setShowNewFeature] = useState(false);
  const [showNewBug, setShowNewBug] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRequest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const supabase = createClient();

  // New Feature Form State
  const [newFeature, setNewFeature] = useState({
    title: '',
    description: '',
    category: 'other' as FeatureCategory
  });

  // New Bug Form State
  const [newBug, setNewBug] = useState({
    title: '',
    description: '',
    steps_to_reproduce: '',
    expected_behavior: '',
    actual_behavior: '',
    severity: 'medium' as BugSeverity,
    affected_page: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadFeatureRequests(), loadBugReports(), loadUserVotes()]);
    setLoading(false);
  }

  async function loadFeatureRequests() {
    const { data } = await supabase
      .from('feature_requests')
      .select('*, profiles:submitted_by(display_name, avatar_url)')
      .order('upvotes', { ascending: false }) as any;
    
    setFeatureRequests(data || []);
  }

  async function loadBugReports() {
    const { data } = await supabase
      .from('bug_reports')
      .select('*, profiles:reported_by(display_name, avatar_url)')
      .order('created_at', { ascending: false }) as any;
    
    setBugReports(data || []);
  }

  async function loadUserVotes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('feature_request_upvotes')
      .select('feature_request_id')
      .eq('user_id', user.id) as any;

    if (data) {
      setUserVotes(new Set(data.map((v: any) => v.feature_request_id)));
    }
  }

  async function loadComments(featureId: string) {
    const { data } = await supabase
      .from('feature_request_comments')
      .select('*, profiles:user_id(display_name, avatar_url)')
      .eq('feature_request_id', featureId)
      .order('created_at', { ascending: true }) as any;
    
    setComments(data || []);
  }

  async function handleUpvote(featureId: string) {
    const { data, error } = await (supabase.rpc as any)('toggle_feature_request_upvote', { request_id: featureId });
    
    if (error) {
      toast.error('Failed to vote');
      return;
    }

    setFeatureRequests(prev => prev.map(f => 
      f.id === featureId ? { ...f, upvotes: data.upvotes } : f
    ));
    
    setUserVotes(prev => {
      const newSet = new Set(prev);
      if (data.action === 'added') {
        newSet.add(featureId);
        toast.success('Vote added! 🎉');
      } else {
        newSet.delete(featureId);
      }
      return newSet;
    });
  }

  async function handleSubmitFeature(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to submit a feature request');
      return;
    }

    const { error } = await supabase.from('feature_requests').insert({
      title: newFeature.title,
      description: newFeature.description,
      category: newFeature.category,
      submitted_by: user.id
    } as any);

    if (error) {
      toast.error('Failed to submit feature request');
      return;
    }

    toast.success('Feature request submitted! 💡');
    setShowNewFeature(false);
    setNewFeature({ title: '', description: '', category: 'other' });
    loadFeatureRequests();
  }

  async function handleSubmitBug(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to report a bug');
      return;
    }

    // Get browser info
    const browserInfo = {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href
    };

    const { error } = await supabase.from('bug_reports').insert({
      title: newBug.title,
      description: newBug.description,
      steps_to_reproduce: newBug.steps_to_reproduce || null,
      expected_behavior: newBug.expected_behavior || null,
      actual_behavior: newBug.actual_behavior || null,
      severity: newBug.severity,
      affected_page: newBug.affected_page || null,
      browser_info: browserInfo,
      reported_by: user.id
    } as any);

    if (error) {
      toast.error('Failed to submit bug report');
      return;
    }

    toast.success('Bug report submitted! 🐛');
    setShowNewBug(false);
    setNewBug({
      title: '',
      description: '',
      steps_to_reproduce: '',
      expected_behavior: '',
      actual_behavior: '',
      severity: 'medium',
      affected_page: ''
    });
    loadBugReports();
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFeature || !newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('feature_request_comments').insert({
      feature_request_id: selectedFeature.id,
      user_id: user.id,
      content: newComment.trim()
    } as any);

    if (error) {
      toast.error('Failed to add comment');
      return;
    }

    toast.success('Comment added!');
    setNewComment('');
    loadComments(selectedFeature.id);
  }

  // Filter feature requests
  const filteredFeatures = featureRequests.filter(f => {
    if (searchQuery && !f.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });

  // Filter bug reports
  const filteredBugs = bugReports.filter(b => {
    if (searchQuery && !b.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feature Requests & Bugs</h1>
            <p className="text-gray-600 dark:text-gray-400">Help us improve! Submit ideas or report issues.</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab('features'); setFilterStatus('all'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'features'
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Feature Requests ({featureRequests.length})
        </button>
        <button
          onClick={() => { setActiveTab('bugs'); setFilterStatus('all'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'bugs'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          <Bug className="w-4 h-4" />
          Bug Reports ({bugReports.length})
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter by status"
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
        >
          <option value="all">All Statuses</option>
          {activeTab === 'features' 
            ? Object.entries(FEATURE_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))
            : Object.entries(BUG_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))
          }
        </select>

        <button
          onClick={() => activeTab === 'features' ? setShowNewFeature(true) : setShowNewBug(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          {activeTab === 'features' ? 'New Feature' : 'Report Bug'}
        </button>
      </div>

      {/* Feature Requests List */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          {filteredFeatures.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No feature requests yet. Be the first to submit one!</p>
            </div>
          ) : (
            filteredFeatures.map(feature => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                isVoted={userVotes.has(feature.id)}
                onUpvote={() => handleUpvote(feature.id)}
                onSelect={() => {
                  setSelectedFeature(feature);
                  loadComments(feature.id);
                }}
              />
            ))
          )}
        </div>
      )}

      {/* Bug Reports List */}
      {activeTab === 'bugs' && (
        <div className="space-y-4">
          {filteredBugs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <Bug className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No bug reports. The app is running smoothly! 🎉</p>
            </div>
          ) : (
            filteredBugs.map(bug => (
              <BugCard key={bug.id} bug={bug} />
            ))
          )}
        </div>
      )}

      {/* New Feature Modal */}
      {showNewFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewFeature(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Submit Feature Request
            </h2>

            <form onSubmit={handleSubmitFeature} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newFeature.title}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of your idea"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={newFeature.category}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, category: e.target.value as FeatureCategory }))}
                  aria-label="Feature category"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.emoji} {config.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  required
                  value={newFeature.description}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the feature in detail. What problem does it solve? How should it work?"
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewFeature(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Bug Modal */}
      {showNewBug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewBug(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Bug className="w-5 h-5 text-red-500" />
              Report a Bug
            </h2>

            <form onSubmit={handleSubmitBug} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newBug.title}
                  onChange={(e) => setNewBug(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the bug"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                  <select
                    value={newBug.severity}
                    onChange={(e) => setNewBug(prev => ({ ...prev, severity: e.target.value as BugSeverity }))}
                    aria-label="Bug severity"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="critical">🔴 Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Affected Page</label>
                  <input
                    type="text"
                    value={newBug.affected_page}
                    onChange={(e) => setNewBug(prev => ({ ...prev, affected_page: e.target.value }))}
                    placeholder="e.g., /events"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  required
                  value={newBug.description}
                  onChange={(e) => setNewBug(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What went wrong?"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Steps to Reproduce (optional)</label>
                <textarea
                  value={newBug.steps_to_reproduce}
                  onChange={(e) => setNewBug(prev => ({ ...prev, steps_to_reproduce: e.target.value }))}
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Behavior</label>
                  <textarea
                    value={newBug.expected_behavior}
                    onChange={(e) => setNewBug(prev => ({ ...prev, expected_behavior: e.target.value }))}
                    placeholder="What should happen?"
                    rows={2}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actual Behavior</label>
                  <textarea
                    value={newBug.actual_behavior}
                    onChange={(e) => setNewBug(prev => ({ ...prev, actual_behavior: e.target.value }))}
                    placeholder="What actually happened?"
                    rows={2}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewBug(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
                >
                  Submit Bug Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature Detail Modal with Comments */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedFeature(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CATEGORY_CONFIG[selectedFeature.category].emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedFeature.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FEATURE_STATUS_CONFIG[selectedFeature.status].color}`}>
                      {FEATURE_STATUS_CONFIG[selectedFeature.status].label}
                    </span>
                    <span className="text-sm text-gray-500">
                      by {selectedFeature.profiles?.display_name || 'Anonymous'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-wrap">{selectedFeature.description}</p>

            {selectedFeature.admin_notes && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Admin Response</p>
                <p className="text-purple-600 dark:text-purple-400">{selectedFeature.admin_notes}</p>
              </div>
            )}

            {/* Comments */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Discussion ({comments.length})
              </h3>

              <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No comments yet. Start the discussion!</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className={`p-3 rounded-xl ${comment.is_admin_response ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {comment.profiles?.display_name || 'Anonymous'}
                        </span>
                        {comment.is_admin_response && (
                          <span className="text-xs px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-full">
                            Team
                          </span>
                        )}
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-medium"
                >
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Feature Card Component
function FeatureCard({ 
  feature, 
  isVoted, 
  onUpvote, 
  onSelect 
}: { 
  feature: FeatureRequest; 
  isVoted: boolean; 
  onUpvote: () => void;
  onSelect: () => void;
}) {
  const category = CATEGORY_CONFIG[feature.category];
  const statusConfig = FEATURE_STATUS_CONFIG[feature.status];

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex gap-4">
        {/* Upvote Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => { e.stopPropagation(); onUpvote(); }}
            aria-label={`Upvote feature request: ${feature.title}`}
            className={`p-2 rounded-lg transition-all ${
              isVoted 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-purple-50'
            }`}
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <span className={`font-bold ${isVoted ? 'text-purple-600' : 'text-gray-700 dark:text-gray-300'}`}>
            {feature.upvotes}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white">{feature.title}</h3>
            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{feature.description}</p>
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              {category.emoji} {category.label}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {feature.profiles?.display_name || 'Anonymous'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(feature.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bug Card Component
function BugCard({ bug }: { bug: BugReport }) {
  const severityConfig = BUG_SEVERITY_CONFIG[bug.severity];
  const statusConfig = BUG_STATUS_CONFIG[bug.status];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-red-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">{bug.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig.color}`}>
            {severityConfig.label}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{bug.description}</p>
      
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {bug.affected_page && (
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            <ExternalLink className="w-3 h-3" />
            {bug.affected_page}
          </span>
        )}
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {bug.profiles?.display_name || 'Anonymous'}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(bug.created_at).toLocaleDateString()}
        </span>
        {bug.fixed_in_version && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Fixed in v{bug.fixed_in_version}
          </span>
        )}
      </div>

      {bug.admin_notes && (
        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Admin Note</p>
          <p className="text-sm text-purple-600 dark:text-purple-400">{bug.admin_notes}</p>
        </div>
      )}
    </div>
  );
}
