-- ============================================================
-- FERNHILL COMMUNITY - SOCIAL FEATURES V2 MIGRATION
-- World-class social networking enhancements
-- Created: January 31, 2026
-- ============================================================

-- ============================================================
-- 1. COMMENTS SYSTEM (Threaded comments on posts)
-- ============================================================

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- For moderation
  is_hidden BOOLEAN DEFAULT FALSE,
  hidden_reason TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created ON post_comments(created_at DESC);

-- Comment reactions (like post reactions)
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL CHECK (emoji IN ('❤️', '🔥', '🙏', '💃', '✨', '🌀', '😂', '👏')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, emoji)
);

-- ============================================================
-- 2. @MENTIONS SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentioned_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mentioned_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Polymorphic reference - can be post, comment, message, etc.
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'comment', 'message', 'board_post', 'board_reply')),
  entity_id UUID NOT NULL,
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentions_user ON mentions(mentioned_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_mentions_entity ON mentions(entity_type, entity_id);

-- ============================================================
-- 3. IN-APP NOTIFICATIONS CENTER
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification type
  type TEXT NOT NULL CHECK (type IN (
    'mention', 'comment', 'reaction', 'follow', 'message', 
    'event_reminder', 'badge_earned', 'post_approved', 
    'rsvp_update', 'poll_ended', 'story_reaction', 'system'
  )),
  
  -- Title and body
  title TEXT NOT NULL,
  body TEXT,
  
  -- Reference to related content
  entity_type TEXT, -- 'post', 'comment', 'event', 'message', 'badge', etc.
  entity_id UUID,
  
  -- Actor who triggered notification (null for system notifications)
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- For grouping similar notifications
  group_key TEXT, -- e.g., 'post:uuid:reactions' to group reaction notifications
  
  -- Metadata as JSON
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- For auto-cleanup
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_group ON notifications(group_key);

-- ============================================================
-- 4. BOOKMARKS / SAVED POSTS
-- ============================================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- What's being bookmarked
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'event', 'music_set', 'board_post', 'altar_post')),
  entity_id UUID NOT NULL,
  
  -- Optional organization
  collection_name TEXT DEFAULT 'Saved', -- Future: custom collections
  notes TEXT, -- Personal notes about why they saved it
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_entity ON bookmarks(entity_type, entity_id);

-- ============================================================
-- 5. STORIES (24-hour ephemeral content)
-- ============================================================

CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  media_url TEXT NOT NULL, -- Image or short video
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT CHECK (char_length(caption) <= 500),
  
  -- Background color/style for text stories
  background_style TEXT DEFAULT 'gradient-1',
  
  -- Location tag (optional)
  location_tag TEXT,
  
  -- Visibility
  visibility TEXT DEFAULT 'all' CHECK (visibility IN ('all', 'close_friends')),
  
  -- Engagement tracking
  view_count INTEGER DEFAULT 0,
  
  -- Auto-expire after 24 hours
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(created_at DESC) WHERE expires_at > NOW();

-- Story views (who viewed)
CREATE TABLE IF NOT EXISTS story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Story reactions (quick emoji tap)
CREATE TABLE IF NOT EXISTS story_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL CHECK (emoji IN ('❤️', '🔥', '😍', '😂', '😮', '💃')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Close friends list for story visibility
CREATE TABLE IF NOT EXISTS close_friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- ============================================================
-- 6. GROUP DMS / CIRCLES
-- ============================================================

CREATE TABLE IF NOT EXISTS group_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  avatar_url TEXT,
  
  -- Creator becomes admin
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Settings
  is_encrypted BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 50,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  nickname TEXT, -- Optional nickname in this group
  
  -- Notification settings
  muted_until TIMESTAMPTZ,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Content (encrypted if group is encrypted)
  content TEXT NOT NULL,
  
  -- Message type
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'system')),
  media_url TEXT,
  
  -- Reply to another message
  reply_to_id UUID REFERENCES group_messages(id) ON DELETE SET NULL,
  
  -- Metadata
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- ============================================================
-- 7. USER BLOCKING & MUTING
-- ============================================================

CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT, -- Optional reason for records
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS user_mutes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  muted_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- What to mute
  mute_posts BOOLEAN DEFAULT TRUE,
  mute_comments BOOLEAN DEFAULT TRUE,
  mute_stories BOOLEAN DEFAULT TRUE,
  
  -- Temporary or permanent
  expires_at TIMESTAMPTZ, -- null = permanent
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, muted_user_id)
);

-- ============================================================
-- 8. HASHTAGS & TRENDING
-- ============================================================

CREATE TABLE IF NOT EXISTS hashtags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag TEXT NOT NULL UNIQUE,
  tag_normalized TEXT NOT NULL UNIQUE, -- Lowercase, no special chars
  use_count INTEGER DEFAULT 0,
  trending_score FLOAT DEFAULT 0, -- Calculated based on recent usage
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hashtags_trending ON hashtags(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_normalized ON hashtags(tag_normalized);

-- Link hashtags to content
CREATE TABLE IF NOT EXISTS content_hashtags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE NOT NULL,
  
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'story', 'board_post', 'event')),
  entity_id UUID NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hashtag_id, entity_type, entity_id)
);

-- ============================================================
-- 9. LINK PREVIEWS CACHE
-- ============================================================

CREATE TABLE IF NOT EXISTS link_previews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  
  -- Preview data
  title TEXT,
  description TEXT,
  image_url TEXT,
  site_name TEXT,
  favicon_url TEXT,
  
  -- Status
  is_valid BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  -- Cache control
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_link_previews_url ON link_previews(url);

-- ============================================================
-- 10. VOICE MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS voice_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Can be used in DMs or group messages
  message_id UUID, -- References messages or group_messages
  message_type TEXT CHECK (message_type IN ('dm', 'group')),
  
  -- Audio data
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  waveform_data JSONB, -- For visual waveform display
  
  -- Transcription (optional, for accessibility)
  transcription TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. TYPING INDICATORS (Real-time presence)
-- ============================================================

CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Where they're typing
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('dm', 'group', 'post_comments')),
  conversation_id UUID NOT NULL,
  
  -- Auto-expire after 5 seconds
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 seconds'),
  
  UNIQUE(user_id, conversation_type, conversation_id)
);

-- ============================================================
-- 12. FOLLOWING SYSTEM (Optional - for larger communities)
-- ============================================================

CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification preference for this follow
  notify_posts BOOLEAN DEFAULT TRUE,
  notify_stories BOOLEAN DEFAULT TRUE,
  notify_events BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Add follower/following counts to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Comments RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on visible posts" ON post_comments
  FOR SELECT USING (
    NOT is_hidden AND
    EXISTS (SELECT 1 FROM posts WHERE id = post_id)
  );

CREATE POLICY "Authenticated users can create comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Bookmarks RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- Stories RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view non-expired stories" ON stories
  FOR SELECT USING (
    expires_at > NOW() AND
    (visibility = 'all' OR 
     user_id = auth.uid() OR
     (visibility = 'close_friends' AND EXISTS (
       SELECT 1 FROM close_friends 
       WHERE user_id = stories.user_id AND friend_id = auth.uid()
     ))
    )
  );

CREATE POLICY "Users can create own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- Group conversations RLS
ALTER TABLE group_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their groups" ON group_conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Members can view group membership" ON group_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
  );

CREATE POLICY "Members can send messages" ON group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can view group messages" ON group_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
  );

-- Blocks RLS
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own blocks" ON user_blocks
  FOR ALL USING (auth.uid() = blocker_id);

