'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Smile } from 'lucide-react';

const MESSAGE_EMOJIS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '🙏', label: 'Thanks' },
  { emoji: '💯', label: '100' },
];

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  isGroupMessage?: boolean;
}

export function MessageReactions({ messageId, isGroupMessage = false }: MessageReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  const tableName = isGroupMessage ? 'group_message_reactions' : 'message_reactions';
  const rpcFunction = isGroupMessage ? 'toggle_group_message_reaction' : 'toggle_message_reaction';

  useEffect(() => {
    fetchReactions();
  }, [messageId]);

  const fetchReactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const { data: allReactions, error } = await (supabase
        .from(tableName) as any)
        .select('emoji, user_id')
        .eq('message_id', messageId);

      if (error) {
        // Table might not exist yet
        if (error.code === '42P01') {
          setReactions([]);
          return;
        }
        throw error;
      }

      // Count reactions by emoji
      const reactionMap: Record<string, { count: number; userReacted: boolean }> = {};
      
      MESSAGE_EMOJIS.forEach(r => {
        reactionMap[r.emoji] = { count: 0, userReacted: false };
      });

      allReactions?.forEach((r: { emoji: string; user_id: string }) => {
        if (!reactionMap[r.emoji]) {
          reactionMap[r.emoji] = { count: 0, userReacted: false };
        }
        reactionMap[r.emoji].count++;
        if (user && r.user_id === user.id) {
          reactionMap[r.emoji].userReacted = true;
        }
      });

      const reactionArray = MESSAGE_EMOJIS.map(r => ({
        emoji: r.emoji,
        count: reactionMap[r.emoji]?.count || 0,
        userReacted: reactionMap[r.emoji]?.userReacted || false,
      }));

      setReactions(reactionArray);
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
    }
  };

  const toggleReaction = async (emoji: string) => {
    if (!userId) return;

    const reaction = reactions.find(r => r.emoji === emoji);
    if (!reaction) return;

    // Optimistic update
    setReactions(prev =>
      prev.map(r =>
        r.emoji === emoji
          ? { ...r, count: r.userReacted ? r.count - 1 : r.count + 1, userReacted: !r.userReacted }
          : r
      )
    );
    setShowPicker(false);

    try {
      // Try to use RPC function first
      const { error: rpcError } = await (supabase.rpc as any)(rpcFunction, {
        p_message_id: messageId,
        p_emoji: emoji,
      });

      if (rpcError) {
        // Fallback to direct table manipulation
        if (reaction.userReacted) {
          await (supabase
            .from(tableName) as any)
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', userId)
            .eq('emoji', emoji);
        } else {
          await (supabase
            .from(tableName) as any)
            .insert({
              message_id: messageId,
              user_id: userId,
              emoji: emoji,
            });
        }
      }
    } catch (error) {
      // Revert on error
      fetchReactions();
      console.error('Failed to toggle reaction:', error);
    }
  };

  const visibleReactions = reactions.filter(r => r.count > 0);

  return (
    <div className="relative inline-flex items-center gap-1">
      {/* Existing reactions */}
      {visibleReactions.map(reaction => (
        <button
          key={reaction.emoji}
          onClick={() => toggleReaction(reaction.emoji)}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all ${
            reaction.userReacted
              ? 'bg-fernhill-gold/20 border border-fernhill-gold/50'
              : 'bg-black/20 hover:bg-black/30'
          }`}
        >
          <span>{reaction.emoji}</span>
          {reaction.count > 0 && (
            <span className={`text-[10px] ${reaction.userReacted ? 'text-fernhill-gold' : 'text-white/60'}`}>
              {reaction.count}
            </span>
          )}
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 rounded-full hover:bg-black/20 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Add reaction"
        >
          <Smile className="w-3.5 h-3.5 text-white/40" />
        </button>

        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
            />
            <div className="absolute bottom-full mb-1 left-0 bg-black/80 backdrop-blur-lg rounded-lg p-2 z-50 flex gap-1 shadow-lg border border-white/10">
              {MESSAGE_EMOJIS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MessageReactions;
