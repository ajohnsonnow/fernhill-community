-- =====================================================
-- ADDITIONAL SCHEMA FOR NEW FEATURES
-- Run this after the main schema.sql
-- =====================================================

-- Add show_in_directory column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN DEFAULT true;

-- =====================================================
-- ALTAR POSTS TABLE (Photo Gallery)
-- =====================================================
CREATE TABLE IF NOT EXISTS altar_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  image_url TEXT NOT NULL,
  caption TEXT,
  likes_count INTEGER DEFAULT 0,
  
  -- Auto-expire after 90 days for privacy
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days')
);

ALTER TABLE altar_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Altar posts viewable by active members" ON altar_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

CREATE POLICY "Active members can create altar posts" ON altar_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

CREATE POLICY "Users can update own altar posts" ON altar_posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own altar posts" ON altar_posts
  FOR DELETE USING (auth.uid() = author_id);

-- =====================================================
-- PUSH SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription JSONB NOT NULL
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- UPDATE PURGE FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION purge_expired_data()
RETURNS void AS $$
BEGIN
  -- Delete expired posts
  DELETE FROM posts WHERE expires_at < NOW();
  
  -- Delete expired altar posts
  DELETE FROM altar_posts WHERE expires_at < NOW();
  
  -- Delete old events
  DELETE FROM events WHERE date < NOW() - INTERVAL '30 days';
  
  -- Log the purge
  INSERT INTO audit_logs (action, details)
  VALUES ('auto_purge', jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Automated data purge completed'
  ));
END;
$$ LANGUAGE plpgsql;
