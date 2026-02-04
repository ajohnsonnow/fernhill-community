'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Plus, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Heart,
  Send,
  Camera,
  Loader2,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  view_count: number;
  created_at: string;
  expires_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface GroupedStories {
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

const STORY_REACTIONS = ['❤️', '🔥', '😍', '😂', '😮', '💃'];

export function StoriesBar() {
  const [groupedStories, setGroupedStories] = useState<GroupedStories[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingUser, setViewingUser] = useState<GroupedStories | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchStories();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch all active stories
    const { data: stories, error } = await (supabase
      .from('stories') as any)
      .select(`
        *,
        user:profiles!stories_user_id_fkey(id, full_name, avatar_url)
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!error && stories) {
      // Get viewed stories for current user
      if (user) {
        const { data: views } = await (supabase
          .from('story_views') as any)
          .select('story_id')
          .eq('viewer_id', user.id);
        
        if (views) {
          setViewedStories(new Set(views.map((v: { story_id: string }) => v.story_id)));
        }
      }

      // Separate my stories
      const mine = stories.filter((s: Story) => s.user_id === user?.id);
      setMyStories(mine);

      // Group other users' stories
      const otherStories = stories.filter((s: Story) => s.user_id !== user?.id);
      const grouped: Map<string, GroupedStories> = new Map();

      otherStories.forEach((story: Story) => {
        const existing = grouped.get(story.user_id);
        if (existing) {
          existing.stories.push(story);
          if (!viewedStories.has(story.id)) {
            existing.hasUnviewed = true;
          }
        } else {
          grouped.set(story.user_id, {
            user: story.user,
            stories: [story],
            hasUnviewed: !viewedStories.has(story.id)
          });
        }
      });

      // Sort: unviewed first
      const sortedGroups = Array.from(grouped.values()).sort((a, b) => {
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0;
      });

      setGroupedStories(sortedGroups);
    }
    
    setLoading(false);
  };

  const viewStory = async (story: Story) => {
    if (!currentUserId || story.user_id === currentUserId) return;
    
    // Record view
    await (supabase
      .from('story_views') as any)
      .insert({
        story_id: story.id,
        viewer_id: currentUserId
      })
      .onConflict('story_id,viewer_id')
      .select();

    // Update view count
    await (supabase
      .from('stories') as any)
      .update({ view_count: story.view_count + 1 })
      .eq('id', story.id);

    setViewedStories(prev => new Set([...prev, story.id]));
  };

  const openStories = (group: GroupedStories) => {
    setViewingUser(group);
    setCurrentStoryIndex(0);
    viewStory(group.stories[0]);
  };

  const nextStory = () => {
    if (!viewingUser) return;
    
    if (currentStoryIndex < viewingUser.stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      viewStory(viewingUser.stories[nextIndex]);
    } else {
      // Move to next user's stories
      const currentUserIndex = groupedStories.findIndex(g => g.user.id === viewingUser.user.id);
      if (currentUserIndex < groupedStories.length - 1) {
        const nextGroup = groupedStories[currentUserIndex + 1];
        setViewingUser(nextGroup);
        setCurrentStoryIndex(0);
        viewStory(nextGroup.stories[0]);
      } else {
        closeViewer();
      }
    }
  };

  const prevStory = () => {
    if (!viewingUser) return;
    
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      // Move to previous user's stories
      const currentUserIndex = groupedStories.findIndex(g => g.user.id === viewingUser.user.id);
      if (currentUserIndex > 0) {
        const prevGroup = groupedStories[currentUserIndex - 1];
        setViewingUser(prevGroup);
        setCurrentStoryIndex(prevGroup.stories.length - 1);
      }
    }
  };

  const closeViewer = () => {
    setViewingUser(null);
    setCurrentStoryIndex(0);
  };

  const sendReaction = async (emoji: string) => {
    if (!viewingUser || !currentUserId) return;
    
    const story = viewingUser.stories[currentStoryIndex];
    
    await (supabase
      .from('story_reactions') as any)
      .insert({
        story_id: story.id,
        user_id: currentUserId,
        emoji
      });
    
    // Could show a toast here
  };

  // Auto-advance stories
  useEffect(() => {
    if (!viewingUser) return;
    
    const timer = setTimeout(() => {
      nextStory();
    }, 5000); // 5 seconds per story

    return () => clearTimeout(timer);
  }, [viewingUser, currentStoryIndex]);

  return (
    <>
      {/* Stories Bar */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-white/5 py-4 px-4">
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide"
        >
          {/* Add Story Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-shrink-0 flex flex-col items-center gap-1"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border-2 border-dashed border-emerald-500/50 flex items-center justify-center">
                {myStories.length > 0 ? (
                  <img 
                    src={myStories[0].media_url} 
                    alt="" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Plus className="w-6 h-6 text-emerald-400" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                <Plus className="w-3 h-3 text-white" />
              </div>
            </div>
            <span className="text-xs text-gray-400">Your Story</span>
          </button>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center w-16">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          )}

          {/* Other Users' Stories */}
          {groupedStories.map((group) => (
            <button
              key={group.user.id}
              onClick={() => openStories(group)}
              className="flex-shrink-0 flex flex-col items-center gap-1"
            >
              <div className={`w-16 h-16 rounded-full p-0.5 ${
                group.hasUnviewed 
                  ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500' 
                  : 'bg-gray-600'
              }`}>
                <div className="w-full h-full rounded-full bg-gray-900 p-0.5">
                  {group.user.avatar_url ? (
                    <img 
                      src={group.user.avatar_url} 
                      alt="" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
                      {group.user.full_name?.[0] || '?'}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-400 truncate max-w-16">
                {group.user.full_name?.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Progress Bars */}
          <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
            {viewingUser.stories.map((_, index) => (
              <div 
                key={index}
                className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
              >
                <div 
                  className={`h-full bg-white rounded-full transition-all duration-[5000ms] ${
                    index < currentStoryIndex 
                      ? 'w-full' 
                      : index === currentStoryIndex 
                        ? 'w-full animate-progress' 
                        : 'w-0'
                  }`}
                  style={{
                    animation: index === currentStoryIndex ? 'progress 5s linear' : 'none'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {viewingUser.user.avatar_url ? (
                <img 
                  src={viewingUser.user.avatar_url} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
                  {viewingUser.user.full_name?.[0]}
                </div>
              )}
              <div>
                <p className="text-white font-medium">{viewingUser.user.full_name}</p>
                <p className="text-gray-400 text-xs">
                  {formatDistanceToNow(new Date(viewingUser.stories[currentStoryIndex].created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <button
              onClick={closeViewer}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Story Content */}
          <div className="relative w-full h-full max-w-lg mx-auto">
            {viewingUser.stories[currentStoryIndex].media_type === 'video' ? (
              <video
                src={viewingUser.stories[currentStoryIndex].media_url}
                className="w-full h-full object-contain"
                autoPlay
                muted
                playsInline
              />
            ) : (
              <img
                src={viewingUser.stories[currentStoryIndex].media_url}
                alt=""
                className="w-full h-full object-contain"
              />
            )}

            {/* Caption */}
            {viewingUser.stories[currentStoryIndex].caption && (
              <div className="absolute bottom-24 left-4 right-4 text-center">
                <p className="text-white text-lg font-medium drop-shadow-lg">
                  {viewingUser.stories[currentStoryIndex].caption}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Areas */}
          <button
            onClick={prevStory}
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
            aria-label="Previous"
          />
          <button
            onClick={nextStory}
            className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
            aria-label="Next"
          />

          {/* Reactions */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 z-10">
            <div className="flex-1 flex gap-2 justify-center">
              {STORY_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* View count for own stories */}
          {viewingUser.user.id === currentUserId && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/70">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{viewingUser.stories[currentStoryIndex].view_count}</span>
            </div>
          )}
        </div>
      )}

      {/* Create Story Modal */}
      {showCreateModal && (
        <CreateStoryModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchStories();
          }}
        />
      )}

      <style jsx global>{`
        @keyframes progress {
          from { width: 0; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 5s linear;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}

// Create Story Modal Component
function CreateStoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const uploadStory = async () => {
    if (!image) return;
    
    setUploading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    // Upload image to storage
    const fileName = `${user.id}/${Date.now()}-${image.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('stories')
      .upload(fileName, image);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      setUploading(false);
      return;
    }

    // Get signed URL (stories bucket is private)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('stories')
      .createSignedUrl(fileName, 60 * 60 * 24); // 24 hour expiry

    if (urlError || !signedUrlData) {
      console.error('Signed URL error:', urlError);
      setUploading(false);
      return;
    }

    // Create story record
    const { error: insertError } = await (supabase
      .from('stories') as any)
      .insert({
        user_id: user.id,
        media_url: signedUrlData.signedUrl,
        media_type: image.type.startsWith('video/') ? 'video' : 'image',
        caption: caption || null
      });

    if (!insertError) {
      onCreated();
    }
    
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Create Story</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {preview ? (
            <div className="relative">
              <img 
                src={preview} 
                alt="" 
                className="w-full aspect-[9/16] object-cover rounded-xl"
              />
              <button
                onClick={() => { setImage(null); setPreview(null); }}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/16] border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-4 hover:border-emerald-500/50 transition-colors"
            >
              <Camera className="w-12 h-12 text-gray-500" />
              <span className="text-gray-400">Tap to add photo or video</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {preview && (
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              maxLength={500}
              className="w-full mt-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              rows={2}
            />
          )}
        </div>

        {/* Footer */}
        {preview && (
          <div className="p-4 border-t border-white/10">
            <button
              onClick={uploadStory}
              disabled={uploading}
              className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Share to Story
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-500 mt-2">
              Your story will disappear after 24 hours
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoriesBar;
