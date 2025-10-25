# Matching Algorithm Improvements

## Overview
Enhanced the matching algorithm with **success tracking** and a **decay factor** to prioritize fresh matches and avoid pairing users with poor engagement history.

## Key Improvements

### 1. Success Tracking System

**Purpose**: Track how successful each match is based on actual engagement metrics.

**Success Score Calculation** (0-100 points):

#### Messages Exchanged (40 points max)
- 1-5 messages: 10 points
- 6-15 messages: 20 points
- 16-30 messages: 30 points
- 30+ messages: 40 points

#### Study Session Scheduled (30 points)
- If users scheduled a study session together: +30 points
- No session scheduled: 0 points

#### Match Duration (20 points max)
- Active for 1+ week: 10 points
- Active for 2+ weeks: 15 points
- Active for 1+ month: 20 points

#### Unmatch Penalty (-10 points)
- If users unmatched: -10 points
- Still matched: 0 points

**Threshold**: A match is considered "successful" if it scores ≥ 50 points.

### 2. Freshness Bonus (Decay Factor)

**Purpose**: Prioritize new users and users who haven't been matched many times.

**Bonus Calculation** (0-15 points):
- **0 matches** (new user): +15 points
- **1 match**: +12 points
- **2 matches**: +9 points
- **3 matches**: +7 points
- **5+ matches**: +3 points

**Formula**: Uses exponential decay
```javascript
bonus = 15 * Math.exp(-totalMatches * 0.3)
```

**Why This Matters**:
- New users get matched faster (better onboarding)
- Prevents veteran users from dominating the match pool
- Balances the ecosystem between new and existing users

### 3. Success Penalty

**Purpose**: Avoid matching users with consistently poor engagement.

**Penalty Calculation** (-15 to 0 points):

#### Based on Success Rate
- **80%+ success**: No penalty (0 points)
- **50-80% success**: Small penalty (-3 points)
- **20-50% success**: Medium penalty (-6 points)
- **<20% success**: Large penalty (-10 points)

#### Low Engagement Additional Penalty
- If user averages < 3 messages per match AND has 2+ matches: -5 points

**Maximum Penalty**: -15 points (prevents completely blocking users)

### 4. Adjusted Scoring System

**Base Compatibility Score** (100 points max):
- University match: 20 points
- Subject overlap: 30 points
- Availability overlap: 20 points
- Study style match: 15 points
- Study goals match: 10 points
- Year proximity: 5 points

**Adjusted Score Formula**:
```
Adjusted Score = Base Score + Freshness Bonus + Success Penalty
```

**Example Scenarios**:

| Scenario | Base | Freshness | Penalty | Adjusted |
|----------|------|-----------|---------|----------|
| New user, good match | 75 | +15 | 0 | **90** |
| Veteran user, poor history | 75 | +3 | -10 | **68** |
| Moderate user, good history | 75 | +9 | 0 | **84** |
| New user, poor match | 45 | +15 | 0 | **60** |

## Database Changes

### New Columns in `matches` table:
```sql
messages_exchanged INTEGER DEFAULT 0
last_message_at TIMESTAMPTZ
study_session_scheduled BOOLEAN DEFAULT FALSE
unmatched_at TIMESTAMPTZ
```

### New Columns in `match_analytics` table:
```sql
success_score FLOAT DEFAULT 0
success_factors JSONB
```

### New Columns in `users` table:
```sql
total_matches INTEGER DEFAULT 0
successful_matches INTEGER DEFAULT 0
avg_messages_per_match FLOAT DEFAULT 0
```

### New Database Functions:

#### `calculate_match_success_score(match_id UUID)`
Calculates the 0-100 success score for a given match based on messages, sessions, duration, and unmatch status.

#### `update_match_statistics()`
Trigger function that automatically recalculates success score when match data changes.

#### `update_user_match_stats(user_id UUID)`
Recalculates user-level statistics (total matches, successful matches, average messages).

#### `increment_match_messages(match_id UUID)`
Increments message count and updates `last_message_at` timestamp.

## Service Layer Changes

### New Functions in `src/services/matching.ts`:

#### Score Calculation
```typescript
calculateAdjustedCompatibilityScore(user1, user2): CompatibilityScore
```
- Returns base score + freshness bonus + success penalty
- Includes breakdown of all factors

#### Statistics Updates
```typescript
updateMatchMessageStats(matchId: string): Promise<void>
markStudySessionScheduled(matchId: string): Promise<void>
refreshUserMatchStats(userId: string): Promise<void>
```

### Updated Functions:

#### `getEligibleUsers()`
Now fetches match statistics for each user:
```typescript
SELECT *,
  total_matches,
  successful_matches,
  avg_messages_per_match
FROM users
```

#### `findBestMatch()`
- Uses `calculateAdjustedCompatibilityScore()` instead of base score
- Sorts by `adjustedTotal` to prioritize fresh matches
- Logs breakdown showing base, freshness, penalty, and adjusted scores

## Integration Points

### When to Update Statistics

#### On Message Send
```typescript
import { updateMatchMessageStats } from '@/src/services/matching';

// After sending a message
await updateMatchMessageStats(matchId);
```

#### On Study Session Scheduled
```typescript
import { markStudySessionScheduled } from '@/src/services/matching';

// After creating a study session
await markStudySessionScheduled(matchId);
```

#### Periodic Refresh (Recommended)
Run a cron job or background task to refresh user stats:
```typescript
import { refreshUserMatchStats } from '@/src/services/matching';

// Refresh all active users (e.g., weekly)
const activeUsers = await getActiveUsers();
for (const user of activeUsers) {
  await refreshUserMatchStats(user.id);
}
```

## Testing the System

### Test Scenarios

#### 1. New User Priority
- Create 2 new users with onboarding complete
- Create 1 veteran user (simulate 5+ matches)
- Run auto-match
- **Expected**: New users should match with each other despite veteran having better compatibility

#### 2. Success Penalty
- Create 2 users
- Set one user's stats: `total_matches=5, successful_matches=0` (0% success)
- Run auto-match
- **Expected**: User with poor history gets lower priority

#### 3. Message Count Tracking
- Send messages in a match
- Check `messages_exchanged` increments
- Verify `last_message_at` updates
- **Expected**: Success score increases with more messages

#### 4. Study Session Bonus
- Schedule a study session
- Check `study_session_scheduled` = true
- Verify success score increases by 30 points
- **Expected**: Matches with scheduled sessions score higher

### SQL Queries for Testing

#### Check User Statistics
```sql
SELECT
  full_name,
  total_matches,
  successful_matches,
  avg_messages_per_match,
  ROUND(successful_matches::FLOAT / NULLIF(total_matches, 0) * 100, 1) as success_rate_pct
FROM users
WHERE total_matches > 0
ORDER BY total_matches DESC;
```

#### View Match Success Scores
```sql
SELECT
  m.id,
  u1.full_name as user1,
  u2.full_name as user2,
  m.messages_exchanged,
  m.study_session_scheduled,
  ma.success_score,
  ma.success_factors
FROM matches m
JOIN users u1 ON u1.id = m.user1_id
JOIN users u2 ON u2.id = m.user2_id
LEFT JOIN match_analytics ma ON ma.match_id = m.id
WHERE m.status = 'active'
ORDER BY ma.success_score DESC;
```

#### Simulate Freshness Bonus
```sql
-- Test decay formula
SELECT
  total_matches,
  ROUND(15 * EXP(-total_matches * 0.3)) as freshness_bonus
FROM generate_series(0, 10) as total_matches;
```

## Monitoring & Analytics

### Key Metrics to Track

1. **Average Success Score**: Track over time to see if matches are improving
2. **New User Match Rate**: Ensure new users get matched within 24 hours
3. **Veteran User Match Rate**: Ensure veteran users still get matched
4. **Success Distribution**: Histogram of success scores (are most matches successful?)
5. **Freshness Impact**: Compare match quality with/without freshness bonus

### Dashboard Queries

