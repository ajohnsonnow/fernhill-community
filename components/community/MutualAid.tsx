'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart, HandHelping, AlertCircle, MapPin, Clock, Search, Filter, Plus, X, Send, Award, Car } from 'lucide-react';

interface MutualAidPost {
  id: string;
  user_id: string;
  post_type: 'offer' | 'request';
  category: string;
  title: string;
  description: string;
  location: string | null;
  available_dates: string | null;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  is_anonymous: boolean;
  status: string;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string;
  };
  karma_score?: number;
}

export default function MutualAid() {
  const supabase = createClient();
  const [posts, setPosts] = useState<MutualAidPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<MutualAidPost | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'offers' | 'requests'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    urgency: 'all'
  });

  useEffect(() => {
    loadPosts();
  }, [activeTab, filters, searchQuery]);

  async function loadPosts() {
    try {
      setLoading(true);
      
      let query = supabase
        .from('mutual_aid_posts' as any)
        .select(`
          *,
          profiles!mutual_aid_posts_user_id_fkey (display_name, avatar_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('post_type', activeTab === 'offers' ? 'offer' : 'request');
      }
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters.urgency !== 'all') {
        query = query.eq('urgency', filters.urgency);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get karma scores for users
      const postsWithKarma = await Promise.all(
        ((data as any) || []).map(async (post: any) => {
          if (post.is_anonymous) {
            return { ...post, profiles: null };
          }
          const { data: karmaData } = await (supabase
            .rpc as any)('get_mutual_aid_karma', { p_user_id: post.user_id });
          return { ...post, karma_score: karmaData || 0 };
        })
      );

      setPosts(postsWithKarma);
    } catch (error) {
      console.error('Error loading mutual aid posts:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    'transportation', 'housing', 'food', 'childcare', 'pet-care',
    'moving-help', 'emotional-support', 'skills-teaching', 'equipment-loan',
    'financial', 'medical', 'errands', 'other'
  ];

  const urgencyColors = {
    low: 'bg-blue-900/30 text-blue-400',
    normal: 'bg-fernhill-brown/50 text-fernhill-sand',
    high: 'bg-orange-900/30 text-orange-400',
    urgent: 'bg-red-900/30 text-red-400'
  };

  return (
    <div className="min-h-screen bg-fernhill-dark">
      {/* Header */}
      <div className="bg-fernhill-charcoal border-b border-fernhill-earth sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HandHelping className="w-6 h-6 text-fernhill-terracotta" />
              <h1 className="text-2xl font-bold text-fernhill-cream">Mutual Aid Network</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-fernhill-gold text-fernhill-dark rounded-lg hover:bg-fernhill-terracotta transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Post
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'all', label: 'All', icon: HandHelping },
              { key: 'offers', label: 'Offers', icon: Heart },
              { key: 'requests', label: 'Requests', icon: AlertCircle }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-fernhill-gold text-fernhill-dark'
                    : 'bg-fernhill-brown/50 text-fernhill-sand hover:bg-fernhill-brown'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fernhill-sand/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mutual aid posts..."
                className="w-full pl-10 pr-4 py-2 bg-fernhill-brown/50 border-0 rounded-lg text-fernhill-sand placeholder:text-fernhill-sand/50"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-4 flex gap-2">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 bg-fernhill-brown/50 rounded-lg text-sm text-fernhill-sand"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
              ))}
            </select>
            <select
              value={filters.urgency}
              onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
              className="px-3 py-2 bg-fernhill-brown/50 rounded-lg text-sm text-fernhill-sand"
              aria-label="Filter by urgency"
            >
              <option value="all">All Urgency</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Ride Share Tip Banner */}
          {(filters.category === 'transportation' || filters.category === 'all') && (
            <div className="mt-4 p-3 rounded-lg bg-fernhill-gold/10 border border-fernhill-gold/30 flex items-center gap-3">
              <Car className="w-5 h-5 text-fernhill-gold flex-shrink-0" />
              <div className="flex-1 text-sm">
                <span className="text-fernhill-sand">
                  Looking for rides to events? Check out the{' '}
                </span>
                <button
                  onClick={() => {
                    // Navigate to rides tab - this works because we're in the same parent component
                    const ridesTab = document.querySelector('[data-tab="rides"]') as HTMLButtonElement;
                    if (ridesTab) ridesTab.click();
                  }}
                  className="font-medium text-fernhill-gold underline hover:no-underline"
                >
                  Ride Share
                </button>
                <span className="text-fernhill-sand"> tab for event carpooling!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fernhill-gold mx-auto"></div>
            <p className="mt-4 text-fernhill-sand/70">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <HandHelping className="w-16 h-16 text-fernhill-sand/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-fernhill-cream mb-2">No posts found</h3>
            <p className="text-fernhill-sand/70">Be the first to offer or request help!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div
                key={post.id}
                className="bg-fernhill-charcoal rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {!post.is_anonymous && post.profiles ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fernhill-terracotta to-fernhill-gold" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-fernhill-cream">{post.profiles.display_name}</span>
                            {post.karma_score! > 0 && (
                              <div className="flex items-center gap-1 text-xs text-fernhill-gold">
                                <Award className="w-3 h-3" />
                                <span>{post.karma_score}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-fernhill-sand/70">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-fernhill-earth flex items-center justify-center">
                          <span className="text-lg">🎭</span>
                        </div>
                        <div>
                          <span className="font-medium text-fernhill-cream">Anonymous</span>
                          <div className="text-sm text-fernhill-sand/70">
                            {new Date(post.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.post_type === 'offer'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {post.post_type === 'offer' ? '💝 Offering' : '🙏 Requesting'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${urgencyColors[post.urgency]}`}>
                      {post.urgency}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-fernhill-cream mb-2">{post.title}</h3>
                <p className="text-fernhill-sand mb-4 line-clamp-2">{post.description}</p>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-sm text-fernhill-sand/70">
                  <div className="flex items-center gap-1">
                    <span className="capitalize px-2 py-1 bg-fernhill-brown/50 rounded text-fernhill-sand">
                      {post.category.replace('-', ' ')}
                    </span>
                  </div>
                  {post.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {post.location}
                    </div>
                  )}
                  {post.available_dates && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.available_dates}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPost && (
        <MutualAidDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onResponseSent={() => {
            setSelectedPost(null);
            loadPosts();
          }}
        />
      )}

      {showCreateModal && (
        <CreateMutualAidModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPosts();
          }}
        />
      )}
    </div>
  );
}

