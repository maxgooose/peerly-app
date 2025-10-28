# Gemini API Integration Deployment Guide

## Overview
This guide explains how to deploy the Gemini API integration into the automatch cycle for the Peerly app.

## What Was Changed

### 1. Auto-Match Edge Function (`supabase/functions/auto-match/index.ts`)
- **Added Gemini API integration** directly into the auto-match Edge Function
- **Generates AI-powered first messages** automatically when matches are created
- **Stores messages** in the conversations/messages tables
- **Marks matches** with `ai_message_sent` flag when AI message is generated

### Key Features Added:
- `generateFirstMessage()` function that calls Gemini API to create personalized messages
- Automatic message insertion into the database after match creation
- Error handling for API failures (continues matching even if message generation fails)
- Proper conversation and message linking

## Prerequisites

Before deploying, ensure you have:

1. **Gemini API Key**: Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Supabase Project**: Your project must be linked with the CLI
3. **Environment Variables**: The `GEMINI_API_KEY` must be set in Supabase Edge Functions

## Deployment Steps

### Step 1: Set the Gemini API Key

```bash
# Set the GEMINI_API_KEY as a secret in Supabase
npx supabase secrets set GEMINI_API_KEY="your-gemini-api-key-here"
```

### Step 2: Deploy the Auto-Match Edge Function

```bash
# Deploy the updated auto-match function
npx supabase functions deploy auto-match
```

### Step 3: Verify the Deployment

Check the Supabase dashboard:
1. Go to **Edge Functions** section
2. Verify `auto-match` function is deployed
3. Check the function logs for any errors

### Step 4: Test the Integration

#### Manual Test (Recommended)
Trigger the auto-match function manually:

```bash
# Get your Supabase URL and anon key from the dashboard
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/auto-match' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

#### Check the Results
1. Go to **Database** > **Table Editor** in Supabase
2. Check the `matches` table for new matches
3. Check the `messages` table for AI-generated messages (look for `is_ai_generated = true`)
4. Check the `conversations` table to see if messages are linked correctly

### Step 5: Monitor the Cron Job

The auto-match function runs every 5 minutes (configured in `setup_auto_match_cron.sql`).

Monitor it:
1. Go to **Edge Functions** > **auto-match** > **Logs**
2. Watch for successful match creation and message generation logs

## Expected Behavior

When the auto-match cycle runs:

1. **Finds eligible users** (completed onboarding, not matched in last 24 hours)
2. **Calculates compatibility scores** for potential matches
3. **Creates matches** for users with score >= 40
4. **Generates AI messages** using Gemini API for each new match
5. **Stores messages** in the messages table linked to conversations
6. **Sends push notifications** to both users
7. **Updates match records** with `ai_message_sent = true`

## Troubleshooting

### Problem: No AI messages generated
**Check:**
- Gemini API key is set correctly: `npx supabase secrets list`
- Check Edge Function logs for API errors
- Verify network connectivity to Gemini API

### Problem: Messages not appearing in chat
**Check:**
- Messages are in the database: `SELECT * FROM messages WHERE is_ai_generated = true`
- Conversations are linked correctly: `SELECT * FROM conversations WHERE match_id = 'your-match-id'`
- Real-time subscriptions are working in the frontend

### Problem: Function times out
**Possible causes:**
- Too many users to process (limit batch size)
- Gemini API is slow (increase timeout in Edge Function settings)

## Frontend Integration

The frontend is **already set up** to display AI-generated messages:
- The chat UI (`app/chat/[id].tsx`) displays all messages from the conversations
- The `is_ai_generated` flag is tracked but doesn't change the UI (messages look the same)
- Real-time updates work automatically through Supabase Realtime

## Cost Considerations

**Gemini API Costs** (as of 2024):
- Model: `gemini-1.5-flash`
- Cost: ~$0.00015 per message generation
- Expected: If you match 100 users per day, cost ≈ $0.015/day = $0.45/month

**Very affordable for most use cases.**

## Monitoring & Optimization

### Metrics to Track
1. **Match success rate**: How many matches lead to conversations?
2. **Message quality**: Are users editing the AI messages before sending?
3. **Response rate**: Do AI messages get responses?

### Optimization Tips
1. **Adjust prompt**: Edit the prompt in `generateFirstMessage()` to improve quality
2. **Temperature tuning**: Lower temperature (0.7) for more consistent messages
3. **A/B testing**: Try different prompts and compare response rates

## Rollback Plan

If you need to rollback:

```bash
# Redeploy the previous version from git
git checkout <previous-commit-hash> supabase/functions/auto-match/index.ts
npx supabase functions deploy auto-match
```

Or simply remove the message generation code and redeploy.

## Next Steps

1. **Monitor the logs** for the first few days
2. **Collect feedback** from users about message quality
3. **Iterate on the prompt** based on feedback
4. **Consider adding** message suggestions (multiple options for users to choose from)

## Support

If you encounter issues:
1. Check the Edge Function logs in Supabase dashboard
2. Review the Gemini API documentation
3. Test the function manually with the curl command above
