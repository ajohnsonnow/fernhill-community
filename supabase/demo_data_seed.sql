-- =====================================================
-- DEMO DATA SEED SCRIPT
-- =====================================================
-- Comprehensive demo data for all Fernhill features
-- All demo data is flagged with is_demo = true for easy clearing
-- =====================================================

-- =====================================================
-- 1. ROADMAP ITEMS (Admin-managed public roadmap)
-- =====================================================
INSERT INTO roadmap_items (title, description, category, status, priority, target_quarter, release_version, emoji, is_featured, upvotes, completed_at) VALUES

-- Completed Features
('End-to-End Encryption', 'Secure messaging with RSA-OAEP + AES-GCM hybrid encryption', 'security', 'completed', 100, 'Q1 2026', '1.0.0', '🔐', false, 47, NOW() - INTERVAL '30 days'),
('Community Feed (Hearth)', 'Main social feed with posts, reactions, and categories', 'social', 'completed', 100, 'Q1 2026', '1.0.0', '🏠', false, 52, NOW() - INTERVAL '30 days'),
('Event Calendar with Google Sync', 'RSVP system with Google Calendar integration', 'events', 'completed', 95, 'Q1 2026', '1.1.0', '📅', false, 38, NOW() - INTERVAL '25 days'),
('Member Directory', 'Searchable profiles with vibe status indicators', 'community', 'completed', 90, 'Q1 2026', '1.2.0', '👥', false, 29, NOW() - INTERVAL '20 days'),
('Photo Gallery (Altar)', 'Private photo sharing with EXIF stripping', 'social', 'completed', 85, 'Q1 2026', '1.3.0', '📸', false, 33, NOW() - INTERVAL '18 days'),
('Community Polls', 'Create and vote on community polls', 'community', 'completed', 80, 'Q1 2026', '1.9.0', '📊', false, 41, NOW() - INTERVAL '10 days'),
('Achievement Badges', '11 badge types with gamification system', 'social', 'completed', 75, 'Q1 2026', '1.10.0', '🏆', true, 56, NOW() - INTERVAL '7 days'),
('PWA with Offline Support', 'Installable app with service worker caching', 'mobile', 'completed', 100, 'Q1 2026', '1.0.0', '📱', false, 44, NOW() - INTERVAL '30 days'),

-- In Progress Features
('AI Community Assistant', 'Smart assistant for community questions and recommendations', 'community', 'in_progress', 90, 'Q1 2026', NULL, '🤖', true, 73),
('Advanced Analytics Dashboard', 'Community health metrics and engagement insights', 'admin', 'in_progress', 85, 'Q1 2026', NULL, '📈', false, 31),
('Voice Messages in DMs', 'Record and send voice notes in private messages', 'messaging', 'in_progress', 80, 'Q1 2026', NULL, '🎤', false, 48),

-- Planned Features
('Video Chat Rooms', 'Built-in video conferencing for virtual gatherings', 'social', 'planned', 70, 'Q2 2026', NULL, '📹', true, 89),
('Event Ticket Sales', 'Integrated ticketing with Stripe payments', 'events', 'planned', 75, 'Q2 2026', NULL, '🎫', false, 67),
('Mobile Push Notifications', 'Real-time push notifications for important updates', 'mobile', 'planned', 85, 'Q1 2026', NULL, '🔔', false, 54),
('Multi-Language Support', 'Interface translation for Spanish, French, German', 'accessibility', 'planned', 60, 'Q2 2026', NULL, '🌍', false, 42),
('Dark Mode Themes', 'Additional theme options beyond default dark mode', 'accessibility', 'planned', 50, 'Q2 2026', NULL, '🎨', false, 38),
('Calendar Widget Embed', 'Embeddable calendar widget for external websites', 'events', 'planned', 45, 'Q3 2026', NULL, '🗓️', false, 23),
('API for Third-Party Apps', 'Public API for approved integrations', 'performance', 'planned', 40, 'Q3 2026', NULL, '🔌', false, 19),
('Two-Factor Authentication', 'Optional 2FA for enhanced account security', 'security', 'planned', 80, 'Q2 2026', NULL, '🔒', false, 61),
('Collaborative Playlists', 'Community members can add tracks to shared playlists', 'social', 'planned', 65, 'Q2 2026', NULL, '🎵', false, 45),
('Stories Feature', '24-hour disappearing photo/video stories', 'social', 'planned', 55, 'Q3 2026', NULL, '📷', false, 52)

ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. FEATURE REQUESTS (Community submitted)
-- =====================================================

-- Note: These need a valid user ID. We'll create a generic approach
-- that works with existing users or creates placeholder entries

DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  -- Try to get an existing admin or active user
  SELECT id INTO demo_user_id FROM profiles WHERE status IN ('admin', 'active') LIMIT 1;
  
  -- If no user exists, we'll skip the user-dependent inserts
  IF demo_user_id IS NOT NULL THEN
    
    -- Feature Requests
    INSERT INTO feature_requests (title, description, category, status, submitted_by, upvotes, admin_notes, is_demo) VALUES
    
    -- Popular submitted requests
    ('Dark theme customization', 'Would love to be able to customize the dark theme colors - maybe choose accent colors or adjust contrast levels', 'accessibility', 'under_review', demo_user_id, 34, 'Great idea! We''re looking into theme builder options.', true),
    ('Export calendar to iCal', 'Ability to export community events to iCal format for other calendar apps', 'events', 'accepted', demo_user_id, 28, 'Added to Q2 roadmap!', true),
    ('Recurring events', 'Support for weekly/monthly recurring events without manual re-creation', 'events', 'in_progress', demo_user_id, 45, 'Currently being developed', true),
    ('Bulk photo upload', 'Upload multiple photos at once to the Altar instead of one by one', 'social', 'submitted', demo_user_id, 22, NULL, true),
    ('Member search filters', 'Filter directory by dance style, experience level, availability', 'community', 'accepted', demo_user_id, 31, 'Will be part of Directory 2.0', true),
    ('Private groups/tribes', 'Create private sub-communities within Fernhill', 'community', 'under_review', demo_user_id, 56, 'Researching implementation options', true),
    ('Event reminders', 'Push notifications 1 hour before RSVP''d events', 'events', 'submitted', demo_user_id, 19, NULL, true),
    ('Profile music preferences', 'Add favorite dance styles and music genres to profile', 'social', 'completed', demo_user_id, 37, 'Shipped in v1.9.0!', true),
    ('Emoji reactions on comments', 'React to comments with emojis like on posts', 'social', 'submitted', demo_user_id, 15, NULL, true),
    ('Event photo galleries', 'Dedicated photo album for each event', 'events', 'under_review', demo_user_id, 41, 'Considering integration with Altar', true),
    ('Reading time estimates', 'Show estimated read time for long posts', 'social', 'declined', demo_user_id, 8, 'Most community posts are short - low priority', true),
    ('Markdown support in posts', 'Allow basic markdown formatting in Hearth posts', 'social', 'submitted', demo_user_id, 12, NULL, true),
    ('Desktop app (Electron)', 'Native desktop application for Windows/Mac', 'mobile', 'submitted', demo_user_id, 24, NULL, true),
    ('Event waitlist', 'Automatic waitlist when events reach capacity', 'events', 'accepted', demo_user_id, 33, 'Coming in Events 2.0', true),
    ('Keyboard shortcuts', 'Vim-style shortcuts for power users', 'accessibility', 'submitted', demo_user_id, 9, NULL, true),
    ('Offline message queue', 'Queue messages when offline, send when reconnected', 'messaging', 'in_progress', demo_user_id, 27, 'Part of PWA improvements', true),
    ('Profile badges visibility', 'Toggle to show/hide badges on profile', 'social', 'submitted', demo_user_id, 11, NULL, true),
    ('Event carpooling integration', 'Dedicated carpool board per event', 'events', 'submitted', demo_user_id, 38, NULL, true),
    ('Read receipts in DMs', 'Optional read receipts for direct messages', 'messaging', 'under_review', demo_user_id, 21, 'Privacy considerations being evaluated', true),
    ('Community announcements email digest', 'Weekly email summary of important announcements', 'community', 'submitted', demo_user_id, 16, NULL, true)
    
    ON CONFLICT DO NOTHING;

    -- Bug Reports
    INSERT INTO bug_reports (title, description, steps_to_reproduce, expected_behavior, actual_behavior, severity, status, reported_by, affected_page, admin_notes, fixed_in_version, is_demo) VALUES
    
    ('Calendar timezone issues', 'Events show wrong time for users in different timezones', '1. Set device to PST\n2. Create event for 7pm\n3. View as user in EST', 'Event shows 10pm EST', 'Event shows 7pm EST', 'high', 'fixed', demo_user_id, '/events', 'Fixed with timezone-aware timestamps', '1.15.0', true),
    ('Avatar upload fails on Safari', 'Cannot upload profile photo on Safari iOS', '1. Open profile on Safari iOS\n2. Tap change avatar\n3. Select photo from library', 'Photo uploads and displays', 'Upload spinner spins forever', 'medium', 'fixed', demo_user_id, '/profile', 'Safari WebKit HEIC handling fixed', '1.14.2', true),
    ('Notification badge not clearing', 'Bell icon shows notification count after marking all read', '1. Have unread notifications\n2. Open notification panel\n3. Click "Mark all read"', 'Badge clears to 0', 'Badge still shows old count', 'low', 'in_progress', demo_user_id, NULL, 'Investigating cache invalidation', NULL, true),
    ('Search results don''t highlight matches', 'Directory search shows results but doesn''t highlight the matching text', '1. Go to directory\n2. Search for partial name\n3. View results', 'Matching text highlighted', 'Plain text, no highlighting', 'low', 'confirmed', demo_user_id, '/directory', NULL, NULL, true),
    ('Double post on slow connection', 'Clicking post button twice creates duplicate posts', '1. Write a post\n2. Click post on slow 3G\n3. Click again thinking it didn''t work', 'Single post created', 'Two identical posts created', 'medium', 'fixed', demo_user_id, '/hearth', 'Added debounce and loading state', '1.16.0', true),
    ('Dark mode flash on load', 'Brief white flash before dark mode applies on page load', '1. Enable dark mode\n2. Refresh page', 'Smooth dark load', 'White flash for 200ms', 'low', 'confirmed', demo_user_id, NULL, 'SSR hydration timing issue', NULL, true),
    ('Event RSVP count off by one', 'RSVP counter sometimes shows 1 less than actual', '1. RSVP to event as new user\n2. Check RSVP count', 'Count increments immediately', 'Count shows stale value', 'medium', 'in_progress', demo_user_id, '/events', 'Race condition in real-time subscription', NULL, true),
    ('Emoji picker closes unexpectedly', 'On mobile, emoji picker closes when scrolling through options', '1. Open post composer\n2. Tap emoji button\n3. Try to scroll emoji list', 'Can scroll through emojis', 'Picker closes on touch scroll', 'low', 'reported', demo_user_id, '/hearth', NULL, NULL, true),
    ('Profile bio truncation', 'Long bios get cut off without "read more" option', '1. Write 500+ char bio\n2. Save and view profile', 'Full bio or "read more"', 'Text just stops mid-sentence', 'low', 'reported', demo_user_id, '/profile', NULL, NULL, true),
    ('Messages not encrypting for new keys', 'If recipient regenerates keys, old sender can''t message them', '1. User A messages User B\n2. User B regenerates keys\n3. User A sends new message', 'Message encrypts with new key', 'Encryption fails silently', 'high', 'fixed', demo_user_id, '/messages', 'Key refresh sync implemented', '1.15.1', true),
    ('Poll results animation janky', 'Progress bars animate with visible stutter on mobile', '1. Vote in poll\n2. Watch results animate', 'Smooth 300ms transition', 'Choppy animation', 'low', 'wont_fix', demo_user_id, '/community', 'Hardware limitation on older devices', NULL, true),
    ('Can''t unRSVP from event', 'No way to remove RSVP after confirming attendance', '1. RSVP "Going" to event\n2. Try to change to "Not going"', 'Can change RSVP status', 'Only "Going"/"Maybe" options shown', 'medium', 'fixed', demo_user_id, '/events', 'Added "Can''t make it" option', '1.14.0', true),
    ('Infinite scroll loads duplicates', 'Sometimes the same posts appear twice when scrolling', '1. Scroll Hearth feed\n2. Keep scrolling past 50 posts', 'Each post appears once', 'Some posts duplicated', 'medium', 'in_progress', demo_user_id, '/hearth', 'Cursor-based pagination fix in progress', NULL, true),
    ('Weather widget shows wrong location', 'Weather shows Portland but user is elsewhere', '1. Be in Seattle\n2. View header weather', 'Weather for current location', 'Always shows Portland weather', 'low', 'wont_fix', demo_user_id, NULL, 'Intentional - shows event location weather', NULL, true),
    ('Push notifications not working iOS', 'No push notifications on iPhone even when enabled', '1. Enable notifications in settings\n2. Wait for new message\n3. App backgrounded', 'Push notification appears', 'No notification received', 'high', 'in_progress', demo_user_id, NULL, 'iOS PWA push requires special handling', NULL, true)
    
    ON CONFLICT DO NOTHING;
    
  END IF;
END $$;

-- =====================================================
-- 3. SAMPLE UPVOTES FOR ROADMAP
-- =====================================================
-- This simulates community engagement
-- Note: We can't create upvotes without real user IDs, 
-- but the upvote counts are set directly on the items above

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
DECLARE
  roadmap_count INTEGER;
  feature_count INTEGER;
  bug_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO roadmap_count FROM roadmap_items;
  SELECT COUNT(*) INTO feature_count FROM feature_requests WHERE is_demo = true;
  SELECT COUNT(*) INTO bug_count FROM bug_reports WHERE is_demo = true;
  
  RAISE NOTICE '✅ Demo data seeded successfully!';
  RAISE NOTICE 'Roadmap items: %', roadmap_count;
  RAISE NOTICE 'Feature requests (demo): %', feature_count;
  RAISE NOTICE 'Bug reports (demo): %', bug_count;
  RAISE NOTICE '';
  RAISE NOTICE 'To clear demo data, run: SELECT clear_demo_data();';
END $$;
