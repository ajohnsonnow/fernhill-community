-- Add browser info and console logs to feedback table
-- Run this in Supabase SQL Editor

ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS browser_info JSONB,
ADD COLUMN IF NOT EXISTS console_logs TEXT;

-- Add helpful comment
COMMENT ON COLUMN feedback.browser_info IS 'Browser and device information (userAgent, viewport, url)';
COMMENT ON COLUMN feedback.console_logs IS 'Console errors/warnings captured from browser (bug reports only)';
