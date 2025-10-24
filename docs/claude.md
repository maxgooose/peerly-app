# Claude Context: Peerly App

## Project Overview
Peerly is a mobile app that connects university students for study partnerships through intelligent matching and real-time chat. The app provides both automatic daily matches and manual swipe-based matching, with AI-generated conversation starters.

**Target Launch**: 3-week MVP timeline
**Current Status**: Initial setup phase - Supabase connected, database schema applied, authentication working

## Tech Stack

### Frontend
- **Framework**: React Native + Expo (~50.0.0)
- **Navigation**: Expo Router (~3.4.0) with React Navigation
- **Animations**: React Native Reanimated, Gesture Handler (for swipe functionality)
- **Language**: TypeScript
- **Key Dependencies**:
  - `react-native-deck-swiper` for swipe interface
  - `expo-image-picker` for profile photos
  - `@supabase/supabase-js` for backend integration

### Backend
- **Platform**: Supabase (all-in-one solution)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Email-based with .edu restriction
- **Real-time**: Supabase Realtime for chat
- **Storage**: Profile photo storage
- **Cron**: Daily auto-matching jobs

### AI
- **Provider**: Gemini Flash API
- **Purpose**: Generate personalized first messages after automatic matches
- **Features**: Low-latency, context-aware message generation

## Project Structure

```
peerly-app/
├── app/                          # Expo Router app directory
│   ├── (auth)/                   # Authentication screens (login, signup, verify-email)
│   ├── (tabs)/                   # Main app tabs (matches, progress, schedule, profile)
│   ├── chat/[id].tsx            # Dynamic chat screen
│   ├── index.tsx                # Entry point
│   └── _layout.tsx              # Root layout
├── src/
│   ├── components/              # Reusable components (SwipeCard, ChatBubble, etc.)
│   ├── services/                # API and business logic
│   ├── constants/               # App constants
│   └── utils/                   # Helper functions
├── supabase/                    # Supabase configuration and migrations
├── assets/                      # Images, fonts, etc.
├── docs/                        # Project documentation
│   ├── peerly-mobile-mvp.plan.md    # MVP development plan
│   └── TEAM_QUICK_START.md          # Team setup guide
├── App.tsx                      # App entry
├── package.json
├── tsconfig.json
└── .env.example                 # Environment variables template
```

## Database Schema

### Tables

**users**
- `id` (uuid, PK)
- `email` (text, unique) - Must end with .edu
- `full_name`, `university`, `major`, `year`, `bio`
- `profile_photo_url` (text)
- `preferred_subjects` (text[])
- `availability` (jsonb)
- `last_auto_match_cycle` (timestamptz)
- `created_at` (timestamptz)

**matches**
- `id` (uuid, PK)
- `user1_id`, `user2_id` (uuid, FK to users)
- `match_type` ('auto' | 'manual')
- `status` ('pending' | 'active' | 'unmatched')
- `matched_at` (timestamptz)
- `ai_message_sent` (boolean)

**messages**
- `id` (uuid, PK)
- `match_id` (uuid, FK to matches)
- `sender_id` (uuid, FK to users)
- `content` (text)
- `is_ai_generated` (boolean)
- `created_at` (timestamptz)

**study_sessions**
- `id` (uuid, PK)
- `match_id` (uuid, FK to matches)
- `date`, `time_start`, `time_end`, `location`, `notes`
- `status` ('scheduled' | 'completed' | 'cancelled')

**swipe_actions**
- `id` (uuid, PK)
- `user_id`, `target_user_id` (uuid, FK to users)
- `action` ('like' | 'skip')
- `created_at` (timestamptz)

## Core Features

### 1. Authentication & Onboarding
- .edu email verification required
- Onboarding flow: collect major, preferred subjects, availability, profile photo
- University derived from email domain

### 2. Matching System (Two Types)

**Automatic Daily Match**
- System-initiated via Supabase cron job
- Pairs compatible users based on:
  - Same university
  - Shared subjects
  - Overlapping availability
  - No prior auto-match
