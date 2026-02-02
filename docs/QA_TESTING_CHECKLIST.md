# Fernhill Community - QA Testing Checklist

**Version:** 1.12.0 "Legendary Touch"  
**Date:** February 2026  
**Tester:** _______________  
**Device:** _______________  
**Browser:** _______________  

---

## 📋 Pre-Testing Setup

### Device Requirements
- [ ] Mobile device (iOS 15+ or Android 10+)
- [ ] Desktop browser (Chrome 110+, Safari 16+, Firefox 115+)
- [ ] Stable internet connection
- [ ] Allow notifications when prompted

### Test Account Setup
- [ ] Create test account via magic link
- [ ] Verify email received within 2 minutes
- [ ] Complete profile setup (name, avatar)
- [ ] Note: Some features require admin approval

---

## 🔐 AUTHENTICATION TESTS

### A1. Magic Link Login
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| A1.1 | Enter email, click "Send Magic Link" | Email sent confirmation shown | ☐ |
| A1.2 | Open email, click magic link | Redirected to app, logged in | ☐ |
| A1.3 | Try invalid email format | Error message shown | ☐ |
| A1.4 | Click magic link twice | Second click shows "already used" | ☐ |

### A2. Session Management
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| A2.1 | Close browser, reopen | Still logged in (session persists) | ☐ |
| A2.2 | Click "Sign Out" | Redirected to login page | ☐ |
| A2.3 | Use back button after logout | Cannot access protected pages | ☐ |

---

## 📱 PWA & MOBILE TESTS

### P1. Installation (Mobile)
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| P1.1 | Visit site on mobile | Install prompt appears | ☐ |
| P1.2 | Tap "Add to Home Screen" | App icon added to home screen | ☐ |
| P1.3 | Launch from home screen | Opens in standalone mode (no browser UI) | ☐ |
| P1.4 | Check app name in switcher | Shows "Fernhill" not URL | ☐ |

### P2. Offline Mode
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| P2.1 | Enable airplane mode | "You're offline" banner appears | ☐ |
| P2.2 | Navigate cached pages | Pages load from cache | ☐ |
| P2.3 | Try to post while offline | Post queued, "Pending" indicator | ☐ |
| P2.4 | Disable airplane mode | "Back online!" message, posts sync | ☐ |
| P2.5 | Refresh offline page | Offline fallback page shown | ☐ |

### P3. Pull-to-Refresh
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| P3.1 | Pull down on Hearth feed | Refresh indicator appears | ☐ |
| P3.2 | Release after threshold | Content refreshes | ☐ |
| P3.3 | Release before threshold | Returns to normal, no refresh | ☐ |
| P3.4 | Check haptic feedback | Vibration at threshold (Android) | ☐ |

### P4. Haptic Feedback
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| P4.1 | Tap bottom navigation item | Light vibration (Android) | ☐ |
| P4.2 | Long-press a post | Vibration during hold | ☐ |
| P4.3 | Complete a swipe action | Medium vibration | ☐ |
| P4.4 | Error state (e.g., network error) | Error vibration pattern | ☐ |

---

## 👆 GESTURE TESTS

### G1. Swipe Gestures
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| G1.1 | Swipe left on list item | Action buttons revealed (delete/archive) | ☐ |
| G1.2 | Swipe past threshold | Action executes automatically | ☐ |
| G1.3 | Partial swipe, release | Springs back to normal | ☐ |
| G1.4 | Swipe right on same item | Different actions revealed | ☐ |

### G2. Long Press
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| G2.1 | Long-press a post (500ms) | Context menu appears | ☐ |
| G2.2 | Move finger during press | Press cancelled | ☐ |
| G2.3 | Tap menu option | Action executes, menu closes | ☐ |
| G2.4 | Tap outside menu | Menu closes | ☐ |

