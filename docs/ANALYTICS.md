# Analytics System Documentation

## Overview
Comprehensive analytics system for Peerly that tracks user behavior, engagement, retention, and platform growth.

## Features

✅ **Event Tracking**: Track all user actions and behaviors
✅ **Engagement Metrics**: Daily/weekly/monthly active users
✅ **Retention Analysis**: Cohort-based retention tracking
✅ **Funnel Analytics**: Conversion tracking for key flows
✅ **User Analytics**: Personal stats and achievements
✅ **Real-time Dashboard**: Live metrics and insights

## Architecture

### Database Tables

#### `analytics_events`
Individual user events for detailed tracking:
```sql
- user_id: Who performed the action
- event_type: What happened (e.g., 'message_sent')
- event_category: Category (engagement, matching, messaging, etc.)
- event_properties: Additional data (JSON)
- device_info: Device and platform info (JSON)
- session_id: Session identifier
- created_at: When it happened
```

#### `analytics_daily_metrics`
Aggregated platform-wide metrics:
```sql
- date: The day
- metric_type: Type of metric (dau, mau, retention, etc.)
- metric_value: The value
- metadata: Additional context (JSON)
```

#### `user_engagement_metrics`
Per-user daily engagement:
```sql
- user_id: User
- date: Day
- messages_sent: Messages sent that day
- messages_received: Messages received
- matches_made: New matches
- study_sessions_scheduled: Sessions scheduled
- study_sessions_completed: Sessions completed
- time_spent_minutes: Time in app
- last_active_at: Last activity timestamp
```

#### `analytics_funnels`
Conversion funnel tracking:
```sql
- funnel_name: Which funnel (onboarding, matching, etc.)
- step_name: Step in funnel
- step_order: Order of step
- users_entered: How many entered this step
- users_completed: How many completed
- users_dropped: How many dropped off
- avg_time_seconds: Average time on this step
- date: Day
```

#### `analytics_cohorts`
Retention cohort analysis:
```sql
- cohort_date: When users signed up
- day_number: Days since signup (0, 1, 7, 14, 30, etc.)
- total_users: Cohort size
- active_users: How many were active on day N
- retention_rate: Percentage retained
```

## Installation

Already installed: `expo-device`

## Usage

### Initialize Analytics

In your app's root layout (`app/_layout.tsx`):

```typescript
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { initializeAnalyticsSession, endAnalyticsSession } from '@/src/services/analytics';

export default function RootLayout() {
  useEffect(() => {
    // Initialize analytics on app start
    initializeAnalyticsSession();

    // Track app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        endAnalyticsSession();
      } else if (nextAppState === 'active') {
        initializeAnalyticsSession();
      }
    });

    return () => {
      subscription.remove();
      endAnalyticsSession();
    };
  }, []);

  return <App />;
}
```

### Track Events

#### Basic Event Tracking

```typescript
import { trackEvent, AnalyticsEvents } from '@/src/services/analytics';

// Track a simple event
await trackEvent({
  eventType: AnalyticsEvents.PROFILE_UPDATED,
  category: 'profile',
});

// Track event with properties
await trackEvent({
  eventType: AnalyticsEvents.MESSAGE_SENT,
  category: 'messaging',
  properties: {
    conversation_id: 'conv-123',
    message_length: content.length,
    has_media: false,
  },
});
```

#### Screen View Tracking

```typescript
import { trackScreenView } from '@/src/services/analytics';

function ChatScreen({ conversationId }) {
  useEffect(() => {
    trackScreenView('ChatScreen', {
      conversation_id: conversationId,
    });
  }, [conversationId]);

  return <View>...</View>;
}
```

#### Track User Actions

```typescript
import { trackEngagement, AnalyticsEvents } from '@/src/services/analytics';

// Track swipe
async function handleSwipe(action: 'like' | 'skip') {
  await trackEngagement(
    action === 'like' ? AnalyticsEvents.SWIPE_LIKE : AnalyticsEvents.SWIPE_SKIP,
    { target_user_id: userId }
  );
}

// Track session scheduled
async function scheduleSession(sessionData) {
  await trackEngagement(AnalyticsEvents.SESSION_SCHEDULED, {
    match_id: sessionData.match_id,
    date: sessionData.date,
  });
}
```

#### Track Errors

```typescript
import { trackError } from '@/src/services/analytics';

try {
  await sendMessage(conversationId, content);
} catch (error) {
  await trackError(error, {
    action: 'send_message',
    conversation_id: conversationId,
  });
}
```

### Update Engagement Metrics

Automatically update user engagement:

