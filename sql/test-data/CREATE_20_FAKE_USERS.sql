-- =====================================================
-- 20 COMPREHENSIVE FAKE USERS FOR TESTING
-- =====================================================
-- Creates 20 realistic users with complete profiles, photos, and nest memberships
-- Run this in Supabase SQL Editor to populate your app with test data

-- Clean up existing fake test data (optional - uncomment if needed)
-- DELETE FROM nest_members WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%fakeuser%');
-- DELETE FROM users WHERE email LIKE '%fakeuser%';

-- Insert 20 fake users with complete profiles
INSERT INTO users (
  id, 
  email, 
  full_name, 
  university, 
  major, 
  year, 
  bio, 
  profile_photo_url,
  has_profile_photo,
  preferred_subjects, 
  availability,
  study_style, 
  study_goals, 
  onboarding_completed,
  onboarding_completed_at
)
VALUES
-- User 1: Emma Johnson
(
  'a1111111-1111-1111-1111-111111111111',
  'emma.fakeuser@stanford.edu',
  'Emma Johnson',
  'Stanford',
  'Computer Science',
  'Junior',
  'Passionate about AI and machine learning. Love collaborating on challenging problems and teaching others! Always up for a coffee and code session.',
  'https://i.pravatar.cc/300?img=1',
  true,
  ARRAY['Data Structures', 'Algorithms', 'Machine Learning', 'Artificial Intelligence'],
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '14:00', 'end', '18:00'))),
    'wednesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '10:00', 'end', '16:00'))),
    'friday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '13:00', 'end', '17:00')))
  ),
  'quiet',
  'ace_exams',
  true,
  NOW() - INTERVAL '30 days'
),

-- User 2: Marcus Chen
(
  'a2222222-2222-2222-2222-222222222222',
  'marcus.fakeuser@stanford.edu',
  'Marcus Chen',
  'Stanford',
  'Computer Science',
  'Sophomore',
  'CS major who loves gaming and coding. Always down to pair program and tackle tough algorithms together. Let''s ace this semester!',
  'https://i.pravatar.cc/300?img=12',
  true,
  ARRAY['Data Structures', 'Web Development', 'Databases', 'Algorithms'],
  jsonb_build_object(
    'tuesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '15:00', 'end', '19:00'))),
    'thursday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '14:00', 'end', '18:00'))),
    'saturday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '10:00', 'end', '14:00')))
  ),
  'with_music',
  'understand_concepts',
  true,
  NOW() - INTERVAL '28 days'
),

-- User 3: Sofia Rodriguez
(
  'a3333333-3333-3333-3333-333333333333',
  'sofia.fakeuser@stanford.edu',
  'Sofia Rodriguez',
  'Stanford',
  'Mathematics',
  'Senior',
  'Math lover exploring pure and applied mathematics. I enjoy explaining complex concepts in simple ways. Teaching is learning twice!',
  'https://i.pravatar.cc/300?img=5',
  true,
  ARRAY['Linear Algebra', 'Calculus III', 'Abstract Algebra', 'Real Analysis'],
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '12:00'))),
    'wednesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '13:00', 'end', '17:00'))),
    'friday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '10:00', 'end', '14:00')))
  ),
  'teach_each_other',
  'understand_concepts',
  true,
  NOW() - INTERVAL '25 days'
),

-- User 4: Jamal Williams
(
  'a4444444-4444-4444-4444-444444444444',
  'jamal.fakeuser@stanford.edu',
  'Jamal Williams',
  'Stanford',
  'Mechanical Engineering',
  'Junior',
  'Engineering student passionate about robotics and design. Love building things and solving real-world problems. Let''s build something amazing!',
  'https://i.pravatar.cc/300?img=14',
  true,
  ARRAY['Thermodynamics', 'Fluid Mechanics', 'Engineering Design', 'CAD'],
  jsonb_build_object(
    'tuesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '16:00', 'end', '20:00'))),
    'thursday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '15:00', 'end', '19:00'))),
    'sunday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '14:00', 'end', '18:00')))
  ),
  'group_discussion',
  'ace_exams',
  true,
  NOW() - INTERVAL '22 days'
),

