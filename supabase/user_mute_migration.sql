-- =====================================================
-- USER MUTE FEATURE MIGRATION
-- =====================================================
-- Adds the ability for admins to mute users
-- Muted users can still post, but only they and admins can see their posts
-- This is a "shadow ban" feature
-- =====================================================

-- Add muted column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS muted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS muted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS muted_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mute_reason TEXT;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_profiles_muted ON profiles(muted) WHERE muted = true;

-- Add audit log for mute/unmute actions
CREATE TABLE IF NOT EXISTS mute_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('mute', 'unmute')),
  reason TEXT,
  CONSTRAINT unique_mute_audit UNIQUE (admin_id, user_id, action, created_at)
);

ALTER TABLE mute_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view the mute audit log
DROP POLICY IF EXISTS "Admins can view mute audit log" ON mute_audit_log;
CREATE POLICY "Admins can view mute audit log" ON mute_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

-- Only admins can insert into mute audit log
DROP POLICY IF EXISTS "Admins can insert mute audit log" ON mute_audit_log;
CREATE POLICY "Admins can insert mute audit log" ON mute_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
  );

-- Comment for clarity
COMMENT ON COLUMN profiles.muted IS 'When true, user posts are only visible to themselves and admins (shadow ban)';
COMMENT ON TABLE mute_audit_log IS 'Audit trail of all user mute/unmute actions';
