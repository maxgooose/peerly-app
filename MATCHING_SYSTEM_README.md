# Peerly Auto-Matching System

## Overview

The auto-matching system pairs compatible students every 5 minutes (for testing) or daily (for production). Users receive **one high-quality match per cycle** based on a compatibility scoring algorithm.

## How It Works

### Compatibility Scoring (100 points max)

| Factor | Weight | Description |
|--------|---------|-------------|
| **University Match** | 20 pts | Must be same university (non-negotiable) |
| **Subject Overlap** | 30 pts | Shared classes/subjects (most important) |
| **Availability Overlap** | 20 pts | Overlapping free time slots |
| **Study Style Match** | 15 pts | How they prefer to study |
| **Study Goals Match** | 10 pts | What they want to achieve |
| **Year Proximity** | 5 pts | Similar academic level |

**Minimum Score:** 40/100 to create a match

### Study Preferences

#### Study Style
- **Quiet** - Complete silence
- **With Music** - Music/background noise
- **Group Discussion** - Talk through concepts
- **Teach Each Other** - Learn by teaching

#### Study Goals
- **Ace Exams** - A's only, high achievement
- **Understand Concepts** - Deep learning
- **Just Pass** - Get through the class
- **Make Friends** - Social studying

## Setup Instructions

### 1. Run Database Migrations

Run these in Supabase SQL Editor in order:

```sql
-- 1. Add study preference fields and analytics table
-- File: supabase/migrations/20241024000001_add_study_preferences.sql

-- 2. Setup cron job (every 5 min for testing)
-- File: supabase/migrations/20241024000002_setup_auto_match_cron.sql

-- 3. Update onboarding function
-- File: supabase/migrations/20241024000003_update_onboarding_function.sql
```

### 2. Configure Supabase Settings

In Supabase SQL Editor:

```sql
-- Replace with your actual values
ALTER DATABASE postgres SET "app.settings.supabase_url" TO 'https://your-project.supabase.co';
ALTER DATABASE postgres SET "app.settings.supabase_anon_key" TO 'your-anon-key';
```

### 3. Deploy Edge Function

```bash
# From project root
npx supabase functions deploy auto-match
```

### 4. Create Test Users

```bash
# Run the test data script
# File: sql/test-data/CREATE_TEST_USERS_FOR_MATCHING.sql
```

## Testing the Matching Algorithm

### Option 1: Manual Test

```bash
# Invoke the Edge Function manually
curl -X POST 'https://your-project.supabase.co/functions/v1/auto-match' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Option 2: Wait for Cron (5 minutes)

The cron job runs every 5 minutes automatically. Check logs in Supabase Dashboard > Edge Functions > auto-match > Logs

### Option 3: Test from App

```typescript
import { runAutoMatching } from '@/services/matching';

// Call the function
const result = await runAutoMatching();
console.log(`Created ${result.matchesCreated} matches`);
```

## Verify Matches Were Created

```sql
-- Check recent matches
SELECT
  m.id,
  m.match_type,
  m.status,
  u1.full_name as user1,
  u2.full_name as user2,
  ma.compatibility_score,
  m.matched_at
FROM matches m
JOIN users u1 ON u1.id = m.user1_id
JOIN users u2 ON u2.id = m.user2_id
LEFT JOIN match_analytics ma ON ma.match_id = m.id
WHERE m.match_type = 'auto'
ORDER BY m.matched_at DESC
LIMIT 10;

-- Check if conversations were created
SELECT
  c.id,
  c.created_at,
  m.user1_id,
  m.user2_id
FROM conversations c
JOIN matches m ON m.id = c.match_id
WHERE m.match_type = 'auto'
ORDER BY c.created_at DESC;
```

## Deliverable Checklist

- [x] **Matching algorithm** - Compatibility scoring based on 6 factors
- [x] **Scheduled task** - Runs every 5 minutes (configurable to 24 hours)
- [x] **Match creation** - Creates match records with type 'auto'
- [x] **Conversation creation** - Auto-creates chat for each match
- [x] **Analytics tracking** - Stores compatibility scores and breakdowns
- [x] **Test data** - 10 test users with varying compatibility
- [x] **Notifications** - ⚠️ Not implemented yet (next phase)

## Expected Test Results

With the test users created, the algorithm should produce these matches:

1. **Alice & Bob** - Both CS Juniors, shared subjects (Data Structures, Algorithms), compatible goals
   - Score: ~85/100

2. **Grace & Henry** - Both Biology Seniors, highly compatible preferences
   - Score: ~95/100

3. **David & Emily** - Shared subjects (Calc II), both like group discussion
   - Score: ~65/100

4. **Carol** - May match with remaining eligible users
   - Score: ~60/100

**NOT Matched:**
- Ivy (different university - MIT vs Stanford)
- Jack (onboarding not completed)

## Changing the Schedule

### For Production (Daily at 8am)

```sql
-- Unschedule test job
SELECT cron.unschedule('auto-match-users');