- Creates `auto` type match
- Generates AI first message from User1 to User2

**Manual Swipe Match**
- User-initiated through swipe interface
- Ranked pool of potential matches
- Mutual like creates `manual` match
- No automatic AI message (users start chat themselves)

### 3. Real-time Chat
- Powered by Supabase Realtime
- Message history persistence
- AI-generated first messages for auto matches
- Support for user-initiated conversations

### 4. Study Sessions
- Schedule study sessions with matched partners
- Date, time, location, and notes
- Status tracking (scheduled, completed, cancelled)

### 5. Profile & Progress
- Profile editing
- View match history
- Track study session progress

## AI Integration

### Gemini Flash API
**Purpose**: Generate friendly, concise first messages for auto matches

**Prompt Structure**:
```
Generate a friendly, concise first message for two students who matched to study.
User A: {name, major, year, subjects, bio}
User B: {name, major, year, subjects, bio}
Shared subjects: {list}
Tone: casual, positive, 2-3 sentences. Refer to a shared subject.
```

**Implementation**: Edge function triggered when auto-match is created

## Development Timeline (3 Weeks)

### Week 1: Foundation
- ✅ Expo project + Supabase setup
- ✅ RLS configuration
- ✅ .edu auth and verification
- 🚧 Onboarding flow (major, subjects, availability, photo)
- 🚧 Swipe UI and ranking

### Week 2: Core Features
- Manual matching flow (mutual like → match)
- Real-time chat (Supabase Realtime)
- Gemini integration
- Edge function for AI first message
- Daily auto-matching cron job

### Week 3: Polish & Launch
- Schedule sessions UI
- Progress tab + profile editing
- Device testing and performance optimization
- TestFlight / Play Internal testing

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Environment setup
cp .env.example .env.local
# Then fill in Supabase credentials
```

## Environment Variables

Required in `.env.local`:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `GEMINI_API_KEY` - Gemini Flash API key (for edge functions)

## Important Files & Their Purposes

- `app/_layout.tsx` - Root layout with navigation setup
- `app/index.tsx` - Entry point and initial routing
- `app/(auth)/*` - Authentication flows
- `app/(tabs)/*` - Main app screens
- `app/chat/[id].tsx` - Individual chat screen with real-time updates
- `src/services/*` - Business logic and API calls
- `supabase/*` - Database migrations and edge functions

## Critical Success Factors

1. **Smooth .edu verification** - Essential for trust and university restriction
2. **Quality matches** - Shared subjects + availability overlap
3. **Natural AI messages** - Conversation starters that feel genuine
4. **Reliable chat** - Instant message delivery via Realtime

## Post-MVP Features (After Nov 15)

- Push notifications (matches/messages)
- Study reminders
- Group study sessions
- Enhanced AI match scoring
- Referrals and growth loops

## Development Best Practices

1. **Branch Strategy**: Feature branches with PRs to main
2. **Code Style**: TypeScript strict mode, consistent formatting
3. **Security**: Never commit `.env.local`, use RLS for all tables
4. **Testing**: Test on both iOS and Android before merging
5. **Performance**: Monitor bundle size, optimize images, lazy load when possible

## Troubleshooting

### Common Issues
- **Expo Go crashes**: Check package compatibility with Expo SDK ~50.0.0
- **Supabase auth errors**: Verify .env.local has correct keys
- **Real-time not working**: Check RLS policies and subscription setup
- **Swipe UI laggy**: Use `react-native-reanimated` for animations

### Useful Resources
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/quickstarts/react-native)
- [Gemini API Reference](https://ai.google.dev/docs)

## Notes for Claude

- This is an MVP in active development - prioritize functionality over perfection
- The matching algorithm is critical - ensure it balances compatibility with speed
- AI messages should feel natural and context-aware, not templated
- Always test authentication flows thoroughly (.edu validation is crucial)
- Consider offline states and loading states in all UI components
- Follow Expo and React Native best practices for performance
- Use TypeScript strictly - type safety prevents bugs in matching/chat logic
