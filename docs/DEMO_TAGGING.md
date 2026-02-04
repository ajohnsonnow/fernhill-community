# Demo/Test Data Tagging Feature

## Overview
All demo and test data is now tagged with an `is_demo` field, making it easy to identify, filter, and clean up test content without affecting real user data.

## What's Tagged?

### Database Tables
- **profiles** - Demo user accounts
- **posts** - Demo posts
- **announcements** - Demo announcements
- **events** - Demo events (optional)
- **board_posts** - Demo discussion board posts

Each table now has an `is_demo` boolean column (default: false)

## Visual Indicators

### In the UI
Demo content displays a blue **"DEMO"** badge:
- In the Hearth feed next to author names
- In the admin user list
- On any demo posts or profiles

The badge style:
```css
px-2 py-0.5 text-xs rounded-full 
bg-blue-500/20 text-blue-400 
border border-blue-500/30
```

## Demo Data Generator Updates

### When Creating Demo Data
All data created by the DemoDataGenerator is automatically marked as demo:
- Demo profiles: `is_demo: true`
- Demo posts: `is_demo: true`
- Demo announcements: `is_demo: true`

### When Resetting Data
The "Reset to Baseline" function now:
1. **Prioritizes is_demo flag** - Deletes all `is_demo=true` records first
2. **Falls back gracefully** - If column doesn't exist, uses old method (delete non-admin content)
3. **Preserves admin accounts** - Never touches admin users
4. **Reports counts** - Shows how many demo items were deleted

## Database Changes

### Migration File: `demo_tagging_migration.sql`
Run this to add is_demo columns to existing databases:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_demo ON profiles(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_posts_is_demo ON posts(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_board_posts_is_demo ON board_posts(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_events_is_demo ON events(is_demo) WHERE is_demo = true;
```

### Updated COMPLETE_SETUP.sql
The main setup file now includes `is_demo` fields by default for new deployments.

## Admin Features

### Demo User Badge
In the admin panel user list, demo users show a blue "DEMO" badge next to their status badge.

### Clean Demo Data
Use the "Reset to Baseline" button to remove all demo content:
1. Go to Admin Dashboard
2. Click the "Reset Demo Data" section
3. Click "Reset to Baseline"
4. Confirm the action

The reset function will:
- Delete all profiles where `is_demo=true`
- Delete all posts where `is_demo=true`
- Delete all announcements where `is_demo=true`
- Preserve ALL admin accounts and their content
- Log the action in audit trail

## Use Cases

### 1. Testing
Create demo users and content without polluting production data. Easily clean up after testing.

### 2. Demonstrations
Show features to stakeholders using clearly-marked demo data. Everyone knows what's real vs. demo.

### 3. Development
Quickly generate realistic test data, work on features, then wipe clean without affecting real users.

### 4. Training
Create a safe sandbox environment for training new admins or moderators.

## Querying Demo Data

### Get All Demo Users
```sql
SELECT * FROM profiles WHERE is_demo = true;
```

### Get All Demo Posts
```sql
SELECT * FROM posts WHERE is_demo = true;
```

### Count Demo Content
```sql
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE is_demo = true) as demo_users,
  (SELECT COUNT(*) FROM posts WHERE is_demo = true) as demo_posts,
  (SELECT COUNT(*) FROM announcements WHERE is_demo = true) as demo_announcements;
```

### Filter Out Demo Content
```sql
-- Get only real users
SELECT * FROM profiles WHERE is_demo = false OR is_demo IS NULL;

-- Get only real posts
SELECT * FROM posts WHERE is_demo = false OR is_demo IS NULL;
```

## Future Enhancements

Possible additions (not yet implemented):
- Admin filter toggle: "Show/Hide Demo Content"
- Demo content expiration (auto-delete after X days)
- Demo user login restrictions (can't access certain features)
- Bulk demo content creator (generate 100 posts, 50 users, etc.)
- Demo watermarks on images
- "Convert to Real" function (mark demo as real if needed)

## Technical Details

### Database Types Updated
- `lib/database.types.ts` - Added `is_demo` to Profile, Posts Row/Insert/Update types

### Components Updated
- `components/admin/DemoDataGenerator.tsx` - Marks all created data as demo
- `app/(protected)/admin/page.tsx` - Shows demo badge in user list
- `app/(protected)/hearth/page.tsx` - Shows demo badge on posts

### SQL Files Updated
- `supabase/demo_tagging_migration.sql` - New migration file
- `supabase/COMPLETE_SETUP.sql` - Includes is_demo by default

---

**Implementation Date**: February 4, 2026  
**Developer**: Anthony (with Claude AI)  
**Status**: ✅ Complete and ready to use
