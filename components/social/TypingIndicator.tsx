'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TypingIndicatorProps {
  conversationType: 'dm' | 'group' | 'post_comments';
  conversationId: string;
}

interface TypingUser {
  id: string;
  full_name: string;
}

export function TypingIndicator({ conversationType, conversationId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to typing indicators
    const channel = supabase
      .channel(`typing:${conversationType}:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_type=eq.${conversationType}`,
        },
        async (payload) => {
          // Fetch current typing users
          const { data } = await (supabase
            .from('typing_indicators') as any)
            .select(`
              user_id,
              user:profiles!typing_indicators_user_id_fkey(id, full_name)
            `)
            .eq('conversation_type', conversationType)
            .eq('conversation_id', conversationId)
            .gt('expires_at', new Date().toISOString());

          if (data) {
            const { data: { user } } = await supabase.auth.getUser();
            // Filter out current user
            const others = data
              .filter((d: { user_id: string; user: { id: string; full_name: string } | null }) => d.user_id !== user?.id && d.user)
              .map((d: { user: { id: string; full_name: string } }) => ({ id: d.user.id, full_name: d.user.full_name }));
            setTypingUsers(others);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationType, conversationId, supabase]);

  if (typingUsers.length === 0) return null;

  const displayText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].full_name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].full_name} and ${typingUsers[1].full_name} are typing`;
    } else {
      return `${typingUsers[0].full_name} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm py-2 px-4">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{displayText()}</span>
    </div>
  );
}

// Hook to send typing indicator
export function useTypingIndicator(
  conversationType: 'dm' | 'group' | 'post_comments',
  conversationId: string
) {
  const supabase = createClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentRef = useRef<number>(0);

  const sendTypingIndicator = useCallback(async () => {
    // Debounce - don't send more than once per 3 seconds
    const now = Date.now();
    if (now - lastSentRef.current < 3000) return;
    lastSentRef.current = now;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert typing indicator (expires in 5 seconds)
    await (supabase
      .from('typing_indicators') as any)
      .upsert({
        user_id: user.id,
        conversation_type: conversationType,
        conversation_id: conversationId,
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5000).toISOString()
      }, {
        onConflict: 'user_id,conversation_type,conversation_id'
      });

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout to remove indicator after 5 seconds of no typing
    timeoutRef.current = setTimeout(async () => {
      await (supabase
        .from('typing_indicators') as any)
        .delete()
        .eq('user_id', user.id)
        .eq('conversation_type', conversationType)
        .eq('conversation_id', conversationId);
    }, 5000);
  }, [conversationType, conversationId, supabase]);

  const stopTyping = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase
      .from('typing_indicators') as any)
      .delete()
      .eq('user_id', user.id)
      .eq('conversation_type', conversationType)
      .eq('conversation_id', conversationId);
  }, [conversationType, conversationId, supabase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { sendTypingIndicator, stopTyping };
}

export default TypingIndicator;
