-- ============================================
-- Phase H: Electric Avenue - CLEAN INSTALL
-- Version: 1.14.0
-- 
-- Run this in 3 parts if you get errors:
-- PART 1: Base tables (lines 1-60)
-- PART 2: Phase H tables (lines 61-400)  
-- PART 3: Policies & functions (lines 401+)
-- ============================================

-- ==========================================
-- PART 1: BASE TABLES
-- ==========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop Phase H tables if they exist (clean slate)
DROP TABLE IF EXISTS recommendation_log CASCADE;
DROP TABLE IF EXISTS event_ratings CASCADE;
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS community_vibe_snapshots CASCADE;
DROP TABLE IF EXISTS mood_entries CASCADE;
DROP TABLE IF EXISTS event_now_playing CASCADE;
DROP TABLE IF EXISTS event_reactions CASCADE;
DROP TABLE IF EXISTS event_chat CASCADE;
DROP TABLE IF EXISTS event_presence CASCADE;
DROP TABLE IF EXISTS playlist_track_votes CASCADE;
DROP TABLE IF EXISTS playlist_tracks CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS event_checkins CASCADE;
DROP TABLE IF EXISTS event_checkin_secrets CASCADE;
DROP TABLE IF EXISTS leaderboards CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS xp_transactions CASCADE;
DROP TABLE IF EXISTS user_gamification CASCADE;

-- Create profiles if not exists
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    email TEXT,
    full_name TEXT,
    tribe_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    pronouns TEXT,
    status TEXT DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT FALSE,
    phone TEXT,
    emergency_contact TEXT,
    dietary_restrictions TEXT,
    accessibility_needs TEXT,
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
    last_seen TIMESTAMPTZ
);

-- Create events if not exists  
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Event',
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    location_name TEXT NOT NULL DEFAULT 'TBD',
    map_link TEXT,
    description TEXT,
    shifts JSONB DEFAULT '[]'::jsonb,
    event_type TEXT DEFAULT 'dance',
    capacity INTEGER,
    cover_image_url TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    tags TEXT[] DEFAULT '{}'
);

-- ==========================================
-- PART 2: PHASE H TABLES
-- ==========================================

-- 1. GAMIFICATION
CREATE TABLE user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_xp INTEGER DEFAULT 0 NOT NULL,
    current_level INTEGER DEFAULT 1 NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    last_activity_date DATE,
    streak_protected_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(50) NOT NULL,
    xp_amount INTEGER NOT NULL,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    multiplier DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common' NOT NULL,
    xp_reward INTEGER DEFAULT 0 NOT NULL,
    category VARCHAR(50) DEFAULT 'general' NOT NULL,
    requirement_type VARCHAR(50) NOT NULL,
    requirement_value INTEGER DEFAULT 1 NOT NULL,
    requirement_target VARCHAR(100),
    is_hidden BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    xp_earned INTEGER DEFAULT 0 NOT NULL,
    rank INTEGER,
    events_attended INTEGER DEFAULT 0,
    posts_created INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(period_type, period_start, user_id)
);

-- 2. QR CHECK-IN
CREATE TABLE event_checkin_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    secret_hash VARCHAR(64) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    geofence_lat DECIMAL(10, 8),
    geofence_lng DECIMAL(11, 8),
    geofence_radius_meters INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE event_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    checked_in_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    check_in_method VARCHAR(20) DEFAULT 'qr' NOT NULL,
    device_info JSONB,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    xp_awarded INTEGER DEFAULT 0,
    UNIQUE(event_id, user_id)
);

-- 3. PLAYLISTS
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    vibe VARCHAR(50) DEFAULT 'mixed',
    cover_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    is_collaborative BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    track_count INTEGER DEFAULT 0,
    total_duration_ms INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE playlist_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(200) NOT NULL,
    album VARCHAR(200),
    duration_ms INTEGER DEFAULT 180000 NOT NULL,
    artwork_url TEXT,
    spotify_url TEXT,
    spotify_uri VARCHAR(100),
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    position INTEGER NOT NULL,
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE playlist_track_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES playlist_tracks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vote INTEGER DEFAULT 1 CHECK (vote IN (-1, 1)),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(track_id, user_id)
);

-- 4. LIVE EVENTS
CREATE TABLE event_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(30) DEFAULT 'dancing' NOT NULL,
    last_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(event_id, user_id)
);

