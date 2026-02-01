# Changelog

All notable changes to Fernhill Community will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-01-31

### 🌐 Social Constellation Release - "Social Constellation"

Session 6 Part 2: World-class social networking features for deeper community connection.

### 💬 Comments System
- **Threaded Comments** - Full comment threads on Hearth posts with nested replies
- **Edit/Delete** - Users can edit and delete their own comments
- **Real-time Updates** - Comments appear instantly via Supabase subscriptions
- **Reply Notifications** - Get notified when someone replies to your comment

### 🔔 Notification Center
- **In-App Notifications** - Central hub for all activity (bell icon in header)
- **Notification Types** - Mentions, comments, reactions, follows, badges, events
- **Mark as Read** - Individual or bulk mark-as-read functionality
- **Browser Notifications** - Optional push notifications for new activity

### 📖 Stories (Ephemeral Content)
- **24-Hour Stories** - Share dance moments that disappear after 24 hours
- **Story Viewer** - Full-screen viewer with auto-advance
- **Quick Reactions** - Tap emoji to react to stories
- **View Count** - See who viewed your stories
- **Close Friends** - Option to share stories with select friends only

### 🔖 Bookmarks
- **Save for Later** - Bookmark posts, events, music sets, and more
- **Quick Access** - Saved items accessible from profile
- **Cross-Type Support** - Works across all content types

### 🛡️ Safety Controls
- **Block Users** - Completely hide someone's content and prevent DMs
- **Mute Users** - Hide posts without full blocking
- **Confirmation Dialogs** - Safety confirmations for sensitive actions
- **Private** - Blocked users aren't notified

### ⌨️ Typing Indicators
- **Real-Time Presence** - See when someone is typing in DMs
- **Animated Dots** - Subtle typing animation
- **Auto-Expire** - Indicators disappear after 5 seconds

### #️⃣ Hashtags & Trending
- **Content Discovery** - Use #hashtags in posts for discovery
- **Trending Topics** - Algorithm tracks popular hashtags
- **Search by Tag** - Find all content with specific hashtags

### 👥 Group DMs (Circles)
- **Group Conversations** - Create group chats with multiple members
- **Admin Roles** - Group creators can manage membership
- **Encrypted** - End-to-end encryption for group messages

### 🔗 Link Previews
- **Rich Embeds** - URLs show title, description, and image
- **Cached Previews** - Fast loading with 7-day cache

### 📊 Database Schema
- **12 New Tables** - Comments, notifications, stories, bookmarks, groups, blocks, hashtags, and more
- **Row Level Security** - All tables protected with proper RLS policies
- **Real-Time Enabled** - Key tables added to Supabase realtime publication
- **Helper Functions** - `create_notification()`, `extract_hashtags()`, `is_blocked()`

### 🔧 Auto Version Bumping
- **--bump Flag** - Patch version bump during pre-deploy
- **--bump-minor** - Minor version bump (new features)
- **--bump-major** - Major version bump (breaking changes)
- **npm run deploy** - Full deploy: checks, fix, bump, and push

---

## [1.5.0] - 2026-01-31

### 🌤️ Weather Wisdom Release - "Weather Wisdom"

Session 6: Mobile fixes, weather forecast, login UX, and pre-deploy automation.

### 🎵 Mobile Audio Fix
- **Permissions-Policy Update** - Fixed `encrypted-media` and `autoplay` policies for SoundCloud embeds
- **ReactPlayer Enhancement** - Added `playsinline`, `forceAudio`, and proper CORS handling
- **Mobile browser compatibility** - Music player now works on iOS Safari and Android Chrome

### 🌦️ Weather Forecast
- **5-Day Forecast** - Click weather widget to see detailed forecast
- **Enhanced Current Weather** - Shows feels-like temp, humidity, wind speed
- **Forecast Modal** - Beautiful glass-panel design with day-by-day breakdown
- **Desktop Display Fix** - Weather description now visible on desktop

### 🔑 Login UX Improvements
- **Enter-to-Submit** - Password fields now submit form on Enter key
- **Autocomplete Attributes** - Proper password manager integration
- **Form Accessibility** - Better keyboard navigation

### 📱 PWA Prompt Tuning
- **Reduced Aggressiveness** - Now shows after 2 minutes (was 30 seconds)
- **Session Tracking** - Only shows once per browser session
- **Dismiss Duration** - 30-day cooldown after dismissal (was 90 days)

### 🔧 Pre-Deploy Automation
- **Comprehensive Script** - `npm run predeploy` checks everything before deploy
- **TypeScript Validation** - Ensures no compilation errors
- **ESLint Check** - Validates code quality
- **Build Test** - Verifies production build succeeds
- **Security Scan** - Checks for hardcoded secrets
- **Auto Documentation** - Updates stats, README, VALUE_PROPOSITION
- **Quick Mode** - `npm run predeploy:quick` skips build for faster iteration