### G3. Edge Swipe (Back Navigation)
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| G3.1 | Swipe from left edge of screen | Previous page indicator appears | ☐ |
| G3.2 | Complete swipe past threshold | Navigate back | ☐ |
| G3.3 | Partial swipe, release | Stay on current page | ☐ |

---

## 🎬 VIEW TRANSITIONS

### V1. Page Transitions
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| V1.1 | Tap navigation item | Smooth slide animation | ☐ |
| V1.2 | Navigate to profile from post | Avatar morphs between views | ☐ |
| V1.3 | Use back button | Reverse animation direction | ☐ |
| V1.4 | Rapid navigation (spam taps) | No animation glitches | ☐ |

---

## 📤 SHARING TESTS

### S1. Web Share
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| S1.1 | Tap share on a post (mobile) | Native share sheet opens | ☐ |
| S1.2 | Tap share on desktop | "Copied to clipboard" message | ☐ |
| S1.3 | Cancel share sheet | Returns to app normally | ☐ |
| S1.4 | Share to Messages/Email | Correct title/URL shared | ☐ |

---

## 🔔 NOTIFICATIONS

### N1. Browser Notifications
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| N1.1 | Grant notification permission | Permission saved | ☐ |
| N1.2 | Receive message while tab hidden | Browser notification appears | ☐ |
| N1.3 | Click notification | Opens app to relevant page | ☐ |
| N1.4 | Deny notifications | App works without them | ☐ |

### N2. App Badge
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| N2.1 | Receive new message (PWA) | Badge appears on app icon | ☐ |
| N2.2 | Read all messages | Badge clears | ☐ |

---

## ♿ ACCESSIBILITY TESTS

### AC1. Reduced Motion
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| AC1.1 | Enable "Reduce Motion" in OS settings | Animations disabled/minimized | ☐ |
| AC1.2 | Page transitions | Instant switch, no animation | ☐ |
| AC1.3 | Loading skeletons | Still visible, no shimmer | ☐ |

### AC2. Screen Reader
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| AC2.1 | Navigate with VoiceOver/TalkBack | All elements announced | ☐ |
| AC2.2 | Images have alt text | Described appropriately | ☐ |
| AC2.3 | Buttons have labels | Purpose is clear | ☐ |
| AC2.4 | Focus order is logical | Tab through makes sense | ☐ |

### AC3. Keyboard Navigation (Desktop)
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| AC3.1 | Tab through all interactive elements | Focus visible on each | ☐ |
| AC3.2 | Enter/Space activates buttons | Actions work | ☐ |
| AC3.3 | Escape closes modals | Modal dismissed | ☐ |
| AC3.4 | Arrow keys in lists | Selection moves | ☐ |

### AC4. Touch Targets
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| AC4.1 | All buttons at least 44x44px | Easy to tap | ☐ |
| AC4.2 | Adequate spacing between targets | No accidental taps | ☐ |

---

## 🏠 THE HEARTH (Community Feed)

### H1. Posts
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| H1.1 | View feed | Posts load with skeletons first | ☐ |
| H1.2 | Create text post | Post appears in feed | ☐ |
| H1.3 | Create post with image | Image uploads and displays | ☐ |
| H1.4 | Delete own post | Post removed from feed | ☐ |
| H1.5 | Cannot delete others' posts | Delete option not shown | ☐ |

### H2. Reactions
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| H2.1 | Tap reaction emoji | Reaction added, count updates | ☐ |
| H2.2 | Tap same emoji again | Reaction removed | ☐ |
| H2.3 | Multiple users react | All reactions shown | ☐ |

### H3. Comments
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| H3.1 | Add comment to post | Comment appears | ☐ |
| H3.2 | Delete own comment | Comment removed | ☐ |

---

## 📅 EVENTS

### E1. Event Listing
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| E1.1 | View events page | Upcoming events shown | ☐ |
| E1.2 | Past events hidden/separated | Clear distinction | ☐ |
| E1.3 | Event card shows key info | Date, time, location visible | ☐ |

