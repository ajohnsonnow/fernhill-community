-- =====================================================
-- DEMO/TEST DATA TAGGING MIGRATION
-- =====================================================
-- Adds the ability to mark users and posts as demo/test data
-- Useful for testing, development, and demonstrations
-- =====================================================

-- Add is_demo column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Add is_demo column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Add is_demo column to board_posts table
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Add is_demo column to events table (optional - for demo events)
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Add is_demo column to announcements table (optional - for demo announcements)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index for efficient filtering of demo content
CREATE INDEX IF NOT EXISTS idx_profiles_is_demo ON profiles(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_posts_is_demo ON posts(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_board_posts_is_demo ON board_posts(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_events_is_demo ON events(is_demo) WHERE is_demo = true;

-- Comment for clarity
COMMENT ON COLUMN profiles.is_demo IS 'Marks profile as demo/test data for development and demonstrations';
COMMENT ON COLUMN posts.is_demo IS 'Marks post as demo/test data for development and demonstrations';
COMMENT ON COLUMN board_posts.is_demo IS 'Marks board post as demo/test data for development and demonstrations';
COMMENT ON COLUMN events.is_demo IS 'Marks event as demo/test data for development and demonstrations';