### 📚 Documentation Updates
- **VALUE_PROPOSITION.md** - Updated with Session 6 stats and features
- **STATS.json** - Auto-generated code statistics
- **README badges** - Auto-updated version and line counts

---

## [1.4.0] - 2026-01-30

### 🚪 Sacred Gate Release - "Sacred Gate"

Session 5: Admin dashboard consolidation, mobile UX, and onboarding improvements.

### 🏗️ Admin Dashboard Overhaul
- **Sacred Gate Integration** - Pending user approval moved INTO Users tab (no separate Gate page)
- **Queue → Content Merge** - Consolidated moderation queue into Content tab
- **Mobile-First Header** - Hamburger menu for narrow screens, horizontal tabs on desktop
- **User List Improvements** - Separate sections for Pending Invites vs Active Users

### 📱 Mobile UX Improvements
- **Responsive Header** - Collapsible hamburger nav for 6-tab dashboard
- **Modal Z-Index Fix** - Fixed iOS layering issues (nav z-40, modals z-50)
- **Content Moderation Wiring** - Post moderation now fully functional

### 🔐 Onboarding Flow
- **Welcome Emails** - Auto-send welcome email when admin approves a user
- **Photo Upload Simplified** - Replaced camera-based verification with simple photo upload
- **Profile State Fix** - Local state updates properly after submission

### ♿ Accessibility Tweaks
- **Settings Default OFF** - Accessibility features now OFF by default (opt-in)
- **Smaller Dismiss Badge** - Tiny dismiss button at top-right of FAB

### 📚 Documentation
- **Roles & Permissions** - Comprehensive section added to User Guide
- **Value Proposition Update** - Revised costs to $358K-718K estimate

---

## [1.3.0] - 2026-01-29

### 🌟 Polish & Production Release - "Sacred Connections"

Session 4: Production testing, bug fixes, and UX improvements.

### 💬 Messaging Improvements
- **Plaintext Fallback** - Users without E2EE keys can now receive messages (stored with PLAIN: prefix)
- **Encryption Indicator** - Unencrypted messages show 🔓 icon next to timestamp
- **Auto-detection** - System detects and handles both encrypted and plaintext messages seamlessly

### ♿ Accessibility Improvements
- **FAB Moved Left** - Accessibility button moved to left side to avoid covering settings
- **Dismiss Button** - Users can hide the floating button with X, persisted to localStorage
- **Profile Integration** - Accessibility settings now available in Profile → Accessibility
- **Restore Option** - "Show floating accessibility button" link in Profile settings

### 🎨 UI/UX Fixes
- **Admin Dashboard Tabs** - Fixed jumbled tabs on narrow screens (icons only on mobile)
- **Suggest Event Modal** - Fixed modal being covered by footer (now centered)
- **Vibe Circle** - Made smaller (24px fixed size) to not overlap avatar
- **Google Calendar Link** - Added direct link to Fernhill calendar in admin events tab

### 📋 Community Forms
- **Boundary Violation Report** - Added link to safety reporting form in Profile

### 🗄️ Database
- **altar_posts.file_path** - Added column for signed URL regeneration

---

## [1.2.0] - 2026-01-29

### 🔒 Security & Performance Release - "Safe Space"

Major security hardening and performance optimizations.

### 🔐 Security Improvements
- **Private Storage Buckets** - All storage buckets (avatars, post_images, altar_photos) are now PRIVATE with RLS policies
- **Signed URLs** - Using `createSignedUrl()` instead of `getPublicUrl()` for authenticated access
- **Owner-Only Uploads** - Users can only upload to their own folder (`{bucket}/{user_id}/filename`)
- **1-Year URL Expiry** - Signed URLs valid for 1 year for long-lived resources

### 📸 Image Optimization
- **Reusable Compression Utilities** - New `lib/image-utils.ts` with standardized compression
- **Avatar Compression** - Max 200KB, 400x400px, webp format
- **Post Image Compression** - Max 500KB, 1200px, webp format  
- **Camera Capture Compression** - Optimized for waiting-room selfies

### 🗄️ Database Setup Simplified
- **COMPLETE_SETUP.sql** - Single comprehensive file for ALL database setup (678 lines)
- Creates all 20+ tables, 40+ RLS policies, triggers, and storage buckets
- Idempotent - safe to run multiple times
- Replaces need for multiple migration files

### 🐛 Bug Fixes
- Fixed PWA install prompt - now respects 90-day dismiss, delayed initial popup (30s Android, 60s iOS)
- Fixed "Share with Tribe" modal - category tags now wrap properly with `flex-wrap`
- Fixed TypeScript build error in admin layout (type assertion for Supabase query)
- Removed edge runtime from icon routes to enable static generation

---

## [1.1.0] - 2026-01-29

### 🦽 Accessibility Release - "Every Body Dances"

Comprehensive accessibility features for community members with disabilities.

### ♿ Accessibility Features

#### 🎤 Voice & Speech
- **Voice Input (Speech-to-Text)** - Speak instead of typing using Web Speech API
- **Text-to-Speech** - Have content read aloud with adjustable speed
- **Screen Reader Mode** - Enhanced ARIA labels and descriptions

