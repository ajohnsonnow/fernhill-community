-- =====================================================
-- ROADMAP & FEATURE TRACKING MIGRATION
-- =====================================================
-- Community Roadmap, Feature Requests, and Bug Tracking
-- Run in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. NEW TYPES
-- =====================================================
DO $$ BEGIN
  CREATE TYPE roadmap_status AS ENUM ('planned', 'in_progress', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE feature_status AS ENUM ('submitted', 'under_review', 'accepted', 'in_progress', 'completed', 'declined', 'duplicate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bug_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bug_status AS ENUM ('reported', 'confirmed', 'in_progress', 'fixed', 'wont_fix', 'cannot_reproduce');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE feature_category AS ENUM ('social', 'events', 'messaging', 'community', 'admin', 'mobile', 'accessibility', 'performance', 'security', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. ROADMAP ITEMS (Admin-managed public roadmap)
-- =====================================================
CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category feature_category NOT NULL DEFAULT 'other',
  status roadmap_status DEFAULT 'planned' NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher = more important
  target_quarter TEXT, -- e.g., "Q1 2026"
  release_version TEXT, -- e.g., "1.18.0"
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  upvotes INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  emoji TEXT DEFAULT '✨',
  related_feature_request_id UUID -- Links to original feature request
);

ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view roadmap" ON roadmap_items;
CREATE POLICY "Anyone can view roadmap" ON roadmap_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage roadmap" ON roadmap_items;
CREATE POLICY "Admins can manage roadmap" ON roadmap_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

-- =====================================================
-- 3. ROADMAP UPVOTES (Track who voted for what)
-- =====================================================
CREATE TABLE IF NOT EXISTS roadmap_upvotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  roadmap_item_id UUID REFERENCES roadmap_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(roadmap_item_id, user_id)
);

ALTER TABLE roadmap_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their votes" ON roadmap_upvotes;
CREATE POLICY "Users can manage their votes" ON roadmap_upvotes
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view upvotes" ON roadmap_upvotes;
CREATE POLICY "Anyone can view upvotes" ON roadmap_upvotes
  FOR SELECT USING (true);

-- =====================================================
-- 4. FEATURE REQUESTS (Community submitted)
-- =====================================================
CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category feature_category NOT NULL DEFAULT 'other',
  status feature_status DEFAULT 'submitted' NOT NULL,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  upvotes INTEGER DEFAULT 0,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  roadmap_item_id UUID REFERENCES roadmap_items(id) ON DELETE SET NULL, -- If promoted to roadmap
  is_demo BOOLEAN DEFAULT false -- For demo data flagging
);

ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active users can view feature requests" ON feature_requests;
CREATE POLICY "Active users can view feature requests" ON feature_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Users can submit feature requests" ON feature_requests;
CREATE POLICY "Users can submit feature requests" ON feature_requests
  FOR INSERT WITH CHECK (
    auth.uid() = submitted_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Admins can manage feature requests" ON feature_requests;
CREATE POLICY "Admins can manage feature requests" ON feature_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

-- =====================================================
-- 5. FEATURE REQUEST UPVOTES
-- =====================================================
CREATE TABLE IF NOT EXISTS feature_request_upvotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  feature_request_id UUID REFERENCES feature_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(feature_request_id, user_id)
);

ALTER TABLE feature_request_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their feature votes" ON feature_request_upvotes;
CREATE POLICY "Users can manage their feature votes" ON feature_request_upvotes
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view feature upvotes" ON feature_request_upvotes;
CREATE POLICY "Anyone can view feature upvotes" ON feature_request_upvotes
  FOR SELECT USING (true);

