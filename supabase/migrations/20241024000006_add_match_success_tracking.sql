-- Add success tracking fields to matches table
ALTER TABLE matches
ADD COLUMN messages_exchanged INTEGER DEFAULT 0,
ADD COLUMN last_message_at TIMESTAMPTZ,
ADD COLUMN study_session_scheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN unmatched_at TIMESTAMPTZ;

-- Add success score to match_analytics
ALTER TABLE match_analytics
ADD COLUMN success_score FLOAT DEFAULT 0,
ADD COLUMN success_factors JSONB;

-- Create index for faster queries
CREATE INDEX idx_matches_messages ON matches(messages_exchanged);
CREATE INDEX idx_matches_last_message ON matches(last_message_at);

-- Add user match statistics
ALTER TABLE users
ADD COLUMN total_matches INTEGER DEFAULT 0,
ADD COLUMN successful_matches INTEGER DEFAULT 0,
ADD COLUMN avg_messages_per_match FLOAT DEFAULT 0;

-- Create function to calculate match success score
-- Success is measured by:
-- 1. Number of messages exchanged (weight: 40%)
-- 2. Whether a study session was scheduled (weight: 30%)
-- 3. How long the match stayed active (weight: 20%)
-- 4. Whether users unmatched (weight: 10%)

CREATE OR REPLACE FUNCTION calculate_match_success_score(match_id UUID)
RETURNS FLOAT AS $$
DECLARE
  v_messages_exchanged INTEGER;
  v_study_session_scheduled BOOLEAN;
  v_matched_at TIMESTAMPTZ;
  v_unmatched_at TIMESTAMPTZ;
  v_score FLOAT := 0;
  v_days_active INTEGER;
BEGIN
  -- Get match data
  SELECT
    messages_exchanged,
    study_session_scheduled,
    matched_at,
    unmatched_at
  INTO
    v_messages_exchanged,
    v_study_session_scheduled,
    v_matched_at,
    v_unmatched_at
  FROM matches
  WHERE id = match_id;

  -- Messages score (0-40 points)
  -- 1-5 messages: 10 points
  -- 6-15 messages: 20 points
  -- 16-30 messages: 30 points
  -- 30+ messages: 40 points
  IF v_messages_exchanged >= 30 THEN
    v_score := v_score + 40;
  ELSIF v_messages_exchanged >= 16 THEN
    v_score := v_score + 30;
  ELSIF v_messages_exchanged >= 6 THEN
    v_score := v_score + 20;
  ELSIF v_messages_exchanged >= 1 THEN
    v_score := v_score + 10;
  END IF;

  -- Study session score (0-30 points)
  IF v_study_session_scheduled THEN
    v_score := v_score + 30;
  END IF;

  -- Duration score (0-20 points)
  -- Active for 1+ week: 10 points
  -- Active for 2+ weeks: 15 points
  -- Active for 1+ month: 20 points
  v_days_active := EXTRACT(DAY FROM (COALESCE(v_unmatched_at, NOW()) - v_matched_at));

  IF v_days_active >= 30 THEN
    v_score := v_score + 20;
  ELSIF v_days_active >= 14 THEN
    v_score := v_score + 15;
  ELSIF v_days_active >= 7 THEN
    v_score := v_score + 10;
  END IF;

  -- Unmatch penalty (-10 points)
  IF v_unmatched_at IS NOT NULL THEN
    v_score := v_score - 10;
  END IF;

  -- Normalize to 0-100 scale
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql;

-- Create function to update match statistics
CREATE OR REPLACE FUNCTION update_match_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update success score when match is updated
  IF TG_OP = 'UPDATE' THEN
    UPDATE match_analytics
    SET
      success_score = calculate_match_success_score(NEW.id),
      success_factors = jsonb_build_object(
        'messages_exchanged', NEW.messages_exchanged,
        'study_session_scheduled', NEW.study_session_scheduled,
        'days_active', EXTRACT(DAY FROM (COALESCE(NEW.unmatched_at, NOW()) - NEW.matched_at)),
        'unmatched', NEW.unmatched_at IS NOT NULL
      )
    WHERE match_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update success scores
CREATE TRIGGER trigger_update_match_statistics
AFTER UPDATE ON matches
FOR EACH ROW
WHEN (
  OLD.messages_exchanged IS DISTINCT FROM NEW.messages_exchanged OR
  OLD.study_session_scheduled IS DISTINCT FROM NEW.study_session_scheduled OR
  OLD.unmatched_at IS DISTINCT FROM NEW.unmatched_at
)
EXECUTE FUNCTION update_match_statistics();

-- Create function to update user statistics
CREATE OR REPLACE FUNCTION update_user_match_stats(user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_matches INTEGER;
  v_successful_matches INTEGER;
  v_avg_messages FLOAT;
BEGIN
  -- Count total matches
  SELECT COUNT(*)
  INTO v_total_matches
  FROM matches
  WHERE (user1_id = user_id OR user2_id = user_id)
    AND status = 'active';

  -- Count successful matches (success_score >= 50)
  SELECT COUNT(*)
  INTO v_successful_matches
  FROM matches m
  JOIN match_analytics ma ON ma.match_id = m.id
  WHERE (m.user1_id = user_id OR m.user2_id = user_id)
    AND ma.success_score >= 50;

  -- Calculate average messages per match
  SELECT COALESCE(AVG(messages_exchanged), 0)
  INTO v_avg_messages
  FROM matches
  WHERE (user1_id = user_id OR user2_id = user_id)
    AND status = 'active';

  -- Update user record
  UPDATE users
  SET
    total_matches = v_total_matches,
    successful_matches = v_successful_matches,
    avg_messages_per_match = v_avg_messages
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment message count
CREATE OR REPLACE FUNCTION increment_match_messages(p_match_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE matches
  SET
    messages_exchanged = COALESCE(messages_exchanged, 0) + 1,
    last_message_at = NOW()
  WHERE id = p_match_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the success tracking
COMMENT ON COLUMN matches.messages_exchanged IS 'Number of messages exchanged in this match';
COMMENT ON COLUMN match_analytics.success_score IS 'Calculated success score (0-100) based on engagement metrics';
COMMENT ON COLUMN users.successful_matches IS 'Number of matches with success_score >= 50';
