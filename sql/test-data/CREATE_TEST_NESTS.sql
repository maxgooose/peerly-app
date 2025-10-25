-- =====================================================
-- TEST DATA FOR NESTS SYSTEM
-- =====================================================
-- Creates sample Nests with members and messages for testing
-- Run this after applying the nests migration

-- Create test nests
INSERT INTO nests (id, name, subject, class_name, description, university, created_by, member_limit, is_auto_created)
VALUES 
  -- Manual nests
  ('11111111-1111-1111-1111-111111111111', 'CS 101 Study Group', 'Computer Science', 'Introduction to Programming', 'Study group for CS 101 students', 'Stanford University', '11111111-1111-1111-1111-111111111111', 6, false),
  ('22222222-2222-2222-2222-222222222222', 'Calculus Study Squad', 'Mathematics', 'Calculus I', 'Working through calculus problems together', 'Stanford University', '22222222-2222-2222-2222-222222222222', 8, false),
  ('33333333-3333-3333-3333-333333333333', 'Physics Lab Partners', 'Physics', 'Physics I', 'Lab reports and problem solving', 'Stanford University', '33333333-3333-3333-3333-333333333333', 4, false),
  
  -- Auto-created nests
  ('44444444-4444-4444-4444-444444444444', 'Data Structures Study Nest', 'Computer Science', 'Data Structures', 'Auto-created study group for Data Structures', 'Stanford University', '44444444-4444-4444-4444-444444444444', 6, true),
  ('55555555-5555-5555-5555-555555555555', 'Linear Algebra Study Nest', 'Mathematics', 'Linear Algebra', 'Auto-created study group for Linear Algebra', 'Stanford University', '55555555-5555-5555-5555-555555555555', 6, true);

-- Add members to nests
-- CS 101 Study Group members
INSERT INTO nest_members (nest_id, user_id, role, joined_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'creator', NOW()),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'member', NOW() - INTERVAL '1 hour'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'member', NOW() - INTERVAL '2 hours'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'member', NOW() - INTERVAL '3 hours');

-- Calculus Study Squad members
INSERT INTO nest_members (nest_id, user_id, role, joined_at)
VALUES 
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'creator', NOW()),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'member', NOW() - INTERVAL '30 minutes'),
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'member', NOW() - INTERVAL '1 hour'),
  ('22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'member', NOW() - INTERVAL '2 hours'),
  ('22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', 'member', NOW() - INTERVAL '3 hours');

-- Physics Lab Partners members
INSERT INTO nest_members (nest_id, user_id, role, joined_at)
VALUES 
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'creator', NOW()),
  ('33333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999', 'member', NOW() - INTERVAL '1 hour'),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member', NOW() - INTERVAL '2 hours');

-- Data Structures Study Nest members
INSERT INTO nest_members (nest_id, user_id, role, joined_at)
VALUES 
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'creator', NOW()),
  ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'member', NOW() - INTERVAL '1 hour'),
  ('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'member', NOW() - INTERVAL '2 hours'),
  ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'member', NOW() - INTERVAL '3 hours'),
  ('44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'member', NOW() - INTERVAL '4 hours');

-- Linear Algebra Study Nest members
INSERT INTO nest_members (nest_id, user_id, role, joined_at)
VALUES 
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'creator', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'member', NOW() - INTERVAL '1 hour'),
  ('55555555-5555-5555-5555-555555555555', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'member', NOW() - INTERVAL '2 hours'),
  ('55555555-5555-5555-5555-555555555555', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'member', NOW() - INTERVAL '3 hours');

