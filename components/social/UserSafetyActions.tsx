'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Shield, 
  Ban, 
  VolumeX, 
  Volume2,
  Loader2,
  AlertTriangle,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface UserSafetyActionsProps {
  userId: string;
  userName: string;
  onAction?: () => void;
}

export function UserSafetyActions({ userId, userName, onAction }: UserSafetyActionsProps) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<'block' | 'unblock' | null>(null);
  const supabase = createClient();

  const fetchStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Check if blocked
    const { data: blockData } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', userId)
      .single();
    
    setIsBlocked(!!blockData);

    // Check if muted
    const { data: muteData } = await supabase
      .from('user_mutes')
      .select('id')
      .eq('user_id', user.id)
      .eq('muted_user_id', userId)
      .single();
    
    setIsMuted(!!muteData);
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const toggleBlock = async () => {
    setShowConfirm(null);
    setActionLoading('block');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setActionLoading(null);
      return;
    }

    if (isBlocked) {
      // Unblock
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);

      if (!error) {
        setIsBlocked(false);
        toast.success(`Unblocked ${userName}`);
      }
    } else {
      // Block
      const { error } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: user.id,
          blocked_id: userId
        });

      if (!error) {
        setIsBlocked(true);
        toast.success(`Blocked ${userName}. They won't be able to see your content or message you.`);
      }
    }

    setActionLoading(null);
    onAction?.();
  };

  const toggleMute = async () => {
    setActionLoading('mute');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setActionLoading(null);
      return;
    }

    if (isMuted) {
      // Unmute
      const { error } = await supabase
        .from('user_mutes')
        .delete()
        .eq('user_id', user.id)
        .eq('muted_user_id', userId);

      if (!error) {
        setIsMuted(false);
        toast.success(`Unmuted ${userName}`);
      }
    } else {
      // Mute
      const { error } = await supabase
        .from('user_mutes')
        .insert({
          user_id: user.id,
          muted_user_id: userId,
          mute_posts: true,
          mute_comments: true,
          mute_stories: true
        });

      if (!error) {
        setIsMuted(true);
        toast.success(`Muted ${userName}. You won't see their posts in your feed.`);
      }
    }

    setActionLoading(null);
    onAction?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Mute Button */}
      <button
        onClick={toggleMute}
        disabled={actionLoading === 'mute'}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
          isMuted 
            ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' 
            : 'bg-white/5 text-gray-300 hover:bg-white/10'
        }`}
      >
        {actionLoading === 'mute' ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isMuted ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
        <div className="flex-1 text-left">
          <p className="font-medium">{isMuted ? 'Unmute' : 'Mute'} {userName}</p>
          <p className="text-xs text-gray-500">
            {isMuted 
              ? 'Show their posts in your feed again' 
              : "Hide their posts from your feed"
            }
          </p>
        </div>
      </button>

      {/* Block Button */}
      <button
        onClick={() => setShowConfirm(isBlocked ? 'unblock' : 'block')}
        disabled={!!actionLoading}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
          isBlocked 
            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
            : 'bg-white/5 text-gray-300 hover:bg-white/10'
        }`}
      >
        {actionLoading === 'block' ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Ban className="w-5 h-5" />
        )}
        <div className="flex-1 text-left">
          <p className="font-medium">{isBlocked ? 'Unblock' : 'Block'} {userName}</p>
          <p className="text-xs text-gray-500">
            {isBlocked 
              ? 'Allow them to see your content and message you' 
              : "They won't be able to see your content or message you"
            }
          </p>
        </div>
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${
                showConfirm === 'block' ? 'bg-red-500/20' : 'bg-emerald-500/20'
              }`}>
                {showConfirm === 'block' ? (
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                ) : (
                  <Check className="w-6 h-6 text-emerald-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {showConfirm === 'block' ? 'Block' : 'Unblock'} {userName}?
                </h3>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm mb-6">
              {showConfirm === 'block' 
                ? `${userName} won't be able to see your posts, stories, or message you. They won't be notified that you blocked them.`
                : `${userName} will be able to see your content and message you again.`
              }
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={toggleBlock}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  showConfirm === 'block'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {showConfirm === 'block' ? 'Block' : 'Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for menus
export function BlockUserMenuItem({ 
  userId, 
  userName,
  onBlock 
}: { 
  userId: string; 
  userName: string;
  onBlock?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleBlock = async () => {
    if (!confirm(`Block ${userName}? They won't be able to see your content or message you.`)) {
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: user.id,
          blocked_id: userId
        });

      if (!error) {
        toast.success(`Blocked ${userName}`);
        onBlock?.();
      }
    }
    
    setLoading(false);
  };

  return (
    <button
      onClick={handleBlock}
      disabled={loading}
      className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Ban className="w-4 h-4" />
      )}
      Block {userName}
    </button>
  );
}

export default UserSafetyActions;
