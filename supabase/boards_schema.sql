-- =====================================================
-- DISCUSSION BOARDS EXTENSION
-- =====================================================

-- =====================================================
-- BOARDS TABLE
-- =====================================================
CREATE TABLE boards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  
  post_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Boards viewable by active members" ON boards
  FOR SELECT USING (
    is_active = TRUE AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

CREATE POLICY "Only admins can manage boards" ON boards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- =====================================================
-- BOARD POSTS TABLE
-- =====================================================
CREATE TABLE board_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  is_pinned BOOLEAN DEFAULT FALSE,
  reply_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  CONSTRAINT title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000)
);

ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board posts viewable by active members" ON board_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

CREATE POLICY "Active members can create board posts" ON board_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

CREATE POLICY "Authors can edit own posts" ON board_posts
  FOR UPDATE USING (auth.uid() = author_id);

-- =====================================================
-- REPLIES TABLE
-- =====================================================
CREATE TABLE replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  post_id UUID REFERENCES board_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000)
);

ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies viewable by active members" ON replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

CREATE POLICY "Active members can create replies" ON replies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

-- =====================================================
-- BOARD REQUESTS TABLE
-- =====================================================
CREATE TYPE board_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE board_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  reason TEXT NOT NULL,
  
  status board_request_status DEFAULT 'pending' NOT NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  CONSTRAINT description_length CHECK (char_length(description) <= 500),
  CONSTRAINT reason_length CHECK (char_length(reason) <= 1000)
);

ALTER TABLE board_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON board_requests
  FOR SELECT USING (
    auth.uid() = requester_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

CREATE POLICY "Active members can create board requests" ON board_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin')
    )
  );

CREATE POLICY "Only admins can update requests" ON board_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- =====================================================
-- TRIGGERS: Auto-increment counters
-- =====================================================

-- Update board post_count when a post is created
CREATE OR REPLACE FUNCTION increment_board_post_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE boards
  SET post_count = post_count + 1,
      last_activity_at = NOW()
  WHERE id = NEW.board_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_board_post_created
  AFTER INSERT ON board_posts
  FOR EACH ROW EXECUTE FUNCTION increment_board_post_count();

-- Update post reply_count when a reply is created
CREATE OR REPLACE FUNCTION increment_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE board_posts
  SET reply_count = reply_count + 1,
      last_activity_at = NOW()
  WHERE id = NEW.post_id;
  
  -- Also update board activity
  UPDATE boards
  SET last_activity_at = NOW()
  WHERE id = (SELECT board_id FROM board_posts WHERE id = NEW.post_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_reply_created
  AFTER INSERT ON replies
  FOR EACH ROW EXECUTE FUNCTION increment_post_reply_count();

-- =====================================================
-- DEFAULT BOARDS
-- =====================================================
INSERT INTO boards (slug, name, description, is_featured, sort_order) VALUES
  ('introductions', 'Introductions', 'Welcome new tribe members! Share your story and what brings you to ecstatic dance.', TRUE, 1),
  ('dance-journeys', 'Dance Journeys', 'Share your experiences, breakthroughs, and reflections from the dance floor.', TRUE, 2),
  ('events-gatherings', 'Events & Gatherings', 'Discuss upcoming dances, workshops, and community gatherings.', TRUE, 3),
  ('music-vibes', 'Music & Vibes', 'Share playlists, discuss DJs, and explore the sonic landscape of ecstatic dance.', FALSE, 4),
  ('movement-practices', 'Movement Practices', 'Yoga, breathwork, contact improv, and other body-based practices.', FALSE, 5),
  ('community-care', 'Community Care', 'Discuss consent culture, conflict resolution, and keeping our space sacred.', FALSE, 6),
  ('off-topic', 'Off-Topic Lounge', 'General discussion about life, the universe, and everything else.', FALSE, 7),
  ('feedback-ideas', 'Feedback & Ideas', 'Suggest improvements to the community, app, or event formats.', FALSE, 8);
