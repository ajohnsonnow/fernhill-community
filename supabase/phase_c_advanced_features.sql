-- ============================================================
-- PHASE C: ADVANCED COMMUNITY FEATURES + CHANNEL PARITY
-- Lost & Found, Announcements, Ride Share, Skills, Polls, Partner Finder
-- Version 1.9.0
-- ============================================================

-- ============================================================
-- 1. LOST & FOUND SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS lost_and_found (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Type: lost or found
    item_type TEXT NOT NULL CHECK (item_type IN ('lost', 'found')),
    
    -- Item details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'clothing', 'accessories', 'electronics', 'keys', 'wallet',
        'dance-gear', 'jewelry', 'water-bottle', 'bag', 'other'
    )),
    
    -- Location and date
    last_seen_location TEXT,
    last_seen_date DATE,
    
    -- Photos
    photos TEXT[] DEFAULT '{}',
    
    -- Contact preferences
    contact_method TEXT DEFAULT 'app' CHECK (contact_method IN ('app', 'direct')),
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
    resolved_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED
);

CREATE INDEX IF NOT EXISTS idx_lost_found_user ON lost_and_found(user_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_type ON lost_and_found(item_type);
CREATE INDEX IF NOT EXISTS idx_lost_found_status ON lost_and_found(status);
CREATE INDEX IF NOT EXISTS idx_lost_found_search ON lost_and_found USING gin(search_vector);

-- ============================================================
-- 2. OFFICIAL ANNOUNCEMENTS (Admin-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'logistics', 'event', 'policy', 'safety', 'community', 'urgent'
    )),
    
    -- Priority for sorting
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Pinning
    is_pinned BOOLEAN DEFAULT false,
    pinned_until TIMESTAMPTZ,
    
    -- Media
    image_url TEXT,
    
    -- Visibility
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    publish_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcement read tracking
CREATE TABLE IF NOT EXISTS announcement_reads (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned, publish_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);

-- ============================================================
-- 3. SPICY CHAT LOUNGE (18+ Community Discussion)
-- ============================================================

CREATE TABLE IF NOT EXISTS lounge_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT NOT NULL,
    topic TEXT CHECK (topic IN ('general', 'dating', 'relationships', 'wellness', 'deep-talk')),
    
    -- Age restriction
    is_18_plus BOOLEAN DEFAULT true,
    
    -- Anonymity option
    is_anonymous BOOLEAN DEFAULT false,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'removed')),
    
    -- Engagement
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lounge_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES lounge_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lounge_posts_topic ON lounge_posts(topic);
CREATE INDEX IF NOT EXISTS idx_lounge_posts_created ON lounge_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lounge_replies_post ON lounge_replies(post_id);

-- ============================================================
-- 4. RIDE SHARE (Carpool System)
-- ============================================================

CREATE TABLE IF NOT EXISTS ride_share (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Ride type
    ride_type TEXT NOT NULL CHECK (ride_type IN ('offering', 'requesting')),
    
    -- Trip details
    event_id UUID REFERENCES event_submissions(id) ON DELETE SET NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    return_time TIMESTAMPTZ,
    
    -- Capacity
    available_seats INTEGER CHECK (available_seats >= 0 AND available_seats <= 10),
    current_passengers INTEGER DEFAULT 0,
    
    -- Preferences
    preferences JSONB DEFAULT '{}'::jsonb,
    -- Example: {"music": "quiet", "stops": "direct", "contribution": "gas-money"}
    
    -- Cost sharing
    suggested_contribution TEXT, -- e.g., "$10 gas money"
    
    -- Notes
    notes TEXT,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'full', 'completed', 'cancelled')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ride requests/joins
