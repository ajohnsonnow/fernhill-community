# Changelog

All notable changes to Fernhill Community will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.12.0] - 2026-02-01

### 🏆 Phase F Complete - "Legendary Touch"

Native app-level features that push mobile UX past 10/10. View transitions, native sharing, wake lock, and maximum accessibility.

### 🎬 View Transitions API
- **useViewTransition hook** - Smooth page-to-page animations
- **Shared element transitions** - Avatars morph between pages
- **viewTransitionStyle helper** - Easy transition names
- **Fallback support** - Graceful degradation on older browsers
- **Back gesture animations** - Reverse transitions going back

### 📤 Web Share API
- **lib/share.ts** - Native share sheet utility
- **ShareButton component** - One-click native sharing
- **shareFernhillContent()** - Pre-configured for posts, events, profiles
- **Clipboard fallback** - Copies to clipboard on desktop
- **CopyLinkButton** - Dedicated copy-to-clipboard button

### 📱 Wake Lock API
- **useWakeLock hook** - Keep screen on
- **useWakeLockWhile** - Auto-lock while condition true
- **Perfect for Journey** - Screen stays on during music playback
- **Event mode** - Keep screen on while viewing event details
- **Visual indicator** - Shows when wake lock is active

### 🔔 App Badge API
- **lib/badge.ts** - Notification badge utility
- **setBadge(count)** - Set app icon badge count
- **badgeManager** - Increment/decrement pattern
- **updateBadgeFromNotifications()** - Aggregate multiple sources

### 💀 Skeleton Loading (Enhanced)
- **Skeleton** - Base shimmer component
- **SkeletonText** - Varying-width text placeholders
- **SkeletonAvatar** - Circular avatar placeholder
- **SkeletonPost** - Full post card placeholder
- **SkeletonEvent** - Event card placeholder
- **SkeletonMessage** - Chat message placeholder
- **SkeletonListItem** - Directory item placeholder
- **SkeletonProfile** - Profile header placeholder
- **SkeletonFeed** - Multiple skeletons for feeds

### ⌨️ Keyboard Handling
- **useKeyboardAware hook** - Virtual keyboard detection
- **useKeepAboveKeyboard** - Auto-scroll inputs into view
- **Visual Viewport API** - Accurate keyboard size
- **keyboard-aware-scroll CSS** - Scroll padding utility

### ♿ Accessibility Enhancements
- **useReducedMotion hook** - Respect motion preferences
- **useAnimationDuration** - Conditional animation timing
- **useAnimatedClass** - Conditional animation classes
- **Reduced motion CSS** - Disables all animations
- **High contrast mode** - Enhanced visibility

### 👈 Edge Swipe Navigation
- **useEdgeSwipe hook** - Swipe from edge to go back
- **EdgeSwipeIndicator** - Visual feedback during swipe
- **Native feel** - Like iOS swipe-back gesture
- **Haptic feedback** - Vibration at threshold

### 🎨 New CSS Features
- **View transition keyframes** - Page morph animations
- **Reduced motion overrides** - Accessibility compliance
- **High contrast variables** - Better visibility mode
- **Edge swipe styles** - Back gesture indicator
- **Keyboard utilities** - Input footer, keyboard padding
- **Share button styles** - Native-feeling share UI
- **Wake lock indicator** - Screen-on badge

### 🗂️ New Files
- `hooks/useViewTransition.ts` - Page transition hook
- `hooks/useWakeLock.ts` - Screen wake lock hook
- `hooks/useKeyboardAware.ts` - Keyboard visibility hook
- `hooks/useReducedMotion.ts` - Motion preference hook
- `hooks/useEdgeSwipe.ts` - Edge swipe navigation hook
- `lib/share.ts` - Web Share API utility
- `lib/badge.ts` - App Badge API utility
- `components/ui/Skeleton.tsx` - Skeleton loading suite
- `components/social/ShareButton.tsx` - Native share button

### 🔧 Updated Files
- `hooks/index.ts` - Added 10 new hook exports
- `components/ui/index.ts` - Added skeleton exports
- `app/globals.css` - Added ~250 lines Phase F CSS
- `lib/version.ts` - v1.12.0 "Legendary Touch"

---

## [1.11.0] - 2026-02-01

### 🚀 Phase E Complete - "Gestural Flow & Performance"

Advanced gesture controls, background sync, real-time notifications, and image optimization.

### 🖼️ Image Optimization
- **OptimizedImage component** - Wrapper for next/image with enhanced features
- **Blur placeholders** - Shimmer effect while images load
- **AvatarImage** - Circular avatars with fallback initials
- **CoverImage** - Fill-mode for hero/cover images
- **AVIF/WebP support** - Next.js image config for modern formats
- **Smart caching** - 24-hour minimum cache TTL

