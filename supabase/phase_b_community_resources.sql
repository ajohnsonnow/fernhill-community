-- ============================================================
-- PHASE B: COMMUNITY RESOURCES SCHEMA
-- Housing Hub, Classifieds, Business Directory, Mutual Aid
-- Version 1.8.0
-- ============================================================

-- ============================================================
-- 1. HOUSING HUB
-- ============================================================

-- Housing listings (rooms, apartments, houses)
CREATE TABLE IF NOT EXISTS housing_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Listing type
    listing_type TEXT NOT NULL CHECK (listing_type IN ('room', 'apartment', 'house', 'sublet', 'roommate-wanted')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Location (general area, not exact address for safety)
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Portland',
    zip_code TEXT,
    
    -- Details
    rent_amount INTEGER, -- monthly in cents
    deposit_amount INTEGER, -- in cents
    utilities_included BOOLEAN DEFAULT false,
    bedrooms INTEGER,
    bathrooms NUMERIC(2,1),
    sqft INTEGER,
    available_date DATE,
    lease_length TEXT, -- 'month-to-month', '6-months', '1-year', 'flexible'
    
    -- Amenities (stored as JSONB for flexibility)
    amenities JSONB DEFAULT '[]'::jsonb,
    -- Example: ["parking", "laundry", "pet-friendly", "wheelchair-accessible", "dance-space"]
    
    -- Roommate preferences (for roommate-wanted listings)
    roommate_preferences JSONB DEFAULT '{}'::jsonb,
    -- Example: {"gender_preference": "any", "age_range": "25-40", "dancer_preferred": true, "quiet_hours": true}
    
    -- Photos
    photos TEXT[] DEFAULT '{}',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'filled', 'expired', 'removed')),
    
    -- Contact preferences
    contact_method TEXT DEFAULT 'app' CHECK (contact_method IN ('app', 'email', 'phone', 'any')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(neighborhood, '')), 'C')
    ) STORED
);

-- Housing saved/favorites
CREATE TABLE IF NOT EXISTS housing_favorites (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES housing_listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, listing_id)
);

-- Housing inquiries/messages
CREATE TABLE IF NOT EXISTS housing_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES housing_listings(id) ON DELETE CASCADE,
    inquirer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'read', 'replied')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CLASSIFIEDS MARKETPLACE
-- ============================================================

CREATE TABLE IF NOT EXISTS classifieds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Type and category
    listing_type TEXT NOT NULL CHECK (listing_type IN ('for-sale', 'wanted', 'free', 'trade')),
    category TEXT NOT NULL CHECK (category IN (
        'dance-shoes', 'dance-costumes', 'dance-accessories', 'music-equipment',
        'electronics', 'furniture', 'clothing', 'vehicles', 'services', 'tickets', 'other'
    )),
    
    -- Details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER, -- in cents, NULL for free/wanted/trade
    is_negotiable BOOLEAN DEFAULT true,
    condition TEXT CHECK (condition IN ('new', 'like-new', 'good', 'fair', 'parts-only')),
    
    -- Photos
    photos TEXT[] DEFAULT '{}',
    
    -- Location
    location TEXT, -- general area for pickup
    shipping_available BOOLEAN DEFAULT false,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'expired', 'removed')),
    
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

-- Classifieds favorites
CREATE TABLE IF NOT EXISTS classifieds_favorites (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, listing_id)
);

-- Classifieds offers/messages
CREATE TABLE IF NOT EXISTS classifieds_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
    offerer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    offer_amount INTEGER, -- in cents, NULL for non-price offers
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. LOCAL BUSINESS DIRECTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS local_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- community member who owns/manages
    submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Business info
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'dance-studio', 'dance-school', 'music-venue', 'restaurant', 'bar', 'cafe',
        'fitness', 'wellness', 'clothing', 'shoes', 'services', 'entertainment', 'other'
    )),
    
    -- Contact
    address TEXT,
    city TEXT DEFAULT 'Portland',
    phone TEXT,
    email TEXT,
    website TEXT,
    social_media JSONB DEFAULT '{}'::jsonb,
    
    -- Hours (stored as JSONB for flexibility)
    hours JSONB DEFAULT '{}'::jsonb,
    -- Example: {"monday": "9am-6pm", "tuesday": "9am-6pm", ...}
    
    -- Details
    photos TEXT[] DEFAULT '{}',
    logo_url TEXT,
    
    -- Community connection
    community_discount TEXT, -- special discount for community members
    is_community_owned BOOLEAN DEFAULT false, -- owned by a community member
    dance_friendly BOOLEAN DEFAULT false, -- hosts dance events or is dance-related
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'closed')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(category, '')), 'C')
    ) STORED
);

