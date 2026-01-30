-- =====================================================
-- ADMIN PROFILES INSERT POLICY
-- =====================================================
-- This migration adds the ability for admins to create
-- profiles for new users via the admin dashboard.
--
-- Problem: The profiles table only has SELECT and UPDATE
-- policies. The handle_new_user() trigger uses SECURITY
-- DEFINER to bypass RLS for automatic profile creation,
-- but admin-initiated inserts from the client are blocked.
--
-- Solution: Add an INSERT policy for admin users.
-- =====================================================

-- Allow admins to insert new profiles
CREATE POLICY "Admins can create profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- Also allow users to insert their own profile (for edge cases 
-- where the trigger doesn't fire or fails)
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

-- =====================================================
-- NOTES FOR DEPLOYMENT:
-- =====================================================
-- Run this in Supabase SQL Editor:
-- 1. Go to your Supabase project dashboard
-- 2. Click "SQL Editor" in the sidebar
-- 3. Paste this entire file
-- 4. Click "Run"
--
-- If you get an error that the policy already exists,
-- you can drop it first:
-- DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
-- DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
-- =====================================================
