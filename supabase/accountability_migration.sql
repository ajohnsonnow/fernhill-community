-- =====================================================
-- ACCOUNTABILITY & SAFETY MIGRATION
-- =====================================================
-- Full reporting system, post comments, message reactions
-- Admin accountability tools for ultra-safe environment
-- =====================================================

-- =====================================================
-- 1. POST COMMENTS (Missing table!)
-- =====================================================
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  hidden_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  hidden_reason TEXT,
  edited_at TIMESTAMPTZ
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active users can view unhidden comments" ON post_comments;
CREATE POLICY "Active users can view unhidden comments" ON post_comments
  FOR SELECT USING (
    (is_hidden = false OR 
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator')))
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
CREATE POLICY "Users can create comments" ON post_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Users can update own comments" ON post_comments;
CREATE POLICY "Users can update own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all comments" ON post_comments;
CREATE POLICY "Admins can manage all comments" ON post_comments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);

-- =====================================================
-- 2. CONTENT REPORTS (Posts, Messages, Comments, Users)
-- =====================================================
DO $$ BEGIN
  CREATE TYPE report_type AS ENUM ('post', 'comment', 'message', 'user', 'event', 'listing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed', 'escalated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM (
    'harassment', 'spam', 'inappropriate_content', 'hate_speech', 
    'misinformation', 'privacy_violation', 'threatening_behavior',
    'impersonation', 'scam', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Who reported
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  
  -- What was reported
  report_type report_type NOT NULL,
  reported_content_id UUID NOT NULL, -- ID of the post/comment/message/user
  reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- The user who created the content
  
  -- Report details
  reason report_reason NOT NULL,
  description TEXT,
  screenshot_url TEXT,
  
  -- Admin handling
  status report_status DEFAULT 'pending' NOT NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  resolution TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  
  -- Action taken
  action_taken TEXT, -- 'warning_issued', 'content_removed', 'user_banned', etc.
  
  -- Metadata
  content_snapshot TEXT, -- Preserve the content at time of report
  browser_info JSONB
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit reports" ON content_reports;
CREATE POLICY "Users can submit reports" ON content_reports
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

DROP POLICY IF EXISTS "Users can view own reports" ON content_reports;
CREATE POLICY "Users can view own reports" ON content_reports
  FOR SELECT USING (
    auth.uid() = reporter_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

DROP POLICY IF EXISTS "Admins can manage reports" ON content_reports;
CREATE POLICY "Admins can manage reports" ON content_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_type ON content_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_user ON content_reports(reported_user_id);

-- =====================================================
-- 3. MESSAGE REACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their message reactions" ON message_reactions;
CREATE POLICY "Users can manage their message reactions" ON message_reactions
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Conversation participants can view reactions" ON message_reactions;
CREATE POLICY "Conversation participants can view reactions" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.id = message_id 
      AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);

-- =====================================================
-- 4. GROUP MESSAGE REACTIONS (Deferred - requires group_messages table)
-- =====================================================
-- NOTE: Group messaging not yet implemented. This section will be enabled
-- when group_messages and group_members tables are created.
-- 
-- To enable later, run:
-- CREATE TABLE IF NOT EXISTS group_message_reactions (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
--   message_id UUID REFERENCES group_messages(id) ON DELETE CASCADE NOT NULL,
--   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
--   emoji TEXT NOT NULL,
--   UNIQUE(message_id, user_id, emoji)
-- );
-- ALTER TABLE group_message_reactions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Group members can manage reactions" ON group_message_reactions
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM group_messages gm
--       JOIN group_members gme ON gme.group_id = gm.group_id  
--       WHERE gm.id = message_id AND gme.user_id = auth.uid()
--     )
--   );
-- CREATE INDEX IF NOT EXISTS idx_group_message_reactions_message ON group_message_reactions(message_id);

-- =====================================================
-- 5. COMMENT REACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  UNIQUE(comment_id, user_id, emoji)
);

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage comment reactions" ON comment_reactions;
CREATE POLICY "Users can manage comment reactions" ON comment_reactions
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Active users can view comment reactions" ON comment_reactions;
CREATE POLICY "Active users can view comment reactions" ON comment_reactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('active', 'facilitator', 'admin'))
  );

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);

