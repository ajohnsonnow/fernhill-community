-- Extended Profile Fields Migration
-- Adds bio, pronouns, location, and social media URLs to profiles table
-- Run this in your Supabase SQL editor

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronouns TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spotify_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bandcamp_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.bio IS 'User bio/about text (max 500 chars recommended)';
COMMENT ON COLUMN profiles.pronouns IS 'User pronouns (e.g., they/them, she/her)';
COMMENT ON COLUMN profiles.location IS 'User location (city, state)';
COMMENT ON COLUMN profiles.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN profiles.facebook_url IS 'Facebook profile URL';
COMMENT ON COLUMN profiles.twitter_url IS 'Twitter/X profile URL';
COMMENT ON COLUMN profiles.tiktok_url IS 'TikTok profile URL';
COMMENT ON COLUMN profiles.spotify_url IS 'Spotify artist/profile URL';
COMMENT ON COLUMN profiles.bandcamp_url IS 'Bandcamp page URL';
COMMENT ON COLUMN profiles.linkedin_url IS 'LinkedIn profile URL';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('bio', 'pronouns', 'location', 'instagram_url', 'facebook_url', 'twitter_url', 'tiktok_url', 'spotify_url', 'bandcamp_url', 'linkedin_url');