-- Schedule for production
SELECT cron.schedule(
  'auto-match-users',
  '0 8 * * *',  -- daily at 8am
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-match',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

## Monitoring

### View Cron Job Status

```sql
-- Check if cron is running
SELECT * FROM cron.job WHERE jobname = 'auto-match-users';

-- View recent runs
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-match-users')
ORDER BY start_time DESC
LIMIT 10;
```

### AI First Message Verification

```sql
-- Most recent AI messages inserted into chat
SELECT m.id, m.conversation_id, m.sender_id, m.created_at
FROM messages m
WHERE m.is_ai_generated = true
ORDER BY m.created_at DESC
LIMIT 10;

-- Suggestions created by the scheduled flow
SELECT id, sender_id, recipient_id, created_at
FROM suggested_messages
ORDER BY created_at DESC
LIMIT 10;

-- Matches that have had the AI icebreaker sent
SELECT id, user1_id, user2_id, matched_at
FROM matches
WHERE ai_message_sent = true
ORDER BY matched_at DESC
LIMIT 10;
```

### View Match Analytics

```sql
-- Average compatibility scores
SELECT
  AVG(compatibility_score) as avg_score,
  MIN(compatibility_score) as min_score,
  MAX(compatibility_score) as max_score,
  COUNT(*) as total_matches
FROM match_analytics;

-- Score breakdown by component
SELECT
  AVG((score_breakdown->>'universityMatch')::int) as avg_university,
  AVG((score_breakdown->>'subjectOverlap')::int) as avg_subjects,
  AVG((score_breakdown->>'availabilityOverlap')::int) as avg_availability,
  AVG((score_breakdown->>'studyStyleMatch')::int) as avg_style,
  AVG((score_breakdown->>'studyGoalsMatch')::int) as avg_goals,
  AVG((score_breakdown->>'yearProximity')::int) as avg_year
FROM match_analytics;
```

## Next Steps

### Phase 2: AI First Message
- [ ] Integrate Gemini API to generate conversation starters
- [ ] Send AI message when auto-match is created
- [ ] Update `matches.ai_message_sent` flag

### Phase 3: Push Notifications
- [ ] Notify users when they get matched
- [ ] Show match in chat list immediately
- [ ] Badge count for new matches

### Phase 4: Algorithm Optimization
- [ ] Track message response rates
- [ ] Learn from successful matches
- [ ] Adjust scoring weights based on data
- [ ] Add "Most Compatible" badge for 90+ scores

## Troubleshooting

### No matches being created

1. Check eligible users exist:
```sql
SELECT COUNT(*) FROM users
WHERE onboarding_completed = true
AND (last_auto_match_cycle IS NULL OR last_auto_match_cycle < NOW() - INTERVAL '24 hours');
```

2. Check Edge Function logs in Supabase Dashboard

3. Verify cron job is running:
```sql
SELECT * FROM cron.job WHERE jobname = 'auto-match-users';
```

### Matches created but no conversations

Check RLS policies on conversations table - make sure INSERT is allowed

### Low compatibility scores

Review the test data and adjust the scoring weights in:
- `src/services/matching.ts`
- `supabase/functions/auto-match/index.ts`

## Architecture

```
┌─────────────────┐
│   Supabase      │
│   pg_cron       │─────── Every 5 min ────┐
└─────────────────┘                         │
                                            ▼
                                   ┌──────────────────┐
                                   │  Edge Function   │
                                   │   auto-match     │
                                   └──────────────────┘
                                            │
                        ┌───────────────────┼───────────────────┐
                        ▼                   ▼                   ▼
                  Get Eligible        Calculate           Create Match
                     Users           Compatibility         + Conversation
                        │                Scores                 │
                        └────────────────┬────────────────────┘
                                         ▼
                                  Update User's
                                last_auto_match_cycle
```

## Files Created

1. **Database**
   - `supabase/migrations/20241024000001_add_study_preferences.sql`
   - `supabase/migrations/20241024000002_setup_auto_match_cron.sql`
   - `supabase/migrations/20241024000003_update_onboarding_function.sql`

2. **Services**
   - `src/services/matching.ts` - Matching algorithm logic
   - `src/services/onboarding.ts` - Updated with study preferences
   - `src/services/supabase.ts` - Updated types

3. **Edge Functions**
   - `supabase/functions/auto-match/index.ts` - Cron job handler
   - `supabase/functions/auto-match/README.md` - Deployment docs

4. **Test Data**
   - `sql/test-data/CREATE_TEST_USERS_FOR_MATCHING.sql`

## Questions?

Check the individual README files:
- Edge Function: `supabase/functions/auto-match/README.md`
- Test Data: Comments in `sql/test-data/CREATE_TEST_USERS_FOR_MATCHING.sql`

---

**Status:** ✅ Ready for testing
**Last Updated:** 2024-10-24
**Version:** 1.0 - Initial auto-matching implementation
