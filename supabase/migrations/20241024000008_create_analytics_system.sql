-- Analytics System for Peerly
-- Tracks user behavior, engagement, and platform metrics

-- User activity events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL, -- 'engagement', 'matching', 'messaging', 'session', 'profile'
  event_properties JSONB DEFAULT '{}'::jsonb,
  device_info JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);

-- Daily aggregated metrics
CREATE TABLE analytics_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, metric_type)
);

CREATE INDEX idx_daily_metrics_date ON analytics_daily_metrics(date DESC);
CREATE INDEX idx_daily_metrics_type ON analytics_daily_metrics(metric_type);

-- User engagement metrics
CREATE TABLE user_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sessions_count INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  matches_made INTEGER DEFAULT 0,
  study_sessions_scheduled INTEGER DEFAULT 0,
  study_sessions_completed INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_user_engagement_user_id ON user_engagement_metrics(user_id);
CREATE INDEX idx_user_engagement_date ON user_engagement_metrics(date DESC);
CREATE INDEX idx_user_engagement_last_active ON user_engagement_metrics(last_active_at DESC);

-- Funnel tracking (onboarding, matching, messaging)
CREATE TABLE analytics_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_name TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  users_entered INTEGER DEFAULT 0,
  users_completed INTEGER DEFAULT 0,
  users_dropped INTEGER DEFAULT 0,
  avg_time_seconds NUMERIC DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(funnel_name, step_name, date)
);

CREATE INDEX idx_funnels_name_date ON analytics_funnels(funnel_name, date DESC);
CREATE INDEX idx_funnels_step ON analytics_funnels(funnel_name, step_order);

-- Retention cohorts
CREATE TABLE analytics_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_date DATE NOT NULL, -- When users signed up
  day_number INTEGER NOT NULL, -- Days since signup (0, 1, 7, 14, 30, 60, 90)
  total_users INTEGER NOT NULL,
  active_users INTEGER NOT NULL,
  retention_rate NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_date, day_number)
);

CREATE INDEX idx_cohorts_date ON analytics_cohorts(cohort_date DESC);
CREATE INDEX idx_cohorts_day ON analytics_cohorts(day_number);

-- RLS Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cohorts ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert own events"
ON analytics_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only admins can view aggregated analytics (implement when admin system is ready)
CREATE POLICY "Public can view daily metrics"
ON analytics_daily_metrics FOR SELECT
USING (true); -- Change to admin-only later

-- Users can view their own engagement metrics
CREATE POLICY "Users can view own engagement"
ON user_engagement_metrics FOR SELECT
USING (auth.uid() = user_id);

-- Public can view funnels and cohorts (for transparency)
CREATE POLICY "Public can view funnels"
ON analytics_funnels FOR SELECT
USING (true);

CREATE POLICY "Public can view cohorts"
ON analytics_cohorts FOR SELECT
USING (true);

-- Function to track an event
CREATE OR REPLACE FUNCTION track_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_category TEXT,
  p_event_properties JSONB DEFAULT '{}'::jsonb,
  p_device_info JSONB DEFAULT '{}'::jsonb,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO analytics_events (
    user_id,
    event_type,
    event_category,
    event_properties,
    device_info,
    session_id
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_category,
    p_event_properties,
    p_device_info,
    p_session_id
  ) RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update user engagement metrics
CREATE OR REPLACE FUNCTION update_user_engagement(
  p_user_id UUID,
  p_date DATE,
  p_messages_sent INTEGER DEFAULT 0,
  p_messages_received INTEGER DEFAULT 0,
  p_matches_made INTEGER DEFAULT 0,
  p_study_sessions_scheduled INTEGER DEFAULT 0,
  p_study_sessions_completed INTEGER DEFAULT 0,
  p_time_spent_minutes INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_engagement_metrics (
    user_id,
    date,
    messages_sent,
    messages_received,
    matches_made,
    study_sessions_scheduled,
    study_sessions_completed,
    time_spent_minutes,
    last_active_at
  ) VALUES (
    p_user_id,
    p_date,
    p_messages_sent,
    p_messages_received,
    p_matches_made,
    p_study_sessions_scheduled,
    p_study_sessions_completed,
    p_time_spent_minutes,
    NOW()
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    messages_sent = user_engagement_metrics.messages_sent + EXCLUDED.messages_sent,
    messages_received = user_engagement_metrics.messages_received + EXCLUDED.messages_received,
    matches_made = user_engagement_metrics.matches_made + EXCLUDED.matches_made,
    study_sessions_scheduled = user_engagement_metrics.study_sessions_scheduled + EXCLUDED.study_sessions_scheduled,
    study_sessions_completed = user_engagement_metrics.study_sessions_completed + EXCLUDED.study_sessions_completed,
    time_spent_minutes = user_engagement_metrics.time_spent_minutes + EXCLUDED.time_spent_minutes,
    last_active_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate daily active users (DAU)
CREATE OR REPLACE FUNCTION calculate_dau(p_date DATE)
RETURNS INTEGER AS $$
DECLARE
  v_dau INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id)
  INTO v_dau
  FROM analytics_events
  WHERE DATE(created_at) = p_date;

  -- Store in daily metrics
  INSERT INTO analytics_daily_metrics (date, metric_type, metric_value)
  VALUES (p_date, 'dau', v_dau)
  ON CONFLICT (date, metric_type)
  DO UPDATE SET metric_value = EXCLUDED.metric_value;

  RETURN v_dau;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate retention rate
CREATE OR REPLACE FUNCTION calculate_retention(
  p_cohort_date DATE,
  p_day_number INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  v_cohort_size INTEGER;
  v_active_users INTEGER;
  v_retention_rate NUMERIC;
  v_target_date DATE;
BEGIN
  -- Get cohort size (users who signed up on cohort_date)
  SELECT COUNT(*)
  INTO v_cohort_size
  FROM users
  WHERE DATE(created_at) = p_cohort_date;

  IF v_cohort_size = 0 THEN
    RETURN 0;
  END IF;

  -- Calculate target date
  v_target_date := p_cohort_date + (p_day_number || ' days')::INTERVAL;

  -- Count users who were active on target date
  SELECT COUNT(DISTINCT ae.user_id)
  INTO v_active_users
  FROM analytics_events ae
  JOIN users u ON u.id = ae.user_id
  WHERE DATE(u.created_at) = p_cohort_date
    AND DATE(ae.created_at) = v_target_date;

  -- Calculate retention rate
  v_retention_rate := (v_active_users::NUMERIC / v_cohort_size::NUMERIC) * 100;

  -- Store in cohorts table
  INSERT INTO analytics_cohorts (
    cohort_date,
    day_number,
    total_users,
    active_users,
    retention_rate
  ) VALUES (
    p_cohort_date,
    p_day_number,
    v_cohort_size,
    v_active_users,
    v_retention_rate
  )
  ON CONFLICT (cohort_date, day_number)
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    active_users = EXCLUDED.active_users,
    retention_rate = EXCLUDED.retention_rate;

  RETURN v_retention_rate;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE analytics_events IS 'Individual user events for detailed tracking';
COMMENT ON TABLE analytics_daily_metrics IS 'Aggregated daily platform metrics (DAU, MAU, etc.)';
COMMENT ON TABLE user_engagement_metrics IS 'Per-user daily engagement metrics';
COMMENT ON TABLE analytics_funnels IS 'Funnel analysis for key user flows';
COMMENT ON TABLE analytics_cohorts IS 'Retention analysis by signup cohort';
