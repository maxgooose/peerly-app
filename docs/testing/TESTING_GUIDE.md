# Phase 1 & 2 Testing Guide

## What I've Prepared For You

✅ `.env` file - Created with your Supabase credentials
✅ `RUN_THIS_IN_SUPABASE.sql` - All migrations combined
✅ `CREATE_TEST_DATA.sql` - Test conversation and messages

---

## Step-by-Step Testing (10 minutes)

### PART 1: Set Up Database (5 minutes)

#### 1.1 Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Open project: **sebscmgcuosemsztmsoq**
3. Click **SQL Editor** (left sidebar)
4. Click **New Query** button

#### 1.2 Run All Migrations

1. **Open the file:** `RUN_THIS_IN_SUPABASE.sql` in your code editor
2. **Copy everything** (Cmd/Ctrl + A, then Cmd/Ctrl + C)
3. **Paste** into Supabase SQL Editor
4. **Click RUN** (or press Cmd/Ctrl + Enter)

**Expected Result:**
```
✅ Success
✅ Should see several "NOTICE" messages about tables created
✅ Final output shows 2 tables, RLS enabled, triggers created
```

**If you see errors:**
- "relation 'matches' does not exist" → You need to create matches table first
- "relation 'users' does not exist" → You need to create users table first
- Other errors → Share the error message with me

#### 1.3 Get a Match ID

After migrations succeed, run this query:

```sql
SELECT id, user1_id, user2_id FROM matches LIMIT 5;
```

**Copy one of the match IDs** (the UUID in the `id` column)

Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

#### 1.4 Create Test Data

1. **Open:** `CREATE_TEST_DATA.sql`
2. **Find line 13:** `v_match_id UUID := 'YOUR_MATCH_ID_HERE'::uuid;`
3. **Replace** `YOUR_MATCH_ID_HERE` with the match ID you copied
4. **Copy the entire file**
5. **Paste** into a new SQL query in Supabase
6. **Click RUN**

**Expected Result:**
```
NOTICE: Creating conversation for match: ...
NOTICE: User 1: ...
NOTICE: User 2: ...
NOTICE: Created new conversation: ...
NOTICE: ✅ Successfully created 10 test messages!
```

Then you should see the conversation and messages displayed!

#### 1.5 Verify Data Exists

Quick verification - run this:

```sql
-- Count conversations
SELECT COUNT(*) as conversation_count FROM conversations;

-- Count messages
SELECT COUNT(*) as message_count FROM messages;
```

**Expected:**
- `conversation_count`: 1 (or more)
- `message_count`: 10 (or more)

---

### PART 2: Test the App (5 minutes)

#### 2.1 Start the App

```bash
cd peerly-app
npm start
```

**If you get errors:**
- "Cannot find module" → Run `npm install` first
- "Supabase credentials missing" → Check `.env` file exists
- Metro bundler errors → Clear cache: `npm start -- --reset-cache`

#### 2.2 Open in Simulator/Device

Choose one:
- **iOS Simulator:** Press `i`
- **Android Emulator:** Press `a`
- **Physical Device:** Scan QR code with Expo Go app

#### 2.3 Test Chat List

1. **Navigate to Chats tab** (chat bubble icon in bottom nav)

**Expected:**
- ✅ See 1 conversation listed
- ✅ Shows other user's name
- ✅ Shows last message: "Would love to see it when it's ready!"
- ✅ Shows timestamp (e.g., "30m ago")
- ✅ Shows avatar (or initials if no photo)

**If empty:**
- Check you're logged in as one of the users in the match
- Verify data exists in Supabase (run queries from 1.5)
- Check console for errors (press `j` in Metro terminal)

#### 2.4 Test Chat Detail

1. **Tap the conversation**

**Expected:**
- ✅ Opens chat detail screen
- ✅ Header shows other user's name
- ✅ See 10 messages
- ✅ Messages in chronological order (oldest at top)
- ✅ Your messages: Blue bubbles on right
- ✅ Their messages: Gray bubbles on left
- ✅ Each message shows timestamp
- ✅ Bottom shows: "💬 Sending messages coming in Phase 3!"

**If errors:**
- "Cannot read property" → Check conversation ID is valid
- Blank screen → Check messages exist for this conversation
- Messages on wrong side → Check which user you're logged in as

#### 2.5 Test Pull to Refresh

