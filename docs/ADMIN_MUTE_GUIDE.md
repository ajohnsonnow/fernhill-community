# Admin Quick Guide: User Mute Feature

## What is Muting?

Muting (also called "shadow banning") allows you to hide a user's posts from the community without banning them. The muted user:
- ✅ Can still post and comment normally
- ✅ Sees all their own content
- ❌ Their content is invisible to other community members
- ❓ **They don't know they're muted**

This is useful for:
- Handling users who spam or post inappropriate content
- Temporary moderation without full ban
- Testing whether behavior improves without confrontation

---

## How to Mute a User

1. Open **Admin Dashboard**
2. Go to **Users** tab
3. Find the user in the list
4. Look for the speaker icon (🔊) next to their name
5. Click the speaker icon
6. A prompt appears - enter a reason (optional but recommended)
7. Click OK

**Result**: User is now muted. You'll see an orange "Muted" badge on their profile.

---

## How to Unmute a User

1. Open **Admin Dashboard**
2. Go to **Users** tab
3. Find the muted user (look for orange "Muted" badge)
4. Click the muted speaker icon (🔇)
5. Confirm unmute

**Result**: User is unmuted and their content is visible again to everyone.

---

## What You See as Admin

### In User List:
- **Orange "Muted" badge** next to user's name
- **Mute reason box** (orange background) showing:
  - Why they were muted
  - When they were muted
  - Who muted them

### In Stats Bar:
- **"Muted" count** shows total currently muted users

### In Content:
- You see **ALL posts and comments**, including from muted users
- This lets you monitor if muted users are improving their behavior

---

## What Users See

### Muted User:
- Sees all their own posts normally
- **Doesn't know they're muted**
- Can interact with the community as usual
- Posts/comments appear to submit successfully

### Regular Community Members:
- **Don't see** posts or comments from muted users
- Don't see any indication that content is hidden
- Experience is seamless

---

## Important Rules

🚫 **You CANNOT mute:**
- Yourself
- Other admins

✅ **Best Practices:**
- Always provide a reason when muting (for audit trail)
- Check muted user's activity periodically
- Consider unmuting if behavior improves
- Use mute instead of ban for first offenses

---

## Audit Trail

Every mute/unmute action is logged:
- Who did it (admin)
- When it happened
- Who was affected (user)
- Why (reason provided)

View audit logs in **Admin Dashboard → Audit Logs** tab.

---

## Troubleshooting

**Q: Mute button not showing up?**
→ Database migration may not be run yet. Contact developer.

**Q: Muted user's posts still showing to regular users?**
→ Clear browser cache or wait a moment for changes to propagate.

**Q: Can users appeal a mute?**
→ Not currently - handle appeals through direct communication.

---

## Technical Notes

- Mute status is stored in database
- Filtering happens at query level (efficient)
- No performance impact on the app
- Works for both Hearth posts and Discussion Boards

---

**Questions?** Contact: Anthony (Admin Panel Developer)