CREATE TABLE event_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'chat' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE event_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE event_now_playing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE NOT NULL,
    track_title VARCHAR(200) NOT NULL,
    track_artist VARCHAR(200) NOT NULL,
    artwork_url TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5. MOOD TRACKING
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mood VARCHAR(30) NOT NULL,
    energy INTEGER NOT NULL,
    note TEXT,
    recorded_date DATE DEFAULT CURRENT_DATE NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, recorded_date)
);

CREATE TABLE community_vibe_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_hour TIMESTAMPTZ NOT NULL,
    dominant_mood VARCHAR(30),
    average_energy DECIMAL(3,2),
    mood_distribution JSONB,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(snapshot_hour)
);

-- 6. RECOMMENDATIONS
CREATE TABLE user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    interest VARCHAR(100) NOT NULL,
    weight DECIMAL(3,2) DEFAULT 1.0,
    source VARCHAR(30) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, interest)
);

CREATE TABLE event_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL,
    review TEXT,
    would_recommend BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(event_id, user_id)
);

CREATE TABLE recommendation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL,
    reasons JSONB NOT NULL,
    was_clicked BOOLEAN DEFAULT FALSE,
    was_attended BOOLEAN DEFAULT FALSE,
    shown_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    clicked_at TIMESTAMPTZ,
    attended_at TIMESTAMPTZ
);

-- ==========================================
-- PART 3: INDEXES, RLS, FUNCTIONS
-- ==========================================

-- Indexes
CREATE INDEX idx_user_gamification_xp ON user_gamification(total_xp DESC);
CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id, created_at DESC);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_event_checkins_event ON event_checkins(event_id);
CREATE INDEX idx_event_checkins_user ON event_checkins(user_id);
CREATE INDEX idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX idx_event_presence_event ON event_presence(event_id);
CREATE INDEX idx_event_chat_event ON event_chat(event_id, created_at DESC);
CREATE INDEX idx_mood_entries_user ON mood_entries(user_id, recorded_date DESC);

-- Enable RLS
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checkin_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_track_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_now_playing ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_vibe_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_log ENABLE ROW LEVEL SECURITY;

-- Simple SELECT policies (allow all authenticated users to read)
CREATE POLICY "select_user_gamification" ON user_gamification FOR SELECT USING (true);
CREATE POLICY "select_xp_transactions" ON xp_transactions FOR SELECT USING (true);
CREATE POLICY "select_achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "select_user_achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "select_leaderboards" ON leaderboards FOR SELECT USING (true);
CREATE POLICY "select_event_checkins" ON event_checkins FOR SELECT USING (true);
CREATE POLICY "select_playlists" ON playlists FOR SELECT USING (true);
CREATE POLICY "select_playlist_tracks" ON playlist_tracks FOR SELECT USING (true);
CREATE POLICY "select_playlist_track_votes" ON playlist_track_votes FOR SELECT USING (true);
CREATE POLICY "select_event_presence" ON event_presence FOR SELECT USING (true);
CREATE POLICY "select_event_chat" ON event_chat FOR SELECT USING (true);
CREATE POLICY "select_event_reactions" ON event_reactions FOR SELECT USING (true);
CREATE POLICY "select_event_now_playing" ON event_now_playing FOR SELECT USING (true);
CREATE POLICY "select_mood_entries" ON mood_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "select_community_vibe" ON community_vibe_snapshots FOR SELECT USING (true);
CREATE POLICY "select_user_interests" ON user_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "select_event_ratings" ON event_ratings FOR SELECT USING (true);
CREATE POLICY "select_recommendation_log" ON recommendation_log FOR SELECT USING (auth.uid() = user_id);

-- INSERT policies
CREATE POLICY "insert_event_checkins" ON event_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insert_playlists" ON playlists FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "insert_playlist_tracks" ON playlist_tracks FOR INSERT WITH CHECK (true);
CREATE POLICY "insert_playlist_track_votes" ON playlist_track_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insert_event_presence" ON event_presence FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insert_event_chat" ON event_chat FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insert_event_reactions" ON event_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insert_mood_entries" ON mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insert_user_interests" ON user_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insert_event_ratings" ON event_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE policies
CREATE POLICY "update_event_presence" ON event_presence FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "update_mood_entries" ON mood_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "update_user_interests" ON user_interests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "update_event_ratings" ON event_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "update_playlists" ON playlists FOR UPDATE USING (auth.uid() = created_by);

