# Supabase Chat System - Phase 1 Setup Guide

## Overview

This folder contains SQL migration files for the chat system. These scripts set up the database foundation for real-time messaging.

## Phase 1: Database Foundation

### Prerequisites

1. **Supabase Project**: You should already have a Supabase project set up
2. **Existing Tables**: You need `users` and `matches` tables already created
3. **Test Data**: Have at least 2 users and 1 match created for testing

### Migration Files (Run in Order)

| File | Purpose | Estimated Time |
|------|---------|----------------|
| `001_create_core_chat_tables.sql` | Creates `conversations` and `messages` tables | 1 min |
| `002_create_rls_policies.sql` | Sets up Row Level Security policies | 1 min |
| `003_create_functions_and_triggers.sql` | Creates auto-update triggers | 1 min |
| `004_create_indexes.sql` | Adds performance indexes | 1 min |
| `005_test_data.sql` | Inserts sample data for testing | 2 min |
| `006_verification_queries.sql` | Validates everything works | 5 min |

**Total Time: ~10 minutes**

---

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Migrations

Run each migration file in order:

#### Migration 1: Core Tables
1. Copy contents of `001_create_core_chat_tables.sql`
2. Paste into SQL Editor
3. Click **Run** (or press Cmd/Ctrl + Enter)
4. Verify: You should see "Success. No rows returned"

#### Migration 2: RLS Policies
1. Copy contents of `002_create_rls_policies.sql`
2. Paste into SQL Editor
3. Click **Run**
4. Verify: Should complete without errors

#### Migration 3: Functions & Triggers
1. Copy contents of `003_create_functions_and_triggers.sql`
2. Paste into SQL Editor
3. Click **Run**
4. Verify: Should complete without errors

#### Migration 4: Indexes
1. Copy contents of `004_create_indexes.sql`
2. Paste into SQL Editor
3. Click **Run**
4. Verify: Should complete without errors

### Step 3: Verify Tables Created

Run this quick check:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('conversations', 'messages');
```

**Expected result:** 2 rows showing `conversations` and `messages`

### Step 4: Add Test Data

1. **IMPORTANT:** First get your test IDs:

```sql
-- Get user IDs
SELECT id, email, full_name FROM users LIMIT 5;

-- Get match IDs
SELECT id, user1_id, user2_id, status FROM matches LIMIT 5;
```

2. Open `005_test_data.sql`
3. Replace `'YOUR_MATCH_ID_HERE'` with an actual match ID from above
4. Copy and paste into SQL Editor
5. Click **Run**

**Expected result:** Should see notices like "Created conversation: xxx" and "Created 10 test messages"

### Step 5: Verify Everything Works

Use queries from `006_verification_queries.sql` to test:

```sql
-- Check conversations were created
SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 5;

-- Check messages were created
SELECT
  m.content,
  m.created_at,
  u.full_name as sender
FROM messages m
LEFT JOIN users u ON u.id = m.sender_id
ORDER BY m.created_at DESC
LIMIT 10;
```

**Expected result:** You should see your test conversation and messages

### Step 6: Test the Trigger

This is critical - verify that new messages auto-update the conversation:

```sql
-- 1. Check current state
SELECT id, last_message_content, last_message_at
FROM conversations
LIMIT 1;

-- 2. Insert a new message (replace IDs with your actual IDs)
INSERT INTO messages (conversation_id, sender_id, content)
VALUES (
  'YOUR_CONVERSATION_ID'::uuid,
  'YOUR_USER_ID'::uuid,
  'Testing the trigger!'
);

-- 3. Check again - should see updated last_message_content
SELECT id, last_message_content, last_message_at
FROM conversations
LIMIT 1;
```

**Expected result:** The `last_message_content` should now be "Testing the trigger!"

---

## Verification Checklist

Before moving to Phase 2, verify all of these:

- [ ] `conversations` table exists
- [ ] `messages` table exists
- [ ] RLS is enabled on both tables (check with query from `006_verification_queries.sql`)
- [ ] Test conversation created successfully
- [ ] 10+ test messages inserted
- [ ] Trigger works (conversation updates when message inserted)
- [ ] Indexes exist (check with query from `006_verification_queries.sql`)
- [ ] Can query messages and get results
- [ ] No errors in any verification queries

---

## Troubleshooting

### Error: "relation 'matches' does not exist"

**Solution:** You need to create the `matches` table first. This is from the main Peerly app setup.

### Error: "relation 'users' does not exist"

**Solution:** You need to create the `users` table first. This should already exist from Supabase Auth.

### Error: "permission denied for table conversations"

**Solution:** Make sure you're running queries as an authenticated user. In SQL Editor, you're running as the service role, so this shouldn't happen. If testing RLS, you need to use the Supabase client from your app.

### Trigger not working

**Solution:**
1. Check trigger exists: Run the trigger check query from `006_verification_queries.sql`
2. Verify the function exists
3. Try dropping and recreating: Re-run `003_create_functions_and_triggers.sql`

### No test data appearing

**Solution:**
1. Check you replaced `'YOUR_MATCH_ID_HERE'` with an actual UUID
2. Verify the match exists: `SELECT * FROM matches WHERE id = 'your-id-here'`
3. Check for error messages in the SQL Editor output

---

## What's Next?

Once Phase 1 is verified and complete:

✅ **Phase 1 Complete!**

→ **Move to Phase 2:** Build the UI to display these messages in your React Native app

---

## Database Schema Reference

### `conversations` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `match_id` | UUID | Foreign key to matches (unique) |
| `last_message_content` | TEXT | Cached last message for chat list |
| `last_message_at` | TIMESTAMPTZ | When last message was sent |
| `last_message_sender_id` | UUID | Who sent the last message |
| `created_at` | TIMESTAMPTZ | When conversation started |
| `updated_at` | TIMESTAMPTZ | Last activity timestamp |

### `messages` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `conversation_id` | UUID | Foreign key to conversations |
| `sender_id` | UUID | Foreign key to users |
| `content` | TEXT | Message text content |
| `message_type` | TEXT | 'text', 'image', or 'file' |
| `status` | TEXT | 'sending', 'sent', 'delivered', 'failed' |
| `client_id` | TEXT | Client-side ID for deduplication |
| `media_url` | TEXT | URL for images/files (future) |
| `created_at` | TIMESTAMPTZ | When message was sent |
| `updated_at` | TIMESTAMPTZ | When message was last updated |

---

## Need Help?

If you get stuck:

1. Check the verification queries in `006_verification_queries.sql`
2. Review error messages carefully
3. Make sure you're running migrations in order
4. Verify your existing `users` and `matches` tables are set up correctly

---

**Status:** ✅ Ready to use

**Last Updated:** 2025-10-23

**Version:** Phase 1 - Database Foundation