### 📴 Offline Queue & Background Sync
- **IndexedDB storage** - Robust offline data persistence
- **Offline queue system** - Queue posts, messages, reactions when offline
- **Background sync** - Automatic retry when connection restored
- **Queue status tracking** - See pending items count
- **SyncStatus component** - Visual indicator of sync state
- **PendingBadge** - Shows count of items waiting to sync

### 🔔 Real-time Notifications
- **Supabase realtime integration** - Live updates via websockets
- **useRealtimeNotifications hook** - Subscribe to messages, notifications, announcements
- **Browser notifications** - Push notifications when tab unfocused
- **Haptic feedback** - Vibration on notification
- **Badge count updates** - App icon badge shows unread count

### 👆 Swipe Gestures
- **useSwipeGesture hook** - Touch gesture detection
- **Left/right swipe detection** - Configurable thresholds
- **Progress tracking** - Know how far user has swiped
- **SwipeableRow component** - Swipeable list items with actions
- **Pre-built actions** - Delete, archive, flag, more
- **Haptic feedback** - Vibration at threshold

### 👇 Long Press Actions
- **useLongPress hook** - Long press detection
- **Configurable duration** - Default 500ms
- **Movement tolerance** - Doesn't cancel on slight movement
- **Progress animation** - Visual feedback during press
- **LongPressMenu component** - Context menu on long press
- **Viewport-aware positioning** - Menu stays on screen

### 🎨 New Animations & Effects
- **scale-in** - Entry animation for menus
- **slide-out-right/left** - Swipe away animations
- **bounce-in** - Playful entry effect
- **shake** - Error/attention animation
- **skeleton loading** - Animated placeholder class
- **progress-ring** - SVG progress indicator
- **ripple effect** - Material-style touch ripple
- **img-blur-load** - Blur transition on image load

### 🗂️ New Files
- `components/ui/OptimizedImage.tsx` - Image component suite
- `components/ui/SwipeableRow.tsx` - Swipeable list item
- `components/ui/LongPressMenu.tsx` - Context menu
- `components/ui/index.ts` - UI components barrel export
- `lib/offline-queue.ts` - IndexedDB offline queue
- `lib/realtime-notifications.ts` - Realtime push system
- `hooks/useSwipeGesture.ts` - Swipe gesture hook
- `hooks/useLongPress.ts` - Long press hook
- `components/pwa/SyncStatus.tsx` - Sync status indicator

### 🔧 Updated Files
- `hooks/index.ts` - Added gesture hook exports
- `components/pwa/index.ts` - Added SyncStatus exports
- `app/globals.css` - Added ~150 lines Phase E animations
- `public/sw.js` - Added full background sync (~180 lines)
- `next.config.js` - Enhanced image optimization config

---

## [1.10.0] - 2026-02-01

### 📱 Phase D Complete - "Mobile Excellence & PWA Perfection"

Comprehensive mobile experience improvements for maximum compatibility across all devices.

### ♿ Accessibility Improvements
- **WCAG 2.1 Viewport Fix** - Enabled pinch-to-zoom (was incorrectly blocked)
- **Better touch targets** - Minimum 48px on touch devices
- **Improved focus indicators** - Clearer keyboard navigation

### 📱 PWA Enhancements
- **Enhanced manifest.json** - App shortcuts, categories, launch handlers
- **Offline fallback page** - Beautiful offline.html with auto-reconnect
- **Service Worker v2.0** - Multi-cache strategy with intelligent routing
  - Cache-First for static assets (instant loading)
  - Network-First for API calls (fresh data when online)
  - Stale-While-Revalidate for images (fast + updated)
  - Automatic cache cleanup on version change

### 🎯 Haptic Feedback
- **New lib/haptics.ts** - Tactile feedback utility
- **Patterns** - Light, medium, heavy, success, error, warning, selection
- **Navigation feedback** - Subtle vibration on tab changes
- **Works on Android & modern iOS**

### 🔄 Pull-to-Refresh
- **usePullToRefresh hook** - Mobile refresh pattern
- **PullToRefresh component** - Wrap any content
- **Visual indicators** - Progress spinner, release hint
- **Haptic feedback** - Vibrates at threshold

### 📡 Network Status
- **useNetworkStatus hook** - Track online/offline state
- **OfflineIndicator component** - Banner when offline
- **Auto-reconnect feedback** - "Back online!" message
- **Connection quality info** - Effective type, downlink, RTT

