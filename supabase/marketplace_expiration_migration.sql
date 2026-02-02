-- =====================================================
-- MARKETPLACE POST EXPIRATION SYSTEM
-- Phase K: Post Expiration & Bump Feature
-- =====================================================

-- =====================================================
-- ADD EXPIRATION & BUMP COLUMNS TO BOARD_POSTS
-- =====================================================

-- Add expiration column
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add bump tracking
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS bump_count INTEGER DEFAULT 0;
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS last_bumped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS max_bumps INTEGER DEFAULT 3;

-- Add marketplace-specific fields
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS condition TEXT;
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS contact_preference TEXT DEFAULT 'messages';
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Add board configuration for expiration
ALTER TABLE boards ADD COLUMN IF NOT EXISTS expires_in_days INTEGER;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS is_marketplace BOOLEAN DEFAULT FALSE;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS allow_bumps BOOLEAN DEFAULT TRUE;

-- =====================================================
-- BUMP HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS post_bumps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  post_id UUID REFERENCES board_posts(id) ON DELETE CASCADE NOT NULL,
  bumped_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  previous_expires_at TIMESTAMP WITH TIME ZONE,
  new_expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE post_bumps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bump history" ON post_bumps
  FOR SELECT USING (
    bumped_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM board_posts bp
      WHERE bp.id = post_id AND bp.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can bump own posts" ON post_bumps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_posts bp
      WHERE bp.id = post_id AND bp.author_id = auth.uid()
    )
  );

-- =====================================================
-- ADD MARKETPLACE BOARDS
-- =====================================================
INSERT INTO boards (slug, name, description, is_featured, is_marketplace, expires_in_days, allow_bumps, sort_order) VALUES
  ('free-stuff', '🎁 Free Stuff', 'Share items you want to give away to the tribe. Posts expire in 7 days.', TRUE, TRUE, 7, TRUE, 10),
  ('yard-sale', '🏷️ Yard Sale', 'Buy and sell items within the community. Posts expire in 14 days.', TRUE, TRUE, 14, TRUE, 11),
  ('housing', '🏠 Housing', 'Room shares, sublets, and housing opportunities. Posts expire in 30 days.', FALSE, TRUE, 30, TRUE, 12),
  ('services', '🛠️ Services', 'Offer or seek services (massage, art, lessons, etc). Posts expire in 30 days.', FALSE, TRUE, 30, TRUE, 13),
  ('rideshare', '🚗 Ride Share', 'Find rides to dances and events. Posts expire in 7 days.', TRUE, TRUE, 7, TRUE, 14),
  ('lost-found', '🔍 Lost & Found', 'Reunite items with their owners. Posts expire in 30 days.', FALSE, TRUE, 30, TRUE, 15)
ON CONFLICT (slug) DO UPDATE SET
  is_marketplace = EXCLUDED.is_marketplace,
  expires_in_days = EXCLUDED.expires_in_days,
  allow_bumps = EXCLUDED.allow_bumps;

-- =====================================================
-- FUNCTION: Set Post Expiration on Insert
-- =====================================================
CREATE OR REPLACE FUNCTION set_post_expiration()
RETURNS TRIGGER AS $$
DECLARE
  board_expires_days INTEGER;
BEGIN
  -- Get the expiration days from the board
  SELECT expires_in_days INTO board_expires_days
  FROM boards WHERE id = NEW.board_id;
  
  -- If board has expiration, set expires_at
  IF board_expires_days IS NOT NULL THEN
    NEW.expires_at := NOW() + (board_expires_days || ' days')::interval;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_set_expiration ON board_posts;
CREATE TRIGGER on_post_set_expiration
  BEFORE INSERT ON board_posts
  FOR EACH ROW EXECUTE FUNCTION set_post_expiration();

-- =====================================================
-- FUNCTION: Bump Post
-- =====================================================
CREATE OR REPLACE FUNCTION bump_post(post_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  post_record RECORD;
  board_record RECORD;
  result JSONB;
BEGIN
  -- Get post details
  SELECT * INTO post_record FROM board_posts WHERE id = post_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post not found');
  END IF;
  
  -- Check if user owns the post
  IF post_record.author_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'You can only bump your own posts');
  END IF;
  
  -- Get board details
  SELECT * INTO board_record FROM boards WHERE id = post_record.board_id;
  
  -- Check if bumping is allowed
  IF NOT COALESCE(board_record.allow_bumps, true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bumping is not allowed on this board');
  END IF;
  
  -- Check bump limit
  IF post_record.bump_count >= COALESCE(post_record.max_bumps, 3) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Maximum bumps reached (3 per post)');
  END IF;
  
  -- Calculate new expiration
  DECLARE
    new_expires_at TIMESTAMP WITH TIME ZONE;
    days_to_add INTEGER;
  BEGIN
    days_to_add := COALESCE(board_record.expires_in_days, 7);
    new_expires_at := NOW() + (days_to_add || ' days')::interval;
    
    -- Record the bump
    INSERT INTO post_bumps (post_id, bumped_by, previous_expires_at, new_expires_at)
    VALUES (post_id_param, auth.uid(), post_record.expires_at, new_expires_at);
    
    -- Update the post
    UPDATE board_posts
    SET 
      expires_at = new_expires_at,
      bump_count = bump_count + 1,
      last_bumped_at = NOW(),
      last_activity_at = NOW(),
      status = 'active'
    WHERE id = post_id_param;
    
    -- Update board activity
    UPDATE boards
    SET last_activity_at = NOW()
    WHERE id = post_record.board_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Post bumped successfully',
      'new_expires_at', new_expires_at,
      'bumps_remaining', COALESCE(post_record.max_bumps, 3) - post_record.bump_count - 1
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Mark Expired Posts
-- =====================================================
CREATE OR REPLACE FUNCTION mark_expired_posts()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE board_posts
  SET status = 'expired'
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND status = 'active';
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW: Active Posts Only
-- =====================================================
CREATE OR REPLACE VIEW active_board_posts AS
SELECT bp.*
FROM board_posts bp
WHERE bp.status = 'active'
  AND (bp.expires_at IS NULL OR bp.expires_at > NOW());

-- =====================================================
-- VIEW: Expired Posts Needing Attention
-- =====================================================
CREATE OR REPLACE VIEW expired_posts AS
SELECT 
  bp.*,
  p.tribe_name as author_name,
  b.name as board_name,
  bp.max_bumps - bp.bump_count as bumps_remaining
FROM board_posts bp
JOIN profiles p ON bp.author_id = p.id
JOIN boards b ON bp.board_id = b.id
WHERE bp.expires_at IS NOT NULL
  AND bp.expires_at < NOW()
  AND bp.bump_count < COALESCE(bp.max_bumps, 3);

-- =====================================================
-- INDEX FOR EXPIRATION QUERIES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_board_posts_expires_at ON board_posts(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_board_posts_status ON board_posts(status);
CREATE INDEX IF NOT EXISTS idx_board_posts_marketplace ON board_posts(board_id, status, expires_at);
