-- =====================================================
-- BOUNDARY VIOLATION REPORTS MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create boundary_reports table for safety reports
CREATE TABLE IF NOT EXISTS boundary_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Reporter info
  user_id UUID REFERENCES profiles(id),
  reporter_name TEXT NOT NULL,
  reporter_phone TEXT,
  reporter_email TEXT,
  
  -- Incident details
  incident_date DATE,
  incident_time TEXT,
  incident_location TEXT,
  description TEXT NOT NULL,
  violation_type TEXT NOT NULL CHECK (violation_type IN ('physical', 'verbal', 'both')),
  feelings TEXT[] DEFAULT '{}',
  feelings_other TEXT,
  
  -- Witnesses & history
  witnesses_present BOOLEAN DEFAULT FALSE,
  witness_names TEXT,
  reported_elsewhere TEXT,
  previous_violations BOOLEAN DEFAULT FALSE,
  previous_description TEXT,
  
  -- Resolution
  desired_resolution TEXT,
  additional_comments TEXT,
  
  -- Admin tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES profiles(id),
  admin_notes TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE boundary_reports ENABLE ROW LEVEL SECURITY;

-- Users can submit reports
CREATE POLICY "Users can submit boundary reports"
  ON boundary_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can view only their own reports
CREATE POLICY "Users can view own reports"
  ON boundary_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON boundary_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status IN ('admin', 'facilitator')
    )
  );

-- Admins can update reports
CREATE POLICY "Admins can update reports"
  ON boundary_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status IN ('admin', 'facilitator')
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_boundary_reports_status ON boundary_reports(status);
CREATE INDEX IF NOT EXISTS idx_boundary_reports_created ON boundary_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boundary_reports_user ON boundary_reports(user_id);