-- Business reviews
CREATE TABLE IF NOT EXISTS business_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES local_businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_id) -- one review per user per business
);

-- Business favorites
CREATE TABLE IF NOT EXISTS business_favorites (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES local_businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, business_id)
);

-- ============================================================
-- 4. MUTUAL AID NETWORK
-- ============================================================

CREATE TABLE IF NOT EXISTS mutual_aid_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Type: offering help or requesting help
    post_type TEXT NOT NULL CHECK (post_type IN ('offer', 'request')),
    
    -- Category
    category TEXT NOT NULL CHECK (category IN (
        'transportation', 'housing', 'food', 'childcare', 'pet-care',
        'moving-help', 'emotional-support', 'skills-teaching', 'equipment-loan',
        'financial', 'medical', 'errands', 'other'
    )),
    
    -- Details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Location/availability
    location TEXT,
    available_dates TEXT, -- flexible text for availability
    is_recurring BOOLEAN DEFAULT false,
    
    -- Urgency (for requests)
    urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
    
    -- Privacy
    is_anonymous BOOLEAN DEFAULT false,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired', 'removed')),
    fulfilled_by UUID REFERENCES profiles(id),
    fulfilled_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED
);

-- Mutual aid responses
CREATE TABLE IF NOT EXISTS mutual_aid_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES mutual_aid_posts(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mutual aid karma/thank you system
CREATE TABLE IF NOT EXISTS mutual_aid_thanks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES mutual_aid_posts(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, from_user_id) -- one thank you per post per user
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Housing
CREATE INDEX IF NOT EXISTS idx_housing_listings_user ON housing_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_housing_listings_status ON housing_listings(status);
CREATE INDEX IF NOT EXISTS idx_housing_listings_type ON housing_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_housing_listings_neighborhood ON housing_listings(neighborhood);
CREATE INDEX IF NOT EXISTS idx_housing_listings_search ON housing_listings USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_housing_listings_rent ON housing_listings(rent_amount) WHERE status = 'active';

-- Classifieds
CREATE INDEX IF NOT EXISTS idx_classifieds_user ON classifieds(user_id);
CREATE INDEX IF NOT EXISTS idx_classifieds_status ON classifieds(status);
CREATE INDEX IF NOT EXISTS idx_classifieds_type ON classifieds(listing_type);
CREATE INDEX IF NOT EXISTS idx_classifieds_category ON classifieds(category);
CREATE INDEX IF NOT EXISTS idx_classifieds_search ON classifieds USING gin(search_vector);

-- Businesses
CREATE INDEX IF NOT EXISTS idx_businesses_status ON local_businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON local_businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_search ON local_businesses USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_business_reviews_business ON business_reviews(business_id);

-- Mutual Aid
CREATE INDEX IF NOT EXISTS idx_mutual_aid_user ON mutual_aid_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_mutual_aid_status ON mutual_aid_posts(status);
CREATE INDEX IF NOT EXISTS idx_mutual_aid_type ON mutual_aid_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_mutual_aid_category ON mutual_aid_posts(category);
CREATE INDEX IF NOT EXISTS idx_mutual_aid_urgency ON mutual_aid_posts(urgency) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_mutual_aid_search ON mutual_aid_posts USING gin(search_vector);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE housing_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifieds ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifieds_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifieds_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutual_aid_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutual_aid_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutual_aid_thanks ENABLE ROW LEVEL SECURITY;

-- Housing policies
CREATE POLICY "Users can view active housing listings" ON housing_listings
    FOR SELECT USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can create housing listings" ON housing_listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own housing listings" ON housing_listings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own housing listings" ON housing_listings
    FOR DELETE USING (auth.uid() = user_id);

-- Housing favorites
CREATE POLICY "Users can manage own housing favorites" ON housing_favorites
    FOR ALL USING (auth.uid() = user_id);

-- Housing inquiries
CREATE POLICY "Users can view inquiries on own listings or own inquiries" ON housing_inquiries
    FOR SELECT USING (
        auth.uid() = inquirer_id OR
        auth.uid() = (SELECT user_id FROM housing_listings WHERE id = listing_id)
    );

CREATE POLICY "Users can create housing inquiries" ON housing_inquiries
    FOR INSERT WITH CHECK (auth.uid() = inquirer_id);

-- Classifieds policies
CREATE POLICY "Users can view active classifieds" ON classifieds
    FOR SELECT USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can create classifieds" ON classifieds
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own classifieds" ON classifieds
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own classifieds" ON classifieds
    FOR DELETE USING (auth.uid() = user_id);

-- Classifieds favorites
CREATE POLICY "Users can manage own classifieds favorites" ON classifieds_favorites
    FOR ALL USING (auth.uid() = user_id);

-- Classifieds offers
CREATE POLICY "Users can view offers on own listings or own offers" ON classifieds_offers
    FOR SELECT USING (
        auth.uid() = offerer_id OR
        auth.uid() = (SELECT user_id FROM classifieds WHERE id = listing_id)
    );

CREATE POLICY "Users can create classifieds offers" ON classifieds_offers
    FOR INSERT WITH CHECK (auth.uid() = offerer_id);

CREATE POLICY "Sellers can update offers on their listings" ON classifieds_offers
    FOR UPDATE USING (
        auth.uid() = (SELECT user_id FROM classifieds WHERE id = listing_id)
    );

-- Business policies
CREATE POLICY "Anyone can view active businesses" ON local_businesses
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can submit businesses" ON local_businesses
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Owners can update their businesses" ON local_businesses
    FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = submitted_by);

