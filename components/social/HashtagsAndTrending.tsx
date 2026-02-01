'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Hash, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Hashtag {
  id: string;
  tag: string;
  use_count: number;
  trending_score: number;
  created_at: string;
}

interface TrendingHashtagsProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

// Extract hashtags from text
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u0080-\uFFFF]+/g);
  return matches 
    ? [...new Set(matches.map(tag => tag.toLowerCase().slice(1)))]
    : [];
}

// Render text with clickable hashtags
export function renderHashtags(text: string): React.ReactNode[] {
  const parts = text.split(/(#[\w\u0080-\uFFFF]+)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1).toLowerCase();
      return (
        <Link
          key={index}
          href={`/hearth?hashtag=${encodeURIComponent(tag)}`}
          className="text-emerald-400 hover:text-emerald-300 hover:underline"
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

export function TrendingHashtags({ limit = 5, showHeader = true, compact = false }: TrendingHashtagsProps) {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await (supabase
      .from('hashtags') as any)
      .select('*')
      .order('trending_score', { ascending: false })
      .limit(limit);

    if (!error && data) {
      setHashtags(data);
    }
    setLoading(false);
  }, [limit, supabase]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (hashtags.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <Link
            key={tag.id}
            href={`/hearth?hashtag=${encodeURIComponent(tag.tag)}`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-full text-sm transition-colors"
          >
            <Hash className="w-3 h-3" />
            {tag.tag}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden">
      {showHeader && (
        <div className="flex items-center gap-2 p-4 border-b border-white/5">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold">Trending in Community</h3>
        </div>
      )}

      <div className="divide-y divide-white/5">
        {hashtags.map((tag, index) => (
          <Link
            key={tag.id}
            href={`/hearth?hashtag=${encodeURIComponent(tag.tag)}`}
            className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors group"
          >
            <span className="text-gray-500 text-sm font-medium w-5">{index + 1}</span>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <Hash className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                  {tag.tag}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {tag.use_count} {tag.use_count === 1 ? 'post' : 'posts'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
          </Link>
        ))}
      </div>

      {hashtags.length >= limit && (
        <Link
          href="/explore/trending"
          className="block p-3 text-center text-sm text-emerald-400 hover:bg-white/5 transition-colors border-t border-white/5"
        >
          See all trending
        </Link>
      )}
    </div>
  );
}

// Hashtag input component for posts
interface HashtagInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
}

export function HashtagInput({ value, onChange, suggestions = [] }: HashtagInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const supabase = createClient();

  const fetchSuggestions = async (query: string) => {
    if (query.length < 1) {
      setFilteredSuggestions([]);
      return;
    }

    const { data } = await (supabase
      .from('hashtags') as any)
      .select('tag')
      .ilike('tag', `${query}%`)
      .order('use_count', { ascending: false })
      .limit(5);

    setFilteredSuggestions(data?.map((h: { tag: string }) => h.tag) || []);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check if user is typing a hashtag
    const match = newValue.match(/#(\w*)$/);
    if (match) {
      setShowSuggestions(true);
      fetchSuggestions(match[1]);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertSuggestion = (tag: string) => {
    const newValue = value.replace(/#\w*$/, `#${tag} `);
    onChange(newValue);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Check for hashtag typing
          const match = e.target.value.match(/#(\w*)$/);
          if (match) {
            setShowSuggestions(true);
            fetchSuggestions(match[1]);
          } else {
            setShowSuggestions(false);
          }
        }}
        placeholder="What's happening? Use #hashtags to categorize..."
        className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
        rows={3}
      />

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              onClick={() => insertSuggestion(tag)}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-left"
            >
              <Hash className="w-4 h-4 text-emerald-400" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Create or update hashtag in database
export async function processHashtags(text: string, contentType: string, contentId: string) {
  const supabase = createClient();
  const tags = extractHashtags(text);

  for (const tag of tags) {
    // Upsert the hashtag
    await (supabase
      .from('hashtags') as any)
      .upsert({
        tag: tag.toLowerCase(),
        use_count: 1,
      }, {
        onConflict: 'tag',
      });

    // Update use count
    await (supabase.rpc as any)('increment_hashtag_count', { hashtag_tag: tag });

    // Link to content
    await (supabase
      .from('content_hashtags') as any)
      .upsert({
        hashtag_tag: tag,
        content_type: contentType,
        content_id: contentId,
      });
  }
}

export default TrendingHashtags;
