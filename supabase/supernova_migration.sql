-- ============================================
-- Phase J: Supernova - Database Migration
-- Version: 1.16.0
-- 
-- Elite Features:
-- 1. AI Assistant (search logs, recommendations)
-- 2. Live Presence (viewers, typing indicators)
-- 3. Magic Onboarding (progress, quiz results)
-- 4. Theme Builder (custom user themes)
-- 5. Personal Insights (aggregated analytics)
-- 6. Live Streaming (streams, chat, reactions)
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- DROP EXISTING (clean install)
-- ==========================================
DROP TABLE IF EXISTS stream_donations CASCADE;
DROP TABLE IF EXISTS stream_reactions CASCADE;
DROP TABLE IF EXISTS stream_chat_messages CASCADE;
DROP TABLE IF EXISTS stream_viewers CASCADE;
DROP TABLE IF EXISTS live_streams CASCADE;
DROP TABLE IF EXISTS user_insights_cache CASCADE;
DROP TABLE IF EXISTS user_themes CASCADE;
DROP TABLE IF EXISTS onboarding_progress CASCADE;
DROP TABLE IF EXISTS presence_events CASCADE;
DROP TABLE IF EXISTS user_presence CASCADE;
DROP TABLE IF EXISTS ai_search_logs CASCADE;
DROP TABLE IF EXISTS ai_recommendations CASCADE;

-- ==========================================
-- 1. AI ASSISTANT TABLES
-- ==========================================

-- Search query logs for improving AI
CREATE TABLE ai_search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    intent_type VARCHAR(50) NOT NULL,
    intent_confidence DECIMAL(3,2) NOT NULL,
    entities JSONB DEFAULT '{}'::jsonb,
    results_count INTEGER DEFAULT 0,
    clicked_result_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- AI-generated recommendations
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL,
    reasons JSONB NOT NULL,
    was_shown BOOLEAN DEFAULT FALSE,
    was_clicked BOOLEAN DEFAULT FALSE,
    was_attended BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    shown_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

-- ==========================================
-- 2. LIVE PRESENCE TABLES
-- ==========================================

-- Real-time user presence
CREATE TABLE user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'viewing' NOT NULL,
    current_page TEXT,
    current_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    is_typing BOOLEAN DEFAULT FALSE,
    typing_in VARCHAR(50),
    device VARCHAR(20) DEFAULT 'desktop',
    last_heartbeat TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Presence event log (for analytics)
CREATE TABLE presence_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    page TEXT,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 3. MAGIC ONBOARDING TABLES
-- ==========================================

-- Onboarding progress tracking
CREATE TABLE onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    current_step_index INTEGER DEFAULT 0 NOT NULL,
    completed_steps TEXT[] DEFAULT '{}',
    skipped_steps TEXT[] DEFAULT '{}',
    quiz_answers JSONB DEFAULT '{}'::jsonb,
    quiz_results JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    total_time_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 4. THEME BUILDER TABLES
-- ==========================================

-- User custom themes
CREATE TABLE user_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    colors JSONB NOT NULL,
    fonts JSONB DEFAULT '{}'::jsonb,
    border_radius JSONB DEFAULT '{}'::jsonb,
    animations JSONB DEFAULT '{"speed": "normal", "reducedMotion": false, "enableParticles": true}'::jsonb,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 5. PERSONAL INSIGHTS TABLES
-- ==========================================

-- Cached insights for performance
CREATE TABLE user_insights_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    period VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    summary JSONB NOT NULL,
    activity JSONB NOT NULL,
    social JSONB NOT NULL,
    events JSONB NOT NULL,
    growth JSONB NOT NULL,
    highlights JSONB DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(user_id, period, period_start)
);

-- ==========================================
-- 6. LIVE STREAMING TABLES
-- ==========================================

-- Live streams
CREATE TABLE live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    
    -- Stream state
    status VARCHAR(20) DEFAULT 'scheduled' NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ,
    
    -- Streaming URLs (encrypted in production)
    stream_url TEXT,
    stream_key VARCHAR(100),
    playback_url TEXT,
    thumbnail_url TEXT,
    
    -- Stats
    current_viewers INTEGER DEFAULT 0,
    peak_viewers INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    
    -- Settings
    is_private BOOLEAN DEFAULT FALSE,
    allow_chat BOOLEAN DEFAULT TRUE,
    allow_reactions BOOLEAN DEFAULT TRUE,
    donations_enabled BOOLEAN DEFAULT FALSE,
    recording_enabled BOOLEAN DEFAULT TRUE,
    chat_moderation VARCHAR(20) DEFAULT 'basic',
    banned_user_ids UUID[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Stream viewers
CREATE TABLE stream_viewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    left_at TIMESTAMPTZ,
    watch_time_seconds INTEGER DEFAULT 0,
    quality VARCHAR(10) DEFAULT 'auto',
    device_type VARCHAR(20) DEFAULT 'desktop',
    UNIQUE(stream_id, user_id)
);