-- User 5: Aisha Patel
(
  'a5555555-5555-5555-5555-555555555555',
  'aisha.fakeuser@stanford.edu',
  'Aisha Patel',
  'Stanford',
  'Biology',
  'Sophomore',
  'Pre-med student fascinated by cellular biology and genetics. Looking for study partners who are equally passionate about understanding life sciences!',
  'https://i.pravatar.cc/300?img=9',
  true,
  ARRAY['Cell Biology', 'Genetics', 'Organic Chemistry', 'Biochemistry'],
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '11:00', 'end', '15:00'))),
    'wednesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '12:00', 'end', '16:00'))),
    'friday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '14:00', 'end', '18:00')))
  ),
  'quiet',
  'ace_exams',
  true,
  NOW() - INTERVAL '20 days'
),

-- User 6: Liam O'Brien
(
  'a6666666-6666-6666-6666-666666666666',
  'liam.fakeuser@stanford.edu',
  'Liam O''Brien',
  'Stanford',
  'Physics',
  'Junior',
  'Physics nerd who loves quantum mechanics and astrophysics. Coffee-fueled problem-solving sessions are my jam. Let''s decode the universe!',
  'https://i.pravatar.cc/300?img=13',
  true,
  ARRAY['Quantum Mechanics', 'Classical Mechanics', 'Electromagnetism', 'Thermodynamics'],
  jsonb_build_object(
    'tuesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '13:00', 'end', '17:00'))),
    'thursday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '10:00', 'end', '14:00'))),
    'saturday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '13:00')))
  ),
  'with_music',
  'understand_concepts',
  true,
  NOW() - INTERVAL '18 days'
),

-- User 7: Maya Thompson
(
  'a7777777-7777-7777-7777-777777777777',
  'maya.fakeuser@stanford.edu',
  'Maya Thompson',
  'Stanford',
  'Economics',
  'Senior',
  'Economics major interested in behavioral economics and public policy. Love discussing theories and real-world applications. Let''s analyze the world!',
  'https://i.pravatar.cc/300?img=20',
  true,
  ARRAY['Microeconomics', 'Macroeconomics', 'Econometrics', 'Game Theory'],
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '15:00', 'end', '19:00'))),
    'wednesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '14:00', 'end', '18:00'))),
    'friday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '11:00', 'end', '15:00')))
  ),
  'group_discussion',
  'make_friends',
  true,
  NOW() - INTERVAL '15 days'
),

-- User 8: David Kim
(
  'a8888888-8888-8888-8888-888888888888',
  'david.fakeuser@stanford.edu',
  'David Kim',
  'Stanford',
  'Computer Science',
  'Freshman',
  'New to CS but super excited to learn! Looking for patient study partners who can help me navigate intro courses. Let''s grow together!',
  'https://i.pravatar.cc/300?img=15',
  true,
  ARRAY['Intro to Programming', 'Calculus I', 'Discrete Math', 'Physics I'],
  jsonb_build_object(
    'tuesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '10:00', 'end', '14:00'))),
    'thursday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '11:00', 'end', '15:00'))),
    'sunday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '13:00', 'end', '17:00')))
  ),
  'quiet',
  'just_pass',
  true,
  NOW() - INTERVAL '12 days'
),

-- User 9: Isabella Martinez
(
  'a9999999-9999-9999-9999-999999999999',
  'isabella.fakeuser@stanford.edu',
  'Isabella Martinez',
  'Stanford',
  'Chemistry',
  'Junior',
  'Chemistry enthusiast with a passion for organic synthesis. Lab work is fun but studying together makes it even better. Let''s ace those reactions!',
  'https://i.pravatar.cc/300?img=23',
  true,
  ARRAY['Organic Chemistry', 'Physical Chemistry', 'Analytical Chemistry', 'Biochemistry'],
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '13:00', 'end', '17:00'))),
    'wednesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '15:00', 'end', '19:00'))),
    'saturday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '11:00', 'end', '15:00')))
  ),
  'teach_each_other',
  'ace_exams',
  true,
  NOW() - INTERVAL '10 days'
),

