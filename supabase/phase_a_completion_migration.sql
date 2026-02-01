-- ============================================================
-- PHASE A COMPLETION MIGRATION
-- Group DMs, Voice Messages, Link Previews, Hashtags UI Support
-- ============================================================

-- 1. Add increment_hashtag_count function
CREATE OR REPLACE FUNCTION increment_hashtag_count(hashtag_tag TEXT)
RETURNS void AS $$
BEGIN
  UPDATE hashtags 
  SET use_count = use_count + 1,
      trending_score = trending_score + 10 -- Boost recent usage
  WHERE tag = hashtag_tag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add decrement_hashtag_count function
CREATE OR REPLACE FUNCTION decrement_hashtag_count(hashtag_tag TEXT)
RETURNS void AS $$
BEGIN
  UPDATE hashtags 
  SET use_count = GREATEST(0, use_count - 1),
      trending_score = GREATEST(0, trending_score - 10)
  WHERE tag = hashtag_tag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create voice-messages storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-messages', 
  'voice-messages', 
  true, 
  5242880, -- 5MB limit
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- Voice messages storage policies
CREATE POLICY "Users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view voice messages"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-messages');

CREATE POLICY "Users can delete own voice messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Add message_type to regular messages table for voice support
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' 
CHECK (message_type IN ('text', 'voice', 'image'));

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS media_url TEXT;

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS media_duration INTEGER; -- Duration in seconds for voice

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_hashtag_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_hashtag_count(TEXT) TO authenticated;

-- 6. Comments for documentation
COMMENT ON FUNCTION increment_hashtag_count IS 'Increment hashtag usage count and boost trending score';
COMMENT ON FUNCTION decrement_hashtag_count IS 'Decrement hashtag usage when content is deleted';
