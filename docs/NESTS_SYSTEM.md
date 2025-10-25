# Nests (Study Groups) System Documentation

## Overview

The Nests system adds Discord-style study groups to Peerly, allowing students to create and join small study groups (3-8 people) for specific subjects. This feature is completely separate from 1-on-1 matches and focuses on group collaboration.

## Features Implemented

### ✅ Core Features
- **Create Nests**: Users can create study groups with name, subject, class, and member limit
- **Join/Leave Nests**: Users can discover and join existing nests, or leave nests they're members of
- **Group Chat**: Real-time messaging within nests with sender display
- **Member Management**: View member list, creator can delete nests
- **Search & Discovery**: Browse nests by subject, search by name/class
- **Segmented Chat View**: Direct messages and Nests in separate tabs

### ✅ Technical Features
- **Database Schema**: Complete with RLS policies and triggers
- **Real-time Updates**: Supabase Realtime for instant message delivery
- **Message Pagination**: Load older messages in batches of 50
- **Push Notifications**: Notify all members when new messages arrive
- **TypeScript Types**: Full type safety for all nest operations
- **Security**: University validation, member limits, proper permissions

## Database Schema

### Tables Created

**`nests`** - Core group information
- `id`, `name`, `subject`, `class_name`, `description`
- `university`, `created_by`, `member_limit`, `is_auto_created`
- `created_at`, `updated_at`

**`nest_members`** - Group membership
- `id`, `nest_id`, `user_id`, `role` ('creator' | 'member')
- `joined_at`, UNIQUE constraint on (nest_id, user_id)

**`nest_messages`** - Group chat messages
- `id`, `nest_id`, `sender_id`, `content`
- `created_at`, `updated_at`, `deleted_at`

### Security Features
- Row Level Security (RLS) enabled on all tables
- Users can only access nests they're members of
- University validation (users can only join nests at their university)
- Member limit enforcement with database triggers
- Only nest creators can delete nests

## API Services

### `src/services/nests.ts`

**Core Functions:**
- `createNest(params)` - Create new nest with validation
- `getNestsForUser()` - Get all nests user is member of
- `getNestById(nestId)` - Get single nest with members
- `joinNest(nestId)` - Join existing nest (checks member limit)
- `leaveNest(nestId)` - Leave a nest
- `deleteNest(nestId)` - Delete nest (creator only)

**Messaging Functions:**
- `getNestMessages(nestId, options)` - Get messages with pagination
- `sendNestMessage(params)` - Send message to nest
- `searchNests(params)` - Search nests by filters
- `getSuggestedNests()` - Get nests based on user's subjects

## UI Components

### Screens

**`app/(tabs)/chats.tsx`** - Updated with segmented control
- "Direct" tab: Shows 1-on-1 conversations
- "Nests" tab: Shows user's nests
- Pull-to-refresh for both sections

**`app/nest/[id].tsx`** - Nest chat screen
- Real-time message updates
- Message pagination (load older messages)
- Member count in header
- Tap header to view members

**`app/nest/create.tsx`** - Create nest form
- Nest name, subject, class name, description
- Member limit slider (3-8)
- Subject dropdown with user's preferred subjects

**`app/nest/discover.tsx`** - Browse/search nests
- Suggested nests based on user's subjects
- Search by name/class
- Filter by subject
- Join button (disabled if full/already member)

### Components

**`NestCard`** - Nest list item
- Subject emoji, nest name, member count
- Subject tag, last message preview
- Tap to open nest chat

**`NestMemberItem`** - Member list item
- Avatar, name, role badge
- Join date

**`NestMembersModal`** - Member management
- List all members with roles
- "Leave Nest" button (members)
- "Delete Nest" button (creator only)

**`MessageBubble`** - Updated for group messages
- `showSender` prop for group chat
- Sender name and avatar display
- Different styling for group messages

## Real-time Features

### Supabase Realtime Integration
- Subscribe to `nest_messages` table changes
- Real-time message delivery to all members
- Auto-scroll to new messages
- Connection management and cleanup

### Message Pagination
- Load 50 messages initially
- Infinite scroll to load older messages
- Cursor-based pagination using timestamps
- Deduplication to prevent duplicate messages

## Notifications

### Push Notifications
- Notify all nest members when new message arrives
- Format: "[Nest Name]: [Sender] sent a message"
- Tap notification navigates to nest chat
- Excludes sender from notifications

### Notification Handling
- Updated `app/_layout.tsx` to handle nest message notifications
- Deep linking to `/nest/[id]` when notification tapped

## Testing

