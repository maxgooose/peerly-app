-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  university text,
  major text,
  year text,
  bio text,
  profile_photo_url text,
  preferred_subjects text[],
  availability jsonb,
  last_auto_match_cycle timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create matches table
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES users(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES users(id) ON DELETE CASCADE,
  match_type text CHECK (match_type IN ('auto','manual')),
  status text CHECK (status IN ('pending','active','unmatched')) DEFAULT 'pending',
  matched_at timestamptz DEFAULT now(),
  ai_message_sent boolean DEFAULT false
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create study_sessions table
CREATE TABLE study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  date date NOT NULL,
  time_start time NOT NULL,
  time_end time NOT NULL,
  location text,
  notes text,
  status text CHECK (status IN ('scheduled','completed','cancelled')) DEFAULT 'scheduled'
);

-- Create swipe_actions table
CREATE TABLE swipe_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  action text CHECK (action IN ('like','skip')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_university ON users(university);
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_swipe_actions_user_id ON swipe_actions(user_id);
CREATE INDEX idx_swipe_actions_target_user_id ON swipe_actions(target_user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for matches table
CREATE POLICY "Users can view their own matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert matches they're part of" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update matches they're part of" ON matches
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for messages table
CREATE POLICY "Users can view messages in their matches" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their matches" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- RLS Policies for study_sessions table
CREATE POLICY "Users can view sessions in their matches" ON study_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = study_sessions.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage sessions in their matches" ON study_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = study_sessions.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- RLS Policies for swipe_actions table
CREATE POLICY "Users can view their own swipe actions" ON swipe_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own swipe actions" ON swipe_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to validate .edu email
CREATE OR REPLACE FUNCTION validate_edu_email(email text)
RETURNS boolean AS $$
BEGIN
  RETURN email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu$';
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate .edu email on user creation/update
CREATE OR REPLACE FUNCTION check_edu_email()
RETURNS trigger AS $$
BEGIN
  IF NOT validate_edu_email(NEW.email) THEN
    RAISE EXCEPTION 'Email must be a valid .edu address';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_user_email
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_edu_email();
