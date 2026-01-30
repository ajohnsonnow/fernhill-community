-- =====================================================
-- ADMIN ENHANCEMENTS MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add keyword_filters to system_settings
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS keyword_filters TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add content_warnings column for flagged content
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT;

-- Policy for admins to delete any post
CREATE POLICY "Admins can delete any post" ON posts
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND status = 'admin'
  )
);

-- Policy for admins to update any post (for flagging)
CREATE POLICY "Admins can update any post" ON posts
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND status = 'admin'
  )
);

-- Policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND status = 'admin'
  )
);

-- Policy for admins to update any profile (for status changes)
CREATE POLICY "Admins can update any profile" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND status = 'admin'
  )
);

-- Policy for admins to delete profiles
CREATE POLICY "Admins can delete profiles" ON profiles
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND status = 'admin'
  )
);

-- Policy for admins to create audit logs
CREATE POLICY "Admins can create audit logs" ON audit_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND status = 'admin'
  )
);

-- Function to check content against keyword filters
CREATE OR REPLACE FUNCTION check_content_filters()
RETURNS TRIGGER AS $$
DECLARE
  filter_word TEXT;
  settings_row RECORD;
BEGIN
  SELECT * INTO settings_row FROM system_settings LIMIT 1;
  
  IF settings_row.keyword_filters IS NOT NULL THEN
    FOREACH filter_word IN ARRAY settings_row.keyword_filters
    LOOP
      IF NEW.content ILIKE '%' || filter_word || '%' THEN
        NEW.flagged := TRUE;
        NEW.flagged_reason := 'Contains filtered keyword: ' || filter_word;
        
        -- Log the flag
        INSERT INTO audit_logs (action, details)
        VALUES ('content_auto_flagged', jsonb_build_object(
          'post_id', NEW.id,
          'keyword', filter_word,
          'author_id', NEW.author_id
        ));
        
        RETURN NEW;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check content on insert/update
DROP TRIGGER IF EXISTS check_post_content ON posts;
CREATE TRIGGER check_post_content
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION check_content_filters();

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION check_content_filters() TO authenticated;