-- Business reviews
CREATE POLICY "Anyone can view reviews" ON business_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON business_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON business_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON business_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Business favorites
CREATE POLICY "Users can manage own business favorites" ON business_favorites
    FOR ALL USING (auth.uid() = user_id);

-- Mutual aid policies
CREATE POLICY "Users can view active mutual aid posts" ON mutual_aid_posts
    FOR SELECT USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can create mutual aid posts" ON mutual_aid_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mutual aid posts" ON mutual_aid_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mutual aid posts" ON mutual_aid_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Mutual aid responses
CREATE POLICY "Users can view responses to own posts or own responses" ON mutual_aid_responses
    FOR SELECT USING (
        auth.uid() = responder_id OR
        auth.uid() = (SELECT user_id FROM mutual_aid_posts WHERE id = post_id)
    );

CREATE POLICY "Users can create mutual aid responses" ON mutual_aid_responses
    FOR INSERT WITH CHECK (auth.uid() = responder_id);

-- Mutual aid thanks
CREATE POLICY "Users can view thanks" ON mutual_aid_thanks
    FOR SELECT USING (true);

CREATE POLICY "Users can create thanks" ON mutual_aid_thanks
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Housing photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('housing-photos', 'housing-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Classifieds photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('classifieds-photos', 'classifieds-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Business photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-photos', 'business-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload housing photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'housing-photos');

CREATE POLICY "Anyone can view housing photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'housing-photos');

CREATE POLICY "Users can delete own housing photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'housing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload classifieds photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'classifieds-photos');

CREATE POLICY "Anyone can view classifieds photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'classifieds-photos');

CREATE POLICY "Users can delete own classifieds photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'classifieds-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload business photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'business-photos');

CREATE POLICY "Anyone can view business photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-photos');

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get user's mutual aid karma (number of times thanked)
CREATE OR REPLACE FUNCTION get_mutual_aid_karma(p_user_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM mutual_aid_thanks
    WHERE to_user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- Get business average rating
CREATE OR REPLACE FUNCTION get_business_rating(p_business_id UUID)
RETURNS JSONB AS $$
    SELECT jsonb_build_object(
        'average', COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
        'count', COUNT(*)
    )
    FROM business_reviews
    WHERE business_id = p_business_id;
$$ LANGUAGE SQL STABLE;

COMMENT ON TABLE housing_listings IS 'Community housing listings - rooms, apartments, roommate finder';
COMMENT ON TABLE classifieds IS 'Buy/sell/trade marketplace for community members';
COMMENT ON TABLE local_businesses IS 'Directory of local businesses supporting the community';
COMMENT ON TABLE mutual_aid_posts IS 'Community mutual aid network for help requests and offers';