-- Stream chat messages
CREATE TABLE stream_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'chat' NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Stream reactions
CREATE TABLE stream_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Stream donations (optional feature)
CREATE TABLE stream_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    message TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- INDEXES
-- ==========================================

-- AI Assistant indexes
CREATE INDEX idx_ai_search_logs_user ON ai_search_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_search_logs_intent ON ai_search_logs(intent_type);
CREATE INDEX idx_ai_recommendations_user ON ai_recommendations(user_id, generated_at DESC);

-- Presence indexes
CREATE INDEX idx_user_presence_status ON user_presence(status);
CREATE INDEX idx_user_presence_event ON user_presence(current_event_id) WHERE current_event_id IS NOT NULL;
CREATE INDEX idx_user_presence_heartbeat ON user_presence(last_heartbeat);
CREATE INDEX idx_presence_events_user ON presence_events(user_id, created_at DESC);

-- Onboarding index
CREATE INDEX idx_onboarding_progress_completed ON onboarding_progress(completed_at) WHERE completed_at IS NOT NULL;

-- Theme indexes
CREATE INDEX idx_user_themes_active ON user_themes(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_user_themes_public ON user_themes(is_public, usage_count DESC) WHERE is_public = TRUE;

-- Insights cache index
CREATE INDEX idx_insights_cache_expires ON user_insights_cache(expires_at);

-- Streaming indexes
CREATE INDEX idx_live_streams_status ON live_streams(status);
CREATE INDEX idx_live_streams_event ON live_streams(event_id);
CREATE INDEX idx_live_streams_scheduled ON live_streams(scheduled_start) WHERE status = 'scheduled';
CREATE INDEX idx_stream_viewers_stream ON stream_viewers(stream_id);
CREATE INDEX idx_stream_chat_stream ON stream_chat_messages(stream_id, created_at DESC);
CREATE INDEX idx_stream_reactions_stream ON stream_reactions(stream_id, created_at DESC);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE ai_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_donations ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES - SELECT
-- ==========================================

-- AI: Users see their own search logs
CREATE POLICY "select_own_search_logs" ON ai_search_logs 
    FOR SELECT USING (auth.uid() = user_id);

-- AI: Users see their own recommendations
CREATE POLICY "select_own_recommendations" ON ai_recommendations 
    FOR SELECT USING (auth.uid() = user_id);

-- Presence: Everyone can see presence (for viewer counts)
CREATE POLICY "select_presence" ON user_presence 
    FOR SELECT USING (true);

-- Presence events: Users see their own
CREATE POLICY "select_own_presence_events" ON presence_events 
    FOR SELECT USING (auth.uid() = user_id);

-- Onboarding: Users see their own progress
CREATE POLICY "select_own_onboarding" ON onboarding_progress 
    FOR SELECT USING (auth.uid() = user_id);

-- Themes: Users see their own + public themes
CREATE POLICY "select_themes" ON user_themes 
    FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

-- Insights: Users see their own cached insights
CREATE POLICY "select_own_insights" ON user_insights_cache 
    FOR SELECT USING (auth.uid() = user_id);

-- Streams: Public streams visible to all, private to viewers
CREATE POLICY "select_streams" ON live_streams 
    FOR SELECT USING (is_private = FALSE OR host_id = auth.uid());

-- Stream viewers: Visible to all (for viewer lists)
CREATE POLICY "select_stream_viewers" ON stream_viewers 
    FOR SELECT USING (true);

-- Stream chat: Visible to all (public chat)
CREATE POLICY "select_stream_chat" ON stream_chat_messages 
    FOR SELECT USING (is_deleted = FALSE);

-- Stream reactions: Visible to all
CREATE POLICY "select_stream_reactions" ON stream_reactions 
    FOR SELECT USING (true);

-- Stream donations: Visible to all (for on-screen display)
CREATE POLICY "select_stream_donations" ON stream_donations 
    FOR SELECT USING (true);

-- ==========================================
-- RLS POLICIES - INSERT
-- ==========================================

CREATE POLICY "insert_search_logs" ON ai_search_logs 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insert_presence" ON user_presence 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insert_presence_events" ON presence_events 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insert_onboarding" ON onboarding_progress 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insert_themes" ON user_themes 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insert_streams" ON live_streams 
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "insert_stream_viewers" ON stream_viewers 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insert_stream_chat" ON stream_chat_messages 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insert_stream_reactions" ON stream_reactions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insert_stream_donations" ON stream_donations 
    FOR INSERT WITH CHECK (auth.uid() = user_id OR is_anonymous = TRUE);

-- ==========================================
-- RLS POLICIES - UPDATE
-- ==========================================

CREATE POLICY "update_own_presence" ON user_presence 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "update_own_onboarding" ON onboarding_progress 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "update_own_themes" ON user_themes 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "update_own_streams" ON live_streams 
    FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "update_own_viewer" ON stream_viewers 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "update_recommendations" ON ai_recommendations 
    FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- RLS POLICIES - DELETE
-- ==========================================

CREATE POLICY "delete_own_presence" ON user_presence 
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "delete_own_themes" ON user_themes 
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "delete_own_viewer" ON stream_viewers 
    FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Update presence heartbeat
CREATE OR REPLACE FUNCTION update_presence_heartbeat()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_heartbeat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER presence_heartbeat_trigger
    BEFORE UPDATE ON user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_presence_heartbeat();

-- Update stream viewer count
CREATE OR REPLACE FUNCTION update_stream_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE live_streams 
        SET current_viewers = current_viewers + 1,
            total_views = total_views + 1,
            peak_viewers = GREATEST(peak_viewers, current_viewers + 1)
        WHERE id = NEW.stream_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.left_at IS NOT NULL AND OLD.left_at IS NULL) THEN
        UPDATE live_streams 
        SET current_viewers = GREATEST(current_viewers - 1, 0)
        WHERE id = COALESCE(NEW.stream_id, OLD.stream_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stream_viewer_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON stream_viewers
    FOR EACH ROW
    EXECUTE FUNCTION update_stream_viewer_count();

-- Log presence event
CREATE OR REPLACE FUNCTION log_presence_event(
    p_user_id UUID,
    p_event_type VARCHAR(30),
    p_page TEXT DEFAULT NULL,
    p_event_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO presence_events (user_id, event_type, page, event_id, metadata)
    VALUES (p_user_id, p_event_type, p_page, p_event_id, p_metadata)
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up stale presence (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM user_presence 
    WHERE last_heartbeat < NOW() - INTERVAL '5 minutes'
    RETURNING 1 INTO v_deleted;
    
    RETURN COALESCE(v_deleted, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- GRANTS
-- ==========================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT INSERT ON ai_search_logs, ai_recommendations, user_presence, presence_events, 
    onboarding_progress, user_themes, live_streams, stream_viewers, 
    stream_chat_messages, stream_reactions, stream_donations TO authenticated;

GRANT UPDATE ON user_presence, onboarding_progress, user_themes, live_streams, 
    stream_viewers, ai_recommendations TO authenticated;

GRANT DELETE ON user_presence, user_themes, stream_viewers TO authenticated;

-- ==========================================
-- SEED DATA
-- ==========================================

-- Insert some public theme presets
INSERT INTO user_themes (user_id, name, is_active, is_public, colors, usage_count) VALUES
(
    (SELECT id FROM auth.users LIMIT 1),
    'Fernhill Forest',
    FALSE,
    TRUE,
    '{
        "primary": "#2d5a27",
        "primaryForeground": "#ffffff",
        "secondary": "#8b7355",
        "secondaryForeground": "#ffffff",
        "background": "#faf9f6",
        "foreground": "#1a1a1a",
        "card": "#ffffff",
        "cardForeground": "#1a1a1a",
        "accent": "#d4a574",
        "accentForeground": "#1a1a1a"
    }'::jsonb,
    100
),
(
    (SELECT id FROM auth.users LIMIT 1),
    'Midnight Dance',
    FALSE,
    TRUE,
    '{
        "primary": "#8b5cf6",
        "primaryForeground": "#ffffff",
        "secondary": "#ec4899",
        "secondaryForeground": "#ffffff",
        "background": "#0f0f23",
        "foreground": "#e5e5e5",
        "card": "#1a1a2e",
        "cardForeground": "#e5e5e5",
        "accent": "#f472b6",
        "accentForeground": "#ffffff"
    }'::jsonb,
    75
),
(
    (SELECT id FROM auth.users LIMIT 1),
    'Sunrise Flow',
    FALSE,
    TRUE,
    '{
        "primary": "#f97316",
        "primaryForeground": "#ffffff",
        "secondary": "#fbbf24",
        "secondaryForeground": "#1a1a1a",
        "background": "#fffbeb",
        "foreground": "#1a1a1a",
        "card": "#ffffff",
        "cardForeground": "#1a1a1a",
        "accent": "#fb923c",
        "accentForeground": "#ffffff"
    }'::jsonb,
    50
)
ON CONFLICT DO NOTHING;

-- Success message
DO $$ BEGIN RAISE NOTICE '✅ Phase J: Supernova migration complete!'; END $$;