### 🎨 Mobile CSS Utilities
- **scroll-snap-x** - Horizontal snap scrolling for carousels
- **no-overscroll / allow-overscroll** - Control bounce behavior
- **no-select / allow-select** - Text selection control
- **momentum-scroll** - Smooth iOS scrolling
- **touch-feedback** - Visual tap feedback class
- **landscape optimizations** - Compact mode for rotated phones
- **notch-safe** - Safe area for landscape mode
- **img-loading** - Shimmer placeholder animation
- **pb-bottom-nav** - Bottom nav spacing utility
- **fab-position** - Floating action button positioning
- **touch-list-item** - 56px touch-friendly list items
- **sticky-header** - Safe area aware sticky headers
- **mobile-full-height** - Dynamic viewport height
- **16px input font** - Prevents iOS zoom on focus

### 🗂️ New Files
- `public/offline.html` - Offline fallback page
- `lib/haptics.ts` - Vibration API utility
- `hooks/usePullToRefresh.ts` - Pull-to-refresh hook
- `hooks/useNetworkStatus.ts` - Network status hook
- `hooks/index.ts` - Hooks barrel export
- `components/pwa/OfflineIndicator.tsx` - Offline banner
- `components/pwa/PullToRefresh.tsx` - PTR component
- `components/pwa/index.ts` - PWA components barrel export

### 🔧 Updated Files
- `app/layout.tsx` - Fixed viewport for accessibility
- `app/globals.css` - Added 150+ lines of mobile utilities
- `public/manifest.json` - Enhanced PWA config
- `public/sw.js` - Complete rewrite with caching strategies
- `app/(protected)/layout.tsx` - Added OfflineIndicator
- `components/navigation/BottomNav.tsx` - Added haptic feedback

---

## [1.9.0] - 2026-02-01

### 🌟 Phase C Complete - "Advanced Features & Facebook Channel Parity"

Full feature parity with existing Facebook Messenger community channels plus new advanced features.

### 📢 Official Announcements System
- **Admin-Only Announcements** - Secure posting for organizers
- **Priority Levels** - Low, normal, high, urgent with color coding
- **Categories** - General, event, safety, schedule, policy, welcome
- **Pinned Announcements** - Important notices stay at top
- **Read Tracking** - Track which members have seen announcements
- **Expiration Dates** - Time-limited announcements auto-hide
- **Hearth Integration** - Banner displays on main feed

### 🔍 Lost & Found
- **Report Items** - Lost or found items with full details
- **Categories** - Keys, phone, wallet, jewelry, clothing, electronics, pet, documents
- **Location Tracking** - Where items were lost/found
- **Photo Support** - Multiple photos per item
- **Date Tracking** - When items went missing
- **Status Management** - Mark items as resolved when reunited
- **Search & Filter** - Find items by type, category, keywords

### 🌶️ Spicy Chat Lounge
- **18+ Discussion Space** - Mature topics welcome
- **Topics** - General, advice, vent, celebration, question, debate
- **Anonymous Posting** - Post without name for sensitive topics
- **Threaded Replies** - Full discussion on each post
- **Like System** - React to posts and replies
- **Topic Filtering** - Browse by topic category

### 🚗 Ride Share
- **Offer Rides** - Share your car for events
- **Request Rides** - Find carpools to venues
- **Route Details** - From/to locations, departure time
- **Seat Tracking** - Available/needed seats
- **Event Integration** - Link rides to specific events
- **Request System** - Ask to join a ride

### 🎓 Skill Exchange
- **Teach & Learn** - Share or request knowledge
- **Dance Styles** - Salsa, bachata, kizomba, zouk, tango, swing, ballroom
- **Experience Levels** - Beginner to professional
- **Availability** - When you can teach/learn
- **Search & Filter** - Find by style, type, level

### 📊 Community Polls
- **Create Polls** - Ask the community anything
- **Multiple Options** - Add as many choices as needed
- **Expiration Dates** - Time-limited voting
- **Results Visualization** - Percentage bars show distribution
- **Vote Tracking** - One vote per person
- **RPC Helper** - Efficient results calculation

### 💃 Dance Partner Finder
- **Partner Profiles** - Showcase your dance styles and levels
- **Multi-Style Support** - List all styles you dance
- **Role Preferences** - Lead, follow, or both
- **Experience per Style** - Different levels for different dances
- **Goals & Bio** - What you're looking for
- **Match Requests** - Send personalized connection requests
- **Style Filtering** - Find partners by dance style

### 🗄️ Database Enhancements
- **11 New Tables** - Complete schema for all features
- **Full RLS Policies** - Row-level security on all tables
- **Helper Functions** - get_poll_results, find_dance_partners
- **Storage Buckets** - lost-found-photos, announcement-images
- **Indexes** - Optimized queries for all new features

