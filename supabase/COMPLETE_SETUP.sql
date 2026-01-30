-- =====================================================
-- FERNHILL COMPLETE DATABASE SETUP
-- =====================================================
-- Run this ONCE in Supabase SQL Editor to set up ALL features
-- This is idempotent - safe to run multiple times
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. CUSTOM TYPES (skip if exists)
-- =====================================================
DO $$ BEGIN
  CREATE TYPE membership_status AS ENUM ('pending', 'active', 'facilitator', 'admin', 'banned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vibe_status AS ENUM ('flowing', 'staccato', 'chaos', 'lyrical', 'stillness', 'open_to_dance', 'mycelial', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE post_category AS ENUM ('general', 'mutual_aid_offer', 'mutual_aid_request', 'gratitude', 'organizing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE feedback_type AS ENUM ('bug', 'feature', 'gratitude');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 3. CORE TABLES
-- =====================================================

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  tribe_name TEXT,
  avatar_url TEXT,
  status membership_status DEFAULT 'pending' NOT NULL,
  vibe_status vibe_status DEFAULT 'offline',
  vouched_by_name TEXT,
  mycelial_gifts TEXT,
  soundcloud_url TEXT,
  website TEXT,
  public_key TEXT,
  show_in_directory BOOLEAN DEFAULT true,
  requires_review BOOLEAN DEFAULT true
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profile policies
DROP POLICY IF EXISTS "Profiles viewable by active members" ON profiles;
CREATE POLICY "Profiles viewable by active members" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- POSTS
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category post_category NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  expires_at TIMESTAMPTZ,
  likes_count INTEGER DEFAULT 0
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts viewable by active members" ON posts;
CREATE POLICY "Posts viewable by active members" ON posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Active members can create posts" ON posts;
CREATE POLICY "Active members can create posts" ON posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins can delete any post" ON posts;
CREATE POLICY "Admins can delete any post" ON posts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location_name TEXT NOT NULL,
  map_link TEXT,
  description TEXT,
  shifts JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events viewable by active members" ON events;
CREATE POLICY "Events viewable by active members" ON events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

-- MESSAGES (E2EE)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  encrypted_content TEXT NOT NULL,
  sender_public_key TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() IN (sender_id, recipient_id));

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- FEEDBACK
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type feedback_type NOT NULL,
  message TEXT NOT NULL,
  browser_info JSONB,
  console_logs TEXT
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit feedback" ON feedback;
CREATE POLICY "Users can submit feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

-- =====================================================
-- 4. SOCIAL FEATURES
-- =====================================================

-- POST REACTIONS
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  UNIQUE(post_id, user_id, emoji)
);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON post_reactions;
CREATE POLICY "Anyone can view reactions" ON post_reactions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can add reactions" ON post_reactions;
CREATE POLICY "Users can add reactions" ON post_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own reactions" ON post_reactions;
CREATE POLICY "Users can remove own reactions" ON post_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);

-- EVENT RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  google_event_id TEXT,
  internal_event_id UUID,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  message TEXT,
  UNIQUE(google_event_id, user_id),
  UNIQUE(internal_event_id, user_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view RSVPs" ON event_rsvps;
CREATE POLICY "Anyone can view RSVPs" ON event_rsvps
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can RSVP" ON event_rsvps;
CREATE POLICY "Users can RSVP" ON event_rsvps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own RSVP" ON event_rsvps;
CREATE POLICY "Users can update own RSVP" ON event_rsvps
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own RSVP" ON event_rsvps;
CREATE POLICY "Users can remove own RSVP" ON event_rsvps
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_google ON event_rsvps(google_event_id);

-- POLLS
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  allow_multiple BOOLEAN DEFAULT FALSE,
  anonymous BOOLEAN DEFAULT FALSE,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_pinned BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'general'
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  option_id TEXT NOT NULL,
  UNIQUE(poll_id, user_id, option_id)
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active polls" ON polls;
CREATE POLICY "Anyone can view active polls" ON polls
  FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage polls" ON polls;
CREATE POLICY "Admins can manage polls" ON polls
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

DROP POLICY IF EXISTS "Anyone can view votes" ON poll_votes;
CREATE POLICY "Anyone can view votes" ON poll_votes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can vote" ON poll_votes;
CREATE POLICY "Users can vote" ON poll_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can change vote" ON poll_votes;
CREATE POLICY "Users can change vote" ON poll_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- BADGES
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  emoji TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  requirement_type TEXT,
  requirement_count INT
);

CREATE TABLE IF NOT EXISTS member_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  awarded_by UUID REFERENCES profiles(id),
  reason TEXT,
  UNIQUE(user_id, badge_id)
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view badges" ON badges;
CREATE POLICY "Anyone can view badges" ON badges
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can create badges" ON badges;
CREATE POLICY "Admins can create badges" ON badges
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

DROP POLICY IF EXISTS "Anyone can view member badges" ON member_badges;
CREATE POLICY "Anyone can view member badges" ON member_badges
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can award badges" ON member_badges;
CREATE POLICY "Admins can award badges" ON member_badges
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