-- User 10: Ethan Brown
(
  'b1111111-1111-1111-1111-111111111111',
  'ethan.fakeuser@stanford.edu',
  'Ethan Brown',
  'Stanford',
  'Electrical Engineering',
  'Sophomore',
  'EE student who loves circuits and signal processing. Always carrying a breadboard. Let''s build circuits and solve problems together!',
  'https://i.pravatar.cc/300?img=33',
  true,
  ARRAY['Circuit Analysis', 'Digital Logic', 'Signals and Systems', 'Electromagnetics'],
  jsonb_build_object(
    'tuesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '14:00', 'end', '18:00'))),
    'thursday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '13:00', 'end', '17:00'))),
    'sunday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '10:00', 'end', '14:00')))
  ),
  'with_music',
  'understand_concepts',
  true,
  NOW() - INTERVAL '8 days'
),

-- User 11: Olivia Davis
(
  'b2222222-2222-2222-2222-222222222222',
  'olivia.fakeuser@stanford.edu',
  'Olivia Davis',
  'Stanford',
  'Psychology',
  'Senior',
  'Psychology major passionate about cognitive science and human behavior. Love deep discussions and collaborative learning. Let''s understand the mind!',
  'https://i.pravatar.cc/300?img=26',
  true,
  ARRAY['Cognitive Psychology', 'Social Psychology', 'Neuroscience', 'Research Methods'],
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '10:00', 'end', '14:00'))),
    'wednesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '11:00', 'end', '15:00'))),
    'friday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '12:00', 'end', '16:00')))
  ),
  'group_discussion',
  'make_friends',
  true,
  NOW() - INTERVAL '7 days'
),

-- User 12: Noah Anderson
(
  'b3333333-3333-3333-3333-333333333333',
  'noah.fakeuser@stanford.edu',
  'Noah Anderson',
  'Stanford',
  'Mathematics',
  'Junior',
  'Pure math enthusiast who finds beauty in proofs. Looking for fellow math lovers to work through challenging problems. Let''s prove theorems!',
  'https://i.pravatar.cc/300?img=35',
  true,
  ARRAY['Real Analysis', 'Abstract Algebra', 'Topology', 'Number Theory'],
  jsonb_build_object(
    'tuesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '13:00'))),
    'thursday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '10:00', 'end', '14:00'))),
    'saturday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '13:00', 'end', '17:00')))
  ),
  'quiet',
  'understand_concepts',
  true,
  NOW() - INTERVAL '6 days'
),

-- User 13: Zara Ahmed
(
  'b4444444-4444-4444-4444-444444444444',
  'zara.fakeuser@stanford.edu',
  'Zara Ahmed',
  'Stanford',
  'Computer Science',
  'Senior',
  'Full-stack developer and open source contributor. Love teaching and mentoring newer students. Always happy to help debug code!',
  'https://i.pravatar.cc/300?img=45',
  true,
  ARRAY['Software Engineering', 'Web Development', 'Databases', 'Cloud Computing'],
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '16:00', 'end', '20:00'))),
    'wednesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '17:00', 'end', '21:00'))),
    'saturday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '12:00', 'end', '16:00')))
  ),
  'teach_each_other',
  'make_friends',
  true,
  NOW() - INTERVAL '5 days'
),

-- User 14: Ryan Taylor
(
  'b5555555-5555-5555-5555-555555555555',
  'ryan.fakeuser@stanford.edu',
  'Ryan Taylor',
  'Stanford',
  'Business',
  'Sophomore',
  'Business major interested in entrepreneurship and startups. Love case studies and real-world business problems. Let''s crack those cases!',
  'https://i.pravatar.cc/300?img=52',
  true,
  ARRAY['Marketing', 'Finance', 'Strategy', 'Accounting'],
  jsonb_build_object(
    'tuesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '11:00', 'end', '15:00'))),
    'thursday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '12:00', 'end', '16:00'))),
    'sunday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '15:00', 'end', '19:00')))
  ),
  'group_discussion',
  'ace_exams',
  true,
  NOW() - INTERVAL '4 days'
),