function MutualAidDetailModal({ post, onClose, onResponseSent }: {
  post: MutualAidPost;
  onClose: () => void;
  onResponseSent: () => void;
}) {
  const supabase = createClient();
  const [message, setMessage] = useState('');

  async function sendResponse() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase.from('mutual_aid_responses' as any).insert as any)({
        post_id: post.id,
        responder_id: user.id,
        message
      });

      alert('Response sent!');
      onResponseSent();
    } catch (error) {
      console.error('Error sending response:', error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-fernhill-charcoal rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-fernhill-earth">
        <div className="sticky top-0 bg-fernhill-charcoal border-b border-fernhill-earth p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-fernhill-cream">{post.title}</h2>
          <button onClick={onClose} aria-label="Close modal"><X className="w-6 h-6 text-fernhill-sand" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-fernhill-earth">
            {!post.is_anonymous && post.profiles ? (
              <>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fernhill-gold to-fernhill-terracotta" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-fernhill-cream">{post.profiles.display_name}</span>
                    {post.karma_score! > 0 && (
                      <div className="flex items-center gap-1 text-sm text-fernhill-gold">
                        <Award className="w-4 h-4" />
                        <span>{post.karma_score} karma</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-fernhill-sand/70">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-fernhill-brown flex items-center justify-center">
                  <span className="text-2xl">🎭</span>
                </div>
                <div>
                  <span className="font-medium text-fernhill-cream">Anonymous</span>
                  <div className="text-sm text-fernhill-sand/70">{new Date(post.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              post.post_type === 'offer' ? 'bg-fernhill-moss/30 text-green-400' : 'bg-fernhill-gold/20 text-fernhill-gold'
            }`}>
              {post.post_type === 'offer' ? '💝 Offering Help' : '🙏 Requesting Help'}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium capitalize bg-fernhill-brown/50 text-fernhill-sand">
              {post.category.replace('-', ' ')}
            </span>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-fernhill-cream">Description</h3>
            <p className="text-fernhill-sand whitespace-pre-wrap">{post.description}</p>
          </div>

          {(post.location || post.available_dates) && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {post.location && (
                <div>
                  <span className="text-fernhill-sand/70">Location:</span>
                  <span className="ml-2 font-medium text-fernhill-cream">{post.location}</span>
                </div>
              )}
              {post.available_dates && (
                <div>
                  <span className="text-fernhill-sand/70">Available:</span>
                  <span className="ml-2 font-medium text-fernhill-cream">{post.available_dates}</span>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-fernhill-earth pt-4">
            <h3 className="font-semibold mb-3 text-fernhill-cream">
              {post.post_type === 'offer' ? 'Accept This Offer' : 'Offer to Help'}
            </h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={post.post_type === 'offer' 
                ? "Let them know why you need help..."
                : "Describe how you can help..."
              }
              rows={4}
              className="w-full px-4 py-2 bg-fernhill-brown/50 border border-fernhill-earth rounded-lg resize-none text-fernhill-cream placeholder:text-fernhill-sand/50"
            />
            <button
              onClick={sendResponse}
              disabled={!message.trim()}
              className="mt-3 w-full py-3 bg-fernhill-gold text-fernhill-dark rounded-lg hover:bg-fernhill-terracotta disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send Response
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateMutualAidModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    post_type: 'request',
    category: 'transportation',
    title: '',
    description: '',
    location: '',
    available_dates: '',
    urgency: 'normal',
    is_anonymous: false
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase.from('mutual_aid_posts' as any).insert as any)({
        user_id: user.id,
        post_type: formData.post_type,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        location: formData.location || null,
        available_dates: formData.available_dates || null,
        urgency: formData.urgency,
        is_anonymous: formData.is_anonymous
      });

      alert('Post created!');
      onSuccess();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  }

  const categories = ['transportation', 'housing', 'food', 'childcare', 'pet-care', 'moving-help', 'emotional-support', 'skills-teaching', 'equipment-loan', 'financial', 'medical', 'errands', 'other'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-fernhill-charcoal rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-fernhill-earth">
        <div className="sticky top-0 bg-fernhill-charcoal border-b border-fernhill-earth p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-fernhill-cream">Create Mutual Aid Post</h2>
          <button onClick={onClose} aria-label="Close form"><X className="w-6 h-6 text-fernhill-sand" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="mutualaid-type-input" className="block text-sm font-medium mb-1 text-fernhill-sand">Type</label>
              <select
                id="mutualaid-type-input"
                value={formData.post_type}
                onChange={(e) => setFormData({ ...formData, post_type: e.target.value })}
                className="w-full px-3 py-2 bg-fernhill-brown/50 border border-fernhill-earth rounded-lg text-fernhill-cream"
              >
                <option value="offer">💝 Offering Help</option>
                <option value="request">🙏 Requesting Help</option>
              </select>
            </div>
            <div>
              <label htmlFor="mutualaid-category-input" className="block text-sm font-medium mb-1 text-fernhill-sand">Category</label>
              <select
                id="mutualaid-category-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-fernhill-brown/50 border border-fernhill-earth rounded-lg text-fernhill-cream"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-fernhill-sand">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of what you need or offer"
              className="w-full px-3 py-2 bg-fernhill-brown/50 border border-fernhill-earth rounded-lg text-fernhill-cream placeholder:text-fernhill-sand/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-fernhill-sand">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Provide details..."
              className="w-full px-3 py-2 bg-fernhill-brown/50 border border-fernhill-earth rounded-lg resize-none text-fernhill-cream placeholder:text-fernhill-sand/50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-fernhill-sand">Location (optional)</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Pearl District"
                className="w-full px-3 py-2 bg-fernhill-brown/50 border border-fernhill-earth rounded-lg text-fernhill-cream placeholder:text-fernhill-sand/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-fernhill-sand">Availability</label>
              <input
                type="text"
                value={formData.available_dates}
                onChange={(e) => setFormData({ ...formData, available_dates: e.target.value })}
                placeholder="Weekends, evenings..."
                className="w-full px-3 py-2 bg-fernhill-brown/50 border border-fernhill-earth rounded-lg text-fernhill-cream placeholder:text-fernhill-sand/50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="mutualaid-urgency-input" className="block text-sm font-medium mb-1 text-fernhill-sand">Urgency</label>
            <select
              id="mutualaid-urgency-input"
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              className="w-full px-3 py-2 bg-fernhill-brown/50 border border-fernhill-earth rounded-lg text-fernhill-cream"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-fernhill-sand">
            <input
              type="checkbox"
              checked={formData.is_anonymous}
              onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
              className="accent-fernhill-gold"
            />
            Post anonymously
          </label>

          <button
            type="submit"
            className="w-full py-3 bg-fernhill-gold text-fernhill-dark rounded-lg hover:bg-fernhill-terracotta transition-colors font-medium"
          >
            Create Post
          </button>
        </form>
      </div>
    </div>
  );
}