### Test Data
**`sql/test-data/CREATE_TEST_NESTS.sql`**
- Creates 5 sample nests (3 manual, 2 auto-created)
- Adds realistic member counts and roles
- Creates 10+ messages per nest with realistic content
- Updates nest timestamps to reflect activity

### Test Scenarios
1. ✅ Create new nest manually
2. ✅ Join existing nest
3. ✅ Send messages in nest (real-time updates)
4. ✅ Message pagination with 50+ messages
5. ✅ Leave nest
6. ✅ Delete nest (creator only)
7. ✅ Search/filter nests
8. ✅ Push notifications for nest messages

## Security Considerations

### Implemented Security Features
- **University Validation**: Users can only create/join nests at their university
- **Member Limit Enforcement**: Database triggers prevent exceeding member limits
- **RLS Policies**: Comprehensive row-level security on all tables
- **Creator Permissions**: Only nest creators can delete nests
- **Content Limits**: Message length limits (1000 characters)
- **Access Control**: Users can only access nests they're members of

## File Structure

### New Files Created (11 files)
1. `supabase/migrations/20241025000001_create_nests_system.sql`
2. `src/services/nests.ts`
3. `src/types/chat.ts` (updated with Nest types)
4. `app/nest/[id].tsx`
5. `app/nest/create.tsx`
6. `app/nest/discover.tsx`
7. `src/components/nest/NestCard.tsx`
8. `src/components/nest/NestMemberItem.tsx`
9. `src/components/nest/NestMembersModal.tsx`
10. `sql/test-data/CREATE_TEST_NESTS.sql`
11. `docs/NESTS_SYSTEM.md` (this file)

### Modified Files (4 files)
1. `app/(tabs)/chats.tsx` - Added segmented control for Direct/Nests
2. `src/components/chat/MessageBubble.tsx` - Added showSender prop
3. `src/services/notifications.ts` - Added nest message notifications
4. `app/_layout.tsx` - Added nest routes and notification handling

## Usage Instructions

### For Users

**Creating a Nest:**
1. Go to Chats tab → Nests segment
2. Tap "+" button or "Create Nest" from empty state
3. Fill in nest details (name, subject, class, description)
4. Set member limit (3-8 people)
5. Tap "Create Nest"

**Joining a Nest:**
1. Go to Chats tab → Nests segment
2. Tap "Discover" to browse available nests
3. Use search/filters to find relevant nests
4. Tap nest card to join
5. Nest appears in your Nests list

**Using Nest Chat:**
1. Tap nest from Nests list
2. Send messages (real-time delivery)
3. Tap header to view members
4. Scroll up to load older messages
5. Leave nest via members modal

### For Developers

**Database Setup:**
1. Run migration: `supabase/migrations/20241025000001_create_nests_system.sql`
2. Run test data: `sql/test-data/CREATE_TEST_NESTS.sql`

**Testing:**
1. Create test users with different subjects
2. Create nests manually or use test data
3. Test real-time messaging between users
4. Verify pagination with large message counts
5. Test push notifications on physical devices

## Future Enhancements

### Potential Improvements
- **File Sharing**: Upload documents/images to nests
- **Study Sessions**: Schedule group study sessions
- **Nest Analytics**: Track engagement and activity
- **Nest Categories**: Organize by difficulty level or topic
- **Moderation Tools**: Report inappropriate content
- **Nest Templates**: Pre-made nest structures for common subjects

### Performance Optimizations
- **Message Caching**: Cache recent messages locally
- **Image Optimization**: Compress uploaded images
- **Offline Support**: Queue messages when offline
- **Background Sync**: Sync messages in background

## Troubleshooting

### Common Issues

**"Access Denied" when joining nest:**
- Check if user is at same university as nest
- Verify nest hasn't reached member limit
- Ensure user isn't already a member

**Messages not appearing in real-time:**
- Check Supabase Realtime is enabled
- Verify user is member of nest
- Check network connection

**Push notifications not working:**
- Ensure device has notification permissions
- Check Expo push token is saved in database
- Verify notification handler is configured

**Pagination not loading older messages:**
- Check if there are older messages in database
- Verify pagination logic in `getNestMessages`
- Check for JavaScript errors in console

## Success Metrics

### Implementation Complete ✅
- ✅ Users can create nests with name, subject, and member limit
- ✅ Users can discover and join existing nests (up to limit)
- ✅ Group chat works with real-time messages
- ✅ Message pagination works (50 messages at a time)
- ✅ Members can view member list and leave nest
- ✅ Creator can delete nest
- ✅ Push notifications for new nest messages
- ✅ Search/filter nests by subject
- ✅ All features work with proper security (RLS)

The Nests system is now fully implemented and ready for production use!
