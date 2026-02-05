-- =====================================================
-- USER USAGE TRACKING MIGRATION
-- =====================================================
-- Tracks data usage per user to help balance community voice
-- and allow users to see their footprint
-- =====================================================

-- Add usage tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_posts INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_storage_bytes BIGINT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_post_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS posts_this_week INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS posts_this_month INTEGER DEFAULT 0;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_total_posts ON profiles(total_posts DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_storage ON profiles(total_storage_bytes DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_post ON profiles(last_post_at DESC);

-- Create user activity log for historical tracking
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  posts_count INTEGER DEFAULT 0,
  storage_added_bytes BIGINT DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reactions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity log
DROP POLICY IF EXISTS "Users can view own activity log" ON user_activity_log;
CREATE POLICY "Users can view own activity log" ON user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all activity logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON user_activity_log;
CREATE POLICY "Admins can view all activity logs" ON user_activity_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

-- System can insert activity logs (via service role)
DROP POLICY IF EXISTS "System can insert activity logs" ON user_activity_log;
CREATE POLICY "System can insert activity logs" ON user_activity_log
  FOR INSERT WITH CHECK (true);

-- System can update activity logs (via service role)
DROP POLICY IF EXISTS "System can update activity logs" ON user_activity_log;
CREATE POLICY "System can update activity logs" ON user_activity_log
  FOR UPDATE USING (true);

-- Create indexes for activity log
CREATE INDEX IF NOT EXISTS idx_activity_user_date ON user_activity_log(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_date ON user_activity_log(date DESC);

-- Function to calculate total storage for a user
CREATE OR REPLACE FUNCTION calculate_user_storage(user_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
  total_bytes BIGINT := 0;
  story_count INTEGER := 0;
  altar_count INTEGER := 0;
BEGIN
  -- Count stories (estimate 500KB per story)
  SELECT COUNT(*) INTO story_count
  FROM stories
  WHERE user_id = user_uuid;
  
  -- Count altar posts (estimate 2MB per photo)
  SELECT COUNT(*) INTO altar_count
  FROM altar_posts
  WHERE author_id = user_uuid;
  
  -- Calculate estimated total storage
  total_bytes := (story_count * 500000) + (altar_count * 2000000);
  
  RETURN total_bytes;
END;
$$ LANGUAGE plpgsql;

-- Function to update user usage stats
CREATE OR REPLACE FUNCTION update_user_usage_stats(user_uuid UUID)
RETURNS void AS $$
DECLARE
  post_count INTEGER;
  storage_bytes BIGINT;
  posts_week INTEGER;
  posts_month INTEGER;
  last_post TIMESTAMPTZ;
BEGIN
  -- Count total posts
  SELECT COUNT(*) INTO post_count
  FROM posts
  WHERE author_id = user_uuid;
  
  -- Calculate storage
  storage_bytes := calculate_user_storage(user_uuid);
  
  -- Count posts this week
  SELECT COUNT(*) INTO posts_week
  FROM posts
  WHERE author_id = user_uuid
    AND created_at >= NOW() - INTERVAL '7 days';
  
  -- Count posts this month
  SELECT COUNT(*) INTO posts_month
  FROM posts
  WHERE author_id = user_uuid
    AND created_at >= NOW() - INTERVAL '30 days';
  
  -- Get last post timestamp
  SELECT MAX(created_at) INTO last_post
  FROM posts
  WHERE author_id = user_uuid;
  
  -- Update profile
  UPDATE profiles
  SET 
    total_posts = post_count,
    total_storage_bytes = storage_bytes,
    posts_this_week = posts_week,
    posts_this_month = posts_month,
    last_post_at = last_post
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to log daily activity (can be called via cron or trigger)
CREATE OR REPLACE FUNCTION log_user_daily_activity(user_uuid UUID, activity_date DATE)
RETURNS void AS $$
DECLARE
  day_posts INTEGER;
  day_comments INTEGER;
  day_reactions INTEGER;
BEGIN
  -- Count posts for the day
  SELECT COUNT(*) INTO day_posts
  FROM posts
  WHERE author_id = user_uuid
    AND DATE(created_at) = activity_date;
  
  -- Count comments for the day
  SELECT COUNT(*) INTO day_comments
  FROM comments
  WHERE user_id = user_uuid
    AND DATE(created_at) = activity_date;
  
  -- Count reactions for the day
  SELECT COUNT(*) INTO day_reactions
  FROM reactions
  WHERE user_id = user_uuid
    AND DATE(created_at) = activity_date;
  
  -- Insert or update activity log
  INSERT INTO user_activity_log (user_id, date, posts_count, storage_added_bytes, comments_count, reactions_count)
  VALUES (user_uuid, activity_date, day_posts, 0, day_comments, day_reactions)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    posts_count = EXCLUDED.posts_count,
    storage_added_bytes = EXCLUDED.storage_added_bytes,
    comments_count = EXCLUDED.comments_count,
    reactions_count = EXCLUDED.reactions_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for clarity
COMMENT ON COLUMN profiles.total_posts IS 'Total number of posts created by user';
COMMENT ON COLUMN profiles.total_storage_bytes IS 'Total storage used by user (posts, photos, stories)';
COMMENT ON COLUMN profiles.last_post_at IS 'Timestamp of user''s most recent post';
COMMENT ON COLUMN profiles.posts_this_week IS 'Number of posts in last 7 days';
COMMENT ON COLUMN profiles.posts_this_month IS 'Number of posts in last 30 days';
COMMENT ON TABLE user_activity_log IS 'Daily activity tracking per user for historical analysis';

-- =====================================================
-- AUTOMATIC USAGE TRACKING TRIGGERS
-- =====================================================

-- Trigger function to update user stats when a post is created
CREATE OR REPLACE FUNCTION update_user_stats_on_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile stats
  UPDATE profiles
  SET 
    total_posts = total_posts + 1,
    last_post_at = NEW.created_at,
    posts_this_week = (
      SELECT COUNT(*) FROM posts 
      WHERE author_id = NEW.author_id 
      AND created_at >= NOW() - INTERVAL '7 days'
    ),
    posts_this_month = (
      SELECT COUNT(*) FROM posts 
      WHERE author_id = NEW.author_id 
      AND created_at >= NOW() - INTERVAL '30 days'
    )
  WHERE id = NEW.author_id;
  
  -- Log daily activity (no storage tracking for posts)
  INSERT INTO user_activity_log (user_id, date, posts_count, storage_added_bytes)
  VALUES (
    NEW.author_id, 
    CURRENT_DATE, 
    1,
    0
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    posts_count = user_activity_log.posts_count + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on posts table
DROP TRIGGER IF EXISTS trigger_update_user_stats_on_post ON posts;
CREATE TRIGGER trigger_update_user_stats_on_post
AFTER INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_post();

-- Trigger function when a post is deleted
CREATE OR REPLACE FUNCTION update_user_stats_on_post_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile stats
  UPDATE profiles
  SET 
    total_posts = GREATEST(total_posts - 1, 0),
    posts_this_week = (
      SELECT COUNT(*) FROM posts 
      WHERE author_id = OLD.author_id 
      AND created_at >= NOW() - INTERVAL '7 days'
    ),
    posts_this_month = (
      SELECT COUNT(*) FROM posts 
      WHERE author_id = OLD.author_id 
      AND created_at >= NOW() - INTERVAL '30 days'
    )
  WHERE id = OLD.author_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post deletion
DROP TRIGGER IF EXISTS trigger_update_user_stats_on_post_delete ON posts;
CREATE TRIGGER trigger_update_user_stats_on_post_delete
AFTER DELETE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_post_delete();

-- Initial population of usage stats for existing users
-- Run this after migration to populate existing data
-- SELECT update_user_usage_stats(id) FROM profiles;
