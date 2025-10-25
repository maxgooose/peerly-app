# Push Notifications Setup

## Overview

Push notifications are automatically sent when users get matched. The system uses **Expo Push Notifications** for cross-platform support (iOS & Android).

## How It Works

1. **User opens app** → Request notification permission → Get Expo push token
2. **Save token** → Store token in `users.push_token` column
3. **Match created** → Edge Function sends push notification to both users
4. **User taps notification** → Opens app to Chats tab

---

## Setup Instructions

### 1. Run Database Migration

```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/20241024000004_add_push_tokens.sql
```

This adds:
- `push_token` column to `users` table
- `push_token_updated_at` timestamp
- Auto-update trigger

### 2. Get Expo Project ID

```bash
# In your project directory
npx expo start

# Note the Project ID shown in terminal or Expo Dev Tools
# Add to .env.local:
EXPO_PUBLIC_PROJECT_ID=your-project-id-here
```

### 3. Deploy Updated Edge Function

```bash
npx supabase functions deploy auto-match
```

The Edge Function now sends notifications when creating matches.

### 4. Test Notifications

#### Option A: Physical Device (Recommended)
- Push notifications only work on physical devices
- Install Expo Go app
- Scan QR code from `npx expo start`
- Grant notification permission when prompted

#### Option B: Test with API

```bash
curl -X POST 'https://exp.host/--/api/v2/push/send' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "title": "Test Notification",
    "body": "This is a test",
    "data": {"type": "test"}
  }'
```

---

## Features

### Automatic Token Management

When app loads (`app/_layout.tsx`):
1. Requests notification permission
2. Gets Expo push token
3. Saves token to database
4. Sets up notification listeners

### Notification Types

**New Match Notification**
```typescript
{
  title: "New Study Match! 🎓",
  body: "You matched with Alice Chen",
  data: {
    type: "new_match",
    matchId: "uuid"
  }
}
```

When user taps notification → Navigates to Chats tab

### Notification Service API

```typescript
import {
  initializePushNotifications,
  sendMatchNotification,
  clearBadge
} from '@/services/notifications';

// Initialize (called automatically in _layout.tsx)
await initializePushNotifications();

// Send match notification (called from Edge Function)
await sendMatchNotification({
  userId: 'user-id',
  matchedUserName: 'Alice Chen',
  matchId: 'match-id'
});

// Clear badge count
await clearBadge();
```

---

## How Matching + Notifications Flow Works

```
┌──────────────────┐
│   Cron Job       │
│   (Every 5 min)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│  Edge Function: auto-match   │
│  1. Find compatible users    │
│  2. Create match record      │
│  3. Create conversation      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Get push tokens from DB     │
│  users.push_token            │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Send via Expo API           │
│  https://exp.host/--/api/... │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  User's device receives      │
│  notification & shows alert  │
└──────────────────────────────┘
         │
         ▼ (user taps)
┌──────────────────────────────┐
│  App opens to Chats tab      │
│  Shows new match             │
└──────────────────────────────┘
```

---

## Troubleshooting

### Notifications not sending

**Check 1:** Verify user has push token
```sql
SELECT id, full_name, push_token
FROM users
WHERE push_token IS NOT NULL;
```

**Check 2:** Test notification manually
```typescript
import { sendPushNotification } from '@/services/notifications';

await sendPushNotification({
  expoPushToken: 'ExponentPushToken[...]',
  title: 'Test',
  body: 'Testing notifications'
});
```

**Check 3:** Check Edge Function logs
- Supabase Dashboard → Edge Functions → auto-match → Logs
- Look for "Sent notification to [user name]"

### Permission denied

Users can deny notification permission. Handle gracefully:

```typescript
const token = await registerForPushNotifications();

if (!token) {
  // User denied permission or not on physical device
  console.log('Notifications not available');
}
```

### Token not saving

Check RLS policies on users table:

```sql
-- Users should be able to update their own push_token
CREATE POLICY "Users can update own push token" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

## Important Notes

### Physical Device Required

Push notifications **only work on physical devices**. Simulators/emulators will return `null` token.

### Expo Push Token Format

Valid token format: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

If you get a different format, you may need to configure Expo project ID.

### iOS Specific

For iOS production builds:
1. Enable Push Notifications capability in Xcode
2. Configure APNs in Apple Developer Console
3. Add Push Notification entitlement

### Android Specific

Android handles notifications automatically. No additional setup needed.

---

## Production Checklist

Before going live:

- [ ] Add `EXPO_PUBLIC_PROJECT_ID` to environment variables
- [ ] Test notifications on both iOS and Android physical devices
- [ ] Set up proper error handling for failed notifications
- [ ] Monitor notification delivery rates
- [ ] Add analytics for notification engagement

---

## Next Steps

### Phase 1: Basic Notifications ✅
- [x] Send notification when users match
- [x] Handle notification taps
- [x] Navigate to relevant screen

### Phase 2: Enhanced Notifications (Future)
- [ ] Send notification when matched user sends first message
- [ ] Send notification for study session reminders
- [ ] Rich notifications with images
- [ ] Custom notification sounds
- [ ] Notification preferences (allow users to customize)

### Phase 3: Advanced Features (Future)
- [ ] Quiet hours (don't send notifications at night)
- [ ] Batch notifications (group multiple matches)
- [ ] In-app notification center
- [ ] Notification history

---

## Files Created

1. **Service**
   - `src/services/notifications.ts` - Push notification logic

2. **Database**
   - `supabase/migrations/20241024000004_add_push_tokens.sql` - Token storage

3. **Edge Function**
   - Updated `supabase/functions/auto-match/index.ts` - Sends notifications

4. **App Integration**
   - Updated `app/_layout.tsx` - Initialize notifications & handle taps

---

**Status:** ✅ Ready to test
**Last Updated:** 2024-10-24
**Version:** 1.0 - Basic push notifications