-- Mutes RLS
ALTER TABLE user_mutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mutes" ON user_mutes
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_group_key TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Don't notify if user blocked the actor
  IF p_actor_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM user_blocks WHERE blocker_id = p_user_id AND blocked_id = p_actor_id
  ) THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id, actor_id, group_key, metadata)
  VALUES (p_user_id, p_type, p_title, p_body, p_entity_type, p_entity_id, p_actor_id, p_group_key, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extract and save hashtags from content
CREATE OR REPLACE FUNCTION extract_hashtags(
  p_content TEXT,
  p_entity_type TEXT,
  p_entity_id UUID
) RETURNS void AS $$
DECLARE
  tag TEXT;
  tag_normalized TEXT;
  hashtag_id UUID;
BEGIN
  -- Find all hashtags in content
  FOR tag IN
    SELECT DISTINCT (regexp_matches(p_content, '#([a-zA-Z][a-zA-Z0-9_]{1,29})', 'g'))[1]
  LOOP
    tag_normalized := lower(tag);
    
    -- Upsert hashtag
    INSERT INTO hashtags (tag, tag_normalized, use_count, last_used_at)
    VALUES (tag, tag_normalized, 1, NOW())
    ON CONFLICT (tag_normalized) 
    DO UPDATE SET use_count = hashtags.use_count + 1, last_used_at = NOW()
    RETURNING id INTO hashtag_id;
    
    -- Link to content
    INSERT INTO content_hashtags (hashtag_id, entity_type, entity_id)
    VALUES (hashtag_id, p_entity_type, p_entity_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_blocked(p_user_id UUID, p_other_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_blocks 
    WHERE (blocker_id = p_user_id AND blocked_id = p_other_user_id)
       OR (blocker_id = p_other_user_id AND blocked_id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create notification on comment
CREATE OR REPLACE FUNCTION notify_on_comment() RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  post_title TEXT;
  commenter_name TEXT;
BEGIN
  -- Get post author
  SELECT user_id, COALESCE(LEFT(content, 50), 'Post') INTO post_author_id, post_title
  FROM posts WHERE id = NEW.post_id;
  
  -- Get commenter name
  SELECT full_name INTO commenter_name FROM profiles WHERE id = NEW.user_id;
  
  -- Notify post author (if not commenting on own post)
  IF post_author_id != NEW.user_id THEN
    PERFORM create_notification(
      post_author_id,
      'comment',
      commenter_name || ' commented on your post',
      LEFT(NEW.content, 100),
      'post',
      NEW.post_id,
      NEW.user_id,
      'post:' || NEW.post_id || ':comments'
    );
  END IF;
  
  -- If this is a reply, notify parent comment author
  IF NEW.parent_comment_id IS NOT NULL THEN
    DECLARE
      parent_author_id UUID;
    BEGIN
      SELECT user_id INTO parent_author_id FROM post_comments WHERE id = NEW.parent_comment_id;
      
      IF parent_author_id != NEW.user_id AND parent_author_id != post_author_id THEN
        PERFORM create_notification(
          parent_author_id,
          'comment',
          commenter_name || ' replied to your comment',
          LEFT(NEW.content, 100),
          'comment',
          NEW.id,
          NEW.user_id
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- Trigger to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follower_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- ============================================================
-- CLEANUP JOBS (Run via pg_cron or external scheduler)
-- ============================================================

-- Function to clean up expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories() RETURNS void AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old notifications (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications() RETURNS void AS $$
BEGIN
  DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to update trending scores
CREATE OR REPLACE FUNCTION update_trending_scores() RETURNS void AS $$
BEGIN
  UPDATE hashtags SET
    trending_score = (
      SELECT COUNT(*) * EXP(-EXTRACT(EPOCH FROM (NOW() - MAX(content_hashtags.created_at))) / 86400)
      FROM content_hashtags
      WHERE content_hashtags.hashtag_id = hashtags.id
        AND content_hashtags.created_at > NOW() - INTERVAL '7 days'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- REAL-TIME SUBSCRIPTIONS
-- Enable real-time for new tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE stories;
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

COMMENT ON TABLE post_comments IS 'Threaded comments on posts';
COMMENT ON TABLE notifications IS 'In-app notification center';
COMMENT ON TABLE bookmarks IS 'User-saved content for later';
COMMENT ON TABLE stories IS '24-hour ephemeral content (dance snippets, vibes)';
COMMENT ON TABLE group_conversations IS 'Group DM conversations (Circles)';
COMMENT ON TABLE user_blocks IS 'User blocking for safety';
COMMENT ON TABLE hashtags IS 'Content discovery via hashtags';
