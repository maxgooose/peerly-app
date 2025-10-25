-- Create user badges system
-- Simple, subtle badges for verified students (tutor, founder, dev, etc.)

-- Create badges table to define available badge types
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL, -- Emoji or icon identifier
  color TEXT NOT NULL, -- Hex color for badge display
  priority INTEGER DEFAULT 0, -- Higher priority badges show first
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_badges junction table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  verified BOOLEAN DEFAULT TRUE, -- Badges are verified by default
  verified_by UUID REFERENCES users(id), -- Admin who verified this badge
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT, -- Optional notes about verification
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id) -- User can only have each badge once
);

-- Create indexes for faster queries
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_badges_priority ON badges(priority DESC);

-- Insert default badge types
INSERT INTO badges (id, name, description, icon, color, priority) VALUES
  ('tutor', 'Tutor', 'Experienced tutor helping other students', '👨‍🏫', '#10B981', 100),
  ('founder', 'Founder', 'App founder and community builder', '🚀', '#8B5CF6', 90),
  ('dev', 'Developer', 'Software developer or engineer', '💻', '#3B82F6', 80),
  ('verified', 'Verified', 'Verified student account', '✓', '#06B6D4', 70),
  ('top_contributor', 'Top Contributor', 'Active community contributor', '⭐', '#F59E0B', 60),
  ('early_adopter', 'Early Adopter', 'Joined during beta/early access', '🌟', '#EC4899', 50),
  ('mentor', 'Mentor', 'Dedicated to mentoring other students', '🎓', '#14B8A6', 40),
  ('researcher', 'Researcher', 'Active in research projects', '🔬', '#A855F7', 30);

-- Add badge display preference to users table
ALTER TABLE users
ADD COLUMN badge_display_preference TEXT DEFAULT 'show_all' CHECK (badge_display_preference IN ('show_all', 'show_primary', 'hide_all')),
ADD COLUMN primary_badge_id TEXT REFERENCES badges(id); -- User's primary/favorite badge

-- Create function to get user's badges
CREATE OR REPLACE FUNCTION get_user_badges(p_user_id UUID)
RETURNS TABLE (
  badge_id TEXT,
  badge_name TEXT,
  badge_icon TEXT,
  badge_color TEXT,
  badge_priority INTEGER,
  verified BOOLEAN,
  verified_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.icon,
    b.color,
    b.priority,
    ub.verified,
    ub.verified_at
  FROM user_badges ub
  JOIN badges b ON b.id = ub.badge_id
  WHERE ub.user_id = p_user_id
    AND ub.verified = TRUE
  ORDER BY b.priority DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to assign badge to user
CREATE OR REPLACE FUNCTION assign_badge(
  p_user_id UUID,
  p_badge_id TEXT,
  p_verified_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert badge, ignore if already exists
  INSERT INTO user_badges (user_id, badge_id, verified_by, notes)
  VALUES (p_user_id, p_badge_id, p_verified_by, p_notes)
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to remove badge from user
CREATE OR REPLACE FUNCTION remove_badge(
  p_user_id UUID,
  p_badge_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM user_badges
  WHERE user_id = p_user_id
    AND badge_id = p_badge_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create view for easy querying of users with their badges
CREATE OR REPLACE VIEW users_with_badges AS
SELECT
  u.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', b.id,
        'name', b.name,
        'icon', b.icon,
        'color', b.color,
        'priority', b.priority
      )
      ORDER BY b.priority DESC
    ) FILTER (WHERE b.id IS NOT NULL),
    '[]'::json
  ) as badges
FROM users u
LEFT JOIN user_badges ub ON ub.user_id = u.id AND ub.verified = TRUE
LEFT JOIN badges b ON b.id = ub.badge_id
GROUP BY u.id;

-- Add RLS policies for badges tables

-- Badges are public (anyone can see available badge types)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are publicly viewable"
ON badges FOR SELECT
USING (true);

-- User badges are public (anyone can see who has which badges)
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are publicly viewable"
ON user_badges FOR SELECT
USING (true);

-- Only admins can assign/remove badges (implement admin check later)
CREATE POLICY "Only admins can manage user badges"
ON user_badges FOR ALL
USING (false); -- Disabled for now, will enable with admin system

-- Add comments
COMMENT ON TABLE badges IS 'Available badge types (tutor, founder, dev, etc.)';
COMMENT ON TABLE user_badges IS 'Junction table linking users to their earned badges';
COMMENT ON COLUMN users.badge_display_preference IS 'How user wants to display their badges (show_all, show_primary, hide_all)';
COMMENT ON COLUMN users.primary_badge_id IS 'Users primary/featured badge to display prominently';
