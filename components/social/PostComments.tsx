'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  MessageCircle, 
  Send, 
  CornerDownRight, 
  MoreHorizontal,
  Trash2,
  Edit2,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
  reply_count?: number;
}

interface PostCommentsProps {
  postId: string;
  initialCommentCount?: number;
}

export function PostComments({ postId, initialCommentCount = 0 }: PostCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showReplies, setShowReplies] = useState<Set<string>>(new Set());
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Fetch current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, [supabase]);

  // Fetch comments when expanded
  useEffect(() => {
    if (expanded) {
      fetchComments();
    }
  }, [expanded, postId]);

  const fetchComments = async () => {
    setLoading(true);
    
    // Fetch top-level comments with reply counts
    const { data, error } = await (supabase
      .from('post_comments') as any)
      .select(`
        *,
        user:profiles!post_comments_user_id_fkey(full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .is('parent_comment_id', null)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Get reply counts for each comment
      const commentsWithReplyCounts = await Promise.all(
        data.map(async (comment: any) => {
          const { count } = await (supabase
            .from('post_comments') as any)
            .select('*', { count: 'exact', head: true })
            .eq('parent_comment_id', comment.id)
            .eq('is_hidden', false);
          
          return { ...comment, reply_count: count || 0 };
        })
      );
      
      setComments(commentsWithReplyCounts as Comment[]);
    }
    
    setLoading(false);
  };

  const fetchReplies = async (parentId: string) => {
    const { data } = await (supabase
      .from('post_comments') as any)
      .select(`
        *,
        user:profiles!post_comments_user_id_fkey(full_name, avatar_url)
      `)
      .eq('parent_comment_id', parentId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(prev => prev.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: data as Comment[] }
          : comment
      ));
    }
  };

  const toggleReplies = async (commentId: string) => {
    const newShowReplies = new Set(showReplies);
    if (showReplies.has(commentId)) {
      newShowReplies.delete(commentId);
    } else {
      newShowReplies.add(commentId);
      // Fetch replies if not already loaded
      const comment = comments.find(c => c.id === commentId);
      if (comment && !comment.replies) {
        await fetchReplies(commentId);
      }
    }
    setShowReplies(newShowReplies);
  };

  const submitComment = async (parentId: string | null = null) => {
    const content = parentId ? replyContent : newComment;
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { data, error } = await (supabase
      .from('post_comments') as any)
      .insert({
        post_id: postId,
        user_id: user.id,
        parent_comment_id: parentId,
        content: content.trim(),
      })
      .select(`
        *,
        user:profiles!post_comments_user_id_fkey(full_name, avatar_url)
      `)
      .single();

    if (!error && data) {
      if (parentId) {
        // Add reply to parent comment
        setComments(prev => prev.map(comment => 
          comment.id === parentId 
            ? { 
                ...comment, 
                replies: [...(comment.replies || []), data as Comment],
                reply_count: (comment.reply_count || 0) + 1
              }
            : comment
        ));
        setReplyContent('');
        setReplyingTo(null);
      } else {
        // Add new top-level comment
        setComments(prev => [...prev, { ...data, reply_count: 0 } as Comment]);
        setNewComment('');
      }
    }

    setSubmitting(false);
  };

  const editComment = async (commentId: string) => {
    if (!editContent.trim() || submitting) return;

    setSubmitting(true);
    
    const { error } = await (supabase
      .from('post_comments') as any)
      .update({ 
        content: editContent.trim(),
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (!error) {
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, content: editContent.trim(), is_edited: true };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply.id === commentId
                ? { ...reply, content: editContent.trim(), is_edited: true }
                : reply
            )
          };
        }
        return comment;
      }));
      setEditingId(null);
      setEditContent('');
    }

    setSubmitting(false);
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    const { error } = await (supabase
      .from('post_comments') as any)
      .delete()
      .eq('id', commentId);

    if (!error) {
      setComments(prev => prev.filter(c => c.id !== commentId).map(comment => ({
        ...comment,
        replies: comment.replies?.filter(r => r.id !== commentId)
      })));
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div 
      key={comment.id} 
      className={`flex gap-3 ${isReply ? 'ml-8 mt-3' : ''}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.user?.avatar_url ? (
          <img 
            src={comment.user.avatar_url} 
            alt="" 
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
            {comment.user?.full_name?.[0] || '?'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white/5 rounded-2xl px-4 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white text-sm">
              {comment.user?.full_name || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-gray-600">(edited)</span>
            )}
          </div>
          
          {editingId === comment.id ? (
            <div className="flex gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none"
                rows={2}
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => editComment(comment.id)}
                  disabled={submitting}
                  className="p-1.5 bg-emerald-500 rounded-lg text-white hover:bg-emerald-600"
                >
                  <Send className="w-3 h-3" />
                </button>
                <button
                  onClick={() => { setEditingId(null); setEditContent(''); }}
                  className="p-1.5 bg-gray-600 rounded-lg text-white hover:bg-gray-500"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-200 text-sm whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}
        </div>

        {/* Actions */}
        {editingId !== comment.id && (
          <div className="flex items-center gap-4 mt-1 ml-2">
            {!isReply && (
              <button
                onClick={() => {
                  setReplyingTo(comment.id);
                  setTimeout(() => replyInputRef.current?.focus(), 100);
                }}
                className="text-xs text-gray-400 hover:text-emerald-400 transition-colors"
              >
                Reply
              </button>
            )}
            
            {comment.user_id === currentUserId && (
              <>
                <button
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                  }}
                  className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply count & toggle */}
        {!isReply && (comment.reply_count ?? 0) > 0 && (
          <button
            onClick={() => toggleReplies(comment.id)}
            className="flex items-center gap-1 mt-2 ml-2 text-xs text-emerald-400 hover:text-emerald-300"
          >
            {showReplies.has(comment.id) ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {/* Replies */}
        {!isReply && showReplies.has(comment.id) && comment.replies && (
          <div className="mt-2 space-y-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}

        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="flex gap-2 mt-2 ml-8">
            <CornerDownRight className="w-4 h-4 text-gray-500 flex-shrink-0 mt-2" />
            <textarea
              ref={replyInputRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Reply to ${comment.user?.full_name}...`}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitComment(comment.id);
                }
              }}
            />
            <button
              onClick={() => submitComment(comment.id)}
              disabled={!replyContent.trim() || submitting}
              className="p-2 bg-emerald-500 rounded-xl text-white disabled:opacity-50 hover:bg-emerald-600 transition-colors self-end"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const totalComments = comments.reduce(
    (acc, c) => acc + 1 + (c.reply_count || 0), 
    0
  );

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      {/* Toggle Comments */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm">
          {totalComments > 0 || initialCommentCount > 0 
            ? `${totalComments || initialCommentCount} comment${(totalComments || initialCommentCount) !== 1 ? 's' : ''}`
            : 'Add a comment'
          }
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Expanded Comments Section */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          )}

          {/* Comments List */}
          {!loading && comments.length > 0 && (
            <div className="space-y-4">
              {comments.map(comment => renderComment(comment))}
            </div>
          )}

          {/* Empty State */}
          {!loading && comments.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-4">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}

          {/* New Comment Input */}
          <div className="flex gap-3 mt-4">
            <textarea
              ref={inputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitComment();
                }
              }}
            />
            <button
              onClick={() => submitComment()}
              disabled={!newComment.trim() || submitting}
              className="p-3 bg-emerald-500 rounded-xl text-white disabled:opacity-50 hover:bg-emerald-600 transition-colors self-end"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostComments;
