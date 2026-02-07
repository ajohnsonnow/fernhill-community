'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageCircle, Reply, Heart, Flag, Clock } from 'lucide-react';

type LoungePost = {
  id: string;
  title: string;
  content: string;
  topic: string;
  is_anonymous: boolean;
  likes_count: number;
  replies_count: number;
  created_by: string;
  created_at: string;
  profiles: { display_name: string; };
};

type LoungeReply = {
  id: string;
  content: string;
  is_anonymous: boolean;
  likes_count: number;
  created_by: string;
  created_at: string;
  profiles: { display_name: string; };
};

export default function SpicyChatLounge() {
  const [posts, setPosts] = useState<LoungePost[]>([]);
  const [selectedPost, setSelectedPost] = useState<LoungePost | null>(null);
  const [replies, setReplies] = useState<LoungeReply[]>([]);
  const [topic, setTopic] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    topic: 'general',
    is_anonymous: false
  });
  const [replyText, setReplyText] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const supabase = createClient();

  const topics = ['general', 'advice', 'vent', 'celebration', 'question', 'debate'];

  useEffect(() => {
    loadPosts();
  }, [topic]);

  async function loadPosts() {
    let query = supabase
      .from('lounge_posts')
      .select('*, profiles:created_by(display_name)')
      .order('created_at', { ascending: false });

    if (topic !== 'all') query = query.eq('topic', topic);

    const { data } = await query as any;
    setPosts(data || []);
  }

  async function loadReplies(postId: string) {
    const { data } = await supabase
      .from('lounge_replies')
      .select('*, profiles:created_by(display_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }) as any;

    setReplies(data || []);
  }

  async function handlePostSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('lounge_posts').insert({
      ...newPost,
      created_by: user.id
    } as any);

    setShowNewPost(false);
    setNewPost({ title: '', content: '', topic: 'general', is_anonymous: false });
    loadPosts();
  }

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPost || !replyText.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('lounge_replies').insert({
      post_id: selectedPost.id,
      content: replyText,
      is_anonymous: replyAnonymous,
      created_by: user.id
    } as any);

    // Update reply count
    await ((supabase.from('lounge_posts') as any)
      .update({ replies_count: (selectedPost.replies_count || 0) + 1 })
      .eq('id', selectedPost.id));

    setReplyText('');
    setReplyAnonymous(false);
    loadReplies(selectedPost.id);
    loadPosts();
  }

  async function toggleLike(postId: string) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    await ((supabase.from('lounge_posts') as any)
      .update({ likes_count: (post.likes_count || 0) + 1 })
      .eq('id', postId));

    loadPosts();
  }

  function openPost(post: LoungePost) {
    setSelectedPost(post);
    loadReplies(post.id);
  }

  if (selectedPost) {
    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={() => setSelectedPost(null)}
          className="text-fernhill-gold hover:text-fernhill-terracotta font-medium"
        >
          ← Back to All Posts
        </button>

        {/* Post Detail */}
        <div className="bg-fernhill-charcoal rounded-lg shadow p-6">
          <div className="mb-4">
            <span className="px-3 py-1 bg-fernhill-gold/20 text-fernhill-gold rounded-full text-sm font-medium capitalize">
              {selectedPost.topic}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-fernhill-cream mb-3">{selectedPost.title}</h2>
          <p className="text-fernhill-sand mb-4 whitespace-pre-wrap">{selectedPost.content}</p>
          <div className="flex items-center justify-between text-sm text-fernhill-sand/80 border-t border-fernhill-earth/50 pt-3">
            <span>
              {selectedPost.is_anonymous ? 'Anonymous' : selectedPost.profiles?.display_name || 'Unknown'} •{' '}
              {new Date(selectedPost.created_at).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleLike(selectedPost.id)}
                className="flex items-center gap-1 hover:text-red-600"
              >
                <Heart className="w-4 h-4" />
                {selectedPost.likes_count || 0}
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {selectedPost.replies_count || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Reply Form */}
        <div className="bg-fernhill-charcoal rounded-lg shadow p-4">
          <form onSubmit={handleReplySubmit} className="space-y-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 h-24 text-fernhill-sand placeholder:text-fernhill-sand/50"
              required
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replyAnonymous}
                  onChange={(e) => setReplyAnonymous(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Post anonymously</span>
              </label>
              <button
                type="submit"
                className="bg-fernhill-gold text-fernhill-dark px-6 py-2 rounded-lg hover:bg-fernhill-terracotta"
              >
                Reply
              </button>
            </div>
          </form>
        </div>

        {/* Replies */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-fernhill-cream">{replies.length} Replies</h3>
          {replies.map(reply => (
            <div key={reply.id} className="bg-fernhill-charcoal rounded-lg shadow p-4">
              <p className="text-fernhill-sand mb-3 whitespace-pre-wrap">{reply.content}</p>
              <div className="flex items-center justify-between text-sm text-fernhill-sand/80">
                <span>
                  {reply.is_anonymous ? 'Anonymous' : reply.profiles?.display_name || 'Unknown'} •{' '}
                  {new Date(reply.created_at).toLocaleDateString()}
                </span>
                <button className="flex items-center gap-1 hover:text-red-600">
                  <Heart className="w-4 h-4" />
                  {reply.likes_count || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-fernhill-terracotta to-fernhill-gold text-fernhill-dark rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-2">🌶️ Spicy Chat Lounge</h2>
        <p className="opacity-90">18+ only • A safe space for open, honest conversation</p>
      </div>

      {/* New Post Button */}
      <button
        onClick={() => setShowNewPost(!showNewPost)}
        className="w-full bg-fernhill-gold text-fernhill-dark py-3 rounded-lg hover:bg-fernhill-terracotta font-medium"
      >
        + Start New Discussion
      </button>

      {/* New Post Form */}
      {showNewPost && (
        <div className="bg-fernhill-charcoal rounded-lg shadow p-6">
          <form onSubmit={handlePostSubmit} className="space-y-4">
            <div>
              <label htmlFor="spicy-topic-input" className="block text-sm font-medium text-fernhill-cream mb-2">Topic</label>
              <select
                id="spicy-topic-input"
                value={newPost.topic}
                onChange={(e) => setNewPost({...newPost, topic: e.target.value})}
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand"
              >
                {topics.map(t => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-cream mb-2">Title *</label>
              <input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                placeholder="Give your post a title..."
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 text-fernhill-sand placeholder:text-fernhill-sand/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fernhill-cream mb-2">Content *</label>
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                placeholder="Share your thoughts..."
                className="w-full bg-fernhill-brown/50 border border-fernhill-earth/50 rounded-lg px-3 py-2 h-32 text-fernhill-sand placeholder:text-fernhill-sand/50"
                required
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newPost.is_anonymous}
                onChange={(e) => setNewPost({...newPost, is_anonymous: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm">Post anonymously</span>
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-fernhill-gold text-fernhill-dark py-2 rounded-lg hover:bg-fernhill-terracotta"
              >
                Post
              </button>
              <button
                type="button"
                onClick={() => setShowNewPost(false)}
                className="px-6 py-2 border border-fernhill-earth/50 rounded-lg text-fernhill-sand hover:bg-fernhill-brown/30"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Topic Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setTopic('all')}
          className={`px-4 py-2 rounded-lg min-h-[44px] ${
            topic === 'all' ? 'bg-fernhill-gold text-fernhill-dark' : 'bg-fernhill-brown/50 text-fernhill-sand'
          }`}
        >
          All Topics
        </button>
        {topics.map(t => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            className={`px-4 py-2 rounded-lg min-h-[44px] capitalize ${
              topic === t ? 'bg-fernhill-gold text-fernhill-dark' : 'bg-fernhill-brown/50 text-fernhill-sand'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="bg-fernhill-charcoal rounded-lg shadow p-8 text-center text-fernhill-sand/70">
            No discussions yet. Start one!
          </div>
        ) : (
          posts.map(post => (
            <div
              key={post.id}
              onClick={() => openPost(post)}
              className="bg-fernhill-charcoal rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="mb-2">
                <span className="px-2 py-1 bg-fernhill-gold/20 text-fernhill-gold rounded text-xs font-medium capitalize">
                  {post.topic}
                </span>
              </div>
              <h3 className="font-bold text-lg text-fernhill-cream mb-2">{post.title}</h3>
              <p className="text-fernhill-sand mb-3 line-clamp-2">{post.content}</p>
              <div className="flex items-center justify-between text-sm text-fernhill-sand/80">
                <span>
                  {post.is_anonymous ? 'Anonymous' : post.profiles?.display_name || 'Unknown'} •{' '}
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {post.likes_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {post.replies_count || 0}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
