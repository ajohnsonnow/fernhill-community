-- =====================================================
-- CONTENT MODERATION SYSTEM MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add requires_review field to profiles
-- All new users default to TRUE (always review)
-- Admins can set to FALSE for trusted posters
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT TRUE;

-- Update existing active/facilitator/admin users to trusted (no review needed)
UPDATE profiles 
SET requires_review = FALSE 
WHERE status IN ('admin', 'facilitator');

-- 2. Create content queue table for pending submissions
CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Who submitted
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content type: 'music_set', 'post', 'altar_photo', 'vibe_tag_suggestion'
  content_type TEXT NOT NULL,
  
  -- The actual content as JSON (flexible for different types)
  content_data JSONB NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Admin feedback
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;

-- Users can submit content
CREATE POLICY "Users can submit content to queue"
  ON content_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
CREATE POLICY "Users can view own queue items"
  ON content_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all queue items"
  ON content_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- Admins can update (approve/reject)
CREATE POLICY "Admins can update queue items"
  ON content_queue FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- Admins can delete
CREATE POLICY "Admins can delete queue items"
  ON content_queue FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- 3. Create custom vibe tags table (for user suggestions)
CREATE TABLE IF NOT EXISTS custom_vibe_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Tag details
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL,
  category TEXT DEFAULT 'custom', -- energy, genre, mood, rhythm, custom
  
  -- Who suggested it
  suggested_by UUID REFERENCES profiles(id),
  
  -- Approval status
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE custom_vibe_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved tags
CREATE POLICY "Anyone can view approved vibe tags"
  ON custom_vibe_tags FOR SELECT
  TO authenticated
  USING (is_approved = TRUE);

-- Admins can view all tags
CREATE POLICY "Admins can view all vibe tags"
  ON custom_vibe_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- Users can suggest tags (via content_queue, but direct insert also allowed)
CREATE POLICY "Users can suggest vibe tags"
  ON custom_vibe_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = suggested_by AND is_approved = FALSE);

-- Admins can update (approve)
CREATE POLICY "Admins can update vibe tags"
  ON custom_vibe_tags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- Admins can delete
CREATE POLICY "Admins can delete vibe tags"
  ON custom_vibe_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_queue_user ON content_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_content_queue_type ON content_queue(content_type);
CREATE INDEX IF NOT EXISTS idx_custom_vibe_tags_approved ON custom_vibe_tags(is_approved);

-- 4. Update profiles policy to allow admins to update requires_review
-- (This should already be covered by existing admin policies, but let's be explicit)
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- Done! After running this:
-- 1. All new users will have requires_review = TRUE
-- 2. Existing admins/facilitators set to requires_review = FALSE
-- 3. Content queue ready for pending submissions
-- 4. Custom vibe tags table ready for suggestions
