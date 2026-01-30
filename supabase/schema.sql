-- =====================================================
-- FERNHILL TRIBE APP - COMPLETE DATABASE SCHEMA
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Custom Types
CREATE TYPE membership_status AS ENUM ('pending', 'active', 'facilitator', 'admin', 'banned');
CREATE TYPE vibe_status AS ENUM ('flowing', 'staccato', 'chaos', 'lyrical', 'stillness', 'open_to_dance', 'mycelial', 'offline');
CREATE TYPE post_category AS ENUM ('general', 'mutual_aid_offer', 'mutual_aid_request', 'gratitude', 'organizing');
CREATE TYPE feedback_type AS ENUM ('bug', 'feature', 'gratitude');

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Basic Info
  username TEXT UNIQUE,
  full_name TEXT,
  tribe_name TEXT,
  avatar_url TEXT,
  
  -- Status & Security
  status membership_status DEFAULT 'pending' NOT NULL,
  vibe_status vibe_status DEFAULT 'offline',
  
  -- Vetting Fields
  vouched_by_name TEXT,
  mycelial_gifts TEXT,
  
  -- Social Links
  soundcloud_url TEXT,
  website TEXT,
  
  -- E2EE Public Key (stored as base64)
  public_key TEXT,
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT tribe_name_required CHECK (
    (status = 'pending' AND tribe_name IS NOT NULL) OR 
    status != 'pending'
  )
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Profiles viewable by active members" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- EVENTS TABLE
-- =====================================================
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location_name TEXT NOT NULL,
  map_link TEXT,
  description TEXT,
  shifts JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by active members" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

CREATE POLICY "Only admins can create events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- =====================================================
-- POSTS TABLE (The Hearth)
-- =====================================================
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  category post_category NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  
  -- Auto-expiry for mutual aid posts
  expires_at TIMESTAMP WITH TIME ZONE,
  
  likes_count INTEGER DEFAULT 0,
  
  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000)
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable by active members" ON posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

CREATE POLICY "Active members can create posts" ON posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

-- Auto-set expires_at for mutual aid posts
CREATE OR REPLACE FUNCTION set_mutual_aid_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category IN ('mutual_aid_offer', 'mutual_aid_request') THEN
    NEW.expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_post_expiry
  BEFORE INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION set_mutual_aid_expiry();

-- =====================================================
-- MESSAGES TABLE (E2EE)
-- =====================================================
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  encrypted_content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- =====================================================
-- MUSIC SETS TABLE
-- =====================================================
CREATE TABLE music_sets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  dj_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  vibe_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  tracklist TEXT
);

ALTER TABLE music_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Music sets viewable by active members" ON music_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

CREATE POLICY "DJs can create music sets" ON music_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('facilitator', 'admin')
    )
  );

-- =====================================================
-- FEEDBACK TABLE
-- =====================================================
CREATE TABLE feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  type feedback_type NOT NULL,
  message TEXT NOT NULL
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can view feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- =====================================================
-- SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE system_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freeze_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default settings
INSERT INTO system_settings (freeze_mode) VALUES (FALSE);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view settings" ON system_settings FOR SELECT USING (true);

CREATE POLICY "Only admins can update settings" ON system_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- Run these in the Supabase Storage section:
-- 1. Create bucket 'avatars' (public)
-- 2. Create bucket 'altar_photos' (private)
-- 3. Create bucket 'post_images' (public)

-- =====================================================
-- CRON JOB: Purge expired data
-- =====================================================
CREATE OR REPLACE FUNCTION purge_expired_data()
RETURNS void AS $$
BEGIN
  -- Delete expired posts
  DELETE FROM posts WHERE expires_at < NOW();
  
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

-- Schedule the purge job (requires pg_cron extension)
-- Run every day at 3 AM UTC
SELECT cron.schedule('purge-expired-data', '0 3 * * *', 'SELECT purge_expired_data()');
