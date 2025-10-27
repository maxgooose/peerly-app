-- Rate Limiting Function for Security
-- This function checks if a user has exceeded rate limits for specific actions

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_limit INTEGER,
  p_window INTERVAL
) RETURNS BOOLEAN AS $$
DECLARE
  action_count INTEGER;
BEGIN
  -- Count actions by this user in the specified time window
  SELECT COUNT(*)
  INTO action_count
  FROM analytics_events
  WHERE user_id = p_user_id
    AND event_type = p_action
    AND created_at > NOW() - p_window;
  
  -- Return true if under limit, false if over limit
  RETURN action_count < p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, TEXT, INTEGER, INTERVAL) TO authenticated;
