-- ============================================
-- Phase H: Electric Avenue - STANDALONE Migration
-- Version: 1.14.0
-- 
-- This file is SELF-CONTAINED - it creates any
-- missing base tables before adding Phase H features.
-- Safe to run on fresh or existing databases.
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BASE TABLES (if not exist)
-- ============================================

-- Profiles table (core user data)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    email TEXT,
    full_name TEXT,
    tribe_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    pronouns TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'facilitator', 'admin', 'suspended')),
    is_verified BOOLEAN DEFAULT FALSE,
    phone TEXT,
    emergency_contact TEXT,
    dietary_restrictions TEXT,
    accessibility_needs TEXT,
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
    last_seen TIMESTAMPTZ
);

-- Events table (required for Phase H foreign keys)
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    location_name TEXT NOT NULL,
    map_link TEXT,
    description TEXT,
    shifts JSONB DEFAULT '[]'::jsonb,
    event_type TEXT DEFAULT 'dance',
    capacity INTEGER,
    cover_image_url TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    tags TEXT[] DEFAULT '{}'
);

-- ============================================
-- 1. GAMIFICATION SYSTEM
-- ============================================

-- User XP and Level tracking
CREATE TABLE IF NOT EXISTS user_gamification (
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

-- XP Transaction Log (audit trail)
CREATE TABLE IF NOT EXISTS xp_transactions (
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

-- Achievement Definitions
CREATE TABLE IF NOT EXISTS achievements (
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

-- User Achievements (unlocked)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, achievement_id)
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
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

-- ============================================
-- 2. QR CODE CHECK-IN SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS event_checkin_secrets (
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

CREATE TABLE IF NOT EXISTS event_checkins (
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

-- ============================================
-- 3. COLLABORATIVE PLAYLISTS
-- ============================================

CREATE TABLE IF NOT EXISTS playlists (
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

CREATE TABLE IF NOT EXISTS playlist_tracks (
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
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(playlist_id, position)
);

CREATE TABLE IF NOT EXISTS playlist_track_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES playlist_tracks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vote INTEGER DEFAULT 1 CHECK (vote IN (-1, 1)),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(track_id, user_id)
);

-- ============================================
-- 4. LIVE EVENT MODE
-- ============================================

CREATE TABLE IF NOT EXISTS event_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(30) DEFAULT 'dancing' NOT NULL,
    last_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL CHECK (char_length(content) <= 500),
    message_type VARCHAR(20) DEFAULT 'chat' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS event_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS event_now_playing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE NOT NULL,
    track_title VARCHAR(200) NOT NULL,
    track_artist VARCHAR(200) NOT NULL,
    artwork_url TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- 5. MOOD/VIBE TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mood VARCHAR(30) NOT NULL,
    energy INTEGER CHECK (energy BETWEEN 1 AND 5) NOT NULL,
    note TEXT,
    recorded_date DATE DEFAULT CURRENT_DATE NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, recorded_date)
);

CREATE TABLE IF NOT EXISTS community_vibe_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_hour TIMESTAMPTZ NOT NULL,
    dominant_mood VARCHAR(30),
    average_energy DECIMAL(3,2),
    mood_distribution JSONB,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(snapshot_hour)
);

-- ============================================
-- 6. SMART RECOMMENDATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    interest VARCHAR(100) NOT NULL,
    weight DECIMAL(3,2) DEFAULT 1.0,
    source VARCHAR(30) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, interest)
);

