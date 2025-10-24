-- =====================================================
-- CREATE TEST DATA
-- =====================================================
-- BEFORE RUNNING: Replace YOUR_MATCH_ID_HERE with actual match ID
--
-- To get your match ID, run this first:
-- SELECT id, user1_id, user2_id FROM matches LIMIT 5;
--
-- Copy one of the match IDs and paste it below
-- =====================================================

DO $$
DECLARE
  v_match_id UUID := 'YOUR_MATCH_ID_HERE'::uuid; -- ⚠️ REPLACE THIS
  v_user1_id UUID;
  v_user2_id UUID;
  v_conversation_id UUID;
BEGIN
  -- Get the users from the match
  SELECT user1_id, user2_id INTO v_user1_id, v_user2_id
  FROM matches
  WHERE id = v_match_id;

  -- Verify match exists
  IF v_user1_id IS NULL THEN
    RAISE EXCEPTION 'Match not found! Check your match ID.';
  END IF;

  RAISE NOTICE 'Creating conversation for match: %', v_match_id;
  RAISE NOTICE 'User 1: %', v_user1_id;
  RAISE NOTICE 'User 2: %', v_user2_id;

  -- Create conversation
  INSERT INTO conversations (match_id, created_at)
  VALUES (v_match_id, NOW() - INTERVAL '2 days')
  ON CONFLICT (match_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  -- If conversation already exists, get its ID
  IF v_conversation_id IS NULL THEN
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE match_id = v_match_id;

    RAISE NOTICE 'Conversation already exists: %', v_conversation_id;
  ELSE
    RAISE NOTICE 'Created new conversation: %', v_conversation_id;
  END IF;

  -- Insert test messages
  INSERT INTO messages (conversation_id, sender_id, content, message_type, status, created_at)
  VALUES
    -- Day 1 - Initial conversation
    (v_conversation_id, v_user1_id, 'Hey! How are you doing?', 'text', 'sent', NOW() - INTERVAL '2 days'),
    (v_conversation_id, v_user2_id, 'Hi! I''m doing great, thanks! How about you?', 'text', 'sent', NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'),
    (v_conversation_id, v_user1_id, 'Pretty good! Working on some interesting projects.', 'text', 'sent', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),

    -- Day 2 - Following up
    (v_conversation_id, v_user2_id, 'That sounds exciting! What kind of projects?', 'text', 'sent', NOW() - INTERVAL '1 day'),
    (v_conversation_id, v_user1_id, 'Building a chat app actually! It''s been a lot of fun.', 'text', 'sent', NOW() - INTERVAL '1 day' + INTERVAL '15 minutes'),
    (v_conversation_id, v_user2_id, 'Oh nice! What tech stack are you using?', 'text', 'sent', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes'),
    (v_conversation_id, v_user1_id, 'React Native and Supabase. The real-time features are awesome!', 'text', 'sent', NOW() - INTERVAL '1 day' + INTERVAL '45 minutes'),

    -- Recent messages
    (v_conversation_id, v_user2_id, 'That''s cool! I''ve heard good things about Supabase.', 'text', 'sent', NOW() - INTERVAL '3 hours'),
    (v_conversation_id, v_user1_id, 'Yeah, it makes backend stuff so much easier.', 'text', 'sent', NOW() - INTERVAL '2 hours'),
    (v_conversation_id, v_user2_id, 'Would love to see it when it''s ready!', 'text', 'sent', NOW() - INTERVAL '30 minutes')
  ON CONFLICT (client_id) DO NOTHING;

  RAISE NOTICE '✅ Successfully created 10 test messages!';

  -- Show the conversation details
  RAISE NOTICE '';
  RAISE NOTICE 'Conversation ID: %', v_conversation_id;
  RAISE NOTICE 'Match ID: %', v_match_id;
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test the app!';

END $$;

-- =====================================================
-- VERIFY TEST DATA WAS CREATED
-- =====================================================

-- View the conversation
SELECT
  c.id,
  c.match_id,
  c.last_message_content,
  c.last_message_at,
  c.created_at
FROM conversations c
ORDER BY c.updated_at DESC
LIMIT 5;

-- View all messages
SELECT
  m.id,
  m.content,
  m.message_type,
  m.status,
  m.created_at,
  u.full_name as sender_name
FROM messages m
LEFT JOIN users u ON u.id = m.sender_id
ORDER BY m.created_at ASC
LIMIT 20;

-- Count messages per conversation
SELECT
  c.id as conversation_id,
  COUNT(m.id) as message_count,
  c.last_message_content
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id, c.last_message_content
ORDER BY message_count DESC;
