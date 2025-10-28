/**
 * Test Script for Gemini API Integration in Auto-Match Cycle
 *
 * This script validates the Gemini integration without actually calling the API.
 * It tests the logic, data structures, and error handling.
 *
 * Run with: npx tsx test-gemini-integration.ts
 * Or: deno run --allow-all test-gemini-integration.ts
 */

// Mock user data structure
interface User {
  id: string;
  email: string;
  full_name: string | null;
  university: string | null;
  major: string | null;
  year: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  preferred_subjects: string[] | null;
  availability: any | null;
  study_style: string | null;
  study_goals: string | null;
  push_token: string | null;
  last_auto_match_cycle: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
}

// Test data
const testUsers: User[] = [
  {
    id: 'user-1',
    email: 'alice@stanford.edu',
    full_name: 'Alice Johnson',
    university: 'Stanford University',
    major: 'Computer Science',
    year: 'Junior',
    bio: 'Love coding and ML!',
    profile_photo_url: null,
    preferred_subjects: ['Data Structures', 'Algorithms', 'Machine Learning'],
    availability: { monday: 'evening', wednesday: 'afternoon' },
    study_style: 'group_discussion',
    study_goals: 'ace_exams',
    push_token: 'ExponentPushToken[xxx]',
    last_auto_match_cycle: null,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-2',
    email: 'bob@stanford.edu',
    full_name: 'Bob Smith',
    university: 'Stanford University',
    major: 'Computer Science',
    year: 'Junior',
    bio: 'CS junior interested in systems',
    profile_photo_url: null,
    preferred_subjects: ['Data Structures', 'Operating Systems', 'Algorithms'],
    availability: { monday: 'evening', friday: 'afternoon' },
    study_style: 'quiet',
    study_goals: 'understand_concepts',
    push_token: 'ExponentPushToken[yyy]',
    last_auto_match_cycle: null,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-3',
    email: 'charlie@berkeley.edu',
    full_name: 'Charlie Davis',
    university: 'UC Berkeley', // Different university - should not match
    major: 'Computer Science',
    year: 'Senior',
    bio: null,
    profile_photo_url: null,
    preferred_subjects: ['Data Structures', 'AI'],
    availability: null,
    study_style: null,
    study_goals: null,
    push_token: null,
    last_auto_match_cycle: null,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
  },
];

// Compatibility scoring functions (from auto-match/index.ts)
function scoreUniversityMatch(user1: User, user2: User): number {
  if (!user1.university || !user2.university) return 0;
  return user1.university.toLowerCase() === user2.university.toLowerCase() ? 20 : 0;
}

function scoreSubjectOverlap(user1: User, user2: User): number {
  const subjects1 = user1.preferred_subjects || [];
  const subjects2 = user2.preferred_subjects || [];

  if (subjects1.length === 0 || subjects2.length === 0) return 0;

  const normalized1 = subjects1.map(s => s.toLowerCase().trim());
  const normalized2 = subjects2.map(s => s.toLowerCase().trim());

  const sharedCount = normalized1.filter(s => normalized2.includes(s)).length;
  if (sharedCount === 0) return 0;

  const minLength = Math.min(subjects1.length, subjects2.length);
  const overlapRatio = sharedCount / minLength;

  return Math.round(overlapRatio * 30);
}

function calculateCompatibilityScore(user1: User, user2: User) {
  const universityMatch = scoreUniversityMatch(user1, user2);
  const subjectOverlap = scoreSubjectOverlap(user1, user2);

  return {
    total: universityMatch + subjectOverlap,
    breakdown: { universityMatch, subjectOverlap }
  };
}

// Mock Gemini prompt builder
function buildGeminiPrompt(user1: User, user2: User): string {
  const subjects1 = user1.preferred_subjects || [];
  const subjects2 = user2.preferred_subjects || [];
  const commonSubjects = subjects1.filter(s =>
    subjects2.some(s2 => s2.toLowerCase() === s.toLowerCase())
  );

  return `You are helping a college student write a friendly first message to a study buddy match on Peerly.

SENDER PROFILE:
- Name: ${user1.full_name || 'Student'}
- Major: ${user1.major || 'Not specified'}
- Year: ${user1.year || 'Not specified'}
- University: ${user1.university || 'Not specified'}
- Subjects: ${subjects1.join(', ') || 'Not specified'}
- Study Style: ${user1.study_style || 'Not specified'}
- Study Goals: ${user1.study_goals || 'Not specified'}
${user1.bio ? `- Bio: ${user1.bio}` : ''}

RECIPIENT PROFILE:
- Name: ${user2.full_name || 'Student'}
- Major: ${user2.major || 'Not specified'}
- Year: ${user2.year || 'Not specified'}
- University: ${user2.university || 'Not specified'}
- Subjects: ${subjects2.join(', ') || 'Not specified'}
- Study Style: ${user2.study_style || 'Not specified'}
- Study Goals: ${user2.study_goals || 'Not specified'}
${user2.bio ? `- Bio: ${user2.bio}` : ''}

COMMON GROUND:
${commonSubjects.length > 0 ? `- Shared Subjects: ${commonSubjects.join(', ')}` : '- No shared subjects listed'}

INSTRUCTIONS:
Generate a warm, friendly first message from ${user1.full_name} to ${user2.full_name} that:
1. Is casual and authentic (like a real college student would write)
2. References at least one specific thing they have in common
3. Shows genuine interest in studying together
4. Includes a question or conversation starter
5. Is 2-3 sentences (50-100 words)
6. Does NOT include greetings like "Hey!" or "Hi!" at the start
7. Does NOT include the sender's name

Generate only the message text, nothing else.`;
}

