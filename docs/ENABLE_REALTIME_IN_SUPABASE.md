# Enable Realtime in Supabase - Quick Guide

## What is Realtime?

Supabase Realtime allows your app to listen for database changes and receive updates instantly. For the chat feature, this means messages appear on both sides without refreshing.

---

## How to Enable (2 minutes)

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/sebscmgcuosemsztmsoq
2. Log in if needed

### Step 2: Navigate to Realtime Settings

Click **Database** in the left sidebar, then click **Replication** tab

**OR**

Go directly to: https://supabase.com/dashboard/project/sebscmgcuosemsztmsoq/database/replication

### Step 3: Enable Realtime for `messages` Table

1. Look for the `messages` table in the list
2. Find the toggle switch in the "Source" column
3. Click to **enable** it (should turn green/blue)
4. Wait a few seconds for it to activate

**Screenshot locations:**
```
Tables
  ├─ conversations  [ ] Source
  ├─ matches       [ ] Source
  ├─ messages      [✓] Source  ← Enable this one!
  ├─ users         [ ] Source
  └─ ...
```

### Step 4: Verify It's Enabled

The toggle should be **ON** (blue/green) next to `messages`

---

## Alternative Method: Via SQL

If you prefer SQL, run this in SQL Editor:

```sql
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

## Troubleshooting

### "Replication" tab not showing
- Make sure you're on the Database page
- Try refreshing the page
- Check you have admin access to the project

### Toggle won't turn on
- Wait a few seconds and try again
- Check your internet connection
- Try refreshing the page

### How to check if it's working
Run this in SQL Editor:

```sql
-- Check which tables have realtime enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

Should show `messages` in the results.

---

## What This Enables

Once enabled, your app can:
- ✅ Receive new messages instantly
- ✅ See when messages are updated
- ✅ Get notified of deletions
- ✅ Subscribe to specific conversations

---

## Cost/Limits

**Free Plan:**
- 2 million realtime messages/month
- 200 concurrent connections
- More than enough for testing!

**Pro Plan:**
- 5 million messages/month
- 500 concurrent connections

For the chat app, each message sent triggers 1 realtime event.

---

## Next Steps

After enabling:

1. ✅ Realtime is enabled
2. Run your app: `npm start`
3. Open conversation on 2 devices/browsers
4. Send message from Device A
5. Should appear on Device B instantly! 🎉

---

## Still Not Working?

If messages still don't appear in real-time after enabling:

1. **Check Console Logs**
   - Press `j` in Metro terminal
   - Look for: `📡 Realtime subscription status: SUBSCRIBED`
   - Should also see: `📨 New message received` when message arrives

2. **Verify Subscription**
   - Console should show: `Setting up real-time subscription for conversation`
   - If you see errors, share them

3. **Check RLS Policies**
   - Realtime respects Row Level Security
   - Make sure policies allow SELECT on messages
   - See `RUN_THIS_IN_SUPABASE.sql` for correct policies

4. **Test Connection**
   ```bash
   cd peerly-app
   node test-connection.js
   ```

---

**Ready?** Enable Realtime in Supabase, then test your chat! 🚀