-- User 15: Priya Sharma
(
  'b6666666-6666-6666-6666-666666666666',
  'priya.fakeuser@stanford.edu',
  'Priya Sharma',
  'Stanford',
  'Bioengineering',
  'Junior',
  'Bioengineering student passionate about medical devices and tissue engineering. Love interdisciplinary collaboration. Let''s innovate healthcare!',
  'https://i.pravatar.cc/300?img=27',
  true,
  ARRAY['Biomechanics', 'Cell Engineering', 'Biomaterials', 'Medical Devices'],
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '14:00', 'end', '18:00'))),
    'wednesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '13:00', 'end', '17:00'))),
    'friday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '15:00', 'end', '19:00')))
  ),
  'with_music',
  'understand_concepts',
  true,
  NOW() - INTERVAL '3 days'
),

-- User 16: Alex Cooper
(
  'b7777777-7777-7777-7777-777777777777',
  'alex.fakeuser@stanford.edu',
  'Alex Cooper',
  'Stanford',
  'Statistics',
  'Senior',
  'Data science enthusiast who loves statistics and probability. Always looking for interesting datasets to analyze. Let''s explore data together!',
  'https://i.pravatar.cc/300?img=60',
  true,
  ARRAY['Probability Theory', 'Statistical Inference', 'Machine Learning', 'Data Analysis'],
  jsonb_build_object(
    'tuesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '13:00', 'end', '17:00'))),
    'thursday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '14:00', 'end', '18:00'))),
    'saturday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '10:00', 'end', '14:00')))
  ),
  'quiet',
  'ace_exams',
  true,
  NOW() - INTERVAL '2 days'
),

-- User 17: Jordan Lee
(
  'b8888888-8888-8888-8888-888888888888',
  'jordan.fakeuser@stanford.edu',
  'Jordan Lee',
  'Stanford',
  'Environmental Science',
  'Sophomore',
  'Environmental science student passionate about climate change and sustainability. Love field work and data collection. Let''s save the planet!',
  'https://i.pravatar.cc/300?img=17',
  true,
  ARRAY['Ecology', 'Climate Science', 'Environmental Policy', 'GIS'],
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '11:00', 'end', '15:00'))),
    'wednesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '10:00', 'end', '14:00'))),
    'friday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '13:00', 'end', '17:00')))
  ),
  'group_discussion',
  'understand_concepts',
  true,
  NOW() - INTERVAL '1 day'
),

-- User 18: Chloe White
(
  'b9999999-9999-9999-9999-999999999999',
  'chloe.fakeuser@stanford.edu',
  'Chloe White',
  'Stanford',
  'Art History',
  'Junior',
  'Art history major fascinated by Renaissance and modern art. Love museum visits and discussing artistic movements. Let''s analyze masterpieces!',
  'https://i.pravatar.cc/300?img=24',
  true,
  ARRAY['Renaissance Art', 'Modern Art', 'Museum Studies', 'Art Theory'],
  jsonb_build_object(
    'tuesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '15:00', 'end', '19:00'))),
    'thursday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '16:00', 'end', '20:00'))),
    'sunday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '11:00', 'end', '15:00')))
  ),
  'teach_each_other',
  'make_friends',
  true,
  NOW() - INTERVAL '12 hours'
),