### E2. RSVP
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| E2.1 | RSVP "Going" to event | Button changes to "Going ✓" | ☐ |
| E2.2 | Change to "Maybe" | Status updates | ☐ |
| E2.3 | Cancel RSVP | Removed from going list | ☐ |

---

## 💬 MESSAGES (E2EE)

### M1. Conversations
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| M1.1 | Start new conversation | Message thread created | ☐ |
| M1.2 | Send text message | Message appears, sent indicator | ☐ |
| M1.3 | Receive message | Notification + message appears | ☐ |
| M1.4 | Messages persist across sessions | History visible on return | ☐ |

### M2. Encryption Indicators
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| M2.1 | View conversation | Lock icon or "Encrypted" shown | ☐ |
| M2.2 | Key generation on first use | No visible delay | ☐ |

---

## 🎵 THE JOURNEY (Music)

### J1. Playback
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| J1.1 | Play a track | Audio plays | ☐ |
| J1.2 | Pause/resume | Playback controls work | ☐ |
| J1.3 | Navigate to another page | Music continues (global player) | ☐ |
| J1.4 | Close app (PWA) | Music stops | ☐ |

### J2. Wake Lock
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| J2.1 | Play music, wait 2 minutes | Screen stays on | ☐ |
| J2.2 | Pause music | Screen can turn off normally | ☐ |

---

## 👥 DIRECTORY

### D1. Member List
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| D1.1 | View directory | Approved members shown | ☐ |
| D1.2 | Search by name | Results filter in real-time | ☐ |
| D1.3 | Tap member | Profile detail view opens | ☐ |

---

## 🆘 SAFETY

### SF1. Reporting
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| SF1.1 | Report a post | Report form opens | ☐ |
| SF1.2 | Submit report | Confirmation shown | ☐ |
| SF1.3 | Report is anonymous | Reporter info not visible | ☐ |

### SF2. Blocking
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| SF2.1 | Block a user | Confirmation required | ☐ |
| SF2.2 | Blocked user's content hidden | Posts/messages not visible | ☐ |
| SF2.3 | Unblock user | Content visible again | ☐ |

---

## 🔧 ADMIN PANEL (Admin Only)

### AD1. User Management
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| AD1.1 | View pending users | List of unapproved accounts | ☐ |
| AD1.2 | Approve user | User gains access | ☐ |
| AD1.3 | Deny user | User remains locked out | ☐ |

### AD2. Content Moderation
| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| AD2.1 | View reported content | Reports dashboard | ☐ |
| AD2.2 | Remove flagged post | Post deleted | ☐ |
| AD2.3 | Dismiss report | Report cleared | ☐ |

---

## 📊 PERFORMANCE CHECKLIST

Run these in Chrome DevTools → Lighthouse:

| Metric | Target | Actual | Pass? |
|--------|--------|--------|-------|
| Performance Score | ≥ 90 | _____ | ☐ |
| Accessibility Score | ≥ 95 | _____ | ☐ |
| Best Practices | ≥ 90 | _____ | ☐ |
| SEO | ≥ 90 | _____ | ☐ |
| PWA | ✓ All checks | _____ | ☐ |
| First Contentful Paint | < 1.5s | _____ | ☐ |
| Largest Contentful Paint | < 2.5s | _____ | ☐ |
| Time to Interactive | < 3.0s | _____ | ☐ |
| Cumulative Layout Shift | < 0.1 | _____ | ☐ |

---

## 🐛 BUG REPORT TEMPLATE

```
**Bug ID:** BUG-____
**Tester:** 
**Date:**
**Device/Browser:**

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**

**Actual Result:**

**Screenshot/Video:** [Attach]

**Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low
```

---

## ✅ SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Tester | | | |
| Developer | | | |
| Product Owner | | | |

---

**Testing Complete:** ☐ Yes ☐ No (see bug reports)

**Recommendation:** ☐ Ready for Release ☐ Needs Fixes ☐ Major Issues