### 📱 Community Hub Upgrade
- **10-Tab Navigation** - All features in one page
- **Scrollable Tabs** - Mobile-friendly navigation
- **Unified Design** - Consistent styling across features

---

## [1.8.0] - 2026-02-01

### 🏘️ Phase B Complete - "Community Resources"

Transforming social network into true community hub with practical resource sharing.

### 🏠 Housing Hub
- **Housing Listings** - Rooms, apartments, houses, sublets
- **Roommate Finder** - Dedicated "roommate-wanted" listings
- **Advanced Filters** - Search by price, bedrooms, neighborhood, amenities
- **Roommate Preferences** - Specify ideal roommate characteristics
- **Amenities Tagging** - parking, laundry, pet-friendly, dance-space, etc.
- **Inquiry System** - Private messaging for interested renters
- **Favorites** - Save listings for later review

### 📦 Classifieds Marketplace
- **Four Listing Types** - For-sale, wanted, free, trade
- **Dance Categories** - Specialized for dance shoes, costumes, accessories
- **General Categories** - Electronics, furniture, clothing, tickets, services
- **Condition Ratings** - New, like-new, good, fair, parts-only
- **Negotiable Pricing** - Mark items as OBO (or best offer)
- **Offer System** - Send offers with optional price and message
- **Photo Uploads** - Multiple photos per listing

### 🏪 Local Business Directory
- **Business Profiles** - Name, description, hours, contact info
- **Category System** - Dance studios, venues, restaurants, services
- **Review System** - 5-star ratings with written reviews
- **Community Features** - "Dance Friendly" and "Community Owned" badges
- **Member Discounts** - Highlight special offers for community members
- **Verification** - Admin-verified businesses with checkmark
- **Favorites** - Save favorite local spots

### 🤝 Mutual Aid Network
- **Help Requests** - Post needs for transportation, housing, food, childcare
- **Help Offers** - Offer skills, equipment loans, emotional support
- **12 Categories** - Transportation, housing, food, childcare, pet-care, moving-help, emotional-support, skills-teaching, equipment-loan, financial, medical, errands
- **Urgency Levels** - Low, normal, high, urgent priority system
- **Anonymous Posts** - Option to post help requests anonymously
- **Karma System** - Track community contributions with thank-you points
- **Response System** - Direct messaging for offers/requests
- **Location Fields** - Optional location sharing for coordination

### 🗺️ Navigation Updates
- **Community Tab** - New bottom nav tab replacing "Music"
- **Four Sub-Tabs** - Housing, Classifieds, Businesses, Mutual Aid
- **Top Menu Item** - Community resources in hamburger menu
- **Unified Interface** - Single page with tab navigation

### 🗄️ Database Architecture
- **11 New Tables** - housing_listings, classifieds, local_businesses, mutual_aid_posts, plus 7 relationship tables
- **Full-Text Search** - tsvector indexes for fast searching
- **Row Level Security** - User-based permissions on all tables
- **3 Storage Buckets** - housing-photos, classifieds-photos, business-photos
- **Helper Functions** - get_mutual_aid_karma, get_business_rating

### 📊 Stats
- **4 Major Components** - ~3,000 lines of TypeScript/React
- **1 SQL Migration** - 750+ lines comprehensive schema
- **Type-Safe** - Full TypeScript with proper casting
- **Mobile-Optimized** - Responsive design for all screens

---

## [1.7.0] - 2026-02-01

### 🚀 Phase A Complete - "Full Social Suite"

Completing all Priority 1-3 social networking features for world-class community engagement.

### 👥 Group DMs (Circles)
- **Circle Conversations** - Create group chats with multiple members
- **Circle Management** - Add/remove members, admin controls
- **Group Messaging** - Real-time group conversations
- **Circle Browser** - Dedicated tab in Messages for circles

### 🎙️ Voice Messages
- **Voice Recording** - Record and send voice notes in DMs
- **Audio Player** - Beautiful inline player with progress bar
- **Duration Display** - See voice message length before playing
- **Secure Upload** - Voice files stored in Supabase storage

### 🔗 Link Previews
- **Auto-Unfurl** - URLs automatically show rich previews
- **Open Graph** - Pulls title, description, image from links
- **Cached Previews** - Fast loading with 7-day cache
- **Compact Mode** - Optimized previews for chat messages

### #️⃣ Hashtags & Trending
- **Clickable Hashtags** - #tags link to filtered content
- **Trending Widget** - See popular topics in community
- **Hashtag Suggestions** - Auto-complete while typing
- **Trending Algorithm** - Score-based ranking system

### 🔐 Security Enhancements
- **Admin Block Protection** - Regular users cannot block admins
- **Auto E2EE Setup** - Encryption initialized at account creation

---

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