CREATE TABLE IF NOT EXISTS ride_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES ride_share(id) ON DELETE CASCADE,
    passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_share_driver ON ride_share(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_share_departure ON ride_share(departure_time);
CREATE INDEX IF NOT EXISTS idx_ride_share_status ON ride_share(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_ride ON ride_requests(ride_id);

-- ============================================================
-- 5. SKILL EXCHANGE (Teach/Learn Marketplace)
-- ============================================================

CREATE TABLE IF NOT EXISTS skill_exchange (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Offering or seeking
    exchange_type TEXT NOT NULL CHECK (exchange_type IN ('offering', 'seeking')),
    
    -- Skill details
    skill_category TEXT NOT NULL CHECK (skill_category IN (
        'dance-salsa', 'dance-bachata', 'dance-kizomba', 'dance-swing', 
        'dance-ecstatic', 'dance-contemporary', 'dance-other',
        'music', 'art', 'wellness', 'cooking', 'language', 'tech', 'other'
    )),
    skill_name TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Experience level
    level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    
    -- Availability
    availability TEXT, -- e.g., "Weekends, evenings"
    location_preference TEXT, -- e.g., "North Portland, can travel"
    
    -- Exchange preferences
    exchange_preferences JSONB DEFAULT '{}'::jsonb,
    -- Example: {"trade": true, "paid": false, "group-ok": true}
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'fulfilled')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(skill_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED
);

CREATE INDEX IF NOT EXISTS idx_skill_exchange_user ON skill_exchange(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_exchange_type ON skill_exchange(exchange_type);
CREATE INDEX IF NOT EXISTS idx_skill_exchange_category ON skill_exchange(skill_category);
CREATE INDEX IF NOT EXISTS idx_skill_exchange_search ON skill_exchange USING gin(search_vector);

-- ============================================================
-- 6. COMMUNITY POLLS
-- ============================================================

CREATE TABLE IF NOT EXISTS community_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Poll details
    question TEXT NOT NULL,
    description TEXT,
    
    -- Options (stored as JSONB array)
    options JSONB NOT NULL,
    -- Example: [{"id": "opt1", "text": "Option 1"}, {"id": "opt2", "text": "Option 2"}]
    
    -- Settings
    allows_multiple BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    requires_verification BOOLEAN DEFAULT false, -- only verified members can vote
    
    -- Visibility
    is_admin_only BOOLEAN DEFAULT false, -- only admins can create
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed')),
    closes_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll votes
CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES community_polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    option_id TEXT NOT NULL, -- matches option.id from poll options JSONB
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poll_id, user_id, option_id)
);

CREATE INDEX IF NOT EXISTS idx_polls_status ON community_polls(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);

-- ============================================================
-- 7. DANCE PARTNER FINDER
-- ============================================================

CREATE TABLE IF NOT EXISTS dance_partner_profiles (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Dance styles (JSONB array for flexibility)
    styles JSONB DEFAULT '[]'::jsonb,
    -- Example: ["salsa", "bachata", "kizomba", "ecstatic"]
    
    -- Experience level per style
    experience_levels JSONB DEFAULT '{}'::jsonb,
    -- Example: {"salsa": "intermediate", "bachata": "beginner"}
    
    -- Preferences
    looking_for TEXT[] DEFAULT '{}', -- ['practice-partner', 'social-dancing', 'performance']
    availability TEXT, -- "Weekends, Wednesday evenings"
    location TEXT, -- "North Portland"
    
    -- Bio
    bio TEXT,
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    show_in_directory BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner match requests
CREATE TABLE IF NOT EXISTS partner_match_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_profiles_active ON dance_partner_profiles(is_active) WHERE show_in_directory = true;
CREATE INDEX IF NOT EXISTS idx_partner_requests_to_user ON partner_match_requests(to_user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('lost-found-photos', 'lost-found-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('announcement-images', 'announcement-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies first (idempotent)
DROP POLICY IF EXISTS "Authenticated users can upload lost-found photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view lost-found photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own lost-found photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload announcement images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view announcement images" ON storage.objects;

-- Storage policies
CREATE POLICY "Authenticated users can upload lost-found photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lost-found-photos');

CREATE POLICY "Anyone can view lost-found photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'lost-found-photos');

CREATE POLICY "Users can delete own lost-found photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lost-found-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can upload announcement images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'announcement-images');

CREATE POLICY "Anyone can view announcement images"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcement-images');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE lost_and_found ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_share ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_exchange ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dance_partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_match_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Users can view active lost & found" ON lost_and_found;
DROP POLICY IF EXISTS "Users can create lost & found posts" ON lost_and_found;
DROP POLICY IF EXISTS "Users can update own posts" ON lost_and_found;
DROP POLICY IF EXISTS "Anyone can view published announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Users can manage own reads" ON announcement_reads;
DROP POLICY IF EXISTS "Users can view active lounge posts" ON lounge_posts;
DROP POLICY IF EXISTS "Users can create lounge posts" ON lounge_posts;
DROP POLICY IF EXISTS "Users can update own lounge posts" ON lounge_posts;
DROP POLICY IF EXISTS "Users can view lounge replies" ON lounge_replies;
DROP POLICY IF EXISTS "Users can create lounge replies" ON lounge_replies;
DROP POLICY IF EXISTS "Users can view active rides" ON ride_share;
DROP POLICY IF EXISTS "Users can create rides" ON ride_share;
DROP POLICY IF EXISTS "Users can update own rides" ON ride_share;
DROP POLICY IF EXISTS "Users can view ride requests" ON ride_requests;
DROP POLICY IF EXISTS "Users can create ride requests" ON ride_requests;
DROP POLICY IF EXISTS "Users can view active skill exchanges" ON skill_exchange;
DROP POLICY IF EXISTS "Users can create skill exchanges" ON skill_exchange;
DROP POLICY IF EXISTS "Users can update own exchanges" ON skill_exchange;
DROP POLICY IF EXISTS "Users can view active polls" ON community_polls;
DROP POLICY IF EXISTS "Users can create polls" ON community_polls;
DROP POLICY IF EXISTS "Creators can update own polls" ON community_polls;
DROP POLICY IF EXISTS "Users can view poll results" ON poll_votes;
DROP POLICY IF EXISTS "Users can vote" ON poll_votes;
DROP POLICY IF EXISTS "Users can view active partner profiles" ON dance_partner_profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON dance_partner_profiles;
DROP POLICY IF EXISTS "Users can view their match requests" ON partner_match_requests;
DROP POLICY IF EXISTS "Users can create match requests" ON partner_match_requests;
DROP POLICY IF EXISTS "Recipients can update requests" ON partner_match_requests;

-- Lost & Found
CREATE POLICY "Users can view active lost & found" ON lost_and_found
    FOR SELECT USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can create lost & found posts" ON lost_and_found
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON lost_and_found
    FOR UPDATE USING (auth.uid() = user_id);

-- Announcements (read-only for non-admins)
CREATE POLICY "Anyone can view published announcements" ON announcements
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage announcements" ON announcements
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
    );

-- Announcement reads
CREATE POLICY "Users can manage own reads" ON announcement_reads
    FOR ALL USING (auth.uid() = user_id);

-- Lounge Posts
CREATE POLICY "Users can view active lounge posts" ON lounge_posts
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create lounge posts" ON lounge_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lounge posts" ON lounge_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Lounge Replies
CREATE POLICY "Users can view lounge replies" ON lounge_replies
    FOR SELECT USING (true);

CREATE POLICY "Users can create lounge replies" ON lounge_replies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ride Share
CREATE POLICY "Users can view active rides" ON ride_share
    FOR SELECT USING (status IN ('active', 'full'));

CREATE POLICY "Users can create rides" ON ride_share
    FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Users can update own rides" ON ride_share
    FOR UPDATE USING (auth.uid() = driver_id);

-- Ride Requests
CREATE POLICY "Users can view ride requests" ON ride_requests
    FOR SELECT USING (
        auth.uid() = passenger_id OR
        auth.uid() = (SELECT driver_id FROM ride_share WHERE id = ride_id)
    );

CREATE POLICY "Users can create ride requests" ON ride_requests
    FOR INSERT WITH CHECK (auth.uid() = passenger_id);

-- Skill Exchange
CREATE POLICY "Users can view active skill exchanges" ON skill_exchange
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create skill exchanges" ON skill_exchange
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exchanges" ON skill_exchange
    FOR UPDATE USING (auth.uid() = user_id);

-- Community Polls
CREATE POLICY "Users can view active polls" ON community_polls
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create polls" ON community_polls
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own polls" ON community_polls
    FOR UPDATE USING (auth.uid() = creator_id);

-- Poll Votes
CREATE POLICY "Users can view poll results" ON poll_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote" ON poll_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Dance Partner Profiles
CREATE POLICY "Users can view active partner profiles" ON dance_partner_profiles
    FOR SELECT USING (is_active = true AND show_in_directory = true);

CREATE POLICY "Users can manage own profile" ON dance_partner_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Partner Match Requests
CREATE POLICY "Users can view their match requests" ON partner_match_requests
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create match requests" ON partner_match_requests
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipients can update requests" ON partner_match_requests
    FOR UPDATE USING (auth.uid() = to_user_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get poll results
CREATE OR REPLACE FUNCTION get_poll_results(p_poll_id UUID)
RETURNS JSONB AS $$
    SELECT jsonb_agg(
        jsonb_build_object(
            'option_id', option_id,
            'vote_count', COUNT(*)
        )
    )
    FROM poll_votes
    WHERE poll_id = p_poll_id
    GROUP BY option_id;
$$ LANGUAGE SQL STABLE;

-- Match dance partners by style
CREATE OR REPLACE FUNCTION find_dance_partners(p_user_id UUID, p_style TEXT)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    bio TEXT,
    experience_level TEXT,
    availability TEXT
) AS $$
    SELECT 
        dpp.user_id,
        p.display_name,
        dpp.bio,
        dpp.experience_levels->p_style AS experience_level,
        dpp.availability
    FROM dance_partner_profiles dpp
    JOIN profiles p ON p.id = dpp.user_id
    WHERE dpp.is_active = true
    AND dpp.show_in_directory = true
    AND dpp.user_id != p_user_id
    AND dpp.styles ? p_style;
$$ LANGUAGE SQL STABLE;

COMMENT ON TABLE lost_and_found IS 'Community lost & found system for items';
COMMENT ON TABLE announcements IS 'Official admin announcements and logistics';
COMMENT ON TABLE lounge_posts IS 'Spicy Chat Lounge for 18+ community discussions';
COMMENT ON TABLE ride_share IS 'Carpool coordination for events';
COMMENT ON TABLE skill_exchange IS 'Teach/learn marketplace for skills and dance styles';
COMMENT ON TABLE community_polls IS 'Democratic community polling system';
COMMENT ON TABLE dance_partner_profiles IS 'Dance partner finder profiles and matching';
