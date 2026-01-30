# 🛡️ Admin Panel Documentation

## Overview
The Fernhill Community Admin Panel provides comprehensive tools for community management, moderation, and system administration.

## Access Control

**Who Can Access:**
- Only users with `status = 'admin'` in the profiles table
- Access is checked server-side on every admin page load
- Non-admins are redirected to the Hearth with an error message

**How to Grant Admin Access:**
```sql
-- Run in Supabase SQL Editor
UPDATE profiles 
SET status = 'admin' 
WHERE email = 'user@example.com';
```

## Admin Features

### 1. User Management (`/admin` → Users Tab)

**Capabilities:**
- ✅ View all users with search and filtering
- ✅ Filter by status (pending, active, facilitator, admin, banned)
- ✅ Change user status (promote to facilitator/admin, ban, activate)
- ✅ Delete users (with confirmation)
- ✅ Manually add new users via admin API
- ✅ View user creation dates and vouchers

**User Statuses:**
- **Pending**: Awaiting approval
- **Active**: Regular member
- **Facilitator**: Elevated permissions
- **Admin**: Full control
- **Banned**: Blocked from community

**Quick Actions:**
- Promote to Facilitator
- Promote to Admin
- Ban User
- Delete User

### 2. Sacred Gate (`/admin/gate`)

**Purpose:** Dedicated interface for vetting new members

**Features:**
- ✅ View all pending membership requests
- ✅ See who vouched for each applicant
- ✅ Review "Gifts to the Mycelium" (skills/contributions)
- ✅ One-click approve/reject
- ✅ Real-time updates via Supabase subscriptions
- ✅ Stats dashboard (pending, active, total)

**Workflow:**
1. New user signs up → Status set to 'pending'
2. Admin reviews in Sacred Gate
3. Approve → Status changes to 'active'
4. Reject → Status changes to 'banned'

### 3. Content Queue (`/admin` → Queue Tab)

**Purpose:** Review community-submitted content before publication

**Supported Content Types:**
- 🎵 Music sets (DJ mixes)
- 🏷️ Vibe tag suggestions
- 📝 Posts (if moderation enabled)
- 📸 Altar photos (if moderation enabled)

**Actions:**
- Approve (publish immediately)
- Reject (with optional admin notes)
- Review details and metadata

### 4. Content Moderation (`/admin` → Content Tab)

**Features:**
- ✅ View all community posts
- ✅ Search posts by content
- ✅ Filter by category
- ✅ Delete inappropriate content
- ✅ View post author and timestamp

**Use Cases:**
- Remove spam
- Delete policy violations
- Monitor community health

### 5. Event Management

**Main Dashboard (`/admin` → Events Tab):**
- Overview of event submissions
- Quick stats

**Dedicated Page (`/admin/events`):**
- ✅ Review all event submissions
- ✅ Filter by status (pending, approved, rejected)
- ✅ Add admin notes for approval/rejection
- ✅ View full event details:
  - Title, description
  - Proposed date and location
  - Event type (dance, workshop, gathering)
  - Submitter information
- ✅ Approve → Event appears in public calendar
- ✅ Reject → Submitter notified (if notifications enabled)

### 6. Feedback Management (`/admin` → Feedback Tab)

**Types of Feedback:**
- 🐛 Bug Reports (with optional console logs)
- 💡 Feature Requests
- 🙏 Gratitude

**Features:**
- ✅ View all feedback submissions
- ✅ Filter by type
- ✅ See reporter's name
- ✅ View submission timestamp
- ✅ **NEW:** Browser info (user agent, viewport, URL)
- ✅ **NEW:** Console logs (for bug reports)

**Debug Information:**
Expandable sections show:
- 📱 Device Info (browser, screen size, page URL)
- 🐛 Console Logs (captured errors/warnings)

### 7. System Settings (`/admin` → Settings Tab)

**Freeze Mode:**
- Toggle entire community freeze
- When enabled: Only admins can post
- When disabled: All active members can post
- Use for emergency situations or maintenance

**Quick Links:**
- Sacred Gate (review pending users)
- Feedback Panel
- Event Submissions

**System Information:**
- Database type (Supabase PostgreSQL)
- Auto-purge schedule (daily @ 3 AM UTC)

### 8. Audit Logs (`/admin` → Logs Tab)

**Purpose:** Track all administrative actions for accountability

**Logged Actions:**
- User status changes
- User deletions
- Content approvals/rejections
- Event approvals/rejections
- Freeze mode toggles
- Manual user creation

**Log Details:**
- Action type
- Admin who performed action
- Timestamp
- Additional details (JSON)

### 9. Manual User Creation

**Location:** Settings Tab → "Quick Tools" section (via admin API)

**Process:**
1. Click "Add User" button
2. Enter email address
3. Enter tribe name
4. Select initial status
5. System creates auth user + profile
6. User receives magic link email

**API Endpoint:** `/api/admin/create-user`

**Requirements:**
- Must be authenticated as admin
- Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable

## Navigation Structure