```typescript
import { updateEngagementMetrics } from '@/src/services/analytics';

// After sending a message
await sendMessage(conversationId, content);
await updateEngagementMetrics({ messagesSent: 1 });

// After receiving a match
await createMatch(user1Id, user2Id);
await updateEngagementMetrics({ matchesMade: 1 });

// After completing a session
await completeSession(sessionId);
await updateEngagementMetrics({ studySessionsCompleted: 1 });
```

### Get Analytics Dashboard

Display platform-wide analytics:

```typescript
import { getAnalyticsDashboard } from '@/src/services/analytics';

async function loadDashboard() {
  const startDate = '2024-10-01';
  const endDate = '2024-10-31';

  const { success, data } = await getAnalyticsDashboard({
    startDate,
    endDate,
  });

  if (success && data) {
    console.log('Daily Active Users:', data.dailyActiveUsers);
    console.log('Total Users:', data.totalUsers);
    console.log('Total Matches:', data.totalMatches);
    console.log('Total Messages:', data.totalMessages);
    console.log('Avg Messages/User:', data.avgMessagesPerUser);
    console.log('Retention Rates:', data.retentionRates);
  }
}
```

### Get User Analytics

Show personalized stats to users:

```typescript
import { getUserAnalytics } from '@/src/services/analytics';

async function loadUserStats(userId: string) {
  const { success, data } = await getUserAnalytics(userId, 30); // Last 30 days

  if (success && data) {
    console.log('Total Messages:', data.totalMessages);
    console.log('Total Matches:', data.totalMatches);
    console.log('Study Sessions:', data.studySessionsCompleted);
    console.log('Avg Daily Engagement:', data.avgDailyEngagement);
    console.log('Streak:', data.streakDays, 'days');
  }
}
```

## Event Types Reference

### Engagement Events
- `app_opened` - App launched
- `app_backgrounded` - App sent to background
- `app_closed` - App closed
- `screen_viewed` - Screen navigated to

### Onboarding Events
- `onboarding_started` - User started onboarding
- `onboarding_step_completed` - Completed a step
- `onboarding_completed` - Finished onboarding
- `onboarding_abandoned` - Left onboarding incomplete

### Profile Events
- `profile_updated` - Profile information changed
- `photo_uploaded` - Profile photo uploaded
- `badge_assigned` - Badge earned

### Matching Events
- `auto_match_received` - Got auto-matched
- `swipe_like` - Liked a profile
- `swipe_skip` - Skipped a profile
- `match_created` - New match created
- `match_unmatched` - Unmatched from someone

### Messaging Events
- `message_sent` - Sent a message
- `message_received` - Received a message
- `conversation_opened` - Opened a chat
- `ai_message_generated` - AI generated icebreaker

### Session Events
- `session_scheduled` - Study session scheduled
- `session_rescheduled` - Session rescheduled
- `session_cancelled` - Session cancelled
- `session_completed` - Session completed

### System Events
- `error_occurred` - An error happened
- `sync_completed` - Offline sync completed
- `notification_received` - Push notification received
- `notification_tapped` - Tapped on notification

## Analytics Dashboard Component

Create a simple analytics dashboard:

```typescript
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { getAnalyticsDashboard } from '@/src/services/analytics';

function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { success, data } = await getAnalyticsDashboard({
      startDate,
      endDate,
    });

    if (success && data) {
      setMetrics(data);
    }
  }

  if (!metrics) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <MetricCard
        title="Total Users"
        value={metrics.totalUsers.toLocaleString()}
        icon="👥"
      />
      <MetricCard
        title="Total Matches"
        value={metrics.totalMatches.toLocaleString()}
        icon="💚"
      />
      <MetricCard
        title="Total Messages"
        value={metrics.totalMessages.toLocaleString()}
        icon="💬"
      />
      <MetricCard
        title="Avg Messages/User"
        value={metrics.avgMessagesPerUser.toFixed(1)}
        icon="📊"
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Retention Rates</Text>
        {metrics.retentionRates.map((item) => (
          <View key={item.day} style={styles.retentionRow}>
            <Text>Day {item.day}</Text>
            <Text>{item.rate.toFixed(1)}%</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  retentionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});
```

## User Stats Component

Show personal analytics to users:

```typescript
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getUserAnalytics } from '@/src/services/analytics';

function UserStatsScreen({ userId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { success, data } = await getUserAnalytics(userId, 30);
    if (success && data) {
      setStats(data);
    }
  }

  if (!stats) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Stats (Last 30 Days)</Text>

      <StatRow label="Messages Sent" value={stats.totalMessages} icon="💬" />
      <StatRow label="Matches Made" value={stats.totalMatches} icon="💚" />
      <StatRow
        label="Study Sessions"
        value={stats.studySessionsCompleted}
        icon="📚"
      />
      <StatRow
        label="Daily Engagement"
        value={stats.avgDailyEngagement.toFixed(1)}
        icon="📊"
      />
      <StatRow label="Current Streak" value={`${stats.streakDays} days`} icon="🔥" />
    </View>
  );
}

function StatRow({ label, value, icon }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#A67B5B',
  },
});
```

