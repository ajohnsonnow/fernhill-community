# 🌿 Fernhill Community PWA

**A Secure Digital Hearth for the Ecstatic Dance Tribe**

[![Version](https://img.shields.io/badge/version-1.21.0-green.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](tsconfig.json)
[![Lines of Code](https://img.shields.io/badge/lines-51,541+-brightgreen.svg)](#)
[![License](https://img.shields.io/badge/license-Private-red.svg)](LICENSE)
[![Deployed](https://img.shields.io/badge/deployed-Render.com-blueviolet.svg)](https://fernhill-community.onrender.com)

The Fernhill Community App is a best-in-class, private Progressive Web App designed to foster connection, safety, and mutual aid within the ecstatic dance community of Portland, Oregon. Moving away from mainstream social media, this platform prioritizes **Consent, Privacy, and Presence**.

> 💡 **Development Note:** This entire application was built by a single Content Engineer using AI assistance (Claude + GitHub Copilot), demonstrating the power of modern development tools. **~32 hours total development. $358K-718K equivalent value.** See [VALUE_PROPOSITION.md](docs/VALUE_PROPOSITION.md) for the full analysis.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [📖 User Guide](docs/USER_GUIDE.md) | Complete guide for app users |
| [💰 Value Proposition](docs/VALUE_PROPOSITION.md) | Cost analysis: AI-assisted vs traditional development |
| [🔧 Setup Guide](SETUP.md) | Development environment setup |

---

## ✨ Core Features

### 🚪 Sacred Gate (Vetting)
Human-powered entry system. Every member must be vouched for and approved by an admin.

### 🏠 The Hearth (Community Feed)
Share offerings, requests, gratitude, and organize events with auto-purging privacy.

### 📅 Events
Clean list view of upcoming and past events with Google Calendar sync, event details, directions, and calendar integration.

### 🎵 The Journey (Music)
Persistent audio player for DJ sets with vibe tags and background playback across all pages.

### 💬 E2EE Messaging
End-to-end encrypted private messages using Web Crypto API (RSA-OAEP + AES-GCM hybrid encryption).

### 📸 The Altar (Photo Gallery)
Privacy-first photo sharing with blur-by-default, EXIF stripping, and 90-day auto-expiry.

### 👥 Soul Gallery (Directory)
Searchable member directory with skill tags, vibe status, and privacy controls.

### 💬 Discussion Boards
Topic-based community discussions organized by category.

### 🆘 Safety Reporting
Comprehensive 4-step boundary violation report form matching official community standards.

### 🛡️ Universal Content Reporting (NEW!)
Report any post, comment, or message directly to admins with 10 reason categories. Content snapshots preserved for review.

### 🎉 Social Features
- **Multi-emoji reactions** (❤️🔥🙏💃✨🌀) like Slack/Discord
- **Message reactions** (❤️👍😂😮🙏💯) on DMs (NEW!)
- **Event RSVPs** (Going / Maybe / Can't Go)
- **Community Polls** with voting and results
- **Achievement Badges** (11 types: First Dance, Regular Dancer, DJ Debut, etc.)
- **Community Roadmap** - Track feature development progress (NEW!)
- **Feature Requests** - Submit and vote on new features (NEW!)

### 🔐 Security Features
- Magic link authentication (no passwords)
- Session management with remote kill switch
- Row-Level Security (RLS) on all tables
- VAPID push notifications
- Automated data purging (30/90 days)
- Content moderation with trust levels

### 👨‍💼 Admin Features
- Member approval dashboard
- Content moderation queue
- Trust level management
- Freeze mode (emergency lockdown)
- Event submission review
- Safety report management

---

## 🛠 Tech Stack

| Component | Technology | Role |
|-----------|------------|------|
| **Frontend** | Next.js 16 | App Router, Server Components, Turbopack |
| **Backend/DB** | Supabase | PostgreSQL, Real-time, Auth, Storage |
| **Encryption** | Web Crypto API | E2EE with RSA-OAEP + AES-GCM |
| **Styling** | Tailwind CSS | Custom Glassmorphism theme |
| **PWA** | Service Worker | Offline support, push notifications |
| **Hosting** | Render.com | Free-tier with auto-deploy |

---

## 📊 Codebase Statistics

| Metric | Value |
|--------|-------|
| **Lines of TypeScript/TSX** | 7,000+ |
| **React Components** | 60+ |
| **Protected Routes** | 12 |
| **API Routes** | 4 |
| **SQL Setup Files** | 1 (COMPLETE_SETUP.sql) |
| **Production URL** | [fernhill-community.onrender.com](https://fernhill-community.onrender.com) |
| **Database Tables** | 20+ |
| **RLS Policies** | 40+ |
| **Storage Buckets** | 3 (private with RLS) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase Project
- (Optional) OpenWeather API Key

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase keys
```

### ⚠️ CRITICAL: Supabase Auth Configuration

In your **Supabase Dashboard** → **Authentication** → **URL Configuration**:

1. **Site URL**: Set to `http://localhost:3000` (dev) or your production URL

2. **Redirect URLs** - Add ALL of these:
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   https://your-production-domain.com/**
   https://your-production-domain.com/auth/callback
   ```

Without these redirect URLs, **magic link authentication will fail!**

```bash
# 3. Set up database (run in Supabase SQL Editor)
# Run the SINGLE comprehensive setup file:
# - supabase/COMPLETE_SETUP.sql (creates ALL tables, policies, triggers, and storage buckets)
# - supabase/boundary_reports_migration.sql

# 4. Generate VAPID keys for push notifications
npx web-push generate-vapid-keys
# Add keys to .env.local

# 5. Seed admin account
npm run seed-admin

# 6. Start development server
npm run dev
```

### Development Login

In development mode (`npm run dev`), a **Dev Admin Login** button appears on the login page:
- Email: `admin@fernhill.local`
- Password: `admin123`

This bypasses magic link for faster local testing.

Visit http://localhost:3000

---

## 📝 Project Status

### ✅ Completed Features (18 pages)
- [x] `/admin/events`
- [x] `/admin`
- [x] `/altar`
- [x] `/audit`
- [x] `/boards`
- [x] `/community`
- [x] `/directory`
- [x] `/events`
- [x] `/hearth`
- [x] `/help`
- [x] `/journey`
- [x] `/messages`
- [x] `/profile`
- [x] `/safety`
- [x] `/auth/auth-code-error`
- [x] `/login`
- [x] `/`
- [x] `/waiting-room`

### 📊 Codebase Statistics
- **Version:** 1.17.2
- **TypeScript Files:** 173
- **Components:** 97
- **Database Tables:** 0
- **Lines of Code:** 49,178
- **Last Updated:** 2/3/2026

---


## 🔒 Security & Privacy

### Authentication
- Magic link email authentication
- No passwords stored
- Session management with remote kill switch

### Data Protection
- End-to-end encryption for DMs (RSA-OAEP + AES-GCM)
- EXIF/GPS stripping on all uploads
- 30-day auto-purge on mutual aid posts
- 90-day expiry on altar photos
- Blur-by-default on all gallery images

### Access Control
- Human-powered vetting required for entry
- Row-Level Security on all database tables
- Freeze mode for emergency lockdown
- Content moderation with trust levels
- Admin audit capabilities

---

## 🎨 Design System

### Color Palette (Matches fernhilldance.com)

| Color | Hex | Usage |
|-------|-----|-------|
| Fernhill Dark | `#0f0f0f` | Background |
| Fernhill Charcoal | `#1a1a1a` | Cards |
| Fernhill Brown | `#2a221c` | Accents |
| Fernhill Gold | `#d4a855` | Primary accent |
| Fernhill Terracotta | `#b87333` | Secondary accent |
| Fernhill Cream | `#f5ebe0` | Headings |
| Fernhill Sand | `#c9b896` | Body text |

### Typography
- **Display:** Playfair Display, Georgia, serif
- **Body:** System UI, -apple-system, sans-serif

### Components
- Glass panels with blur effects
- Warm cards with gradient backgrounds
- Smooth fadeIn/slideUp animations
- Mobile-first responsive design
- iOS safe area support

---

## 📦 NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed-admin` | Create admin account |

---

## 🙏 Community Agreements

### Dance Floor
- Move freely—no right or wrong way
- Talk-free zone on the floor
- Phone-free presence

### Consent
- Hand on heart = "I need space"
- Respect the "no" instantly
- Ask before entering someone's space

### Digital
- Vouch responsibly
- No screenshots of private content
- Be kind—we're all learning

---

## 📞 Support

Use the in-app feedback system:
1. Go to Profile
2. Tap "Send Feedback"
3. Choose: Bug Report, Feature Idea, or Gratitude

For safety concerns, use the dedicated Safety Report form at `/safety`.

---

## 💰 Development Economics

This app demonstrates the power of AI-assisted development:

| Metric | Traditional Team | AI-Assisted |
|--------|-----------------|-------------|
| **Cost** | $577K - $1.16M | ~$125 |
| **Time** | 11-20 months | 2 weeks |
| **Team Size** | 6-10 people | 1 person |
| **Lines of Code** | Same | 10,193 |
| **Quality** | High | High |

**ROI Multiplier: 4,619x**

See full analysis: [docs/VALUE_PROPOSITION.md](docs/VALUE_PROPOSITION.md)

---

## 🗄️ Database Migrations

Run these SQL files in Supabase SQL Editor (in order):

1. `supabase/schema.sql` - Core tables
2. `supabase/additional_schema.sql` - Extended features
3. `supabase/boards_schema.sql` - Discussion boards
4. `supabase/admin_migration.sql` - Admin features
5. `supabase/feedback_migration.sql` - Feedback system
6. `supabase/event_submissions_migration.sql` - Event suggestions
7. `supabase/content_moderation_migration.sql` - Trust levels & moderation
8. `supabase/social_features_migration.sql` - Reactions, RSVPs, polls, badges
9. `supabase/boundary_reports_migration.sql` - Safety reports

---

**Built with love for the Fernhill Ecstatic Dance Community** 🌿✨

*One Content Engineer. One AI Partner. Infinite Possibilities.*

**Last Updated:** January 29, 2026