-- =====================================================
-- 6. BUG REPORTS (Enhanced from feedback table)
-- =====================================================
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  severity bug_severity DEFAULT 'medium' NOT NULL,
  status bug_status DEFAULT 'reported' NOT NULL,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  browser_info JSONB,
  console_logs TEXT,
  screenshot_url TEXT,
  affected_page TEXT,
  admin_notes TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  fixed_in_version TEXT,
  fixed_at TIMESTAMPTZ,
  is_demo BOOLEAN DEFAULT false -- For demo data flagging
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their bug reports" ON bug_reports;
CREATE POLICY "Users can view their bug reports" ON bug_reports
  FOR SELECT USING (
    auth.uid() = reported_by OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

DROP POLICY IF EXISTS "Users can submit bug reports" ON bug_reports;
CREATE POLICY "Users can submit bug reports" ON bug_reports
  FOR INSERT WITH CHECK (
    auth.uid() = reported_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Admins can manage bug reports" ON bug_reports;
CREATE POLICY "Admins can manage bug reports" ON bug_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

-- =====================================================
-- 7. FEATURE REQUEST COMMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS feature_request_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  feature_request_id UUID REFERENCES feature_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_admin_response BOOLEAN DEFAULT false
);

ALTER TABLE feature_request_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active users can view comments" ON feature_request_comments;
CREATE POLICY "Active users can view comments" ON feature_request_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Users can add comments" ON feature_request_comments;
CREATE POLICY "Users can add comments" ON feature_request_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Upvote/downvote roadmap item
CREATE OR REPLACE FUNCTION toggle_roadmap_upvote(item_id UUID)
RETURNS JSONB AS $$
DECLARE
  existing_vote UUID;
  new_count INTEGER;
BEGIN
  SELECT id INTO existing_vote 
  FROM roadmap_upvotes 
  WHERE roadmap_item_id = item_id AND user_id = auth.uid();
  
  IF existing_vote IS NOT NULL THEN
    DELETE FROM roadmap_upvotes WHERE id = existing_vote;
    UPDATE roadmap_items SET upvotes = GREATEST(0, upvotes - 1) WHERE id = item_id;
    SELECT upvotes INTO new_count FROM roadmap_items WHERE id = item_id;
    RETURN jsonb_build_object('action', 'removed', 'upvotes', new_count);
  ELSE
    INSERT INTO roadmap_upvotes (roadmap_item_id, user_id) VALUES (item_id, auth.uid());
    UPDATE roadmap_items SET upvotes = upvotes + 1 WHERE id = item_id;
    SELECT upvotes INTO new_count FROM roadmap_items WHERE id = item_id;
    RETURN jsonb_build_object('action', 'added', 'upvotes', new_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upvote/downvote feature request
CREATE OR REPLACE FUNCTION toggle_feature_request_upvote(request_id UUID)
RETURNS JSONB AS $$
DECLARE
  existing_vote UUID;
  new_count INTEGER;
BEGIN
  SELECT id INTO existing_vote 
  FROM feature_request_upvotes 
  WHERE feature_request_id = request_id AND user_id = auth.uid();
  
  IF existing_vote IS NOT NULL THEN
    DELETE FROM feature_request_upvotes WHERE id = existing_vote;
    UPDATE feature_requests SET upvotes = GREATEST(0, upvotes - 1) WHERE id = request_id;
    SELECT upvotes INTO new_count FROM feature_requests WHERE id = request_id;
    RETURN jsonb_build_object('action', 'removed', 'upvotes', new_count);
  ELSE
    INSERT INTO feature_request_upvotes (feature_request_id, user_id) VALUES (request_id, auth.uid());
    UPDATE feature_requests SET upvotes = upvotes + 1 WHERE id = request_id;
    SELECT upvotes INTO new_count FROM feature_requests WHERE id = request_id;
    RETURN jsonb_build_object('action', 'added', 'upvotes', new_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get roadmap stats
CREATE OR REPLACE FUNCTION get_roadmap_stats()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'planned', (SELECT COUNT(*) FROM roadmap_items WHERE status = 'planned'),
    'in_progress', (SELECT COUNT(*) FROM roadmap_items WHERE status = 'in_progress'),
    'completed', (SELECT COUNT(*) FROM roadmap_items WHERE status = 'completed'),
    'total_feature_requests', (SELECT COUNT(*) FROM feature_requests),
    'pending_requests', (SELECT COUNT(*) FROM feature_requests WHERE status = 'submitted'),
    'open_bugs', (SELECT COUNT(*) FROM bug_reports WHERE status IN ('reported', 'confirmed', 'in_progress')),
    'fixed_bugs', (SELECT COUNT(*) FROM bug_reports WHERE status = 'fixed')
  ) INTO stats;
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear demo data
CREATE OR REPLACE FUNCTION clear_demo_data()
RETURNS JSONB AS $$
DECLARE
  deleted_features INTEGER;
  deleted_bugs INTEGER;
  deleted_roadmap INTEGER;
BEGIN
  -- Delete demo feature requests and their upvotes (cascade)
  DELETE FROM feature_requests WHERE is_demo = true;
  GET DIAGNOSTICS deleted_features = ROW_COUNT;
  
  -- Delete demo bug reports
  DELETE FROM bug_reports WHERE is_demo = true;
  GET DIAGNOSTICS deleted_bugs = ROW_COUNT;
  
  -- Delete roadmap items linked to demo feature requests
  DELETE FROM roadmap_items WHERE related_feature_request_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM feature_requests WHERE id = roadmap_items.related_feature_request_id);
  GET DIAGNOSTICS deleted_roadmap = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'deleted_features', deleted_features,
    'deleted_bugs', deleted_bugs,
    'deleted_roadmap', deleted_roadmap
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_roadmap_items_status ON roadmap_items(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_category ON roadmap_items(category);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_category ON feature_requests(category);
CREATE INDEX IF NOT EXISTS idx_feature_requests_submitted_by ON feature_requests(submitted_by);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX IF NOT EXISTS idx_bug_reports_reported_by ON bug_reports(reported_by);

-- =====================================================
-- 10. UPDATE TIMESTAMP TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS roadmap_items_updated_at ON roadmap_items;
CREATE TRIGGER roadmap_items_updated_at
  BEFORE UPDATE ON roadmap_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS feature_requests_updated_at ON feature_requests;
CREATE TRIGGER feature_requests_updated_at
  BEFORE UPDATE ON feature_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS bug_reports_updated_at ON bug_reports;
CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Roadmap & Feature Tracking migration complete!';
  RAISE NOTICE 'Tables created: roadmap_items, roadmap_upvotes, feature_requests, feature_request_upvotes, bug_reports, feature_request_comments';
  RAISE NOTICE 'Functions: toggle_roadmap_upvote, toggle_feature_request_upvote, get_roadmap_stats, clear_demo_data';
END $$;