## SQL Queries for Analytics

### Calculate Daily Active Users

```sql
SELECT calculate_dau('2024-10-25');
```

### Calculate Retention for a Cohort

```sql
-- Day 0 (signup day)
SELECT calculate_retention('2024-10-01', 0);

-- Day 1
SELECT calculate_retention('2024-10-01', 1);

-- Day 7
SELECT calculate_retention('2024-10-01', 7);

-- Day 30
SELECT calculate_retention('2024-10-01', 30);
```

### Get Top Active Users

```sql
SELECT
  u.full_name,
  SUM(uem.messages_sent) as total_messages,
  SUM(uem.matches_made) as total_matches,
  SUM(uem.time_spent_minutes) as total_time
FROM user_engagement_metrics uem
JOIN users u ON u.id = uem.user_id
WHERE uem.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.full_name
ORDER BY total_messages DESC
LIMIT 10;
```

### Get Funnel Conversion

```sql
SELECT
  step_name,
  users_entered,
  users_completed,
  (users_completed::FLOAT / users_entered * 100) as conversion_rate
FROM analytics_funnels
WHERE funnel_name = 'onboarding'
  AND date = CURRENT_DATE
ORDER BY step_order;
```

### Get Events by Type (Last 24 Hours)

```sql
SELECT
  event_type,
  COUNT(*) as event_count
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY event_count DESC;
```

## Automated Analytics Jobs

Create a cron job to calculate daily metrics:

```sql
-- Run daily at midnight
SELECT cron.schedule(
  'calculate-daily-analytics',
  '0 0 * * *', -- Every day at midnight
  $$
  SELECT calculate_dau(CURRENT_DATE - INTERVAL '1 day');

  -- Calculate retention for recent cohorts
  SELECT calculate_retention(cohort_date, 1)
  FROM (
    SELECT DISTINCT DATE(created_at) as cohort_date
    FROM users
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  ) cohorts;
  $$
);
```

## Privacy & GDPR Compliance

### Data Collection
- All events include user_id (tied to account)
- Device info collected for analytics only
- No sensitive data in event properties

### User Rights
- Users can request data export
- Users can request data deletion
- Analytics data deleted with account

### Anonymization
For public dashboards, anonymize user data:

```sql
-- Anonymized events (no user_id)
CREATE VIEW analytics_events_anonymous AS
SELECT
  id,
  event_type,
  event_category,
  event_properties,
  device_info ->> 'platform' as platform,
  created_at
FROM analytics_events;
```

## Performance Optimization

### Indexes
All critical columns are indexed:
- `analytics_events`: user_id, event_type, created_at
- `user_engagement_metrics`: user_id, date
- `analytics_cohorts`: cohort_date, day_number

### Partitioning
For large datasets (>10M events), partition by date:

```sql
-- Create partitioned table (PostgreSQL 10+)
CREATE TABLE analytics_events_partitioned (
  LIKE analytics_events INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE analytics_events_2024_10
PARTITION OF analytics_events_partitioned
FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
```

### Aggregation
Pre-aggregate common queries:

```sql
-- Materialized view for faster dashboard queries
CREATE MATERIALIZED VIEW analytics_summary AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as dau,
  COUNT(*) FILTER (WHERE event_type = 'message_sent') as messages,
  COUNT(*) FILTER (WHERE event_type = 'match_created') as matches
FROM analytics_events
GROUP BY DATE(created_at);

-- Refresh daily
REFRESH MATERIALIZED VIEW analytics_summary;
```

## Best Practices

1. **Track Important Events Only**: Don't track every button click
2. **Include Context**: Add relevant properties to events
3. **Respect Privacy**: Don't track sensitive information
4. **Test Events**: Verify events are tracked correctly
5. **Monitor Performance**: Keep analytics lightweight
6. **Aggregate Early**: Pre-calculate common metrics
7. **Archive Old Data**: Move old events to cold storage

## Troubleshooting

### Events not appearing
- Check RLS policies (users can insert own events)
- Verify user is authenticated
- Check network connectivity

### Slow queries
- Use indexes
- Aggregate data
- Limit date ranges

### High storage usage
- Archive old events (>90 days)
- Compress or delete low-value events
- Use partitioning

## Future Enhancements

1. **Real-time Analytics**: WebSocket updates
2. **Custom Dashboards**: User-configurable views
3. **Export Reports**: PDF/CSV exports
4. **A/B Testing**: Built-in experimentation
5. **Alerts**: Notifications for anomalies
6. **ML Insights**: Predictive analytics
