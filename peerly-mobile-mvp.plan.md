# Peerly Mobile MVP - 3 Week Build Plan

## Tech Stack Decision

### Frontend: React Native + Expo
- Cross-platform (iOS + Android from one codebase)
- Fast development with Expo Go
- Smooth animations and native feel

### Backend: Supabase (All-in-One)
- PostgreSQL database
- Auth with .edu email restriction
- Real-time subscriptions for chat
- Storage for profile photos
- Row Level Security

### AI: Gemini Flash API
- Generate personalized first messages after matches
- Low-latency and inexpensive for MVP scale

### Key Libraries
- Expo Router / React Navigation
- React Native Reanimated & Gesture Handler (swipe)
- Supabase JS client
- Expo Image Picker

## Project Structure (Expo)

```
peerly-app/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── verify-email.tsx
│   ├── (tabs)/
│   │   ├── matches.tsx
│   │   ├── progress.tsx
│   │   ├── schedule.tsx
│   │   └── profile.tsx
│   ├── chat/[id].tsx
│   └── onboarding.tsx
├── components/
│   ├── SwipeCard.tsx
│   ├── ChatBubble.tsx
│   └── ScheduleModal.tsx
├── lib/
│   ├── supabase.ts
│   ├── gemini.ts
│   └── matching.ts
└── types/
    └── database.types.ts
```

## Database Schema

```sql
-- users
users (
  id uuid primary key,
  email text unique not null,              -- must end with .edu
  full_name text,
  university text,                         -- derived from email domain
  major text,
  year text,
  bio text,
  profile_photo_url text,
  preferred_subjects text[],
  availability jsonb,
  last_auto_match_cycle timestamptz,       -- last auto match run
  created_at timestamptz default now()
);

-- matches
matches (
  id uuid primary key,
  user1_id uuid references users(id),
  user2_id uuid references users(id),
  match_type text check (match_type in ('auto','manual')),
  status text check (status in ('pending','active','unmatched')),
  matched_at timestamptz default now(),
  ai_message_sent boolean default false
);

-- messages
messages (
  id uuid primary key,
  match_id uuid references matches(id),
  sender_id uuid references users(id),
  content text,
  is_ai_generated boolean default false,
  created_at timestamptz default now()
);

-- study_sessions
study_sessions (
  id uuid primary key,
  match_id uuid references matches(id),
  date date,
  time_start time,
  time_end time,
  location text,
  notes text,
  status text check (status in ('scheduled','completed','cancelled'))
);

-- swipe_actions
swipe_actions (
  id uuid primary key,
  user_id uuid references users(id),
  target_user_id uuid references users(id),
  action text check (action in ('like','skip')),
  created_at timestamptz default now()
);
```

## Matching Algorithm Logic

### Two Match Types

1. Automatic Daily Match (system-initiated)
- Runs daily via Supabase cron job
- Pairs compatible users (same university, shared subjects, overlapping availability, no prior auto-match)
- Immediately creates a match of type `auto`
- Generates and sends an AI first message from User1 → User2

2. Manual Swipe Match (user-initiated)
- Users swipe through a ranked pool
- When both users like each other, create `manual` match
- No automatic AI message (users start chat themselves)

```ts
// Daily cron entrypoint
async function performDailyAutoMatching() {
  const eligible = await getEligibleUsersForAutoMatch();
  const used = new Set<string>();
  for (const u of eligible) {
    if (used.has(u.id)) continue;
    const best = await findBestAutoMatch(u, eligible, used);
    if (!best) continue;
    used.add(u.id); used.add(best.id);
    const match = await createMatch(u.id, best.id, 'auto');
    const text = await generateFirstMessage(u, best);
    await saveMessage({ match_id: match.id, sender_id: u.id, content: text, is_ai_generated: true });
    await markAutoCycle(u.id); await markAutoCycle(best.id);
  }
}
```

## AI First Message (Gemini Flash)

Prompt skeleton:
```
Generate a friendly, concise first message for two students who matched to study.
User A: {name, major, year, subjects, bio}
User B: {name, major, year, subjects, bio}
Shared subjects: {list}
Tone: casual, positive, 2–3 sentences. Refer to a shared subject.
```

## Week-by-Week Timeline (3 Weeks)

Week 1: Foundation
- Expo project + Supabase setup; RLS; .edu auth and verification
- Onboarding (major, subjects, availability, photo)
- Swipe UI and rule-based ranking

Week 2: Core Features
- Manual matching flow (mutual like → match)
- Real-time chat (Supabase Realtime)
- Gemini integration; edge function for AI first message
- Daily auto-matching cron job

Week 3: Polish & Launch
- Schedule sessions (date/time + list UI)
- Progress tab + profile editing
- Testing on devices; performance fixes
- TestFlight / Play Internal testing

## Team Collaboration Setup

GitHub repo `peerly-` with branch protection on `main`. Use feature branches and pull requests. Store secrets locally in `.env.local` and in GitHub Secrets for CI.

## Critical Success Factors
- Smooth .edu verification and onboarding completion
- Useful matches (shared subjects + availability overlap)
- Natural AI first messages
- Reliable, instant chat

## Post-MVP (after Nov 15)
- Push notifications (matches/messages)
- Study reminders
- Group study sessions
- AI match scoring upgrade
- Referrals and growth loops