#### 🔤 Input Assistance  
- **Word Prediction** - Tap common words/phrases instead of typing
- **Quick Phrases** - One-tap access to "Hi!", "Sounds great!", "I'm excited!", etc.
- **Category Word Banks** - Organized by: General, Greetings, Dance, Feelings, Actions, Questions
- **Large Buttons** - Easier to tap for those with motor difficulties

#### 👁️ Visual Accessibility
- **High Contrast Mode** - Stronger colors and borders for better visibility
- **Large Text Mode** - Bigger text throughout the app
- **Reduced Motion** - Respects `prefers-reduced-motion` preference

#### ⚡ Easy Mode
- One-tap "Easy Mode" enables: Large buttons + Word prediction + Voice input + Text-to-speech
- Designed for users with limited mobility or cognitive differences
- Settings persist in localStorage

#### 🏗️ Technical Implementation
- `AccessibilityContext` - Global state provider with localStorage persistence
- `AccessibilityFAB` - Floating button always visible for quick access
- `AccessibleTextInput` - Enhanced input combining voice, word buttons, and TTS
- `SpeechInput` - Web Speech API integration with interim results
- `WordPrediction` - Category-organized word/phrase buttons
- WCAG 2.1 AA compliant CSS with data-attribute styling
- Skip link for keyboard navigation
- Focus-visible outlines for keyboard users

---

## [1.0.0] - 2026-01-29

### 🎉 Initial Release - "The First Dance"

The complete Fernhill Community PWA, built in a single intense development session.

### Core Features

#### 🔐 Authentication & Security
- Magic link email authentication (passwordless)
- Row-Level Security (RLS) on all tables
- Status-based access control (pending → active → facilitator → admin)
- Waiting room flow for new member onboarding
- Admin gate for initial setup
- Boundary reporting system for community safety

#### 🏠 Community Spaces
- **Hearth** - Main community feed with posts, polls, and announcements
- **Events** - Community event calendar with RSVP and volunteer shifts
- **Journey** - Shared music sets with SoundCloud integration
- **Directory** - Member profiles with vibe status indicators
- **Messages** - Private encrypted conversations
- **Boards** - Discussion forums for deeper conversations
- **Altar** - Sacred photo sharing space

#### 👥 Social Features
- Reaction system (🔥 Fire, 💚 Heart, ✨ Spark, 🌊 Flow, 🌀 Spiral)
- Vibe status indicators (Flowing, Staccato, Chaos, Lyrical, Stillness, etc.)
- Member badges and recognition
- Event check-ins and RSVPs
- Polls and community voting

#### 📱 PWA Capabilities
- Installable on iOS, Android, and desktop
- Offline-first architecture
- Push notifications for messages and events
- Native app-like experience
- Safe area support for modern devices

#### 🛡️ Admin Dashboard
- User management (approve, ban, promote)
- Content moderation queue
- Event submission review
- Audit logging
- System freeze mode
- Community statistics

#### 🎨 Design System
- Dark, earthy aesthetic (Sacred Charcoal, Forest Green, Fernhill Gold)
- Glassmorphism UI components
- Responsive mobile-first design
- Smooth animations and transitions

### Technical Stack
- **Framework**: Next.js 16.1.6 with App Router
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Analytics**: GoatCounter (privacy-friendly)

### Database Tables
- `profiles` - Member profiles and status
- `events` - Community events and gatherings
- `posts` - Hearth feed content
- `messages` / `conversations` - Private messaging
- `music_sets` - Shared DJ sets and playlists
- `boards` / `board_topics` / `board_replies` - Discussion forums
- `altar_posts` - Sacred photo sharing
- `feedback` - Community suggestions
- `audit_logs` - Admin action tracking
- `system_settings` - App configuration
- `content_queue` - Moderation queue
- `boundary_reports` - Safety reports

### Security Measures
- All database access through RLS policies
- Service role key never exposed to client
- Admin actions logged to audit trail
- Content moderation for trusted posting
- Rate limiting on sensitive operations

---

## Development Notes

### Built by
Anthony @ Structure for Growth

### Development Time
~20 hours (across multiple sessions)

### Architecture Decisions
- Server Components for auth-protected pages
- Client Components for interactive features
- Supabase for real-time subscriptions
- PWA for native-like mobile experience
- GoatCounter for privacy-respecting analytics
- Private storage buckets with signed URLs for security
- Image compression utilities for optimized uploads

---

## Future Roadmap

### v1.5.0 (Planned)
- [ ] Enhanced notification preferences
- [ ] Calendar sync (Google/Apple)
- [ ] Improved offline mode
- [ ] Theme customization

### v1.6.0 (Planned)
- [ ] Event photo galleries
- [ ] Music set comments
- [ ] Member search improvements
- [ ] API rate limiting dashboard

---

*"Movement is medicine. Community is the container."*
