# User Mute Feature Implementation Summary

## Overview
Implemented a "shadow ban" mute feature that allows admins to mute users. Muted users can still post content, but their posts are only visible to themselves and admins. This is useful for handling problematic users without outright banning them.

## Database Changes

### 1. New Migration File: `user_mute_migration.sql`
- Added `muted` boolean field to profiles (default: false)
- Added `muted_at` timestamp field
- Added `muted_by` UUID field (references the admin who muted)
- Added `mute_reason` text field
- Created index on `muted` for efficient filtering
- Created `mute_audit_log` table for tracking all mute/unmute actions

### 2. Updated `COMPLETE_SETUP.sql`
- Added mute-related fields to the profiles table creation
- Added mute audit log table
- Added index for muted users
- Added RLS policies for the mute audit log (admin-only access)

### 3. Updated `database.types.ts`
- Added mute fields to Profile type (Row, Insert, Update interfaces)

## Frontend Changes

### 1. Admin Panel (`app/(protected)/admin/page.tsx`)
- Added `VolumeX` and `Volume2` icons from lucide-react
- Updated Profile interface to include mute fields
- Added `toggleUserMute()` function to mute/unmute users with optional reason
- Added mute button in user list (appears next to delete button)
- Added visual "Muted" badge for muted users
- Added mute reason display card showing why user was muted and when
- Added `mutedUsers` count to stats state
- Updated `fetchStats()` to count muted users
- Updated stats bar to display muted users count (5-column grid)
- Mute button prompts for reason when muting
- Admins cannot mute themselves or other admins
- Logs mute/unmute actions in both audit_logs and mute_audit_log tables

### 2. Hearth Page (`app/(protected)/hearth/page.tsx`)
- Updated `fetchPosts()` to:
  - Check if current user is admin
  - Fetch author's `muted` status
  - Filter out posts from muted users UNLESS:
    - The post is by the current user (users see their own posts)
    - The current user is an admin (admins see all posts)

### 3. Discussion Boards (`app/(protected)/boards/page.tsx`)
- Updated `fetchPosts()` with same filtering logic as Hearth
- Updated `fetchReplies()` to filter muted users' replies with same logic
- Board posts and replies from muted users are hidden from regular users

## How It Works

### For Admins:
1. Go to Admin Dashboard → Users tab
2. Find the user you want to mute
3. Click the speaker icon (🔊) next to their name
4. Enter an optional reason for muting
5. User is now muted (shows orange "Muted" badge)
6. Click the muted speaker icon (🔇) to unmute

### For Muted Users:
- They can still post, comment, and interact normally
- They see all their own content
- **They don't know they're muted** (that's the "shadow" part)
- Their posts/comments only appear to themselves and admins

### For Regular Users:
- Don't see any posts or comments from muted users
- Don't see any indication that a user is muted
- Experience is seamless

### For Admins:
- See ALL content including from muted users
- See "Muted" badge on user profiles in admin panel
- See mute reason and timestamp
- Can unmute at any time
- All mute/unmute actions are logged in audit trail

## Database Migration Required

To enable this feature, run the following SQL in Supabase SQL Editor:

```sql
-- Option 1: Run the standalone migration
-- Execute: supabase/user_mute_migration.sql

-- Option 2: For new deployments, the mute fields are included in COMPLETE_SETUP.sql
```

### For Existing Databases:
If your database is already set up, you need to run `user_mute_migration.sql` to add the mute columns.

### For New Deployments:
The mute feature is already included in `COMPLETE_SETUP.sql`, no additional migration needed.

## Files Modified

### New Files:
- `supabase/user_mute_migration.sql` - Standalone migration for adding mute feature

### Modified Files:
- `lib/database.types.ts` - Added mute fields to Profile type
- `supabase/COMPLETE_SETUP.sql` - Added mute fields to profiles table
- `app/(protected)/admin/page.tsx` - Admin UI for mute management
- `app/(protected)/hearth/page.tsx` - Filter muted users from feed
- `app/(protected)/boards/page.tsx` - Filter muted users from boards and replies

## Security Considerations

1. **RLS Policies**: Only admins can view/insert mute audit logs
2. **Type Safety**: All fields are properly typed in TypeScript
3. **Audit Trail**: Every mute/unmute action is logged with admin ID, user ID, timestamp, and reason
4. **Cannot Mute Admins**: Admins are protected from being muted
5. **Cannot Mute Self**: Admins cannot mute themselves
6. **Graceful Degradation**: If mute columns don't exist yet, features fall back gracefully with error handling

## UI/UX Highlights

- **Orange Color Scheme**: Muted status uses orange (between yellow warning and red ban)
- **Visual Feedback**: Toast notifications confirm mute/unmute actions
- **Contextual Icons**: Speaker icons (on = unmute available, muted = unmuted available)
- **Reason Display**: Mute reason shown in an orange info box on user profile
- **Stats Integration**: Muted count displayed prominently in admin stats bar
- **Prompt for Reason**: Admins are prompted to enter a reason (optional but encouraged)

## Future Enhancements

Potential additions (not currently implemented):
- Bulk mute operations
- Mute duration/auto-unmute
- Mute history view (all past mutes for a user)
- User-facing appeal system
- Notification to admins when muted users post (for monitoring)
- Filter to show only muted users in admin panel

## Testing Checklist

- [ ] Run `user_mute_migration.sql` in Supabase
- [ ] Verify mute button appears in admin panel user list
- [ ] Mute a test user and verify "Muted" badge appears
- [ ] Check that muted user can still create posts
- [ ] Verify muted user sees their own posts in Hearth
- [ ] Verify regular users don't see muted user's posts
- [ ] Verify admins see muted user's posts
- [ ] Test mute button on discussion board posts/replies
- [ ] Check muted users count in admin stats
- [ ] Verify unmute functionality works
- [ ] Check audit log entries are created

---

**Implementation Date**: February 4, 2026
**Developer**: Anthony (with Claude AI)
**Status**: ✅ Complete and ready for testing
