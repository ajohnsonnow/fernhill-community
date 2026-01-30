# 🚀 Deployment Checklist for Fernhill Community

## Database Schema Updates Required

### ⚠️ CRITICAL: Run Additional Schema

The `additional_schema.sql` file must be run in Supabase SQL Editor to create required tables:

1. Navigate to Supabase Dashboard → SQL Editor
2. Open a new query
3. Copy and paste contents of `supabase/additional_schema.sql`
4. Click "Run" to execute

**Tables created:**
- `altar_posts` - Photo gallery with auto-expiry
- `push_subscriptions` - Web push notifications
- `feedback` - User feedback and bug reports
- `audit_logs` - Admin action logging

### Environment Variables

Ensure these are set in Render.com dashboard:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wflmgthqtxevloefbhwq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<optional_for_push_notifications>
```

### Post-Deployment Verification

- [ ] Visit `/login` and confirm login works
- [ ] Create test post in Hearth
- [ ] Upload photo to Altar (tests `altar_posts` table)
- [ ] Submit feedback (tests `feedback` table)
- [ ] Admin: Create new user (tests `audit_logs` table)
- [ ] Check browser console for errors

### Known Console Warnings (Safe to Ignore)

✅ Chrome extension interference warnings
✅ Service worker registration in development

### Critical Errors to Watch For

❌ `altar_posts table does not exist` - Run additional_schema.sql
❌ `IndexedDB encryption-keys not found` - Fixed in latest version
❌ Admin API 500 errors - Check service role key is set

## Recent Fixes (Session 2)

### UI/UX Fixes
- ✅ Soul Gallery skills tags now wrap properly (flex-wrap)
- ✅ Profile avatar rendering fixed (aspect-square constraint)
- ✅ Calendar "Add to Calendar" now generates .ics file for user's calendar

### Technical Fixes
- ✅ IndexedDB initialization properly handles upgrade events
- ✅ Admin create-user API has detailed error logging
- ✅ Hydration errors resolved (suppressHydrationWarning)
- ✅ useSearchParams wrapped in Suspense boundary

### Auth Improvements
- ✅ Admin password login bypass
- ✅ Password creation flow when magic links fail
- ✅ Profile password change feature
- ✅ Auth error page with fallback options

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Version bump (automatic with git hooks)
npm run version:bump
```

## Versioning

Auto-versioning is enabled via Husky post-commit hook:
- `fix:` commits → patch version (1.0.0 → 1.0.1)
- `feat:` commits → minor version (1.0.0 → 1.1.0)
- `feat!:` or `BREAKING` → major version (1.0.0 → 2.0.0)

Version is stored in `package.json` and `lib/version.ts`.

## Troubleshooting

### Build Fails on Render
- Check Node.js version is 18+ in Render dashboard
- Verify all environment variables are set
- Check build logs for missing dependencies

### Users Can't Login
- Verify Supabase project is running
- Check anon key is correct in environment variables
- Confirm user email is confirmed in Supabase Auth dashboard

### Photos Won't Upload
- Run `additional_schema.sql` to create `altar_posts` table
- Check Supabase storage bucket "altar-photos" exists
- Verify RLS policies are enabled

### Admin Features Not Working
- Confirm user status is "admin" in profiles table
- Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Review audit logs for error details

---

**Last Updated:** Session 2 - Production Bug Fixes
**Deployment:** fernhill-community.onrender.com
**Repository:** github.com/ajohnsonnow/fernhill-community
