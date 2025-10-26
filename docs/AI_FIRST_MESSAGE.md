# Peerly Gemini AI Integration - Quick Start Checklist ✅

Use this checklist to implement the AI message generation feature step by step.

## Phase 1: Setup (30 minutes)

### Step 1: Get API Access
- [ ] Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] Create a Google account if needed
- [ ] Generate a new API key
- [ ] Save the API key securely
- [ ] Test the key with a simple curl request (optional)

### Step 2: Environment Setup
- [ ] Open your Peerly project
- [ ] Locate or create `.env` or `.env.local` file
- [ ] Add: `GEMINI_API_KEY=your_key_here`
- [ ] Verify Supabase keys are present:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Restart your development server

### Step 3: Install Dependencies
```bash
# In your project directory
npm install @google/generative-ai
# or
yarn add @google/generative-ai
```

- [ ] Run the install command
- [ ] Verify installation: `npm list @google/generative-ai`
- [ ] Check package.json includes the dependency

## Phase 2: Database Setup (20 minutes)

### Step 4: Run Database Schema
- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Copy contents of `peerly-database-schema.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run" to execute
- [ ] Verify tables created:
  - `profiles`
  - `matches`
  - `suggested_messages`
  - `messages`
- [ ] Check Row Level Security is enabled on all tables

### Step 5: Verify Database Structure
- [ ] Go to Table Editor in Supabase
- [ ] Check `profiles` table has correct columns
- [ ] Check `suggested_messages` table exists
- [ ] Test inserting a sample profile (optional)

## Phase 3: Backend Deployment (30 minutes)

### Step 6: Prepare Edge Function
- [ ] Create directory: `supabase/functions/generate-first-message/`
- [ ] Copy `supabase-edge-function-generate-first-message.ts` to:
  - `supabase/functions/generate-first-message/index.ts`
- [ ] Review the code to understand the flow
- [ ] Customize if needed (optional)

### Step 7: Deploy to Supabase
```bash
# Set API key as Supabase secret
supabase secrets set GEMINI_API_KEY=your_key_here

# Deploy the function
supabase functions deploy generate-first-message
```

- [ ] Run the secrets command
- [ ] Run the deploy command
- [ ] Note the function URL from output
- [ ] Check deployment in Supabase Dashboard > Edge Functions

### Step 8: Test Edge Function
```bash
# Test with curl (replace with your values)
curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/generate-first-message' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"senderId":"test-id-1","recipientId":"test-id-2"}'
```

- [ ] Run test curl command
- [ ] Verify you get a response (even if error due to fake IDs)
- [ ] Check Supabase logs for any errors
- [ ] Fix any issues before proceeding

## Phase 4: Frontend Integration (1-2 hours)

### Step 9: Add Service File
- [ ] Copy `gemini-service.ts` to your project:
  - Suggested: `src/services/gemini-service.ts`
- [ ] Update import paths if needed
- [ ] Review the UserProfile interface
- [ ] Adjust to match your actual profile structure

### Step 10: Create Helper Functions
- [ ] Create a new file: `src/api/messages.ts`
- [ ] Add function to call edge function:

```typescript
import { supabase } from '@/lib/supabase';