1. **Go back to chat list** (tap back button)
2. **Pull down on the list**
3. **Release**

**Expected:**
- ✅ Loading spinner appears briefly
- ✅ Conversations refresh
- ✅ Still shows your conversation

---

### PART 2.5: Auto-match AI message (dev cycle)

Use this to verify the scheduled flow is inserting AI first messages without a Gemini key (fallback text):

1. Ensure you have at least two eligible users (onboarding_complete = true); last cycle > 24h or null
2. Invoke the function manually (replace values with your project):

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/auto-match' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

3. Verify inserts:

```sql
-- AI messages
SELECT * FROM messages WHERE is_ai_generated = true ORDER BY created_at DESC LIMIT 5;

-- Suggestions
SELECT * FROM suggested_messages ORDER BY created_at DESC LIMIT 5;

-- Matches flagged
SELECT * FROM matches WHERE ai_message_sent = true ORDER BY matched_at DESC LIMIT 5;
```

If empty, check Edge logs in Supabase Dashboard → Functions → auto-match → Logs.

---

### PART 3: Verification Checklist

Go through this checklist. All should be ✅:

**Database (Supabase):**
- [ ] `conversations` table exists
- [ ] `messages` table exists
- [ ] RLS is enabled on both tables
- [ ] Triggers are created
- [ ] 1+ conversation in database
- [ ] 10+ messages in database

**App (Local):**
- [ ] App starts without errors
- [ ] Can navigate to Chats tab
- [ ] See conversation(s) in list
- [ ] Can tap conversation
- [ ] Messages display correctly
- [ ] Your messages on right (blue)
- [ ] Their messages on left (gray)
- [ ] Timestamps show
- [ ] Pull to refresh works

---

## Troubleshooting

### "Match not found" error in test data script
**Problem:** The match ID doesn't exist or is wrong

**Solution:**
1. Run: `SELECT * FROM matches;`
2. Copy a valid match ID from the results
3. Make sure you pasted it correctly (no extra quotes or spaces)

### No conversations showing in app
**Problem:** Either no data in database OR user authentication issue

**Solution:**
1. Verify data exists: `SELECT * FROM conversations;`
2. Check which user you're logged in as
3. Make sure that user is part of the match

### "relation does not exist" errors
**Problem:** You're missing the users or matches tables

**Solution:**
You need to set up the base Peerly tables first:
- `users` table (from Supabase Auth setup)
- `matches` table (from Peerly MVP plan)

### Messages not displaying
**Problem:** Query is failing or messages don't exist

**Solution:**
1. Check messages exist: `SELECT COUNT(*) FROM messages;`
2. Open Chrome DevTools in Expo (press `j` in terminal)
3. Look for console errors
4. Share the error with me

### App won't start
**Problem:** Dependencies not installed or wrong Node version

**Solution:**
```bash
# Clear everything and start fresh
cd peerly-app
rm -rf node_modules
npm install
npm start -- --reset-cache
```

---

## Success Criteria

**Phase 1 & 2 are COMPLETE when:**

✅ Database migrations ran successfully
✅ Test data created (1 conversation, 10 messages)
✅ App shows conversation list
✅ App shows messages in conversation
✅ Messages display on correct sides
✅ No errors in console

---

## What to Do After Testing

### If Everything Works ✅

**Report back with:**
"Phase 1 & 2 working! Ready for Phase 3"

**Then we'll build:**
- Chat input component
- Send message functionality
- Optimistic updates

### If Something's Broken ❌

**Report back with:**
1. Which step failed (1.1, 1.2, 2.1, etc.)
2. The error message (copy/paste exact text)
3. Screenshot if helpful

**I'll help you fix it!**

---

## Quick Reference

**Your Supabase Project:**
- URL: https://sebscmgcuosemsztmsoq.supabase.co
- Project Ref: sebscmgcuosemsztmsoq
- Dashboard: https://supabase.com/dashboard/project/sebscmgcuosemsztmsoq

**Files to Run:**
1. `RUN_THIS_IN_SUPABASE.sql` - All migrations (run once)
2. `CREATE_TEST_DATA.sql` - Test data (edit match ID first)

**Commands:**
- Start app: `cd peerly-app && npm start`
- Install deps: `npm install`
- Clear cache: `npm start -- --reset-cache`

---

**Let's do this! 🚀**

Start with Part 1, Step 1.1 and work your way through.
Report back when done (or if you get stuck).
