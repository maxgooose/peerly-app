# AI First Message Auto-Match Test Guide

## Test Setup Complete ✅

### Test Users Created
- **Alice Johnson** (alice.johnson@stanford.edu) - CS Junior, 4 subjects
- **Bob Smith** (bob.smith@stanford.edu) - CS Junior, 4 subjects  
- **Carol Williams** (carol.williams@stanford.edu) - Biology Sophomore, 4 subjects
- **David Brown** (david.brown@stanford.edu) - Math Sophomore, 4 subjects

All users:
- ✅ Same university (Stanford)
- ✅ Onboarding completed
- ✅ last_auto_match_cycle = NULL (eligible for matching)
- ✅ Have preferred_subjects arrays
- ✅ Have study preferences

### Expected Matches

**High Compatibility:**
- **Alice ↔ Bob**: Both CS Juniors, shared subjects (Data Structures, Algorithms), compatible study styles
- **Carol ↔ David**: Both Sophomores, some overlapping subjects (Statistics)

## How to Test

### Option 1: Manual Edge Function Invoke

```bash
# Get your Supabase credentials first
# URL: Check .env or Supabase dashboard
# ANON_KEY: Check .env or Supabase dashboard

curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/auto-match' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Option 2: Using Supabase CLI

```bash
# From project root
cd "/Users/hamza/ultra peerly/peerly-app"

# Invoke the function
npx supabase functions invoke auto-match --no-verify-jwt
```

### Option 3: Wait for Cron (5 minutes)

The cron job runs automatically every 5 minutes. Just wait and check results.

## Verification Steps

### 1. Check Matches Created

```sql
-- View recent matches
SELECT 
  m.id,
  m.match_type,
  m.ai_message_sent,
  u1.full_name as user1,
  u2.full_name as user2,
  m.matched_at
FROM matches m
JOIN users u1 ON u1.id = m.user1_id
JOIN users u2 ON u2.id = m.user2_id
WHERE m.match_type = 'auto'
ORDER BY m.matched_at DESC
LIMIT 10;
```

**Expected:** 2 matches (Alice-Bob, Carol-David or similar)

### 2. Check AI Messages Inserted

```sql
-- View AI-generated messages
SELECT 
  m.id,
  m.conversation_id,
  m.sender_id,
  u.full_name as sender,
  m.content,
  m.is_ai_generated,
  m.created_at
FROM messages m
JOIN users u ON u.id = m.sender_id
WHERE m.is_ai_generated = true
ORDER BY m.created_at DESC
LIMIT 10;
```

**Expected:** 2 messages (one per match, from user1 to user2)

### 3. Check Suggested Messages Stored

```sql
-- View suggestions created
SELECT 
  s.id,
  u1.full_name as sender,
  u2.full_name as recipient,
  s.message,
  s.created_at
FROM suggested_messages s
JOIN users u1 ON u1.id = s.sender_id
JOIN users u2 ON u2.id = s.recipient_id
ORDER BY s.created_at DESC
LIMIT 10;
```

**Expected:** 2 suggestions matching the messages above

### 4. Check Conversations Created

```sql
-- View conversations with last messages
SELECT 
  c.id,
  c.match_id,
  c.last_message_content,
  c.last_message_at,
  c.created_at
FROM conversations c
WHERE c.match_id IN (
  SELECT id FROM matches WHERE match_type = 'auto'
)
ORDER BY c.created_at DESC
LIMIT 10;
```

**Expected:** 2 conversations with AI messages as last_message_content

### 5. Verify Match Flags

```sql
-- Check ai_message_sent flags
SELECT 
  id,
  user1_id,
  user2_id,
  ai_message_sent,
  matched_at
FROM matches
WHERE match_type = 'auto'
  AND ai_message_sent = true
ORDER BY matched_at DESC;
```

**Expected:** All auto matches have `ai_message_sent = true`

## Sample AI Message Format

The fallback message should look like:

```
"Looks like we're both taking Data Structures. Want to compare notes or plan a quick session this week? What works for you, Bob?"
```

- Personalized with shared subject
- Mentions recipient by name
- Asks engaging question
- Friendly, casual tone

## Troubleshooting

### No Matches Created

**Check eligible users:**
```sql
SELECT COUNT(*) FROM users
WHERE onboarding_completed = true
  AND university = 'Stanford University'
  AND (last_auto_match_cycle IS NULL OR last_auto_match_cycle < NOW() - INTERVAL '24 hours');
```

Should return at least 2 users.

### Matches Created but No AI Messages

**Check Edge Function logs:**
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → auto-match
3. View Logs tab
4. Look for errors in AI message generation

**Common issues:**
- Profile fetch failed (check users table has data)
- Message insert failed (check conversations exist)
- Fallback generator error (check console logs)

### AI Messages Look Wrong

The fallback generator uses:
- `preferred_subjects` for course overlap
- `full_name` for names
- `availability` for preferences

Make sure test users have these fields populated.

## Success Criteria ✅

Test is successful when:
- [x] 2+ matches created
- [x] Each match has `ai_message_sent = true`
- [x] AI messages exist in `messages` table with `is_ai_generated = true`
- [x] Suggestions stored in `suggested_messages` table
- [x] Conversations have `last_message_content` populated
- [x] Messages reference correct `suggested_message_id`

## Next Steps After Testing

1. **If working:** Switch cron to daily schedule (see MATCHING_SYSTEM_README.md)
2. **Add Gemini API key:** For real AI generation instead of fallback
3. **Monitor:** Check logs regularly for any issues
4. **Optimize:** Adjust matching algorithm weights based on message quality

## Production Checklist

Before going live:
- [ ] Test with real user data
- [ ] Add Gemini API key as secret: `supabase secrets set GEMINI_API_KEY=...`
- [ ] Switch cron schedule to daily
- [ ] Set up monitoring/alerts
- [ ] Test push notifications (if implemented)
- [ ] Verify RLS policies are correct
- [ ] Load test with 100+ users

---

**Status:** Ready for testing  
**Last Updated:** 2024-11-02  
**Test Data Location:** Supabase `users` table (Stanford users)