export async function generateFirstMessage(
  senderId: string,
  recipientId: string
) {
  const { data, error } = await supabase.functions.invoke(
    'generate-first-message',
    { body: { senderId, recipientId } }
  );

  if (error) throw error;
  return data.message;
}
```

- [ ] Test the function in your app

### Step 11: Create UI Component
- [ ] Create component: `src/components/SuggestedMessage.tsx`
- [ ] Use the example from `IMPLEMENTATION_GUIDE.md`
- [ ] Customize styling to match your app
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test in your app

### Step 12: Integrate in Match Flow
- [ ] Find your match/profile viewing screen
- [ ] Import the SuggestedMessage component
- [ ] Add it to the UI when viewing a match
- [ ] Test the complete flow:
  - User views match
  - AI generates message
  - User sees suggestion
  - User can edit/send

## Phase 5: Testing & QA (1 hour)

### Step 13: Run Test Suite
```bash
npm run test
# or
node test-gemini-integration.ts
```

- [ ] Run the test suite
- [ ] Review all test outputs
- [ ] Verify messages are relevant and natural
- [ ] Check for any errors or warnings

### Step 14: Manual Testing
- [ ] Create test user profiles in your app
- [ ] Match two users
- [ ] Generate a first message
- [ ] Verify message quality:
  - [ ] References common interests/courses
  - [ ] Natural, casual tone
  - [ ] Includes a question or call-to-action
  - [ ] Appropriate length (2-4 sentences)
  - [ ] No awkward formatting
- [ ] Test editing the message
- [ ] Test sending the message
- [ ] Verify message appears in chat

### Step 15: Edge Cases
- [ ] Test with users who have:
  - [ ] No common courses
  - [ ] No common interests
  - [ ] Very different majors
  - [ ] Different study preferences
- [ ] Verify fallback behavior works
- [ ] Check error messages are user-friendly

## Phase 6: Optimization & Monitoring (Ongoing)

### Step 16: Implement Caching
- [ ] Add check for existing suggested messages
- [ ] Implement cooldown period (e.g., 1 hour)
- [ ] Cache messages in database
- [ ] Test cache retrieval

### Step 17: Add Analytics
- [ ] Track message generation events:
  - [ ] Generation success rate
  - [ ] Generation time
  - [ ] Message usage rate
  - [ ] Message modification rate
- [ ] Set up logging in Supabase
- [ ] Create analytics dashboard (optional)

### Step 18: Monitor Performance
- [ ] Check Gemini API usage in Google Cloud Console
- [ ] Monitor Supabase function logs
- [ ] Watch for rate limit errors
- [ ] Check database query performance
- [ ] Set up alerts for errors

## Phase 7: Production Deployment (30 minutes)

### Step 19: Pre-Deployment Checklist
- [ ] All tests passing
- [ ] No console errors
- [ ] API keys secured (not in code)
- [ ] Edge function deployed to production
- [ ] Database migrations run in production
- [ ] RLS policies verified
- [ ] Rate limiting implemented
- [ ] Error handling robust

### Step 20: Deploy to Production
- [ ] Deploy your React Native app update
- [ ] Monitor Sentry/error tracking
- [ ] Watch first few generations
- [ ] Be ready to rollback if needed

### Step 21: Post-Deployment
- [ ] Test with real users
- [ ] Collect feedback
- [ ] Monitor key metrics:
  - API success rate
  - User satisfaction
  - Message quality
- [ ] Iterate on prompts based on feedback

## Phase 8: Continuous Improvement

### Ongoing Tasks
- [ ] Weekly: Review analytics and adjust prompts
- [ ] Monthly: A/B test different prompt variations
- [ ] Quarterly: Update model or API version
- [ ] Continuous: Collect user feedback
- [ ] Regular: Review and optimize costs

## 🎯 Success Criteria

Your implementation is successful when:
- ✅ 95%+ of message generations succeed
- ✅ Users send suggested messages 60%+ of the time
- ✅ Average generation time < 2 seconds
- ✅ Zero API key exposure
- ✅ Positive user feedback on message quality
- ✅ No rate limit errors
- ✅ Smooth UX with proper loading states

## 📞 Need Help?

- **Technical Issues**: Check `IMPLEMENTATION_GUIDE.md` troubleshooting section
- **API Problems**: Review Gemini API docs
- **Database Issues**: Check Supabase logs and RLS policies
- **Edge Function Errors**: Use `supabase functions logs`
- **Testing**: Run `test-gemini-integration.ts` for diagnostics

## 🎉 Completion

Once all boxes are checked, you have successfully integrated Gemini AI into Peerly!

**Time to celebrate!** 🎊

Now start monitoring usage and iterating on the prompts to make the messages even better.

---

**Estimated Total Time**: 4-6 hours for complete implementation

**Pro Tip**: Don't rush! Test thoroughly at each phase before moving forward.