# 🚀 Fernhill App - Setup Checklist

## ✅ Step 1: Dependencies (COMPLETED)
- [x] Node.js installed
- [x] Dependencies installed via `npm install`

## 📋 Step 2: Supabase Setup (ACTION REQUIRED)

### 2.1 Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Wait for it to initialize (~2 minutes)

### 2.2 Get Your Credentials
1. Go to Project Settings → API
2. Copy these values to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` (Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon/public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role key - keep this secret!)

### 2.3 Run Database Setup
1. Open Supabase SQL Editor
2. Copy contents of `supabase/COMPLETE_SETUP.sql`
3. Run the entire script (this creates ALL tables, policies, triggers, and storage buckets)
4. The script is idempotent - safe to run multiple times

### 2.4 Storage Buckets (Auto-Created)
The COMPLETE_SETUP.sql automatically creates these **PRIVATE** buckets with RLS:
- `avatars` - User profile photos (private, owner-only upload)
- `post_images` - Post attachments (private, owner-only upload)  
- `altar_photos` - Sacred gallery photos (private, owner-only upload)

> ⚠️ **Security Note:** Buckets are PRIVATE, not public. The app uses `createSignedUrl()` to generate authenticated URLs that expire after 1 year.

## 📧 Step 3: Email Setup (OPTIONAL)

### Get Resend API Key
1. Sign up at https://resend.com (free tier: 100 emails/day)
2. Create API key
3. Add to `.env.local` as `RESEND_API_KEY`

## ☁️ Step 4: Weather Widget (OPTIONAL)

### Get OpenWeather API Key
1. Sign up at https://openweathermap.org/api
2. Get free API key
3. Add to `.env.local` as `OPENWEATHER_API_KEY`

## 🔐 Step 5: Create Your Admin Account

1. Start the dev server: `npm run dev`
2. Go to http://localhost:3000
3. Log in with your email (magic link)
4. Wait for email and click the link
5. You'll be in "Waiting Room" (pending status)
6. **Stop the server** (Ctrl+C)
7. Run admin seed script: `npm run seed-admin`
8. Enter your email when prompted
9. Restart dev server: `npm run dev`
10. Refresh browser - you should now see the admin dashboard!

## 🎨 Step 6: Add PWA Icons (RECOMMENDED)

Create these icon files in the `public` folder:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)
- Use your logo or the Fernhill symbol

You can use a tool like https://realfavicongenerator.net/

## 🧪 Step 7: Test the Flow

1. **Test Login**: Use a different browser/incognito to test the login flow
2. **Test Vetting**: Sign up as a new user and approve yourself via admin dashboard
3. **Test Posting**: Create a post in the Hearth
4. **Test Navigation**: Click through all sections

## 🚀 Step 8: Deploy to Render.com

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial Fernhill app"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. Go to https://render.com
3. New → Web Service
4. Connect your GitHub repo
5. Build Command: `npm install && npm run build`
6. Start Command: `npm start`
7. Add all environment variables from `.env.local`
8. Deploy!

## 📱 Step 9: Share with the Tribe

1. Get your Render URL (e.g., `fernhill-tribe.onrender.com`)
2. Update `NEXT_PUBLIC_APP_URL` in Render dashboard env vars
3. Create a QR code pointing to your app
4. Print it out for the next Sunday dance! 🎉

---

## � Production Deployment Status

**Live URL:** https://fernhill-community.onrender.com

### Recent Fixes Applied:
- ✅ React hydration error #418 fixed (suppressHydrationWarning)
- ✅ AccessibilityContext body mutations deferred to prevent SSR mismatch
- ✅ Admin password login bypass added (for rate limit situations)
- ✅ Supabase Auth URLs configured for production

---

## 🆘 Troubleshooting

### "Cannot connect to Supabase"
- Check your `.env.local` has correct values
- Make sure you ran both SQL schema files
- Verify project is not paused in Supabase dashboard

### "Middleware redirect loop"
- Clear browser cookies
- Check that your admin seed script ran successfully
- Verify `status` column in profiles table

### "Auth callback error"
- Make sure redirect URL is set in Supabase Auth settings
- For local: `http://localhost:3000/auth/callback`
- For production: `https://fernhill-community.onrender.com/auth/callback`

### "Rate Limited (429) on Magic Link"
- Wait 15-60 minutes for Supabase to reset rate limit
- Use the **Admin Login** bypass at the bottom of the login page
- Create user with password in Supabase Dashboard → Authentication → Users

---

## 💡 What's Built

All core features are complete! Here's what's included:

- [x] Event calendar with volunteer sign-ups
- [x] Persistent music player for DJ sets
- [x] E2EE messaging system
- [x] Photo gallery (The Altar)
- [x] Vibe status presence indicators
- [x] Push notifications
- [x] Image compression for avatars (200KB, 400px, webp)
- [x] Private storage buckets with RLS
- [x] PWA install prompt (respects 90-day dismiss)
- [ ] Full discussion boards implementation

Check `README.md` for the complete roadmap!