-- Create test messages for CS 101 Study Group
INSERT INTO nest_messages (nest_id, sender_id, content, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Welcome to our CS 101 study group! Let''s help each other learn programming.', NOW() - INTERVAL '3 hours'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Thanks for creating this! I''m struggling with loops, anyone want to help?', NOW() - INTERVAL '2 hours 45 minutes'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'I can help with loops! What specifically are you having trouble with?', NOW() - INTERVAL '2 hours 30 minutes'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Same here! For loops vs while loops always confuse me', NOW() - INTERVAL '2 hours 15 minutes'),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Let''s meet up tomorrow at 2pm in the library to go over loops together!', NOW() - INTERVAL '2 hours'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Perfect! I''ll be there', NOW() - INTERVAL '1 hour 45 minutes'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Count me in too!', NOW() - INTERVAL '1 hour 30 minutes'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Great! See you all tomorrow', NOW() - INTERVAL '1 hour 15 minutes'),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Don''t forget to bring your laptops!', NOW() - INTERVAL '1 hour'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Will do! Thanks everyone', NOW() - INTERVAL '45 minutes');

-- Create test messages for Calculus Study Squad
INSERT INTO nest_messages (nest_id, sender_id, content, created_at)
VALUES 
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Hey everyone! Ready to tackle calculus together?', NOW() - INTERVAL '3 hours'),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'Absolutely! Derivatives are killing me though', NOW() - INTERVAL '2 hours 30 minutes'),
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'Same! The chain rule is so confusing', NOW() - INTERVAL '2 hours'),
  ('22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'I found this great YouTube channel that explains it really well', NOW() - INTERVAL '1 hour 30 minutes'),
  ('22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', 'Can you share the link?', NOW() - INTERVAL '1 hour'),
  ('22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'Sure! It''s Khan Academy - their calculus videos are amazing', NOW() - INTERVAL '45 minutes'),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Thanks for sharing! Let''s all check it out', NOW() - INTERVAL '30 minutes');

-- Create test messages for Data Structures Study Nest
INSERT INTO nest_messages (nest_id, sender_id, content, created_at)
VALUES 
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Welcome to the Data Structures study nest! This was automatically created based on your course.', NOW() - INTERVAL '4 hours'),
  ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Thanks! I''m excited to work on algorithms together', NOW() - INTERVAL '3 hours 30 minutes'),
  ('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Binary trees are so confusing! Anyone want to study together?', NOW() - INTERVAL '3 hours'),
  ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'I can help! I just finished that chapter', NOW() - INTERVAL '2 hours 30 minutes'),
  ('44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Perfect! Can we meet up this weekend?', NOW() - INTERVAL '2 hours'),
  ('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Yes! Saturday afternoon works for me', NOW() - INTERVAL '1 hour 30 minutes'),
  ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Great! I''ll bring my laptop and notes', NOW() - INTERVAL '1 hour'),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'This is exactly what study groups are for! Keep it up everyone', NOW() - INTERVAL '30 minutes');

-- Create test messages for Linear Algebra Study Nest
INSERT INTO nest_messages (nest_id, sender_id, content, created_at)
VALUES 
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Welcome to Linear Algebra study nest! Let''s master matrices together.', NOW() - INTERVAL '3 hours'),
  ('55555555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Matrix multiplication is so tedious!', NOW() - INTERVAL '2 hours 45 minutes'),
  ('55555555-5555-5555-5555-555555555555', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'I know right? But it gets easier with practice', NOW() - INTERVAL '2 hours 30 minutes'),
  ('55555555-5555-5555-5555-555555555555', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Anyone want to form a study group for the midterm?', NOW() - INTERVAL '2 hours'),
  ('55555555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Yes! I''m in', NOW() - INTERVAL '1 hour 45 minutes'),
  ('55555555-5555-5555-5555-555555555555', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'Me too! When should we meet?', NOW() - INTERVAL '1 hour 30 minutes'),
  ('55555555-5555-5555-5555-555555555555', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'How about this Friday evening?', NOW() - INTERVAL '1 hour'),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Perfect! I''ll create a shared document for our notes', NOW() - INTERVAL '45 minutes');

-- Update nest updated_at timestamps to reflect latest message times
UPDATE nests SET updated_at = NOW() - INTERVAL '45 minutes' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE nests SET updated_at = NOW() - INTERVAL '30 minutes' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE nests SET updated_at = NOW() - INTERVAL '2 hours' WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE nests SET updated_at = NOW() - INTERVAL '30 minutes' WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE nests SET updated_at = NOW() - INTERVAL '45 minutes' WHERE id = '55555555-5555-5555-5555-555555555555';

-- Success message
SELECT '✅ Successfully created test nests with members and messages!' as result;
