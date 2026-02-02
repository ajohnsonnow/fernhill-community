-- ============================================
-- Phase I: Diamond Status - Database Migration
-- Version: 1.15.0
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. DAILY CHALLENGES
-- ==========================================

CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL, -- daily, weekly, seasonal, special
    category VARCHAR(50) NOT NULL,
    xp_reward INTEGER DEFAULT 0 NOT NULL,
    bonus_xp INTEGER DEFAULT 0,
    requirement_action VARCHAR(50) NOT NULL,
    requirement_count INTEGER DEFAULT 1 NOT NULL,
    requirement_target VARCHAR(100),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
    progress INTEGER DEFAULT 0 NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    xp_awarded INTEGER DEFAULT 0,
    UNIQUE(user_id, challenge_id, assigned_at::date)
);

CREATE TABLE IF NOT EXISTS challenge_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    last_completed_date DATE,
    total_days_completed INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 2. STORIES
-- ==========================================

CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL, -- photo, text, poll, music, event, mood, shoutout
    content JSONB NOT NULL,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(story_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS story_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 3. TRIBES
-- ==========================================

CREATE TABLE IF NOT EXISTS tribes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    banner_url TEXT,
    avatar_url TEXT,
    visibility VARCHAR(20) DEFAULT 'public' NOT NULL,
    member_count INTEGER DEFAULT 0 NOT NULL,
    max_members INTEGER,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_official BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS tribe_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) DEFAULT 'member' NOT NULL,
    custom_title VARCHAR(50),
    xp_contributed INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    events_attended INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tribe_id, user_id)
);

CREATE TABLE IF NOT EXISTS tribe_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE NOT NULL,
    inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INTEGER DEFAULT 1,
    uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS tribe_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(tribe_id, user_id)
);

-- ==========================================
-- 4. REFERRALS
-- ==========================================

CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    uses INTEGER DEFAULT 0,
    max_uses INTEGER,
    xp_per_referral INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE NOT NULL,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    xp_awarded INTEGER DEFAULT 0,
    bonus_xp_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    rewarded_at TIMESTAMPTZ,
    UNIQUE(referred_user_id)
);

-- ==========================================
-- 5. MILESTONES & ANNIVERSARIES
-- ==========================================

CREATE TABLE IF NOT EXISTS user_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    milestone_type VARCHAR(50) NOT NULL,
    milestone_value INTEGER NOT NULL,
    xp_awarded INTEGER DEFAULT 0,
    achieved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    celebrated BOOLEAN DEFAULT FALSE,
    shared_to_feed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, milestone_type, milestone_value)
);

