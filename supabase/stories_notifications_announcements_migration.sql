-- =====================================================
-- STORIES, NOTIFICATIONS & ANNOUNCEMENTS MIGRATION
-- =====================================================
-- Run this in Supabase SQL Editor to add missing tables
-- This is idempotent - safe to run multiple times
-- =====================================================

-- =====================================================
-- 1. STORIES TABLE (24hr Ephemeral Content)
-- =====================================================

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Stories policies
DROP POLICY IF EXISTS "Active members can view stories" ON stories;
CREATE POLICY "Active members can view stories" ON stories
  FOR SELECT TO authenticated
  USING (
    expires_at > NOW() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Users can create own stories" ON stories;
CREATE POLICY "Users can create own stories" ON stories
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Users can delete own stories" ON stories;
CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Story views tracking
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(story_id, viewer_id)
);

ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view story views for own stories" ON story_views;
CREATE POLICY "Users can view story views for own stories" ON story_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid())
    OR viewer_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can mark stories as viewed" ON story_views;
CREATE POLICY "Users can mark stories as viewed" ON story_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- Story reactions
CREATE TABLE IF NOT EXISTS story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  UNIQUE(story_id, user_id, emoji)
);

ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view story reactions" ON story_reactions;
CREATE POLICY "Anyone can view story reactions" ON story_reactions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can react to stories" ON story_reactions;
CREATE POLICY "Users can react to stories" ON story_reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own reactions" ON story_reactions;
CREATE POLICY "Users can remove own reactions" ON story_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for stories
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);

-- =====================================================
-- 2. NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'reaction', 'comment', 'mention', 'event', 'announcement', 'follow', 'approval', 'badge', 'milestone')),
  title TEXT NOT NULL,
  content TEXT,
  link TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notification policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- 3. ANNOUNCEMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'community' CHECK (category IN ('logistics', 'event', 'policy', 'safety', 'community', 'urgent')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_pinned BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  publish_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Announcement policies
DROP POLICY IF EXISTS "Active members can view published announcements" ON announcements;
CREATE POLICY "Active members can view published announcements" ON announcements
  FOR SELECT TO authenticated
  USING (
    status = 'published' AND
    (expires_at IS NULL OR expires_at > NOW()) AND
    publish_at <= NOW()
  );

DROP POLICY IF EXISTS "Admins can view all announcements" ON announcements;
CREATE POLICY "Admins can view all announcements" ON announcements
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

DROP POLICY IF EXISTS "Admins can create announcements" ON announcements;
CREATE POLICY "Admins can create announcements" ON announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

DROP POLICY IF EXISTS "Admins can update announcements" ON announcements;
CREATE POLICY "Admins can update announcements" ON announcements
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

DROP POLICY IF EXISTS "Admins can delete announcements" ON announcements;
CREATE POLICY "Admins can delete announcements" ON announcements
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

-- Announcement read tracking
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reads" ON announcement_reads;
CREATE POLICY "Users can view own reads" ON announcement_reads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark announcements as read" ON announcement_reads;
CREATE POLICY "Users can mark announcements as read" ON announcement_reads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_at ON announcements(publish_at);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);

-- =====================================================
-- 4. STORIES STORAGE BUCKET
-- =====================================================

-- Create stories bucket (private with RLS)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stories', 'stories', false)
ON CONFLICT (id) DO NOTHING;

-- Stories bucket policies
DROP POLICY IF EXISTS "Authenticated users can view stories media" ON storage.objects;
CREATE POLICY "Authenticated users can view stories media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'stories');

DROP POLICY IF EXISTS "Users can upload own story media" ON storage.objects;
CREATE POLICY "Users can upload own story media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'stories' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own story media" ON storage.objects;
CREATE POLICY "Users can update own story media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'stories' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own story media" ON storage.objects;
CREATE POLICY "Users can delete own story media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'stories' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- 5. ADD DISPLAY_NAME TO PROFILES (for announcements)
-- =====================================================

-- Add display_name column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN display_name TEXT;
  END IF;
END $$;

-- Update display_name from full_name if empty
UPDATE profiles 
SET display_name = full_name 
WHERE display_name IS NULL AND full_name IS NOT NULL;

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to increment story view count
CREATE OR REPLACE FUNCTION increment_story_views(story_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE stories SET view_count = view_count + 1 WHERE id = story_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired stories (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  -- Delete stories older than 24 hours
  DELETE FROM stories WHERE expires_at < NOW();
  
  -- Also cleanup orphaned storage files (optional - needs edge function)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. RIDE SHARE TABLES
-- =====================================================

-- Drop existing ride_share table if it has wrong schema (safe rebuild)
DO $$ 
BEGIN
  -- Check if ride_share exists but is missing created_by column
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ride_share')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_share' AND column_name = 'created_by')
  THEN
    DROP TABLE IF EXISTS ride_requests CASCADE;
    DROP TABLE IF EXISTS ride_share CASCADE;
  END IF;
END $$;

-- Main ride share table
CREATE TABLE IF NOT EXISTS ride_share (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('offer', 'request')),
  departure_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  seats_available INTEGER DEFAULT 1,
  seats_requested INTEGER DEFAULT 1,
  notes TEXT,
  event_id UUID,  -- Removed foreign key constraint for flexibility
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_days TEXT[], -- ['monday', 'wednesday', 'friday']
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'filled', 'cancelled', 'completed')),
  contact_preference TEXT DEFAULT 'in_app' CHECK (contact_preference IN ('in_app', 'phone', 'both'))
);

ALTER TABLE ride_share ENABLE ROW LEVEL SECURITY;

-- Ride share policies
DROP POLICY IF EXISTS "Active members can view rides" ON ride_share;
CREATE POLICY "Active members can view rides" ON ride_share
  FOR SELECT TO authenticated
  USING (
    status = 'active' AND
    departure_time > NOW() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Users can create rides" ON ride_share;
CREATE POLICY "Users can create rides" ON ride_share
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Users can update own rides" ON ride_share;
CREATE POLICY "Users can update own rides" ON ride_share
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own rides" ON ride_share;
CREATE POLICY "Users can delete own rides" ON ride_share
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Ride requests (passengers requesting to join a ride)
CREATE TABLE IF NOT EXISTS ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ride_id UUID REFERENCES ride_share(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seats_needed INTEGER DEFAULT 1,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  UNIQUE(ride_id, requested_by)
);

ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

-- Ride request policies
DROP POLICY IF EXISTS "Users can view own requests" ON ride_requests;
CREATE POLICY "Users can view own requests" ON ride_requests
  FOR SELECT TO authenticated
  USING (
    auth.uid() = requested_by OR
    EXISTS (SELECT 1 FROM ride_share WHERE id = ride_id AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create requests" ON ride_requests;
CREATE POLICY "Users can create requests" ON ride_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requested_by);

DROP POLICY IF EXISTS "Ride owners can update requests" ON ride_requests;
CREATE POLICY "Ride owners can update requests" ON ride_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM ride_share WHERE id = ride_id AND created_by = auth.uid())
  );

-- Indexes for ride share
CREATE INDEX IF NOT EXISTS idx_ride_share_departure_time ON ride_share(departure_time);
CREATE INDEX IF NOT EXISTS idx_ride_share_event_id ON ride_share(event_id);
CREATE INDEX IF NOT EXISTS idx_ride_share_status ON ride_share(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_ride_id ON ride_requests(ride_id);

-- =====================================================
-- DONE! Stories, Notifications, Announcements & RideShare ready.
-- =====================================================