-- =====================================================
-- 6. USER WARNINGS (Admin accountability)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_warnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  issued_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  reason TEXT NOT NULL,
  severity INTEGER DEFAULT 1 CHECK (severity BETWEEN 1 AND 3), -- 1=mild, 2=moderate, 3=severe
  related_report_id UUID REFERENCES content_reports(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ, -- Warnings can expire
  is_active BOOLEAN DEFAULT true,
  acknowledged_at TIMESTAMPTZ -- When user acknowledged the warning
);

ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own warnings" ON user_warnings;
CREATE POLICY "Users can view own warnings" ON user_warnings
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

DROP POLICY IF EXISTS "Admins can manage warnings" ON user_warnings;
CREATE POLICY "Admins can manage warnings" ON user_warnings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status IN ('admin', 'facilitator'))
  );

CREATE INDEX IF NOT EXISTS idx_user_warnings_user ON user_warnings(user_id);

-- =====================================================
-- 7. BOOKMARKS (Wire up bookmark functionality)
-- =====================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(user_id, post_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own bookmarks" ON bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

-- =====================================================
-- 8. ADMIN AUDIT LOG ENHANCEMENTS
-- =====================================================
-- Make sure audit_logs captures all admin actions
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS target_content_id UUID,
ADD COLUMN IF NOT EXISTS target_content_type TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Report content function
CREATE OR REPLACE FUNCTION report_content(
  p_content_type report_type,
  p_content_id UUID,
  p_reported_user_id UUID,
  p_reason report_reason,
  p_description TEXT DEFAULT NULL,
  p_content_snapshot TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_report_id UUID;
BEGIN
  INSERT INTO content_reports (
    reporter_id,
    report_type,
    reported_content_id,
    reported_user_id,
    reason,
    description,
    content_snapshot
  ) VALUES (
    auth.uid(),
    p_content_type,
    p_content_id,
    p_reported_user_id,
    p_reason,
    p_description,
    p_content_snapshot
  ) RETURNING id INTO new_report_id;
  
  RETURN new_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get report statistics
CREATE OR REPLACE FUNCTION get_report_stats()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total', (SELECT COUNT(*) FROM content_reports),
    'pending', (SELECT COUNT(*) FROM content_reports WHERE status = 'pending'),
    'reviewing', (SELECT COUNT(*) FROM content_reports WHERE status = 'reviewing'),
    'resolved', (SELECT COUNT(*) FROM content_reports WHERE status = 'resolved'),
    'dismissed', (SELECT COUNT(*) FROM content_reports WHERE status = 'dismissed'),
    'escalated', (SELECT COUNT(*) FROM content_reports WHERE status = 'escalated'),
    'by_type', (
      SELECT jsonb_object_agg(report_type, cnt)
      FROM (SELECT report_type, COUNT(*) as cnt FROM content_reports GROUP BY report_type) sub
    ),
    'today', (SELECT COUNT(*) FROM content_reports WHERE created_at > NOW() - INTERVAL '24 hours'),
    'this_week', (SELECT COUNT(*) FROM content_reports WHERE created_at > NOW() - INTERVAL '7 days')
  ) INTO stats;
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resolve a report with action
CREATE OR REPLACE FUNCTION resolve_report(
  p_report_id UUID,
  p_resolution TEXT,
  p_action_taken TEXT DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE content_reports SET
    status = 'resolved',
    resolution = p_resolution,
    action_taken = p_action_taken,
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    resolved_by = auth.uid(),
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_report_id;
  
  -- Log the action
  INSERT INTO audit_logs (admin_id, action, details, target_content_id, target_content_type)
  VALUES (auth.uid(), 'resolve_report', jsonb_build_object(
    'report_id', p_report_id,
    'resolution', p_resolution,
    'action_taken', p_action_taken
  ), p_report_id, 'content_report');
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Issue warning to user
CREATE OR REPLACE FUNCTION issue_warning(
  p_user_id UUID,
  p_reason TEXT,
  p_severity INTEGER DEFAULT 1,
  p_report_id UUID DEFAULT NULL,
  p_expires_days INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  warning_id UUID;
  expires TIMESTAMPTZ;
BEGIN
  IF p_expires_days IS NOT NULL THEN
    expires := NOW() + (p_expires_days || ' days')::INTERVAL;
  END IF;
  
  INSERT INTO user_warnings (user_id, issued_by, reason, severity, related_report_id, expires_at)
  VALUES (p_user_id, auth.uid(), p_reason, p_severity, p_report_id, expires)
  RETURNING id INTO warning_id;
  
  -- Log the action
  INSERT INTO audit_logs (admin_id, action, details, target_user_id)
  VALUES (auth.uid(), 'issue_warning', jsonb_build_object(
    'warning_id', warning_id,
    'reason', p_reason,
    'severity', p_severity
  ), p_user_id);
  
  RETURN warning_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle bookmark
CREATE OR REPLACE FUNCTION toggle_bookmark(p_post_id UUID)
RETURNS JSONB AS $$
DECLARE
  existing_id UUID;
BEGIN
  SELECT id INTO existing_id FROM bookmarks 
  WHERE user_id = auth.uid() AND post_id = p_post_id;
  
  IF existing_id IS NOT NULL THEN
    DELETE FROM bookmarks WHERE id = existing_id;
    RETURN jsonb_build_object('action', 'removed');
  ELSE
    INSERT INTO bookmarks (user_id, post_id) VALUES (auth.uid(), p_post_id);
    RETURN jsonb_build_object('action', 'added');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle message reaction
CREATE OR REPLACE FUNCTION toggle_message_reaction(p_message_id UUID, p_emoji TEXT)
RETURNS JSONB AS $$
DECLARE
  existing_id UUID;
BEGIN
  SELECT id INTO existing_id FROM message_reactions 
  WHERE message_id = p_message_id AND user_id = auth.uid() AND emoji = p_emoji;
  
  IF existing_id IS NOT NULL THEN
    DELETE FROM message_reactions WHERE id = existing_id;
    RETURN jsonb_build_object('action', 'removed', 'emoji', p_emoji);
  ELSE
    INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (p_message_id, auth.uid(), p_emoji);
    RETURN jsonb_build_object('action', 'added', 'emoji', p_emoji);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle group message reaction (Deferred - requires group_messages table)
-- CREATE OR REPLACE FUNCTION toggle_group_message_reaction(p_message_id UUID, p_emoji TEXT)
-- RETURNS JSONB AS $$
-- DECLARE
--   existing_id UUID;
-- BEGIN
--   SELECT id INTO existing_id FROM group_message_reactions 
--   WHERE message_id = p_message_id AND user_id = auth.uid() AND emoji = p_emoji;
--   
--   IF existing_id IS NOT NULL THEN
--     DELETE FROM group_message_reactions WHERE id = existing_id;
--     RETURN jsonb_build_object('action', 'removed', 'emoji', p_emoji);
--   ELSE
--     INSERT INTO group_message_reactions (message_id, user_id, emoji) VALUES (p_message_id, auth.uid(), p_emoji);
--     RETURN jsonb_build_object('action', 'added', 'emoji', p_emoji);
--   END IF;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle comment reaction  
CREATE OR REPLACE FUNCTION toggle_comment_reaction(p_comment_id UUID, p_emoji TEXT)
RETURNS JSONB AS $$
DECLARE
  existing_id UUID;
BEGIN
  SELECT id INTO existing_id FROM comment_reactions 
  WHERE comment_id = p_comment_id AND user_id = auth.uid() AND emoji = p_emoji;
  
  IF existing_id IS NOT NULL THEN
    DELETE FROM comment_reactions WHERE id = existing_id;
    RETURN jsonb_build_object('action', 'removed', 'emoji', p_emoji);
  ELSE
    INSERT INTO comment_reactions (comment_id, user_id, emoji) VALUES (p_comment_id, auth.uid(), p_emoji);
    RETURN jsonb_build_object('action', 'added', 'emoji', p_emoji);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Accountability & Safety migration complete!';
  RAISE NOTICE 'Tables: post_comments, content_reports, message_reactions, comment_reactions, user_warnings, bookmarks';
  RAISE NOTICE 'Deferred: group_message_reactions (requires group_messages table)';
  RAISE NOTICE 'Functions: report_content, get_report_stats, resolve_report, issue_warning, toggle_bookmark, toggle_message_reaction, toggle_comment_reaction';
END $$;
