-- =========================================
-- EVENT SUBMISSIONS QUEUE
-- For community members to request events
-- Run this in Supabase SQL Editor
-- =========================================

-- Create event submissions table
CREATE TABLE IF NOT EXISTS public.event_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  proposed_date TIMESTAMPTZ NOT NULL,
  proposed_location TEXT NOT NULL,
  location_address TEXT,
  event_type TEXT DEFAULT 'community' CHECK (event_type IN ('dance', 'workshop', 'gathering', 'community', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON public.event_submissions(status);
CREATE INDEX IF NOT EXISTS idx_event_submissions_user_id ON public.event_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_created_at ON public.event_submissions(created_at DESC);

-- Enable RLS
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;

-- Users can submit event requests
CREATE POLICY "Users can submit events"
  ON public.event_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON public.event_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON public.event_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND status = 'admin'
    )
  );

-- Admins can update submissions (approve/reject)
CREATE POLICY "Admins can update submissions"
  ON public.event_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND status = 'admin'
    )
  );

-- Admins can delete submissions
CREATE POLICY "Admins can delete submissions"
  ON public.event_submissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND status = 'admin'
    )
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_event_submission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_submission_updated_at ON public.event_submissions;
CREATE TRIGGER event_submission_updated_at
  BEFORE UPDATE ON public.event_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_event_submission_timestamp();

-- Grant permissions
GRANT SELECT, INSERT ON public.event_submissions TO authenticated;
GRANT UPDATE, DELETE ON public.event_submissions TO authenticated;

-- =========================================
-- DROP OLD EVENTS TABLE (if exists and empty)
-- Uncomment if you want to remove local events
-- =========================================
-- DROP TABLE IF EXISTS public.events;

-- =========================================
-- SUCCESS! Event submissions queue created.
-- =========================================