-- =====================================================
-- 5. ADMIN & MODERATION
-- =====================================================

-- EVENT SUBMISSIONS
CREATE TABLE IF NOT EXISTS event_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  proposed_date TIMESTAMPTZ NOT NULL,
  proposed_location TEXT NOT NULL,
  location_address TEXT,
  event_type TEXT DEFAULT 'community' CHECK (event_type IN ('dance', 'workshop', 'gathering', 'community', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit events" ON event_submissions;
CREATE POLICY "Users can submit events" ON event_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own submissions" ON event_submissions;
CREATE POLICY "Users can view own submissions" ON event_submissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all submissions" ON event_submissions;
CREATE POLICY "Admins can view all submissions" ON event_submissions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update submissions" ON event_submissions;
CREATE POLICY "Admins can update submissions" ON event_submissions
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON event_submissions(status);

-- CONTENT QUEUE (for moderation)
CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL,
  content_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit content to queue" ON content_queue;
CREATE POLICY "Users can submit content to queue" ON content_queue
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own queue items" ON content_queue;
CREATE POLICY "Users can view own queue items" ON content_queue
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all queue items" ON content_queue;
CREATE POLICY "Admins can view all queue items" ON content_queue
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update queue items" ON content_queue;
CREATE POLICY "Admins can update queue items" ON content_queue
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

DROP POLICY IF EXISTS "Admins can create audit logs" ON audit_logs;
CREATE POLICY "Admins can create audit logs" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

-- SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freeze_mode BOOLEAN DEFAULT FALSE,
  keyword_filters TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read settings" ON system_settings;
CREATE POLICY "Anyone can read settings" ON system_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can update settings" ON system_settings;
CREATE POLICY "Admins can update settings" ON system_settings
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

-- Insert default settings if not exists
INSERT INTO system_settings (freeze_mode, keyword_filters)
SELECT FALSE, ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM system_settings);

-- =====================================================
-- 6. ADDITIONAL FEATURES
-- =====================================================

-- ALTAR POSTS (Photo Gallery)
CREATE TABLE IF NOT EXISTS altar_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  likes_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

ALTER TABLE altar_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Altar posts viewable by active members" ON altar_posts;
CREATE POLICY "Altar posts viewable by active members" ON altar_posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Active members can create altar posts" ON altar_posts;
CREATE POLICY "Active members can create altar posts" ON altar_posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Users can delete own altar posts" ON altar_posts;
CREATE POLICY "Users can delete own altar posts" ON altar_posts
  FOR DELETE USING (auth.uid() = author_id);

-- PUSH SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription JSONB NOT NULL
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- MUSIC SETS
CREATE TABLE IF NOT EXISTS music_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  dj_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  vibe_tags TEXT[],
  tracklist TEXT
);

ALTER TABLE music_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view music sets" ON music_sets;
CREATE POLICY "Anyone can view music sets" ON music_sets
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "DJs can add music sets" ON music_sets;
CREATE POLICY "DJs can add music sets" ON music_sets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = dj_id);

-- CUSTOM VIBE TAGS
CREATE TABLE IF NOT EXISTS custom_vibe_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL,
  category TEXT DEFAULT 'custom',
  suggested_by UUID REFERENCES profiles(id),
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ
);

ALTER TABLE custom_vibe_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved tags" ON custom_vibe_tags;
CREATE POLICY "Anyone can view approved tags" ON custom_vibe_tags
  FOR SELECT TO authenticated USING (is_approved = true);

-- =====================================================
-- 7. STORAGE BUCKETS & POLICIES (Private buckets with RLS)
-- =====================================================
-- Go to Supabase Dashboard > Storage and create these PRIVATE buckets:
-- 1. "avatars" bucket - Private (not public)
-- 2. "post_images" bucket - Private (not public)  
-- 3. "altar_photos" bucket - Private (not public)

-- STORAGE RLS POLICIES
-- These allow authenticated users to read files and owners to upload/delete

-- AVATARS BUCKET POLICIES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
CREATE POLICY "Authenticated users can view avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- POST_IMAGES BUCKET POLICIES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post_images', 'post_images', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can view post images" ON storage.objects;
CREATE POLICY "Authenticated users can view post images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'post_images');

DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
CREATE POLICY "Users can upload post images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post_images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own post images" ON storage.objects;
CREATE POLICY "Users can delete own post images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'post_images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ALTAR_PHOTOS BUCKET POLICIES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('altar_photos', 'altar_photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can view altar photos" ON storage.objects;
CREATE POLICY "Authenticated users can view altar photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'altar_photos');

DROP POLICY IF EXISTS "Users can upload altar photos" ON storage.objects;
CREATE POLICY "Users can upload altar photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'altar_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own altar photos" ON storage.objects;
CREATE POLICY "Users can delete own altar photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'altar_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- 8. AUTO-CREATE PROFILE FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- DONE! All features are now wired up.
-- =====================================================