-- User 19: Tyler Scott
(
  'c1111111-1111-1111-1111-111111111111',
  'tyler.fakeuser@stanford.edu',
  'Tyler Scott',
  'Stanford',
  'Political Science',
  'Senior',
  'Poli-sci major interested in international relations and policy analysis. Love debates and discussing current events. Let''s change the world!',
  'https://i.pravatar.cc/300?img=59',
  true,
  ARRAY['International Relations', 'Political Theory', 'Public Policy', 'Comparative Politics'],
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '13:00', 'end', '17:00'))),
    'wednesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '14:00', 'end', '18:00'))),
    'saturday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '13:00')))
  ),
  'group_discussion',
  'understand_concepts',
  true,
  NOW() - INTERVAL '6 hours'
),

-- User 20: Hannah Green
(
  'c2222222-2222-2222-2222-222222222222',
  'hannah.fakeuser@stanford.edu',
  'Hannah Green',
  'Stanford',
  'Computer Science',
  'Sophomore',
  'CS student interested in cybersecurity and networking. Love solving security challenges and learning about encryption. Let''s hack (ethically)!',
  'https://i.pravatar.cc/300?img=32',
  true,
  ARRAY['Computer Networks', 'Cybersecurity', 'Cryptography', 'Operating Systems'],
  jsonb_build_object(
    'tuesday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '10:00', 'end', '14:00'))),
    'thursday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '11:00', 'end', '15:00'))),
    'friday', jsonb_build_object('available', true, 'timeSlots', jsonb_build_array(jsonb_build_object('start', '14:00', 'end', '18:00')))
  ),
  'quiet',
  'ace_exams',
  true,
  NOW() - INTERVAL '3 hours'
);

-- =====================================================
-- CREATE NESTS FOR FAKE USERS
-- =====================================================