-- DELETE policies
CREATE POLICY "delete_event_presence" ON event_presence FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "delete_playlist_track_votes" ON playlist_track_votes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "delete_user_interests" ON user_interests FOR DELETE USING (auth.uid() = user_id);

-- Seed achievements
INSERT INTO achievements (slug, name, description, icon, rarity, xp_reward, category, requirement_type, requirement_value, requirement_target) VALUES
('welcome', 'Welcome to Fernhill', 'Joined the community', '🎉', 'common', 10, 'welcome', 'milestone', 1, 'signup'),
('first_dance', 'First Dance', 'Attended your first event', '💃', 'common', 25, 'attendance', 'count', 1, 'events'),
('profile_complete', 'Soul Revealed', 'Completed your profile', '✨', 'common', 15, 'profile', 'milestone', 1, 'profile'),
('first_post', 'Finding Your Voice', 'Created your first post', '📝', 'common', 20, 'social', 'count', 1, 'posts'),
('first_friend', 'Connection Made', 'Made your first connection', '🤝', 'common', 15, 'social', 'count', 1, 'friends'),
('regular_5', 'Regular Dancer', 'Attended 5 events', '🌟', 'uncommon', 50, 'attendance', 'count', 5, 'events'),
('regular_10', 'Dedicated Dancer', 'Attended 10 events', '⭐', 'uncommon', 100, 'attendance', 'count', 10, 'events'),
('regular_25', 'Movement Master', 'Attended 25 events', '🏆', 'rare', 250, 'attendance', 'count', 25, 'events'),
('regular_50', 'Dance Legend', 'Attended 50 events', '👑', 'epic', 500, 'attendance', 'count', 50, 'events'),
('regular_100', 'Century Dancer', 'Attended 100 events', '💎', 'legendary', 1000, 'attendance', 'count', 100, 'events'),
('streak_3', 'Getting Started', '3-week streak', '🔥', 'common', 30, 'streak', 'streak', 3, 'weeks'),
('streak_5', 'On Fire', '5-week streak', '🔥', 'uncommon', 75, 'streak', 'streak', 5, 'weeks'),
('streak_10', 'Unstoppable', '10-week streak', '🔥', 'rare', 200, 'streak', 'streak', 10, 'weeks')
ON CONFLICT (slug) DO NOTHING;

-- Award XP function
CREATE OR REPLACE FUNCTION award_xp(p_user_id UUID, p_action VARCHAR(50), p_amount INTEGER) 
RETURNS INTEGER AS $$
DECLARE v_new_total INTEGER;
BEGIN
    INSERT INTO xp_transactions (user_id, action, xp_amount)
    VALUES (p_user_id, p_action, p_amount);
    
    INSERT INTO user_gamification (user_id, total_xp, last_activity_date)
    VALUES (p_user_id, p_amount, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
        total_xp = user_gamification.total_xp + p_amount,
        last_activity_date = CURRENT_DATE,
        updated_at = NOW()
    RETURNING total_xp INTO v_new_total;
    
    UPDATE user_gamification SET current_level = 
        CASE WHEN v_new_total >= 25000 THEN 12
             WHEN v_new_total >= 15000 THEN 11
             WHEN v_new_total >= 10000 THEN 10
             WHEN v_new_total >= 5000 THEN 8
             WHEN v_new_total >= 2500 THEN 6
             WHEN v_new_total >= 1000 THEN 4
             WHEN v_new_total >= 500 THEN 3
             WHEN v_new_total >= 100 THEN 2
             ELSE 1 END
    WHERE user_id = p_user_id;
    
    RETURN v_new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON event_checkins, playlists, playlist_tracks, playlist_track_votes, 
    event_presence, event_chat, event_reactions, mood_entries, user_interests, event_ratings TO authenticated;
GRANT UPDATE ON event_presence, mood_entries, user_interests, event_ratings, playlists TO authenticated;
GRANT DELETE ON event_presence, playlist_track_votes, user_interests TO authenticated;

-- Success!
DO $$ BEGIN RAISE NOTICE '✅ Phase H: Electric Avenue installed successfully!'; END $$;
