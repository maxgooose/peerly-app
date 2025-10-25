-- Add study preference fields to users table
ALTER TABLE users
ADD COLUMN study_style TEXT CHECK (study_style IN ('quiet', 'with_music', 'group_discussion', 'teach_each_other')),
ADD COLUMN study_goals TEXT CHECK (study_goals IN ('ace_exams', 'understand_concepts', 'just_pass', 'make_friends'));

-- Add index for matching queries
CREATE INDEX idx_users_study_preferences ON users(study_style, study_goals);

-- Add analytics table for tracking match success
CREATE TABLE match_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  compatibility_score INTEGER NOT NULL,
  score_breakdown JSONB, -- stores individual component scores
  first_message_sent BOOLEAN DEFAULT false,
  first_response_received BOOLEAN DEFAULT false,
  conversation_message_count INTEGER DEFAULT 0,
  study_session_scheduled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on match_analytics
ALTER TABLE match_analytics ENABLE ROW LEVEL SECURITY;

-- Allow users to view analytics for their own matches
CREATE POLICY "Users can view analytics for their matches" ON match_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_analytics.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Create index for analytics queries
CREATE INDEX idx_match_analytics_match_id ON match_analytics(match_id);
CREATE INDEX idx_match_analytics_score ON match_analytics(compatibility_score);
