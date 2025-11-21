-- =====================================================
-- READ RECEIPTS & NOTIFICATION TRIGGERS
-- =====================================================
-- Adds message_read_receipts table for granular read tracking
-- Adds notifications table and triggers for matches, messages, and nests

-- -----------------------------------------------------
-- Table: message_read_receipts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON message_read_receipts(user_id);

-- -----------------------------------------------------
-- Table: notifications
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('match', 'message', 'nest')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- -----------------------------------------------------
-- Trigger: Match accepted notification
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_match_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> 'accepted' THEN
    RETURN NEW;
  END IF;

  -- Notify both users when a match becomes accepted
  INSERT INTO notifications (user_id, notification_type, title, body, data)
  VALUES
    (NEW.user1_id, 'match', 'New Match', 'You matched with another student!', jsonb_build_object('match_id', NEW.id, 'partner_id', NEW.user2_id)),
    (NEW.user2_id, 'match', 'New Match', 'You matched with another student!', jsonb_build_object('match_id', NEW.id, 'partner_id', NEW.user1_id))
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_match_insert ON matches;
CREATE TRIGGER trigger_notify_match_insert
  AFTER INSERT ON matches
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION notify_match_accepted();

DROP TRIGGER IF EXISTS trigger_notify_match_update ON matches;
CREATE TRIGGER trigger_notify_match_update
  AFTER UPDATE ON matches
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM NEW.status))
  EXECUTE FUNCTION notify_match_accepted();

-- -----------------------------------------------------
-- Trigger: Direct message notification
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  match_users RECORD;
  recipient_id UUID;
  preview TEXT;
BEGIN
  -- Resolve match participants using match_id or conversation -> match_id
  SELECT m.user1_id, m.user2_id INTO match_users
  FROM matches m
  WHERE m.id = NEW.match_id
     OR m.id = (SELECT c.match_id FROM conversations c WHERE c.id = NEW.conversation_id LIMIT 1)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF match_users.user1_id = NEW.sender_id THEN
    recipient_id := match_users.user2_id;
  ELSE
    recipient_id := match_users.user1_id;
  END IF;

  preview := COALESCE(LEFT(NEW.content, 140), 'New message');

  INSERT INTO notifications (user_id, notification_type, title, body, data)
  VALUES (
    recipient_id,
    'message',
    'New message',
    preview,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'match_id', NEW.match_id
    )
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NULL)
  EXECUTE FUNCTION notify_new_message();

-- -----------------------------------------------------
-- Trigger: Nest message notifications
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_new_nest_message()
RETURNS TRIGGER AS $$
DECLARE
  member RECORD;
  preview TEXT;
BEGIN
  preview := COALESCE(LEFT(NEW.content, 140), 'New message');

  FOR member IN
    SELECT user_id FROM nest_members WHERE nest_id = NEW.nest_id AND user_id <> NEW.sender_id
  LOOP
    INSERT INTO notifications (user_id, notification_type, title, body, data)
    VALUES (
      member.user_id,
      'nest',
      'New nest message',
      preview,
      jsonb_build_object('nest_id', NEW.nest_id, 'message_id', NEW.id)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_nest_message ON nest_messages;
CREATE TRIGGER trigger_notify_new_nest_message
  AFTER INSERT ON nest_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_nest_message();