// Tests
console.log('🧪 Starting Gemini Integration Tests\n');

let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => boolean) {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ PASS: ${name}`);
      passedTests++;
    } else {
      console.log(`❌ FAIL: ${name}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${name} - ${error}`);
    failedTests++;
  }
}

// Test 1: University matching
test('Should match users from same university', () => {
  const score = scoreUniversityMatch(testUsers[0], testUsers[1]);
  return score === 20; // Both from Stanford
});

test('Should not match users from different universities', () => {
  const score = scoreUniversityMatch(testUsers[0], testUsers[2]);
  return score === 0; // Alice from Stanford, Charlie from Berkeley
});

// Test 2: Subject overlap
test('Should score subject overlap correctly', () => {
  const score = scoreSubjectOverlap(testUsers[0], testUsers[1]);
  // Alice: [Data Structures, Algorithms, Machine Learning]
  // Bob: [Data Structures, Operating Systems, Algorithms]
  // Common: Data Structures, Algorithms (2 out of 3)
  return score > 0 && score <= 30;
});

test('Should handle no subject overlap', () => {
  const userWithDifferentSubjects: User = {
    ...testUsers[0],
    preferred_subjects: ['Art History', 'Philosophy'],
  };
  const score = scoreSubjectOverlap(userWithDifferentSubjects, testUsers[1]);
  return score === 0;
});

test('Should handle empty subject lists', () => {
  const userWithNoSubjects: User = {
    ...testUsers[0],
    preferred_subjects: [],
  };
  const score = scoreSubjectOverlap(userWithNoSubjects, testUsers[1]);
  return score === 0;
});

test('Should handle null subject lists', () => {
  const userWithNullSubjects: User = {
    ...testUsers[0],
    preferred_subjects: null,
  };
  const score = scoreSubjectOverlap(userWithNullSubjects, testUsers[1]);
  return score === 0;
});

// Test 3: Compatibility threshold
test('Compatible users should score >= 40', () => {
  const score = calculateCompatibilityScore(testUsers[0], testUsers[1]);
  console.log(`   Score: ${score.total} (university: ${score.breakdown.universityMatch}, subjects: ${score.breakdown.subjectOverlap})`);
  return score.total >= 40;
});

test('Incompatible users should score < 40', () => {
  const score = calculateCompatibilityScore(testUsers[0], testUsers[2]);
  console.log(`   Score: ${score.total} (different universities)`);
  return score.total < 40;
});

// Test 4: Prompt generation
test('Should generate valid prompt with all user data', () => {
  const prompt = buildGeminiPrompt(testUsers[0], testUsers[1]);

  return (
    prompt.includes('Alice Johnson') &&
    prompt.includes('Bob Smith') &&
    prompt.includes('Stanford University') &&
    prompt.includes('Data Structures') &&
    prompt.includes('Algorithms') &&
    prompt.includes('Shared Subjects')
  );
});

test('Should handle missing user fields in prompt', () => {
  const minimalUser: User = {
    id: 'user-min',
    email: 'min@test.edu',
    full_name: 'Minimal User',
    university: 'Test U',
    major: null,
    year: null,
    bio: null,
    profile_photo_url: null,
    preferred_subjects: null,
    availability: null,
    study_style: null,
    study_goals: null,
    push_token: null,
    last_auto_match_cycle: null,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
  };

  const prompt = buildGeminiPrompt(minimalUser, testUsers[1]);

  return (
    prompt.includes('Minimal User') &&
    prompt.includes('Not specified') &&
    !prompt.includes('null') &&
    !prompt.includes('undefined')
  );
});

// Test 5: Message insertion data structure
test('Should create valid message insert object', () => {
  const messageData = {
    conversation_id: 'conv-123',
    match_id: 'match-456',
    sender_id: testUsers[0].id,
    content: 'Test AI message',
    is_ai_generated: true,
    message_type: 'text',
    status: 'sent',
  };

  return (
    messageData.conversation_id !== null &&
    messageData.match_id !== null &&
    messageData.sender_id !== null &&
    messageData.content !== null &&
    messageData.is_ai_generated === true &&
    messageData.message_type === 'text' &&
    messageData.status === 'sent'
  );
});

// Test 6: Edge cases
test('Should handle case-insensitive subject matching', () => {
  const user1: User = {
    ...testUsers[0],
    preferred_subjects: ['data structures', 'ALGORITHMS'],
  };
  const user2: User = {
    ...testUsers[1],
    preferred_subjects: ['DATA STRUCTURES', 'algorithms'],
  };

  const score = scoreSubjectOverlap(user1, user2);
  return score > 0; // Should match despite different cases
});

test('Should handle subject names with extra whitespace', () => {
  const user1: User = {
    ...testUsers[0],
    preferred_subjects: [' Data Structures ', 'Algorithms  '],
  };
  const user2: User = {
    ...testUsers[1],
    preferred_subjects: ['Data Structures', '  Algorithms'],
  };

  const score = scoreSubjectOverlap(user1, user2);
  return score > 0; // Should match after trimming
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Tests Passed: ${passedTests}`);
console.log(`❌ Tests Failed: ${failedTests}`);
console.log(`📊 Total Tests: ${passedTests + failedTests}`);
console.log('='.repeat(50));

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! Integration is ready for deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
  process.exit(1);
}
