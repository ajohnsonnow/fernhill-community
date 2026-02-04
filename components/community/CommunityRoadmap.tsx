'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Map, ChevronUp, Clock, CheckCircle2, Rocket, Archive, 
  Sparkles, Calendar, Tag, TrendingUp, Filter, Search
} from 'lucide-react';
import { toast } from 'sonner';

type RoadmapStatus = 'planned' | 'in_progress' | 'completed' | 'archived';
type FeatureCategory = 'social' | 'events' | 'messaging' | 'community' | 'admin' | 'mobile' | 'accessibility' | 'performance' | 'security' | 'other';

type RoadmapItem = {
  id: string;
  title: string;
  description: string | null;
  category: FeatureCategory;
  status: RoadmapStatus;
  priority: number;
  target_quarter: string | null;
  release_version: string | null;
  completed_at: string | null;
  upvotes: number;
  is_featured: boolean;
  emoji: string;
  created_at: string;
};

type RoadmapStats = {
  planned: number;
  in_progress: number;
  completed: number;
  total_feature_requests: number;
  pending_requests: number;
  open_bugs: number;
  fixed_bugs: number;
};

const STATUS_CONFIG: Record<RoadmapStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  planned: { label: 'Planned', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Rocket },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle2 },
  archived: { label: 'Archived', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: Archive }
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

export default function CommunityRoadmap() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [stats, setStats] = useState<RoadmapStats | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<RoadmapStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadRoadmapItems(), loadStats(), loadUserVotes()]);
    setLoading(false);
  }

  async function loadRoadmapItems() {
    const { data } = await supabase
      .from('roadmap_items')
      .select('*')
      .neq('status', 'archived')
      .order('priority', { ascending: false })
      .order('upvotes', { ascending: false }) as any;
    
    setItems(data || []);
  }

  async function loadStats() {
    const { data } = await supabase.rpc('get_roadmap_stats') as any;
    if (data) setStats(data);
  }

  async function loadUserVotes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('roadmap_upvotes')
      .select('roadmap_item_id')
      .eq('user_id', user.id) as any;

    if (data) {
      setUserVotes(new Set(data.map((v: any) => v.roadmap_item_id)));
    }
  }

  async function handleUpvote(itemId: string) {
    setVotingId(itemId);
    
    const { data, error } = await (supabase.rpc as any)('toggle_roadmap_upvote', { item_id: itemId });
    
    if (error) {
      toast.error('Failed to vote');
    } else {
      // Update local state
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, upvotes: data.upvotes } : item
      ));
      
      setUserVotes(prev => {
        const newSet = new Set(prev);
        if (data.action === 'added') {
          newSet.add(itemId);
          toast.success('Vote added! 🎉');
        } else {
          newSet.delete(itemId);
          toast.success('Vote removed');
        }
        return newSet;
      });
    }
    
    setVotingId(null);
  }

  // Filter items
  const filteredItems = items.filter(item => {
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group by status for kanban view
  const groupedItems = {
    planned: filteredItems.filter(i => i.status === 'planned'),
    in_progress: filteredItems.filter(i => i.status === 'in_progress'),
    completed: filteredItems.filter(i => i.status === 'completed')
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl">
            <Map className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Roadmap</h1>
            <p className="text-gray-600 dark:text-gray-400">See what&apos;s coming and vote for features you want!</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Planned</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.planned}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                <Rocket className="w-4 h-4" />
                <span className="text-sm font-medium">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.in_progress}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Feature Ideas</span>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.total_feature_requests}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search roadmap..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            aria-label="Filter by status"
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            aria-label="Filter by category"
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.emoji} {config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid md:grid-cols-3 gap-6">
        {(['planned', 'in_progress', 'completed'] as const).map(status => {
          const config = STATUS_CONFIG[status];
          const StatusIcon = config.icon;
          const statusItems = groupedItems[status] as RoadmapItem[];

          return (
            <div key={status} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
              <div className={`flex items-center gap-2 mb-4 ${config.color}`}>
                <StatusIcon className="w-5 h-5" />
                <h2 className="font-semibold">{config.label}</h2>
                <span className="ml-auto bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs text-gray-600 dark:text-gray-300">
                  {statusItems.length}
                </span>
              </div>

              <div className="space-y-3">
                {statusItems.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No items</p>
                ) : (
                  statusItems.map(item => (
                    <RoadmapCard
                      key={item.id}
                      item={item}
                      isVoted={userVotes.has(item.id)}
                      isVoting={votingId === item.id}
                      onUpvote={() => handleUpvote(item.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm"
            >
              <span>{config.emoji}</span>
              <span className="text-gray-600 dark:text-gray-300">{config.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual Roadmap Card
function RoadmapCard({ 
  item, 
  isVoted, 
  isVoting, 
  onUpvote 
}: { 
  item: RoadmapItem; 
  isVoted: boolean; 
  isVoting: boolean;
  onUpvote: () => void;
}) {
  const category = CATEGORY_CONFIG[item.category];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 ${item.is_featured ? 'ring-2 ring-purple-500' : ''}`}>
      {/* Featured Badge */}
      {item.is_featured && (
        <div className="flex items-center gap-1 text-purple-500 text-xs font-medium mb-2">
          <Sparkles className="w-3 h-3" />
          Featured
        </div>
      )}

      {/* Title with Emoji */}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xl">{item.emoji}</span>
        <h3 className="font-medium text-gray-900 dark:text-white flex-1">{item.title}</h3>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
          <span>{category.emoji}</span>
          <span className="text-gray-600 dark:text-gray-300">{category.label}</span>
        </span>
        
        {item.target_quarter && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
            <Calendar className="w-3 h-3" />
            {item.target_quarter}
          </span>
        )}
        
        {item.release_version && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
            <Tag className="w-3 h-3" />
            v{item.release_version}
          </span>
        )}
      </div>

      {/* Upvote Button */}
      <button
        onClick={onUpvote}
        disabled={isVoting}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
          isVoted 
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
        } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <ChevronUp className={`w-4 h-4 ${isVoted ? 'fill-current' : ''}`} />
        <span className="font-medium">{item.upvotes}</span>
        <span className="text-sm">{isVoted ? 'Voted' : 'Upvote'}</span>
      </button>
    </div>
  );
}
