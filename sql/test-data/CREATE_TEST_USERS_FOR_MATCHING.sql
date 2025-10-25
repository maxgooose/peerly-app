-- Test Data for Auto-Matching Algorithm
-- Creates 10 test users with varying compatibility scores
-- Run this in Supabase SQL Editor to test the matching algorithm

-- Clean up existing test data (optional)
-- DELETE FROM users WHERE email LIKE '%test-matching%';

-- Test User 1: Computer Science Junior who wants to ace exams
INSERT INTO users (id, email, full_name, university, major, year, bio, preferred_subjects, study_style, study_goals, onboarding_completed)
VALUES
(
  gen_random_uuid(),
  'alice.test-matching@stanford.edu',
  'Alice Chen',
  'Stanford',
  'Computer Science',
  'Junior',
  'Love algorithms and data structures!',
  ARRAY['Data Structures', 'Algorithms', 'Operating Systems'],
  'quiet',
  'ace_exams',
  true
);

-- Test User 2: CS Junior who wants to understand concepts (good match for Alice)
INSERT INTO users (id, email, full_name, university, major, year, bio, preferred_subjects, study_style, study_goals, onboarding_completed)
VALUES
(
  gen_random_uuid(),
  'bob.test-matching@stanford.edu',
  'Bob Martinez',
  'Stanford',
  'Computer Science',
  'Junior',
  'I want to really understand how things work',
  ARRAY['Data Structures', 'Algorithms', 'Machine Learning'],
  'quiet',
  'understand_concepts',
  true
);

-- Test User 3: CS Sophomore with music (compatible study style with some)
INSERT INTO users (id, email, full_name, university, major, year, bio, preferred_subjects, study_style, study_goals, onboarding_completed)
VALUES
(
  gen_random_uuid(),
  'carol.test-matching@stanford.edu',
  'Carol Davis',
  'Stanford',
  'Computer Science',
  'Sophomore',
  'I study better with lo-fi beats',
  ARRAY['Data Structures', 'Calculus II', 'Physics I'],
  'with_music',
  'ace_exams',
  true
);

-- Test User 4: Mechanical Engineering Junior (different major, some overlap)
INSERT INTO users (id, email, full_name, university, major, year, bio, preferred_subjects, study_style, study_goals, onboarding_completed)
VALUES
(
  gen_random_uuid(),
  'david.test-matching@stanford.edu',
  'David Kim',
  'Stanford',
  'Mechanical Engineering',
  'Junior',
  'Engineering is my passion',
  ARRAY['Calculus II', 'Physics II', 'Engineering Graphics'],
  'group_discussion',
  'understand_concepts',
  true
);

-- Test User 5: Math Sophomore who likes group discussion
INSERT INTO users (id, email, full_name, university, major, year, bio, preferred_subjects, study_style, study_goals, onboarding_completed)
VALUES
(
  gen_random_uuid(),
  'emily.test-matching@stanford.edu',
  'Emily Wang',
  'Stanford',
  'Mathematics',
  'Sophomore',
  'Math is beautiful when you discuss it',
  ARRAY['Calculus II', 'Linear Algebra', 'Abstract Algebra'],
  'group_discussion',
  'understand_concepts',
  true
);

-- Test User 6: CS Freshman just wants to pass
INSERT INTO users (id, email, full_name, university, major, year, bio, preferred_subjects, study_style, study_goals, onboarding_completed)
VALUES
(
  gen_random_uuid(),
  'frank.test-matching@stanford.edu',
  'Frank Lee',
  'Stanford',
  'Computer Science',
  'Freshman',
  'Just trying to survive college',
  ARRAY['Intro to Programming', 'Calculus I', 'Physics I'],
  'quiet',
  'just_pass',
  true
);

-- Test User 7: Biology Senior wants to make friends
INSERT INTO users (id, email, full_name, university, major, year, bio, preferred_subjects, study_style, study_goals, onboarding_completed)
VALUES
(
  gen_random_uuid(),
  'grace.test-matching@stanford.edu',
  'Grace Thompson',
  'Stanford',
  'Biology',
  'Senior',
  'Looking for study buddies in my last year',
  ARRAY['Biochemistry', 'Genetics', 'Cell Biology'],
  'teach_each_other',
  'make_friends',
  true
);

-- Test User 8: Biology Senior perfect match for Grace
INSERT INTO users (id, email, full_name, university, major, year, bio, preferred_subjects, study_style, study_goals, onboarding_completed)
VALUES
(
  gen_random_uuid(),
  'henry.test-matching@stanford.edu',
  'Henry Brown',
  'Stanford',
  'Biology',
  'Senior',
  'Love teaching and learning from others',
  ARRAY['Biochemistry', 'Genetics', 'Molecular Biology'],
  'teach_each_other',
  'make_friends',
  true
);

-- Test User 9: Different University (should NOT match with anyone)
INSERT INTO users (id, email, full_name, university, major, year, bio, preferred_subjects, study_style, study_goals, onboarding_completed)
VALUES
(
  gen_random_uuid(),
  'ivy.test-matching@mit.edu',
  'Ivy Johnson',
  'MIT',
  'Computer Science',
  'Junior',
  'From a different school',
  ARRAY['Data Structures', 'Algorithms'],
  'quiet',
  'ace_exams',
  true
);

-- Test User 10: Incomplete onboarding (should NOT be eligible for matching)
INSERT INTO users (id, email, full_name, university, major, year, onboarding_completed)
VALUES
(
  gen_random_uuid(),
  'jack.test-matching@stanford.edu',
  'Jack Wilson',
  'Stanford',
  'Computer Science',
  'Junior',
  false
);

-- Verify test users were created
SELECT
  full_name,
  university,
  major,
  year,
  preferred_subjects,
  study_style,
  study_goals,
  onboarding_completed
FROM users
WHERE email LIKE '%test-matching%'
ORDER BY full_name;

-- Expected Matches (based on compatibility scores):
-- 1. Alice & Bob - Both CS Juniors, same subjects, compatible goals, same study style (High score: ~85)
-- 2. Carol & Frank - Different years but overlap in subjects, both quiet, both want good grades (Medium score: ~60)
-- 3. David & Emily - Both Sophomores/Juniors, overlap in Calc II, both group discussion (Medium score: ~65)
-- 4. Grace & Henry - Perfect match! Same year, same major, overlapping subjects, same preferences (High score: ~95)
-- 5. Ivy - No match (different university)
-- 6. Jack - No match (onboarding not complete)

RAISE NOTICE 'Created 10 test users for matching algorithm testing';
RAISE NOTICE 'Expected matches:';
RAISE NOTICE '  - Alice & Bob (high compatibility)';
RAISE NOTICE '  - Grace & Henry (very high compatibility)';
RAISE NOTICE '  - David & Emily (medium compatibility)';
RAISE NOTICE '  - Carol might match with remaining users';
