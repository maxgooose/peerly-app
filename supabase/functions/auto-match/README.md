# Auto-Match Edge Function

This Supabase Edge Function runs the auto-matching algorithm to pair compatible students every 5 minutes (for testing) or daily (for production).

## How It Works

1. Fetches all eligible users (completed onboarding, not matched in last 24 hours)
2. For each user, finds the best compatible match based on:
   - Same university (required)
   - Shared subjects (most important)
   - Availability overlap
   - Study style compatibility
   - Study goals alignment
   - Academic year proximity
3. Creates match record with type 'auto'
4. Creates conversation for the match
5. Generates and sends a first message (fallback text when no Gemini key)
6. Stores suggestion and chat message; updates `matches.ai_message_sent`
7. Tracks compatibility score in analytics table

## Setup

### 1. Deploy the Edge Function

```bash
# Navigate to project root
cd /Users/hamza/Desktop/peerly\ chat/peerly-app

# Deploy the function to Supabase
npx supabase functions deploy auto-match
```

### 2. Run Database Migrations

Run these migrations in order in Supabase SQL Editor:

1. `20241024000001_add_study_preferences.sql` - Adds study_style and study_goals fields
2. `20241024000002_setup_auto_match_cron.sql` - Sets up cron job

### 3. Configure Supabase Settings

In Supabase SQL Editor, run these commands with your actual values:

```sql
-- Replace with your actual Supabase URL
ALTER DATABASE postgres SET "app.settings.supabase_url" TO 'https://your-project.supabase.co';

-- Replace with your actual anon key
ALTER DATABASE postgres SET "app.settings.supabase_anon_key" TO 'your-anon-key-here';
```

## Testing

### Manual Invoke

Test the function manually before setting up the cron:

```bash
# Using curl
curl -X POST 'https://your-project.supabase.co/functions/v1/auto-match' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Or using Supabase CLI
npx supabase functions invoke auto-match
```

### Check Cron Status

View scheduled jobs:

```sql
SELECT * FROM cron.job;
```

View job run history:

```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## Schedule Configuration

### Testing (Every 5 Minutes)

```sql
SELECT cron.schedule(
  'auto-match-users',
  '*/5 * * * *',  -- every 5 minutes
  $$ ... $$
);
```

### Production (Daily at 8am)

```sql
-- First unschedule the test job
SELECT cron.unschedule('auto-match-users');

-- Then schedule for production
SELECT cron.schedule(
  'auto-match-users',
  '0 8 * * *',  -- daily at 8am
  $$ ... $$
);
```

## Monitoring

Check the Edge Function logs in Supabase Dashboard:
1. Go to Edge Functions in sidebar
2. Click on "auto-match"
3. View Logs tab

### Verify AI first messages

```sql
-- Recent AI messages
SELECT id, conversation_id, sender_id, created_at
FROM messages
WHERE is_ai_generated = true
ORDER BY created_at DESC
LIMIT 10;

-- Recent suggestions
SELECT id, sender_id, recipient_id, created_at
FROM suggested_messages
ORDER BY created_at DESC
LIMIT 10;

-- Matches flagged as AI message sent
SELECT id, ai_message_sent, matched_at
FROM matches
WHERE ai_message_sent = true
ORDER BY matched_at DESC
LIMIT 10;
```

## Troubleshooting

### Function not running

1. Check if pg_cron extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Verify database settings are configured:
   ```sql
   SHOW "app.settings.supabase_url";
   SHOW "app.settings.supabase_anon_key";
   ```

3. Check for errors in cron job runs:
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-match-users')
   ORDER BY start_time DESC;
   ```

### No matches being created

1. Verify there are eligible users:
   ```sql
   SELECT COUNT(*) FROM users
   WHERE onboarding_completed = true
   AND (last_auto_match_cycle IS NULL OR last_auto_match_cycle < NOW() - INTERVAL '24 hours');
   ```

2. Check Edge Function logs for errors

3. Test compatibility scoring manually in the app

## Environment Variables

The Edge Function uses these environment variables (automatically provided by Supabase):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

## Next Steps

After auto-matching + AI message works:
1. Add push notifications when users get matched
2. Switch cron schedule to daily in production
3. Add match quality tracking and algorithm optimization
