-- =====================================================
-- SOCIAL FEATURES MIGRATION
-- Best-in-class community app features
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. EMOJI REACTIONS (multi-reaction system like Slack/Discord)
-- =====================================================
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL, -- e.g., '❤️', '🔥', '🙏', '💃', '✨'
  UNIQUE(post_id, user_id, emoji) -- One reaction type per user per post
);

-- RLS for reactions
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions" ON post_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can add reactions" ON post_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON post_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);


-- 2. EVENT RSVPs (for event attendance tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Either Google Calendar event ID or internal event ID
  google_event_id TEXT,
  internal_event_id UUID,
  
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  
  -- Optional message
  message TEXT,
  
  UNIQUE(google_event_id, user_id),
  UNIQUE(internal_event_id, user_id)
);

-- RLS for RSVPs
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view RSVPs" ON event_rsvps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can RSVP" ON event_rsvps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RSVP" ON event_rsvps
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can remove own RSVP" ON event_rsvps
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_rsvps_google ON event_rsvps(google_event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user ON event_rsvps(user_id);


-- 3. COMMUNITY POLLS (for gathering community input)
-- =====================================================
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT '[]', -- Array of {id, text} objects
  
  -- Poll settings
  allow_multiple BOOLEAN DEFAULT FALSE,
  anonymous BOOLEAN DEFAULT FALSE,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Visibility
  is_pinned BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'general' -- general, event, feedback, etc.
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  option_id TEXT NOT NULL, -- References option.id from polls.options
  UNIQUE(poll_id, user_id, option_id)
);

-- RLS for polls
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active polls" ON polls
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can create polls" ON polls
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

CREATE POLICY "Admins can update polls" ON polls
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

CREATE POLICY "Anyone can view votes" ON poll_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can vote" ON poll_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change vote" ON poll_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 4. MEMBER BADGES & ACHIEVEMENTS (gamification)
-- =====================================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  emoji TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- participation, contribution, special
  
  -- Requirements (nullable - can be manually awarded)
  requirement_type TEXT, -- 'dances_attended', 'posts_created', 'dj_sets', 'manual'
  requirement_count INT
);

CREATE TABLE IF NOT EXISTS member_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  awarded_by UUID REFERENCES profiles(id), -- NULL if automatic
  reason TEXT, -- Optional reason for manual awards
  UNIQUE(user_id, badge_id)
);

-- RLS for badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON badges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can create badges" ON badges
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

CREATE POLICY "Anyone can view member badges" ON member_badges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can award badges" ON member_badges
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );


-- 5. ATTENDANCE TRACKING (for badge automation)
-- =====================================================
CREATE TABLE IF NOT EXISTS event_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  event_date DATE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  checked_in_by UUID REFERENCES profiles(id), -- Who checked them in (facilitator/self)
  
  -- Optional notes
  notes TEXT,
  
  UNIQUE(event_date, user_id)
);

ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins" ON event_checkins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all checkins" ON event_checkins
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

CREATE POLICY "Admins can create checkins" ON event_checkins
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );


-- 6. SEED DEFAULT BADGES
-- =====================================================
INSERT INTO badges (name, description, emoji, category, requirement_type, requirement_count) VALUES
  ('First Dance', 'Attended your first Fernhill dance', '💃', 'participation', 'dances_attended', 1),
  ('Regular Dancer', 'Attended 10 dances', '🌟', 'participation', 'dances_attended', 10),
  ('Dance Devotee', 'Attended 25 dances', '🔥', 'participation', 'dances_attended', 25),
  ('Century Dancer', 'Attended 100 dances', '👑', 'participation', 'dances_attended', 100),
  
  ('Community Voice', 'Shared 10 posts in the Hearth', '📢', 'contribution', 'posts_created', 10),
  ('Helpful Heart', 'Offered mutual aid 5 times', '💝', 'contribution', NULL, NULL),
  ('Photo Keeper', 'Shared photos on the Altar', '📸', 'contribution', NULL, NULL),
  
  ('DJ Debut', 'Played your first set', '🎧', 'special', 'dj_sets', 1),
  ('Sound Shaman', 'Played 5 DJ sets', '🎵', 'special', 'dj_sets', 5),
  ('Founding Member', 'Joined during our first year', '🌱', 'special', 'manual', NULL),
  ('Event Organizer', 'Helped organize a community event', '🎪', 'special', 'manual', NULL)
ON CONFLICT (name) DO NOTHING;


-- 7. ADD FEATURED/HIGHLIGHTED MEMBERS (optional showcase)
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS featured_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dance_count INT DEFAULT 0;
