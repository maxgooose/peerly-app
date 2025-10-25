-- =====================================================
-- NESTS SYSTEM MIGRATION
-- =====================================================
-- Creates tables for Discord-style study groups (Nests)
-- Phase: Nests Implementation

-- Create nests table
CREATE TABLE nests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  class_name TEXT,
  description TEXT,
  university TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  member_limit INTEGER DEFAULT 8 CHECK (member_limit >= 3 AND member_limit <= 8),
  is_auto_created BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create nest_members table
CREATE TABLE nest_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nest_id UUID REFERENCES nests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('creator', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(nest_id, user_id)
);

-- Create nest_messages table
CREATE TABLE nest_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nest_id UUID REFERENCES nests(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_nests_university ON nests(university);
CREATE INDEX idx_nests_subject ON nests(subject);
CREATE INDEX idx_nests_created_by ON nests(created_by);
CREATE INDEX idx_nests_created_at ON nests(created_at DESC);

CREATE INDEX idx_nest_members_nest_id ON nest_members(nest_id);
CREATE INDEX idx_nest_members_user_id ON nest_members(user_id);
CREATE INDEX idx_nest_members_role ON nest_members(role);

CREATE INDEX idx_nest_messages_nest_id ON nest_messages(nest_id);
CREATE INDEX idx_nest_messages_created_at ON nest_messages(created_at DESC);
CREATE INDEX idx_nest_messages_sender_id ON nest_messages(sender_id);

-- Enable Row Level Security
ALTER TABLE nests ENABLE ROW LEVEL SECURITY;
ALTER TABLE nest_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE nest_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nests table
CREATE POLICY "Users can view nests they're members of" ON nests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nest_members 
      WHERE nest_members.nest_id = nests.id 
      AND nest_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create nests at their university" ON nests
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    university = (SELECT university FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Only nest creator can update their nest" ON nests
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Only nest creator can delete their nest" ON nests
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for nest_members table
CREATE POLICY "Users can view members of nests they're in" ON nest_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nest_members nm2 
      WHERE nm2.nest_id = nest_members.nest_id 
      AND nm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join nests at their university" ON nest_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM nests 
      WHERE nests.id = nest_members.nest_id 
      AND nests.university = (SELECT university FROM users WHERE id = auth.uid())
      AND (
        SELECT COUNT(*) FROM nest_members 
        WHERE nest_id = nest_members.nest_id
      ) < (
        SELECT member_limit FROM nests 
        WHERE id = nest_members.nest_id
      )
    )
  );

CREATE POLICY "Users can leave nests they're members of" ON nest_members
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Nest creator can manage members" ON nest_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM nests 
      WHERE nests.id = nest_members.nest_id 
      AND nests.created_by = auth.uid()
    )
  );

-- RLS Policies for nest_messages table
CREATE POLICY "Users can view messages in nests they're members of" ON nest_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nest_members 
      WHERE nest_members.nest_id = nest_messages.nest_id 
      AND nest_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to nests they're members of" ON nest_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM nest_members 
      WHERE nest_members.nest_id = nest_messages.nest_id 
      AND nest_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON nest_messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON nest_messages
  FOR DELETE USING (sender_id = auth.uid());

-- Function to automatically add creator as member when nest is created
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO nest_members (nest_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'creator');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add creator as member
CREATE TRIGGER trigger_add_creator_as_member
  AFTER INSERT ON nests
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_member();

-- Function to update nest updated_at when message is added
CREATE OR REPLACE FUNCTION update_nest_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE nests
  SET updated_at = NOW()
  WHERE id = NEW.nest_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update nest timestamp on new message
CREATE TRIGGER trigger_update_nest_on_message
  AFTER INSERT ON nest_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_nest_on_message();

-- Function to validate member limit
CREATE OR REPLACE FUNCTION validate_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  SELECT COUNT(*), member_limit 
  INTO current_count, max_limit
  FROM nest_members nm
  JOIN nests n ON n.id = nm.nest_id
  WHERE nm.nest_id = NEW.nest_id;
  
  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Nest is at member limit (%)', max_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate member limit before adding member
CREATE TRIGGER trigger_validate_member_limit
  BEFORE INSERT ON nest_members
  FOR EACH ROW
  EXECUTE FUNCTION validate_member_limit();

-- Add comment
COMMENT ON TABLE nests IS 'Study groups (Nests) - Discord-style groups for subject-specific study';
COMMENT ON TABLE nest_members IS 'Membership table linking users to nests';
COMMENT ON TABLE nest_messages IS 'Messages sent within nests (group chat)';
