-- =====================================================
-- CHAT SYSTEM MIGRATION
-- =====================================================
-- Creates conversations table and chat-media storage bucket
-- Adds media support columns to messages table

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
-- Create conversations table to track chat sessions between matched users
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_id UUID,
  last_message_content TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_sender_id UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_conversations_match_id ON conversations(match_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_last_message_sender ON conversations(last_message_sender_id);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view conversations for their matches
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = conversations.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- RLS Policy: Users can create conversations for their matches
CREATE POLICY "Users can create conversations for their matches" ON conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = conversations.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- RLS Policy: Users can update their conversations
CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = conversations.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- ============================================================================
-- UPDATE MESSAGES TABLE
-- ============================================================================
-- Add columns for media support and conversation linking
ALTER TABLE messages
ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
ADD COLUMN message_type TEXT CHECK (message_type IN ('text', 'image', 'file')) DEFAULT 'text',
ADD COLUMN media_url TEXT,
ADD COLUMN media_type TEXT,
ADD COLUMN media_size BIGINT,
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN status TEXT CHECK (status IN ('sending', 'sent', 'delivered', 'failed')) DEFAULT 'sent',
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN deleted_at TIMESTAMPTZ,
ADD COLUMN client_id TEXT;

-- Create indexes for new columns
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_client_id ON messages(client_id);
CREATE INDEX idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NULL;

-- Update existing messages to link to conversations
-- First create conversations for all existing matches that don't have one
INSERT INTO conversations (match_id, created_at, updated_at)
SELECT 
  m.id,
  m.matched_at,
  m.matched_at
FROM matches m
WHERE NOT EXISTS (
  SELECT 1 FROM conversations c WHERE c.match_id = m.id
)
ON CONFLICT (match_id) DO NOTHING;

-- Then update messages to point to conversations
UPDATE messages msg
SET conversation_id = (
  SELECT c.id 
  FROM conversations c 
  WHERE c.match_id = msg.match_id
)
WHERE msg.conversation_id IS NULL;

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================
-- Create chat-media bucket for image and file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for chat-media bucket
-- Users can upload to their conversation folders
CREATE POLICY "Users can upload to conversation folders"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM conversations c
    JOIN matches m ON m.id = c.match_id
    WHERE m.user1_id = auth.uid() OR m.user2_id = auth.uid()
  )
);

-- Users can read files from their conversations
CREATE POLICY "Users can read conversation files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-media' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM conversations c
    JOIN matches m ON m.id = c.match_id
    WHERE m.user1_id = auth.uid() OR m.user2_id = auth.uid()
  )
);

-- Users can delete files from their conversations
CREATE POLICY "Users can delete conversation files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-media' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM conversations c
    JOIN matches m ON m.id = c.match_id
    WHERE m.user1_id = auth.uid() OR m.user2_id = auth.uid()
  )
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Function to update conversation when message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_id = NEW.id,
    last_message_content = CASE
      WHEN NEW.message_type = 'text' THEN NEW.content
      WHEN NEW.message_type = 'image' THEN '📷 Image'
      WHEN NEW.message_type = 'file' THEN '📎 File'
      ELSE NEW.content
    END,
    last_message_at = NEW.created_at,
    last_message_sender_id = NEW.sender_id,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NULL)
  EXECUTE FUNCTION update_conversation_on_message();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE conversations IS 'Chat conversations between matched users';
COMMENT ON COLUMN conversations.last_message_content IS 'Cached last message for list view performance';
COMMENT ON COLUMN messages.conversation_id IS 'Links message to conversation (replaces match_id for chat system)';
COMMENT ON COLUMN messages.message_type IS 'Type of message: text, image, or file';
COMMENT ON COLUMN messages.client_id IS 'Client-generated ID for deduplication and optimistic updates';