CREATE TABLE IF NOT EXISTS event_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    review TEXT,
    would_recommend BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS recommendation_log (
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

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_gamification_xp ON user_gamification(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_level ON user_gamification(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_period ON leaderboards(period_type, period_start, rank);
CREATE INDEX IF NOT EXISTS idx_event_checkins_event ON event_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_checkins_user ON event_checkins(user_id, checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkin_secrets_event ON event_checkin_secrets(event_id, valid_until);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_playlist_track_votes_track ON playlist_track_votes(track_id);
CREATE INDEX IF NOT EXISTS idx_event_presence_event ON event_presence(event_id, is_active);
CREATE INDEX IF NOT EXISTS idx_event_chat_event ON event_chat(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_reactions_event ON event_reactions(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date ON mood_entries(user_id, recorded_date DESC);
CREATE INDEX IF NOT EXISTS idx_community_vibe_hour ON community_vibe_snapshots(snapshot_hour DESC);
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_event_ratings_event ON event_ratings(event_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_log_user ON recommendation_log(user_id, shown_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
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

-- ============================================
-- RLS POLICIES (using DROP IF EXISTS pattern)
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view active profiles" ON profiles;
CREATE POLICY "Users can view active profiles" ON profiles
    FOR SELECT USING (status IN ('active', 'facilitator', 'admin'));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Events policies
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
CREATE POLICY "Anyone can view published events" ON events
    FOR SELECT USING (is_published = TRUE OR created_by = auth.uid());

-- Gamification policies
DROP POLICY IF EXISTS "Users can view their own gamification" ON user_gamification;
CREATE POLICY "Users can view their own gamification" ON user_gamification
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view leaderboards" ON leaderboards;
CREATE POLICY "Users can view leaderboards" ON leaderboards
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can view achievements" ON achievements;
CREATE POLICY "Users can view achievements" ON achievements
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users can view their achievements" ON user_achievements;
CREATE POLICY "Users can view their achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their XP history" ON xp_transactions;
CREATE POLICY "Users can view their XP history" ON xp_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Check-in policies
DROP POLICY IF EXISTS "Users can check in" ON event_checkins;
CREATE POLICY "Users can check in" ON event_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view event checkins" ON event_checkins;
CREATE POLICY "Users can view event checkins" ON event_checkins
    FOR SELECT USING (TRUE);

-- Playlist policies
DROP POLICY IF EXISTS "Anyone can view public playlists" ON playlists;
CREATE POLICY "Anyone can view public playlists" ON playlists
    FOR SELECT USING (is_public = TRUE);

DROP POLICY IF EXISTS "Users can create playlists" ON playlists;
CREATE POLICY "Users can create playlists" ON playlists
    FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creators can update their playlists" ON playlists;
CREATE POLICY "Creators can update their playlists" ON playlists
    FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Anyone can view playlist tracks" ON playlist_tracks;
CREATE POLICY "Anyone can view playlist tracks" ON playlist_tracks
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can add tracks to collaborative playlists" ON playlist_tracks;
CREATE POLICY "Users can add tracks to collaborative playlists" ON playlist_tracks
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM playlists WHERE id = playlist_id AND is_collaborative = TRUE)
    );

DROP POLICY IF EXISTS "Users can vote on tracks" ON playlist_track_votes;
CREATE POLICY "Users can vote on tracks" ON playlist_track_votes
    FOR ALL USING (auth.uid() = user_id);

-- Live event policies
DROP POLICY IF EXISTS "Users can manage their presence" ON event_presence;
CREATE POLICY "Users can manage their presence" ON event_presence
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view event presence" ON event_presence;
CREATE POLICY "Users can view event presence" ON event_presence
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can send chat messages" ON event_chat;
CREATE POLICY "Users can send chat messages" ON event_chat
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view chat" ON event_chat;
CREATE POLICY "Users can view chat" ON event_chat
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can react" ON event_reactions;
CREATE POLICY "Users can react" ON event_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view reactions" ON event_reactions;
CREATE POLICY "Users can view reactions" ON event_reactions
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Anyone can see now playing" ON event_now_playing;
CREATE POLICY "Anyone can see now playing" ON event_now_playing
    FOR SELECT USING (TRUE);

-- Mood policies
DROP POLICY IF EXISTS "Users can manage their moods" ON mood_entries;
CREATE POLICY "Users can manage their moods" ON mood_entries
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view community vibe" ON community_vibe_snapshots;
CREATE POLICY "Anyone can view community vibe" ON community_vibe_snapshots
    FOR SELECT USING (TRUE);

-- Recommendation policies
DROP POLICY IF EXISTS "Users can manage their interests" ON user_interests;
CREATE POLICY "Users can manage their interests" ON user_interests
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can rate events" ON event_ratings;
CREATE POLICY "Users can rate events" ON event_ratings
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their recommendations" ON recommendation_log;
CREATE POLICY "Users can view their recommendations" ON recommendation_log
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Award XP function
CREATE OR REPLACE FUNCTION award_xp(
    p_user_id UUID,
    p_action VARCHAR(50),
    p_amount INTEGER,
    p_description TEXT DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_new_total INTEGER;
    v_multiplier DECIMAL(3,2) := 1.0;
    v_streak INTEGER;
BEGIN
    SELECT current_streak INTO v_streak 
    FROM user_gamification 
    WHERE user_id = p_user_id;
    
    IF v_streak IS NOT NULL AND v_streak > 0 THEN
        v_multiplier := LEAST(1.5, 1.0 + (v_streak * 0.05));
    END IF;
    
    INSERT INTO xp_transactions (user_id, action, xp_amount, description, reference_type, reference_id, multiplier)
    VALUES (p_user_id, p_action, ROUND(p_amount * v_multiplier), p_description, p_reference_type, p_reference_id, v_multiplier);
    
    INSERT INTO user_gamification (user_id, total_xp, last_activity_date)
    VALUES (p_user_id, ROUND(p_amount * v_multiplier), CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
        total_xp = user_gamification.total_xp + ROUND(p_amount * v_multiplier),
        last_activity_date = CURRENT_DATE,
        updated_at = NOW()
    RETURNING total_xp INTO v_new_total;
    
    UPDATE user_gamification
    SET current_level = CASE
        WHEN v_new_total >= 25000 THEN 12
        WHEN v_new_total >= 15000 THEN 11
        WHEN v_new_total >= 10000 THEN 10
        WHEN v_new_total >= 7000 THEN 9
        WHEN v_new_total >= 5000 THEN 8
        WHEN v_new_total >= 3500 THEN 7
        WHEN v_new_total >= 2500 THEN 6
        WHEN v_new_total >= 1500 THEN 5
        WHEN v_new_total >= 1000 THEN 4
        WHEN v_new_total >= 500 THEN 3
        WHEN v_new_total >= 100 THEN 2
        ELSE 1
    END
    WHERE user_id = p_user_id;
    
    RETURN v_new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update streak function
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
    v_last_date DATE;
    v_current_streak INTEGER;
    v_protected_until TIMESTAMPTZ;
BEGIN
    SELECT last_activity_date, current_streak, streak_protected_until
    INTO v_last_date, v_current_streak, v_protected_until
    FROM user_gamification
    WHERE user_id = p_user_id;
    
    IF v_last_date IS NULL THEN
        UPDATE user_gamification
        SET current_streak = 1, last_activity_date = CURRENT_DATE
        WHERE user_id = p_user_id;
        RETURN 1;
    END IF;
    
    IF v_last_date = CURRENT_DATE THEN
        RETURN v_current_streak;
    END IF;
    
    IF v_last_date = CURRENT_DATE - 1 THEN
        UPDATE user_gamification
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_activity_date = CURRENT_DATE
        WHERE user_id = p_user_id
        RETURNING current_streak INTO v_current_streak;
        RETURN v_current_streak;
    END IF;
    
    IF v_protected_until IS NOT NULL AND v_protected_until > NOW() THEN
        UPDATE user_gamification
        SET last_activity_date = CURRENT_DATE,
            streak_protected_until = NULL
        WHERE user_id = p_user_id;
        RETURN v_current_streak;
    END IF;
    
    UPDATE user_gamification
    SET current_streak = 1, last_activity_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_event_checkin ON event_checkins;
DROP TRIGGER IF EXISTS on_track_change ON playlist_tracks;
DROP TRIGGER IF EXISTS on_vote_change ON playlist_track_votes;

-- Check-in XP trigger
CREATE OR REPLACE FUNCTION trigger_checkin_xp() RETURNS TRIGGER AS $$
BEGIN
    PERFORM award_xp(NEW.user_id, 'event_checkin', 50, 'Checked in to event', 'event', NEW.event_id);
    PERFORM update_user_streak(NEW.user_id);
    NEW.xp_awarded := 50;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_checkin
    BEFORE INSERT ON event_checkins
    FOR EACH ROW EXECUTE FUNCTION trigger_checkin_xp();

-- Playlist stats trigger
CREATE OR REPLACE FUNCTION trigger_update_playlist_stats() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE playlists SET 
            track_count = track_count + 1,
            total_duration_ms = total_duration_ms + NEW.duration_ms,
            updated_at = NOW()
        WHERE id = NEW.playlist_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE playlists SET 
            track_count = track_count - 1,
            total_duration_ms = total_duration_ms - OLD.duration_ms,
            updated_at = NOW()
        WHERE id = OLD.playlist_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_track_change
    AFTER INSERT OR DELETE ON playlist_tracks
    FOR EACH ROW EXECUTE FUNCTION trigger_update_playlist_stats();

-- Vote update trigger
CREATE OR REPLACE FUNCTION trigger_update_track_votes() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE playlist_tracks SET votes = votes + NEW.vote WHERE id = NEW.track_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE playlist_tracks SET votes = votes - OLD.vote WHERE id = OLD.track_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE playlist_tracks SET votes = votes - OLD.vote + NEW.vote WHERE id = NEW.track_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vote_change
    AFTER INSERT OR UPDATE OR DELETE ON playlist_track_votes
    FOR EACH ROW EXECUTE FUNCTION trigger_update_track_votes();

-- ============================================
-- SEED ACHIEVEMENTS
-- ============================================

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
('streak_3', 'Getting Started', '3-week attendance streak', '🔥', 'common', 30, 'streak', 'streak', 3, 'weeks'),
('streak_5', 'On Fire', '5-week attendance streak', '🔥', 'uncommon', 75, 'streak', 'streak', 5, 'weeks'),
('streak_10', 'Unstoppable', '10-week attendance streak', '🔥', 'rare', 200, 'streak', 'streak', 10, 'weeks'),
('streak_20', 'Streak Master', '20-week attendance streak', '🔥', 'epic', 500, 'streak', 'streak', 20, 'weeks'),
('popular', 'Community Star', 'Received 50 reactions on posts', '⭐', 'uncommon', 50, 'social', 'count', 50, 'reactions_received'),
('connector', 'Connector', 'Made 10 connections', '🔗', 'uncommon', 75, 'social', 'count', 10, 'friends'),
('helper', 'Helping Hand', 'Replied to 25 posts', '🙌', 'uncommon', 50, 'social', 'count', 25, 'comments'),
('early_bird', 'Early Bird', 'Checked in within first 30 minutes', '🐦', 'uncommon', 25, 'special', 'milestone', 1, 'early_checkin'),
('night_owl', 'Night Owl', 'Stayed until the end', '🦉', 'uncommon', 25, 'special', 'milestone', 1, 'late_checkout'),
('playlist_curator', 'Playlist Curator', 'Added 10 tracks to playlists', '🎵', 'uncommon', 50, 'special', 'count', 10, 'tracks_added'),
('mood_tracker', 'Vibe Keeper', 'Logged mood for 7 days straight', '🌈', 'uncommon', 40, 'special', 'streak', 7, 'mood_days')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- REALTIME (skip if publication doesn't exist)
-- ============================================

DO $$
BEGIN
    -- Try to add tables to realtime publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE event_presence;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE event_chat;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE event_reactions;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE event_now_playing;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE playlist_track_votes;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- ============================================
-- GRANTS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT SELECT ON events TO authenticated;
GRANT SELECT ON achievements TO authenticated;
GRANT SELECT, INSERT ON user_achievements TO authenticated;
GRANT SELECT ON user_gamification TO authenticated;
GRANT SELECT ON xp_transactions TO authenticated;
GRANT SELECT ON leaderboards TO authenticated;
GRANT SELECT, INSERT ON event_checkins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON playlists TO authenticated;
GRANT SELECT, INSERT, DELETE ON playlist_tracks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON playlist_track_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_presence TO authenticated;
GRANT SELECT, INSERT ON event_chat TO authenticated;
GRANT SELECT, INSERT ON event_reactions TO authenticated;
GRANT SELECT ON event_now_playing TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON mood_entries TO authenticated;
GRANT SELECT ON community_vibe_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_interests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON event_ratings TO authenticated;
GRANT SELECT, UPDATE ON recommendation_log TO authenticated;

-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '✅ Phase H: Electric Avenue - SUCCESS!';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  • profiles, events (base tables)';
    RAISE NOTICE '  • user_gamification, xp_transactions';
    RAISE NOTICE '  • achievements, user_achievements, leaderboards';
    RAISE NOTICE '  • event_checkin_secrets, event_checkins';
    RAISE NOTICE '  • playlists, playlist_tracks, playlist_track_votes';
    RAISE NOTICE '  • event_presence, event_chat, event_reactions, event_now_playing';
    RAISE NOTICE '  • mood_entries, community_vibe_snapshots';
    RAISE NOTICE '  • user_interests, event_ratings, recommendation_log';
    RAISE NOTICE '';
    RAISE NOTICE '21 achievements seeded';
    RAISE NOTICE 'Realtime enabled for live features';
    RAISE NOTICE '';
END $$;
