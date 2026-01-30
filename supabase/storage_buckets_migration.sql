-- =====================================================
-- STORAGE BUCKETS MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('altar_photos', 'altar_photos', true),
  ('post_images', 'post_images', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- AVATARS BUCKET (public)
-- =====================================================

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update/replace their own avatars
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- =====================================================
-- ALTAR PHOTOS BUCKET (private - authenticated only)
-- =====================================================

-- Allow authenticated users to upload altar photos
CREATE POLICY "Users can upload altar photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'altar_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own altar photos
CREATE POLICY "Users can delete own altar photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'altar_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can view all altar photos
CREATE POLICY "Authenticated users can view altar photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'altar_photos');

-- =====================================================
-- POST IMAGES BUCKET (public)
-- =====================================================

-- Allow authenticated users to upload post images
CREATE POLICY "Users can upload post images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post_images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own post images
CREATE POLICY "Users can delete own post images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'post_images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can view post images (public bucket)
CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'post_images');
