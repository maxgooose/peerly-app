# Phase 1: Database Foundation - Quick Start

## What We're Doing

Setting up the chat database in Supabase. This takes **~10 minutes** and requires no coding - just running SQL scripts.

---

## Prerequisites Check

Before starting, make sure you have:

- [ ] Supabase project is running
- [ ] `users` table exists (from Supabase Auth)
- [ ] `matches` table exists (from Peerly app setup)
- [ ] At least 2 test users created
- [ ] At least 1 test match created

**Don't have these?** Run this in Supabase SQL Editor to check:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'matches');

-- Check for test data
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as match_count FROM matches;
```

---

## Step-by-Step (10 minutes)

### Step 1: Open Supabase (30 seconds)

1. Go to https://supabase.com
2. Open your Peerly project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### Step 2: Run Migration 1 - Tables (1 minute)

**File:** `supabase/migrations/001_create_core_chat_tables.sql`

1. Open the file in your code editor
2. Copy all contents (Cmd/Ctrl + A, then Cmd/Ctrl + C)
3. Paste into Supabase SQL Editor
4. Click **Run** button (or Cmd/Ctrl + Enter)

**✅ Success looks like:** "Success. No rows returned"

**❌ Error?** Check that `users` and `matches` tables exist

### Step 3: Run Migration 2 - Security (1 minute)

**File:** `supabase/migrations/002_create_rls_policies.sql`

1. Copy all contents
2. Paste into a new SQL Editor query
3. Click **Run**

**✅ Success looks like:** "Success. No rows returned"

### Step 4: Run Migration 3 - Triggers (1 minute)

**File:** `supabase/migrations/003_create_functions_and_triggers.sql`

1. Copy all contents
2. Paste into a new SQL Editor query
3. Click **Run**

**✅ Success looks like:** "Success. No rows returned"

### Step 5: Run Migration 4 - Indexes (1 minute)

**File:** `supabase/migrations/004_create_indexes.sql`

1. Copy all contents
2. Paste into a new SQL Editor query
3. Click **Run**

**✅ Success looks like:** "Success. No rows returned"

### Step 6: Get Your Test IDs (1 minute)

Run this to get IDs you'll need for test data:

```sql
-- Get user IDs
SELECT id, email, full_name FROM users LIMIT 5;

-- Get match IDs
SELECT id, user1_id, user2_id FROM matches LIMIT 5;
```

**Copy one match ID** - you'll need it in the next step.

### Step 7: Insert Test Data (2 minutes)

**File:** `supabase/migrations/005_test_data.sql`

1. Open the file in your code editor
2. Find line 48: `v_match_id UUID := 'YOUR_MATCH_ID_HERE'::uuid;`
3. **Replace** `YOUR_MATCH_ID_HERE` with the match ID you copied
4. Copy all contents
5. Paste into SQL Editor
6. Click **Run**

**✅ Success looks like:**
```
NOTICE: Created conversation: <some-uuid>
NOTICE: Created 10 test messages
Success. No rows returned
```

**❌ Error "violates foreign key constraint"?** The match ID is wrong. Double-check it.

### Step 8: Verify Everything Works (3 minutes)

Run these verification queries one by one:

**Check conversations:**
```sql
SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 5;
```
**Expected:** 1 row with your test conversation

**Check messages:**
```sql
SELECT
  m.content,
  m.created_at,
  u.full_name as sender
FROM messages m
LEFT JOIN users u ON u.id = m.sender_id
ORDER BY m.created_at DESC
LIMIT 10;
```
**Expected:** 10 rows with test messages

**Test the trigger (CRITICAL):**
```sql
-- 1. See current state
SELECT id, last_message_content, last_message_at
FROM conversations
ORDER BY updated_at DESC
LIMIT 1;
```

Copy the conversation `id`, then insert a test message:

```sql
-- 2. Insert new message (replace the UUIDs with your actual IDs)
INSERT INTO messages (conversation_id, sender_id, content)
VALUES (
  '<PASTE_CONVERSATION_ID_HERE>'::uuid,
  '<PASTE_ONE_OF_YOUR_USER_IDS_HERE>'::uuid,
  'Testing the trigger!'
);

-- 3. Check again
SELECT id, last_message_content, last_message_at
FROM conversations
ORDER BY updated_at DESC
LIMIT 1;
```

**✅ Success looks like:** `last_message_content` is now "Testing the trigger!"

**❌ Trigger didn't work?** Re-run migration 003

---

## Final Verification Checklist

Run through this checklist. Everything should be ✅ before moving to Phase 2.

- [ ] `conversations` table exists
- [ ] `messages` table exists
- [ ] Can see test conversation
- [ ] Can see 10+ test messages
- [ ] Trigger works (conversation updates when message inserted)
- [ ] No errors when running queries

**All checked?** 🎉 **Phase 1 is COMPLETE!**

---

## What You Just Built

You now have:

✅ Two database tables: `conversations` and `messages`
✅ Security policies (users can only see their own chats)
✅ Auto-updating last message (via trigger)
✅ Performance indexes (for fast queries)
✅ Test data to work with

---

## Next Steps

**Phase 1 Complete?** → Tell me "Phase 1 verified" and we'll move to:

**Phase 2: Basic Message Display**
- Build Supabase service
- Create chat list screen
- Display messages (read-only)
- No real-time yet, just basic fetching

This will take about 1-2 hours and will give you a working chat list that displays your test messages.

---

## Troubleshooting

### "relation 'matches' does not exist"
You need to create the matches table first from the main Peerly setup.

### "permission denied"
This shouldn't happen in SQL Editor. If testing from app, make sure user is authenticated.

### Test data not showing
- Verify you replaced `YOUR_MATCH_ID_HERE` with a real UUID
- Check the match exists: `SELECT * FROM matches WHERE id = 'your-id'::uuid`

### Trigger not firing
- Re-run migration 003
- Check trigger exists: See `006_verification_queries.sql` for the check query

---

**Need help?** Share the error message and I'll help troubleshoot.

**Everything working?** Let me know and we'll build the UI next!