#### Overall Health
```sql
SELECT
  COUNT(*) as total_matches,
  AVG(ma.success_score) as avg_success_score,
  COUNT(*) FILTER (WHERE ma.success_score >= 50) as successful_matches,
  COUNT(*) FILTER (WHERE m.messages_exchanged > 0) as matches_with_messages,
  COUNT(*) FILTER (WHERE m.study_session_scheduled) as matches_with_sessions
FROM matches m
LEFT JOIN match_analytics ma ON ma.match_id = m.id
WHERE m.matched_at > NOW() - INTERVAL '30 days';
```

#### User Engagement Tiers
```sql
SELECT
  CASE
    WHEN total_matches = 0 THEN 'New Users'
    WHEN total_matches BETWEEN 1 AND 3 THEN 'Beginners'
    WHEN total_matches BETWEEN 4 AND 10 THEN 'Active'
    ELSE 'Veterans'
  END as user_tier,
  COUNT(*) as user_count,
  AVG(successful_matches::FLOAT / NULLIF(total_matches, 0)) as avg_success_rate,
  AVG(avg_messages_per_match) as avg_messages
FROM users
WHERE onboarding_completed = true
GROUP BY user_tier
ORDER BY
  CASE user_tier
    WHEN 'New Users' THEN 1
    WHEN 'Beginners' THEN 2
    WHEN 'Active' THEN 3
    WHEN 'Veterans' THEN 4
  END;
```

## Benefits

### For Users
✅ **New users**: Get matched faster with other new users (better onboarding)
✅ **Active users**: Paired with similarly engaged users (better conversations)
✅ **All users**: Avoid being matched with users who don't respond or engage

### For Platform
✅ **Better retention**: New users have successful first matches
✅ **Quality over quantity**: Focuses on creating meaningful connections
✅ **Self-healing**: Users who don't engage naturally get lower priority
✅ **Fairness**: Prevents veteran users from monopolizing matches

## Future Enhancements

### 1. Time-Based Decay
Add decay based on time since last match:
```typescript
// Users who haven't matched in a while get bonus
const daysSinceLastMatch = calculateDays(user.last_auto_match_cycle);
const timeBonus = Math.min(10, daysSinceLastMatch * 0.5);
```

### 2. Subject-Specific Success
Track success rates per subject:
```sql
ALTER TABLE match_analytics
ADD COLUMN subject_success JSONB;

-- Example: {"Calculus I": 0.8, "Physics": 0.6}
```

### 3. Machine Learning
Use historical data to predict match success:
```typescript
const predictedSuccess = await mlModel.predict({
  subjectOverlap: score.breakdown.subjectOverlap,
  user1History: user1.successful_matches / user1.total_matches,
  user2History: user2.successful_matches / user2.total_matches,
  // ... more features
});
```

### 4. A/B Testing
Test different decay factors:
```typescript
const DECAY_VARIANTS = {
  aggressive: 0.5,  // Stronger preference for new users
  moderate: 0.3,    // Current setting
  gentle: 0.15      // Slight preference for new users
};
```

## Migration Instructions

1. **Apply Migration**:
   ```bash
   supabase db push
   ```

2. **Backfill Existing Matches** (optional):
   ```sql
   -- Calculate success scores for existing matches
   UPDATE match_analytics
   SET success_score = calculate_match_success_score(match_id);
   ```

3. **Update User Stats** (optional):
   ```sql
   -- Refresh all user statistics
   SELECT update_user_match_stats(id)
   FROM users
   WHERE onboarding_completed = true;
   ```

4. **Deploy Service Updates**:
   - Deploy updated `src/services/matching.ts`
   - Update Edge Function to use new service methods
   - Restart auto-match cron job

## Rollback Plan

If issues arise, you can disable the new features:

```typescript
// In findBestMatch(), use old scoring:
const score = calculateCompatibilityScore(user, candidate); // Instead of adjusted
```

Or adjust the decay/penalty factors to be more lenient:
```typescript
// Reduce freshness bonus impact
const decayFactor = Math.exp(-totalMatches * 0.1); // Was 0.3

// Reduce penalty severity
if (successRate >= 0.2) { // Was 0.5
  penalty = -3; // Was -6
}
```

## Questions & Support

For questions about this implementation:
- Check success scores in match_analytics table
- Review logs from auto-match runs
- Test with small user pools first
- Monitor metrics for first 2 weeks