-- Create diverse nests if they don't exist
INSERT INTO nests (id, name, subject, class_name, description, university, created_by, member_limit, is_auto_created)
VALUES 
  ('c3333333-3333-3333-3333-333333333333', 'CS101 - Intro to Programming', 'Computer Science', 'Introduction to Programming', 'Beginner-friendly group for learning programming fundamentals', 'Stanford', 'a1111111-1111-1111-1111-111111111111', 8, false),
  ('c4444444-4444-4444-4444-444444444444', 'ML Study Group', 'Computer Science', 'Machine Learning', 'Advanced ML topics and projects', 'Stanford', 'a1111111-1111-1111-1111-111111111111', 6, false),
  ('c5555555-5555-5555-5555-555555555555', 'Calculus Warriors', 'Mathematics', 'Calculus I', 'Conquering calculus together!', 'Stanford', 'a3333333-3333-3333-3333-333333333333', 8, false),
  ('c6666666-6666-6666-6666-666666666666', 'Biology Lab Partners', 'Biology', 'Cell Biology', 'Lab work and exam prep', 'Stanford', 'a5555555-5555-5555-5555-555555555555', 5, false),
  ('c7777777-7777-7777-7777-777777777777', 'Physics Problem Solvers', 'Physics', 'Quantum Mechanics', 'Tackling quantum mechanics together', 'Stanford', 'a6666666-6666-6666-6666-666666666666', 6, false),
  ('c8888888-8888-8888-8888-888888888888', 'Data Science Club', 'Statistics', 'Data Analysis', 'Exploring data science and analytics', 'Stanford', 'b7777777-7777-7777-7777-777777777777', 8, false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ADD FAKE USERS TO NESTS
-- =====================================================

-- CS101 Nest Members
INSERT INTO nest_members (nest_id, user_id, role, joined_at)
VALUES 
  ('c3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'creator', NOW() - INTERVAL '5 days'),
  ('c3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'member', NOW() - INTERVAL '4 days'),
  ('c3333333-3333-3333-3333-333333333333', 'a8888888-8888-8888-8888-888888888888', 'member', NOW() - INTERVAL '3 days'),
  ('c3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'member', NOW() - INTERVAL '2 days'),
  ('c3333333-3333-3333-3333-333333333333', 'b4444444-4444-4444-4444-444444444444', 'member', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- ML Study Group Members
INSERT INTO nest_members (nest_id, user_id, role, joined_at)
VALUES 
  ('c4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'creator', NOW() - INTERVAL '6 days'),
  ('c4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'member', NOW() - INTERVAL '5 days'),
  ('c4444444-4444-4444-4444-444444444444', 'b7777777-7777-7777-7777-777777777777', 'member', NOW() - INTERVAL '4 days')
ON CONFLICT DO NOTHING;

-- Calculus Warriors Members
INSERT INTO nest_members (nest_id, user_id, role, joined_at)
VALUES 
  ('c5555555-5555-5555-5555-555555555555', 'a3333333-3333-3333-3333-333333333333', 'creator', NOW() - INTERVAL '7 days'),
  ('c5555555-5555-5555-5555-555555555555', 'b3333333-3333-3333-3333-333333333333', 'member', NOW() - INTERVAL '6 days'),
  ('c5555555-5555-5555-5555-555555555555', 'a8888888-8888-8888-8888-888888888888', 'member', NOW() - INTERVAL '5 days'),
  ('c5555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222222', 'member', NOW() - INTERVAL '4 days')
ON CONFLICT DO NOTHING;

-- Biology Lab Partners Members
INSERT INTO nest_members (nest_id, user_id, role, joined_at)
VALUES 
  ('c6666666-6666-6666-6666-666666666666', 'a5555555-5555-5555-5555-555555555555', 'creator', NOW() - INTERVAL '8 days'),
  ('c6666666-6666-6666-6666-666666666666', 'a9999999-9999-9999-9999-999999999999', 'member', NOW() - INTERVAL '7 days'),
  ('c6666666-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 'member', NOW() - INTERVAL '6 days')
ON CONFLICT DO NOTHING;

-- Physics Problem Solvers Members
INSERT INTO nest_members (nest_id, user_id, role, joined_at)
VALUES 
  ('c7777777-7777-7777-7777-777777777777', 'a6666666-6666-6666-6666-666666666666', 'creator', NOW() - INTERVAL '9 days'),
  ('c7777777-7777-7777-7777-777777777777', 'a4444444-4444-4444-4444-444444444444', 'member', NOW() - INTERVAL '8 days'),
  ('c7777777-7777-7777-7777-777777777777', 'b1111111-1111-1111-1111-111111111111', 'member', NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Data Science Club Members
INSERT INTO nest_members (nest_id, user_id, role, joined_at)
VALUES 
  ('c8888888-8888-8888-8888-888888888888', 'b7777777-7777-7777-7777-777777777777', 'creator', NOW() - INTERVAL '10 days'),
  ('c8888888-8888-8888-8888-888888888888', 'a1111111-1111-1111-1111-111111111111', 'member', NOW() - INTERVAL '9 days'),
  ('c8888888-8888-8888-8888-888888888888', 'b4444444-4444-4444-4444-444444444444', 'member', NOW() - INTERVAL '8 days'),
  ('c8888888-8888-8888-8888-888888888888', 'a2222222-2222-2222-2222-222222222222', 'member', NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFY FAKE USERS WERE CREATED
-- =====================================================

SELECT 
  '✅ Successfully created 20 fake users!' as result,
  COUNT(*) as total_users
FROM users
WHERE email LIKE '%fakeuser%';

-- Show all fake users
SELECT
  full_name,
  major,
  year,
  study_style,
  study_goals,
  has_profile_photo,
  array_length(preferred_subjects, 1) as num_subjects
FROM users
WHERE email LIKE '%fakeuser%'
ORDER BY created_at DESC;

-- Show nest memberships
SELECT 
  n.name as nest_name,
  COUNT(nm.user_id) as member_count
FROM nests n
LEFT JOIN nest_members nm ON n.id = nm.nest_id
WHERE n.id IN (
  'c3333333-3333-3333-3333-333333333333',
  'c4444444-4444-4444-4444-444444444444',
  'c5555555-5555-5555-5555-555555555555',
  'c6666666-6666-6666-6666-666666666666',
  'c7777777-7777-7777-7777-777777777777',
  'c8888888-8888-8888-8888-888888888888'
)
GROUP BY n.name
ORDER BY member_count DESC;

