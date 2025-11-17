# Switching Auto-Match to Daily Schedule (Production)

## Current State
- **Dev/Test:** Runs every 5 minutes (`*/5 * * * *`)
- **Location:** `supabase/migrations/20241024000002_setup_auto_match_cron.sql`

## Production Schedule
- **Recommended:** Daily at 8:00 AM UTC (`0 8 * * *`)
- **Why 8 AM UTC:** Catches users globally at reasonable times

## How to Switch

### Step 1: Verify Current Job

```sql
-- Check if cron job exists
SELECT * FROM cron.job WHERE jobname = 'auto-match-users';
```

### Step 2: Unschedule Test Job

```sql
-- Remove 5-minute test schedule
SELECT cron.unschedule('auto-match-users');
```

### Step 3: Schedule Production Job

```sql
-- Schedule daily at 8:00 AM UTC
SELECT cron.schedule(
  'auto-match-users',           -- job name
  '0 8 * * *',                  -- cron expression: daily at 8 AM
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

### Step 4: Verify New Schedule

```sql
-- Confirm job is scheduled
SELECT 
  jobname,
  schedule,
  active,
  nodename
FROM cron.job 
WHERE jobname = 'auto-match-users';
```

Expected output:
```
jobname           | schedule   | active | nodename
------------------|------------|--------|----------
auto-match-users  | 0 8 * * *  | t      | ...
```

## Alternative Schedules

### Twice Daily (Morning & Evening)

```sql
-- 8 AM and 8 PM UTC
SELECT cron.schedule(
  'auto-match-users',
  '0 8,20 * * *',
  $$ ... $$
);
```

### Every 12 Hours

```sql
-- Every 12 hours
SELECT cron.schedule(
  'auto-match-users',
  '0 */12 * * *',
  $$ ... $$
);
```

### Weekdays Only

```sql
-- Monday-Friday at 8 AM
SELECT cron.schedule(
  'auto-match-users',
  '0 8 * * 1-5',
  $$ ... $$
);
```

## Monitoring Production Schedule

### Check Last Run

```sql
-- View recent job executions
SELECT 
  runid,
  jobid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-match-users')
ORDER BY start_time DESC
LIMIT 10;
```

### Check Next Scheduled Run

```sql
-- View job schedule details
SELECT 
  j.jobname,
  j.schedule,
  j.active,
  NOW() as current_time,
  -- Next run time (approximate based on cron expression)
  CASE 
    WHEN j.schedule = '0 8 * * *' THEN 
      (DATE_TRUNC('day', NOW()) + INTERVAL '1 day' + INTERVAL '8 hours')::timestamptz
    ELSE NULL
  END as next_run_approx
FROM cron.job j
WHERE j.jobname = 'auto-match-users';
```

## Rollback to Test Schedule

If you need to go back to 5-minute testing:

```sql
-- Unschedule production
SELECT cron.unschedule('auto-match-users');

-- Re-enable 5-minute test
SELECT cron.schedule(
  'auto-match-users',
  '*/5 * * * *',
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

## Cron Expression Reference

| Expression | Meaning |
|------------|---------|
| `*/5 * * * *` | Every 5 minutes |
| `0 8 * * *` | Daily at 8:00 AM |
| `0 */6 * * *` | Every 6 hours |
| `0 8,20 * * *` | 8 AM and 8 PM |
| `0 8 * * 1-5` | Weekdays at 8 AM |
| `0 0 * * 0` | Sundays at midnight |

Format: `minute hour day_of_month month day_of_week`

## Post-Switch Verification

After switching to daily:

1. **Wait 24 hours** for first run
2. **Check logs** after scheduled time
3. **Verify matches** were created
4. **Check AI messages** were sent
5. **Monitor** for any errors

## Best Practices

- **Test first:** Run manual invokes to verify everything works
- **Monitor initial runs:** Watch logs for first few production runs
- **Set up alerts:** Configure notifications for job failures
- **Document timezone:** Note that cron uses UTC
- **Consider user activity:** Schedule during peak user times for your region

## Troubleshooting

### Job Not Running

```sql
-- Check if job is active
SELECT jobname, active FROM cron.job WHERE jobname = 'auto-match-users';

-- If not active, re-enable:
UPDATE cron.job SET active = true WHERE jobname = 'auto-match-users';
```

### Wrong Schedule Applied

```sql
-- Verify exact schedule
SELECT schedule FROM cron.job WHERE jobname = 'auto-match-users';

-- If wrong, unschedule and re-create with correct expression
```

### Job Failing

```sql
-- Check for error messages
SELECT 
  status,
  return_message,
  start_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-match-users')
  AND status = 'failed'
ORDER BY start_time DESC
LIMIT 5;
```

---

**Status:** Ready to apply after testing  
**Current Schedule:** Every 5 minutes (test mode)  
**Recommended:** Daily at 8 AM UTC  
**Apply After:** Successful test run verification