```
/admin
├── Main Dashboard (all tabs accessible)
│   ├── Users Tab
│   ├── Queue Tab
│   ├── Content Tab
│   ├── Events Tab
│   ├── Settings Tab
│   ├── Feedback Tab
│   └── Audit Logs Tab
│
├── /admin/gate (Sacred Gate - Dedicated Vetting)
│
└── /admin/events (Event Management - Detailed Review)
```

## Security Features

### Access Control
- ✅ Layout-level admin check on all routes
- ✅ Server-side profile status verification
- ✅ Automatic redirect for non-admins
- ✅ Session validation via Supabase Auth

### Row Level Security (RLS)
All admin queries respect Supabase RLS policies:
- Admins can view/modify based on defined policies
- No direct database access bypassing security
- Audit logs track all changes

### API Security
- Admin API endpoints check status server-side
- Service role key stored as environment variable
- Never exposed to client

## Common Tasks

### Approve a New Member
1. Go to `/admin/gate`
2. Review their info (voucher, gifts)
3. Click "Approve"
4. User receives welcome notification

### Handle a Bug Report
1. Go to `/admin` → Feedback Tab
2. Click bug report to expand
3. Review device info
4. Check console logs (if included)
5. Create GitHub issue or fix directly

### Emergency Freeze
1. Go to `/admin` → Settings Tab
2. Click "Freeze" button
3. Confirm action
4. Community enters read-only mode
5. Unfreeze when resolved

### Delete Inappropriate Content
1. Go to `/admin` → Content Tab
2. Search for content
3. Click delete icon
4. Confirm deletion
5. Action logged in audit logs

### Review Event Submission
1. Go to `/admin/events`
2. Review event details
3. Add admin notes (optional)
4. Approve or Reject
5. Event added to public calendar (if approved)

## Real-Time Features

**Live Updates via Supabase Realtime:**
- Sacred Gate updates when new users sign up
- Event submissions appear immediately
- Content queue updates in real-time
- No manual refresh needed

**Subscribe Patterns:**
```typescript
supabase
  .channel('channel-name')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'table_name'
  }, callback)
  .subscribe()
```

## Stats Dashboard

**Metrics Displayed:**
- Total Users
- Active Users
- Pending Users (awaiting approval)
- Banned Users
- Total Posts
- Total Feedback
- Pending Events
- Pending Queue Items

**Refresh:**
- Auto-loads on page mount
- Manual refresh button available
- Real-time updates for key metrics

## Best Practices

### Moderation
1. ✅ Review pending users within 24 hours
2. ✅ Check feedback daily
3. ✅ Monitor audit logs weekly
4. ✅ Use admin notes for transparency
5. ✅ Document ban reasons

### Communication
1. ✅ Add context in admin notes
2. ✅ Keep audit trail clear
3. ✅ Coordinate with other admins via logs
4. ✅ Respond to feedback promptly

### Security
1. ✅ Never share admin credentials
2. ✅ Log out when done
3. ✅ Review audit logs for suspicious activity
4. ✅ Update service role key if compromised
5. ✅ Storage buckets are PRIVATE - use signed URLs only
6. ✅ All user uploads are restricted to their own folder

## Storage Security

### Private Buckets
All storage buckets are configured as **PRIVATE** with Row-Level Security:

| Bucket | Purpose | Access |
|--------|---------|--------|
| `avatars` | User profile photos | Read: All authenticated users |
| `post_images` | Post attachments | Upload/Delete: Owner only |
| `altar_photos` | Sacred gallery | 1-year signed URL expiry |

### File Organization
Files are organized by user ID: `{bucket}/{user_id}/filename.webp`

This ensures:
- Users can only upload to their own folder
- Users can only delete their own files
- All authenticated users can view files (via signed URLs)

### Image Compression
All uploaded images are automatically compressed:
- **Avatars:** Max 200KB, 400x400px, webp format
- **Post Images:** Max 500KB, 1200px, webp format
- **Camera Captures:** Max 200KB, 400px, webp format

## Troubleshooting

### "Access Denied" Error
- Verify your profile status is 'admin'
- Check Supabase connection
- Clear browser cache and retry

### Missing Data
- Check RLS policies in Supabase
- Verify table migrations ran successfully
- Check browser console for errors

### Real-Time Not Working
- Verify Supabase project is online
- Check realtime subscriptions in Supabase dashboard
- Ensure WebSocket connection established

## Future Enhancements

**Planned Features:**
- [ ] Bulk user actions
- [ ] Advanced search with filters
- [ ] Export audit logs to CSV
- [ ] Email templates for user notifications
- [ ] Content flagging system
- [ ] Trust score automation
- [ ] Analytics dashboard

## Support

For admin-specific issues:
1. Check audit logs for errors
2. Review browser console
3. Check Supabase logs
4. Contact system administrator

---

**Last Updated:** January 29, 2026  
**Version:** 1.2.0  
**Admin Count:** Check `/admin` → Users Tab → Filter: Admin
