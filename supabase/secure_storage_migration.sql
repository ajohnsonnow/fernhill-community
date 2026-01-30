-- =====================================================
-- SECURE STORAGE MIGRATION
-- Run this in Supabase SQL Editor to LOCK DOWN storage
-- NOTHING is publicly viewable without authentication
-- =====================================================

-- STEP 1: Make ALL buckets PRIVATE (only authenticated users)
UPDATE storage.buckets SET public = false WHERE id = 'altar_photos';
UPDATE storage.buckets SET public = false WHERE id = 'avatars';
UPDATE storage.buckets SET public = false WHERE id = 'post_images';

-- STEP 2: Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view altar photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view altar photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload altar photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own altar photos" ON storage.objects;

-- =====================================================
-- ALTAR PHOTOS BUCKET (PRIVATE - tribe only)
-- =====================================================

-- Only authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload altar photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'altar_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Only authenticated users can view altar photos
CREATE POLICY "Only authenticated can view altar photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'altar_photos');

-- Users can delete their own photos
CREATE POLICY "Users can delete own altar photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'altar_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can delete any altar photo
CREATE POLICY "Admins can delete any altar photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'altar_photos' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status IN ('admin', 'facilitator')
    )
  );

-- =====================================================
-- AVATARS BUCKET (PRIVATE - tribe only)
-- =====================================================

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Only authenticated can view avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- POST IMAGES BUCKET (PRIVATE - tribe only)
-- =====================================================

CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post_images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Only authenticated can view post images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'post_images');

CREATE POLICY "Users can delete own post images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'post_images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- RESULT: 
-- ALL buckets are now PRIVATE
-- ONLY logged-in community members can view ANY images
-- URLs require authentication to access
-- Outside visitors see NOTHING
-- =====================================================
