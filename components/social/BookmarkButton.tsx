'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BookmarkButtonProps {
  entityType: 'post' | 'event' | 'music_set' | 'board_post' | 'altar_post';
  entityId: string;
  initialBookmarked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function BookmarkButton({ 
  entityType, 
  entityId, 
  initialBookmarked = false,
  size = 'md',
  showLabel = false
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size];

  const toggleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (loading) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to save posts');
      setLoading(false);
      return;
    }

    if (isBookmarked) {
      // Remove bookmark
      const { error } = await (supabase
        .from('bookmarks') as any)
        .delete()
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (!error) {
        setIsBookmarked(false);
        toast.success('Removed from saved');
      }
    } else {
      // Add bookmark
      const { error } = await (supabase
        .from('bookmarks') as any)
        .insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId
        });

      if (!error) {
        setIsBookmarked(true);
        toast.success('Saved for later');
      } else if (error.code === '23505') {
        // Already bookmarked
        setIsBookmarked(true);
      }
    }

    setLoading(false);
  }, [entityType, entityId, isBookmarked, loading, supabase]);

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className={`flex items-center gap-1.5 transition-colors ${
        isBookmarked 
          ? 'text-emerald-400 hover:text-emerald-300' 
          : 'text-gray-400 hover:text-white'
      }`}
      aria-label={isBookmarked ? 'Remove from saved' : 'Save for later'}
    >
      {loading ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : isBookmarked ? (
        <BookmarkCheck className={iconSize} />
      ) : (
        <Bookmark className={iconSize} />
      )}
      {showLabel && (
        <span className="text-sm">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
}

// Hook to check bookmark status
export function useBookmarkStatus(entityType: string, entityId: string) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const checkStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await (supabase
      .from('bookmarks') as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();

    setIsBookmarked(!!data);
    setLoading(false);
  }, [entityType, entityId, supabase]);

  return { isBookmarked, loading, checkStatus };
}

export default BookmarkButton;
