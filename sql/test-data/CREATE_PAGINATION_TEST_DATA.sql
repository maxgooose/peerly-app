-- =====================================================
-- CREATE PAGINATION TEST DATA
-- =====================================================
-- This creates 200+ test messages for testing pagination
-- Run this in Supabase SQL Editor after the basic test data is created
-- =====================================================

DO $$
DECLARE
  v_conversation_id UUID := '44444444-4444-4444-4444-444444444444'; -- Our test conversation
  v_user1_id UUID := '11111111-1111-1111-1111-111111111111'; -- Alice
  v_user2_id UUID := '22222222-2222-2222-2222-222222222222'; -- Bob
  v_message_count INTEGER := 0;
  v_base_time TIMESTAMPTZ := NOW() - INTERVAL '30 days'; -- Start 30 days ago
  v_current_time TIMESTAMPTZ;
  v_sender_id UUID;
  v_message_text TEXT;
  v_message_types TEXT[] := ARRAY['text', 'text', 'text', 'text', 'text']; -- Mostly text messages
  v_message_templates TEXT[] := ARRAY[
    'Hey, how are you doing?',
    'That sounds great!',
    'I totally agree with you',
    'What do you think about this?',
    'Let me know what you think',
    'That''s interesting',
    'I see what you mean',
    'Thanks for sharing that',
    'I hadn''t thought of it that way',
    'That makes sense',
    'I''m not sure about that',
    'What time works for you?',
    'I''m free tomorrow',
    'Let''s meet up soon',
    'Sounds like a plan',
    'I''ll see you then',
    'Looking forward to it',
    'Thanks for the help',
    'No problem at all',
    'Happy to help'
  ];
BEGIN
  RAISE NOTICE 'Creating 200+ test messages for pagination testing...';
  
  -- Generate 200 messages over 30 days
  FOR i IN 1..200 LOOP
    -- Calculate timestamp (spread over 30 days)
    v_current_time := v_base_time + (i * INTERVAL '3.6 hours'); -- ~4 messages per day
    
    -- Alternate between users
    IF i % 2 = 1 THEN
      v_sender_id := v_user1_id; -- Alice
    ELSE
      v_sender_id := v_user2_id; -- Bob
    END IF;
    
    -- Pick a random message template
    v_message_text := v_message_templates[1 + (i % array_length(v_message_templates, 1))];
    
    -- Add some variation to messages
    CASE (i % 10)
      WHEN 0 THEN v_message_text := v_message_text || ' 😊';
      WHEN 1 THEN v_message_text := v_message_text || ' 👍';
      WHEN 2 THEN v_message_text := v_message_text || ' 🤔';
      WHEN 3 THEN v_message_text := v_message_text || ' 💭';
      WHEN 4 THEN v_message_text := v_message_text || ' ✨';
      ELSE NULL;
    END CASE;
    
    -- Insert the message
    INSERT INTO messages (
      conversation_id,
      sender_id,
      content,
      message_type,
      status,
      created_at
    ) VALUES (
      v_conversation_id,
      v_sender_id,
      v_message_text,
      'text',
      'sent',
      v_current_time
    );
    
    v_message_count := v_message_count + 1;
    
    -- Log progress every 50 messages
    IF v_message_count % 50 = 0 THEN
      RAISE NOTICE 'Created % messages so far...', v_message_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Successfully created % test messages!', v_message_count;
  RAISE NOTICE 'Messages span from % to %', v_base_time, v_current_time;
  
END $$;

-- =====================================================
-- VERIFY THE TEST DATA
-- =====================================================

-- Count total messages
SELECT 
  COUNT(*) as total_messages,
  MIN(created_at) as oldest_message,
  MAX(created_at) as newest_message
FROM messages 
WHERE conversation_id = '44444444-4444-4444-4444-444444444444';

-- Count messages by sender
SELECT 
  CASE 
    WHEN sender_id = '11111111-1111-1111-1111-111111111111' THEN 'Alice'
    WHEN sender_id = '22222222-2222-2222-2222-222222222222' THEN 'Bob'
    ELSE 'Unknown'
  END as sender_name,
  COUNT(*) as message_count
FROM messages 
WHERE conversation_id = '44444444-4444-4444-4444-444444444444'
GROUP BY sender_id;

-- Show message distribution over time
SELECT 
  DATE(created_at) as message_date,
  COUNT(*) as messages_per_day
FROM messages 
WHERE conversation_id = '44444444-4444-4444-4444-444444444444'
GROUP BY DATE(created_at)
ORDER BY message_date DESC
LIMIT 10;

-- =====================================================
-- TEST PAGINATION QUERIES
-- =====================================================

-- Test: Get first 50 messages (most recent)
SELECT 
  id,
  content,
  sender_id,
  created_at
FROM messages 
WHERE conversation_id = '44444444-4444-4444-4444-444444444444'
ORDER BY created_at DESC
LIMIT 50;

-- Test: Get next 50 messages (older)
SELECT 
  id,
  content,
  sender_id,
  created_at
FROM messages 
WHERE conversation_id = '44444444-4444-4444-4444-444444444444'
  AND created_at < (SELECT created_at FROM messages WHERE conversation_id = '44444444-4444-4444-4444-444444444444' ORDER BY created_at DESC LIMIT 1 OFFSET 49)
ORDER BY created_at DESC
LIMIT 50;