-- ==========================================
-- 6. NOTIFICATION PREFERENCES
-- ==========================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    push_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    digest_frequency VARCHAR(20) DEFAULT 'daily',
    digest_time TIME DEFAULT '09:00',
    digest_day INTEGER,
    category_settings JSONB DEFAULT '{}'::jsonb,
    smart_bundling BOOLEAN DEFAULT TRUE,
    smart_timing BOOLEAN DEFAULT TRUE,
    summary_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    sections JSONB NOT NULL,
    summary TEXT,
    total_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    sent_at TIMESTAMPTZ
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_user_challenges_user ON user_challenges(user_id, expires_at);
CREATE INDEX idx_user_challenges_completion ON user_challenges(user_id, is_completed);
CREATE INDEX idx_stories_user ON stories(user_id, created_at DESC);
CREATE INDEX idx_stories_active ON stories(is_active, expires_at);
CREATE INDEX idx_story_views_story ON story_views(story_id);
CREATE INDEX idx_tribes_category ON tribes(category, visibility);
CREATE INDEX idx_tribe_members_tribe ON tribe_members(tribe_id, role);
CREATE INDEX idx_tribe_members_user ON tribe_members(user_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_user_milestones_user ON user_milestones(user_id, achieved_at DESC);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_digests ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLICIES
-- ==========================================

-- Challenges
CREATE POLICY "select_challenges" ON challenges FOR SELECT USING (is_active = TRUE);
CREATE POLICY "select_user_challenges" ON user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_user_challenges" ON user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_user_challenges" ON user_challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "select_challenge_streaks" ON challenge_streaks FOR SELECT USING (auth.uid() = user_id);

-- Stories
CREATE POLICY "select_stories" ON stories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "insert_stories" ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_stories" ON stories FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "insert_story_views" ON story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "select_story_views" ON story_views FOR SELECT USING (true);
CREATE POLICY "insert_story_reactions" ON story_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tribes
CREATE POLICY "select_tribes" ON tribes FOR SELECT USING (visibility = 'public' OR id IN (SELECT tribe_id FROM tribe_members WHERE user_id = auth.uid()));
CREATE POLICY "insert_tribes" ON tribes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "update_tribes" ON tribes FOR UPDATE USING (id IN (SELECT tribe_id FROM tribe_members WHERE user_id = auth.uid() AND role = 'leader'));
CREATE POLICY "select_tribe_members" ON tribe_members FOR SELECT USING (true);
CREATE POLICY "insert_tribe_members" ON tribe_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_tribe_members" ON tribe_members FOR UPDATE USING (auth.uid() = user_id OR tribe_id IN (SELECT tribe_id FROM tribe_members WHERE user_id = auth.uid() AND role IN ('leader', 'elder')));

-- Referrals
CREATE POLICY "select_referral_codes" ON referral_codes FOR SELECT USING (auth.uid() = user_id OR is_active = TRUE);
CREATE POLICY "insert_referral_codes" ON referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "select_referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Milestones
CREATE POLICY "select_user_milestones" ON user_milestones FOR SELECT USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "select_notification_preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_notification_preferences" ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_notification_preferences" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "select_notification_digests" ON notification_digests FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- SEED CHALLENGES
-- ==========================================

INSERT INTO challenges (slug, title, description, icon, type, category, xp_reward, requirement_action, requirement_count) VALUES
('say_hello', 'Say Hello', 'Send a message to someone new', '👋', 'daily', 'social', 15, 'send_message', 1),
('hype_squad', 'Hype Squad', 'React to 5 posts with ❤️', '💖', 'daily', 'engagement', 10, 'react', 5),
('good_vibes', 'Good Vibes Only', 'Log your mood for today', '🌈', 'daily', 'wellness', 10, 'log_mood', 1),
('share_moment', 'Share a Moment', 'Post a story or update', '📸', 'daily', 'engagement', 20, 'create_post', 1),
('rsvp_ready', 'RSVP Ready', 'RSVP to an upcoming event', '✅', 'daily', 'attendance', 15, 'rsvp', 1),
('playlist_add', 'DJ Mode', 'Add a song to a community playlist', '🎵', 'daily', 'engagement', 15, 'add_track', 1),
('welcome_newbie', 'Welcome Committee', 'Welcome a new member', '🎉', 'daily', 'community', 25, 'welcome_new_member', 1),
('weekly_warrior', 'Weekly Warrior', 'Complete all daily challenges for 5 days', '⚔️', 'weekly', 'engagement', 100, 'complete_dailies', 5),
('social_butterfly', 'Social Butterfly', 'Connect with 3 new people this week', '🦋', 'weekly', 'social', 75, 'new_connection', 3),
('dance_floor_regular', 'Dance Floor Regular', 'Attend 2 events this week', '💃', 'weekly', 'attendance', 100, 'attend_event', 2)
ON CONFLICT (slug) DO NOTHING;

-- ==========================================
-- SEED DEFAULT TRIBES
-- ==========================================

INSERT INTO tribes (name, slug, description, category, icon, visibility, is_verified, is_official, created_by, settings) VALUES
('First Timers', 'first-timers', 'Welcome to Fernhill! A supportive space for newcomers to connect and learn.', 'skill_level', '🌱', 'public', TRUE, TRUE, NULL, '{"allowMemberPosts": true, "allowMemberEvents": false, "requireApproval": false}'::jsonb),
('Night Owls', 'night-owls', 'For those who dance past midnight 🦉', 'social', '🦉', 'public', TRUE, TRUE, NULL, '{"allowMemberPosts": true, "allowMemberEvents": true, "requireApproval": false}'::jsonb),
('Ecstatic Explorers', 'ecstatic-explorers', 'Deep diving into ecstatic dance and conscious movement', 'dance_style', '✨', 'public', TRUE, TRUE, NULL, '{"allowMemberPosts": true, "allowMemberEvents": true, "requireApproval": false}'::jsonb),
('Music Nerds', 'music-nerds', 'Deep discussions about music, DJs, and the art of the playlist', 'interest', '🎵', 'public', TRUE, TRUE, NULL, '{"allowMemberPosts": true, "allowMemberEvents": true, "requireApproval": false}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ==========================================
-- GRANTS
-- ==========================================

GRANT SELECT ON challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_challenges TO authenticated;
GRANT SELECT ON challenge_streaks TO authenticated;
GRANT SELECT, INSERT, DELETE ON stories TO authenticated;
GRANT SELECT, INSERT ON story_views TO authenticated;
GRANT SELECT, INSERT ON story_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON tribes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tribe_members TO authenticated;
GRANT SELECT, INSERT ON tribe_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE ON tribe_join_requests TO authenticated;
GRANT SELECT, INSERT ON referral_codes TO authenticated;
GRANT SELECT ON referrals TO authenticated;
GRANT SELECT ON user_milestones TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT SELECT ON notification_digests TO authenticated;

-- Success!
DO $$ BEGIN RAISE NOTICE '✅ Phase I: Diamond Status installed successfully!'; END $$;
