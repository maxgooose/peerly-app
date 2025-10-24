# Chat System - Structured Build Phases

## Overview Philosophy

**Build → Test → Verify → Move Forward**

Each phase builds on the previous one. We complete and verify each phase before starting the next. This prevents overwhelming complexity and ensures a solid foundation.

---

## Phase 1: Database Foundation (Day 1)

### Goal
Create and test the core database schema without any UI. Get the data layer working perfectly first.

### Tasks

#### 1.1 Create Core Tables in Supabase
Use Supabase SQL Editor to create:
- `conversations` table
- `messages` table

**Why just these two first?**
- These are the absolute minimum needed for chat
- We can test the relationship and queries
- Keep it simple to start

#### 1.2 Set Up Basic RLS Policies
- Enable RLS on both tables
- Create policies for users to view their own conversations
- Create policies for users to send/view messages in their conversations

#### 1.3 Create Database Function
- `update_conversation_last_message()` trigger
- This keeps conversations sorted by recent activity

#### 1.4 Add Indexes
- Conversations: `updated_at DESC`
- Messages: `conversation_id`, `created_at DESC`

#### 1.5 Verification Steps
Using Supabase SQL Editor:
1. Insert a test conversation linked to your existing match
2. Insert test messages
3. Verify the trigger updates the conversation's `last_message_*` fields
4. Test RLS by trying to access another user's conversation (should fail)
5. Query messages with pagination (LIMIT + ORDER BY)

**Phase 1 Complete When:**
- Tables created successfully
- RLS blocks unauthorized access
- Trigger updates conversation on new message
- Sample queries return correct data

---

## Phase 2: Basic Message Display (Day 2)

### Goal
Display existing messages in a conversation. No sending yet, just reading. Prove we can fetch and display data.

### Tasks

#### 2.1 Create Supabase Service File
- Set up Supabase client connection
- Verify environment variables are correct

#### 2.2 Create Message Data Service
Functions to:
- `getConversations()` - fetch user's conversation list
- `getMessages(conversationId)` - fetch messages for a conversation

**No real-time yet!** Just basic fetching.

#### 2.3 Build Basic UI Components (Read-Only)
- Chat List Screen: Display conversations from database
- Chat Detail Screen: Display messages from database
- Message Bubble: Show text only (no images, no status, just text)

#### 2.4 Test Data Flow
1. Use Supabase SQL Editor to insert test conversations
2. Use SQL to insert test messages
3. Open app and verify they display correctly
4. Verify correct user messages appear on right, others on left

**Phase 2 Complete When:**
- App successfully fetches conversations from Supabase
- App displays messages in correct order
- No errors in console
- Can navigate between chat list and chat detail

---

## Phase 3: Send Basic Messages (Day 3)

### Goal
Add the ability to send text messages. Messages should appear in the database and in the UI.

### Tasks

#### 3.1 Create Send Message Function
- `sendMessage(conversationId, senderId, content)`
- Insert into database
- Return the created message

#### 3.2 Build Chat Input Component
- Text input field
- Send button
- Clear input after send

#### 3.3 Implement Optimistic Updates
- Show message immediately in UI with "sending" status
- Update to "sent" when database confirms
- Handle errors (mark as "failed")

#### 3.4 Test the Full Loop
1. Type message in input
2. Press send
3. Message appears in UI immediately
4. Verify message appears in Supabase database
5. Verify conversation's `last_message_*` updated

**Phase 3 Complete When:**
- Can send messages successfully
- Messages appear in UI immediately
- Messages persist in database
- Conversation list updates with latest message
- Error handling works (try sending with no internet)

---

## Phase 4: Real-Time Message Updates (Day 4)

### Goal
When User A sends a message, User B sees it instantly without refreshing.

### Tasks

#### 4.1 Set Up Supabase Realtime
Using Supabase Dashboard:
- Enable Realtime for `messages` table
- Verify Realtime is enabled in project settings

#### 4.2 Create Realtime Service
- Subscribe to `messages` table changes for a conversation
- Listen for INSERT events
- Add new messages to UI when received

#### 4.3 Handle Realtime Updates
- When new message arrives, add to message list
- Don't duplicate if it's your own message
- Scroll to bottom when new message arrives

#### 4.4 Test Real-Time
1. Open app on two devices (or web + mobile)
2. Log in as different users in same conversation
3. Send message from Device A
4. Verify it appears on Device B within 1 second
5. Test back-and-forth conversation

**Phase 4 Complete When:**
- Messages appear instantly on both sides
- No duplicate messages
- Works consistently across multiple tests
- Connection reconnects if lost

---

## Phase 5: Message Pagination (Day 5)

### Goal
Load older messages as user scrolls up. Don't load all messages at once.

### Tasks

#### 5.1 Update getMessages Function
- Add pagination parameters (limit, before cursor)
- Use cursor-based pagination with `created_at`

#### 5.2 Implement Infinite Scroll
- Detect when user scrolls to top
- Load 50 more messages
- Prepend to existing message list
- Show loading indicator

#### 5.3 State Management
- Track if there are more messages to load
- Prevent duplicate requests while loading
- Cache loaded messages

#### 5.4 Test Pagination
1. Create conversation with 200+ test messages (use SQL)
2. Open conversation
3. Verify only ~50 messages load initially
4. Scroll to top
5. Verify more messages load
6. Continue until no more messages

**Phase 5 Complete When:**
- Initial load shows only recent messages
- Scrolling up loads older messages
- No duplicate messages
- Performance is smooth
- Works with 500+ message conversations

---

## Phase 6: Read Receipts & Delivery Status (Day 6)

### Goal
Show when messages are delivered and read.

### Tasks

#### 6.1 Add Read Receipts Table
- Create `message_read_receipts` table in Supabase
- Set up RLS policies

#### 6.2 Mark Messages as Delivered
- When user opens a conversation, mark all messages as delivered
- Update message status to "delivered"

#### 6.3 Mark Messages as Read
- When messages are visible on screen, mark as read
- Insert read receipts for each message

#### 6.4 Update UI with Status Icons
- Show ✓ for sent
- Show ✓✓ for delivered
- Show different color or "Read" for read receipts

#### 6.5 Subscribe to Read Receipt Updates
- Use Realtime to listen for read receipts
- Update message status when other user reads

#### 6.6 Test Status Flow
1. User A sends message (should show ✓)
2. User B opens conversation (A sees ✓✓)
3. User B's screen shows the message (A sees "Read")
4. Test with multiple messages

**Phase 6 Complete When:**
- All status states work correctly
- Real-time updates reflect status changes
- Works for both participants
- Status persists across app restarts

---

## Phase 7: Online/Offline Presence (Day 7)

### Goal
Show if the other user is online, offline, or when they were last seen.

### Tasks

#### 7.1 Create Presence Table
- Add `user_presence` table in Supabase
- Set up RLS policies

#### 7.2 Create Presence Service
- Start tracking when user opens app (status: "online")
- Send heartbeat every 30 seconds
- Mark offline when app closes
- Mark "away" when app goes to background

#### 7.3 Display Presence in UI
- Show "Online" or "Offline" in chat header
- Show "Last seen X minutes ago" for offline users
- Use green dot for online status

#### 7.4 Subscribe to Presence Changes
- Use Realtime to listen for presence updates
- Update UI when other user's status changes

#### 7.5 Test Presence
1. User A opens app → status becomes "online"
2. User B sees User A as "online"
3. User A closes app → status becomes "offline"
4. User B sees "Last seen just now"
5. Test heartbeat by waiting 1 minute

**Phase 7 Complete When:**
- Online/offline status is accurate
- Last seen timestamp is correct
- Heartbeat prevents false "offline" status
- Works when app is backgrounded

---

## Phase 8: Typing Indicators (Day 8)

### Goal
Show "User is typing..." when someone is typing a message.

### Tasks

#### 8.1 Create Typing Indicators Table
- Add `typing_indicators` table in Supabase
- Set up RLS policies

#### 8.2 Create Typing Service
- Detect when user types in input
- Set typing status to `true`
- Auto-reset to `false` after 3 seconds of no typing
- Reset to `false` when message is sent

#### 8.3 Display Typing Indicator
- Show "User is typing..." below message list
- Animate dots (optional)
- Hide when typing stops

#### 8.4 Subscribe to Typing Updates
- Use Realtime to listen for typing status changes
- Update UI when other user types

#### 8.5 Test Typing
1. User A starts typing
2. User B sees "User A is typing..."
3. User A stops typing for 3 seconds
4. Indicator disappears
5. User A sends message
6. Indicator disappears immediately

**Phase 8 Complete When:**
- Typing indicator appears when typing starts
- Disappears after 3 seconds of inactivity
- Disappears immediately when message sent
- Works smoothly without lag

---

## Phase 9: Image Sharing (Day 9)

### Goal
Send and display images in chat.

### Tasks

#### 9.1 Set Up Supabase Storage
- Create `chat-media` bucket in Supabase Storage
- Configure storage policies (users can upload to their conversations)
- Set up public access for reading

#### 9.2 Create Media Upload Service
- Function to select image from device
- Upload to Supabase Storage
- Return public URL

#### 9.3 Send Image Messages
- Add image picker to chat input
- Upload image to storage
- Create message with `message_type: 'image'` and `media_url`

#### 9.4 Display Images in Chat
- Update Message Bubble to show images
- Add loading state while image loads
- Support image preview/full screen view

#### 9.5 Test Image Sharing
1. Select image from device
2. Send in chat
3. Verify image uploads to Supabase Storage
4. Verify image displays in chat
5. Test on both sender and receiver side
6. Test with large images (should work)

**Phase 9 Complete When:**
- Can select and send images
- Images display correctly in chat
- Works real-time (receiver sees image instantly)
- Images persist after app restart

---

## Phase 10: File Sharing (Day 10)

### Goal
Share documents and other files in chat.

### Tasks

#### 10.1 Extend Media Upload Service
- Support PDF, DOC, TXT, etc.
- Add file type validation
- Add file size limits (e.g., 10MB max)

#### 10.2 Send File Messages
- Add file picker to chat input
- Upload to Supabase Storage
- Create message with `message_type: 'file'`

#### 10.3 Display Files in Chat
- Show file name, size, and icon
- Add download button
- Show file preview for supported types

#### 10.4 Test File Sharing
1. Select document from device
2. Send in chat
3. Verify file uploads successfully
4. Verify receiver can download/view file
5. Test file size limits (should reject >10MB)

**Phase 10 Complete When:**
- Can send various file types
- Files download correctly
- File size validation works
- Error handling for unsupported types

---

## Phase 11: State Management & Optimization (Day 11)

### Goal
Implement proper state management and optimize performance.

### Tasks

#### 11.1 Set Up Zustand Store
- Move all chat state to Zustand
- Conversations list
- Messages by conversation
- Presence data
- Typing indicators

#### 11.2 Create Custom Hooks
- `useConversation(conversationId)` - manages single conversation
- `useConversations()` - manages conversation list
- `useTypingIndicator(conversationId)` - manages typing
- `usePresence(userId)` - manages presence

#### 11.3 Optimize Re-renders
- Memo expensive components
- Use selectors in Zustand
- Prevent unnecessary re-renders

#### 11.4 Add Caching
- Cache loaded messages
- Cache conversation list
- Invalidate cache when needed

#### 11.5 Test Performance
1. Open conversation with 500+ messages
2. Should load smoothly
3. Scroll should be 60fps
4. No lag when typing

**Phase 11 Complete When:**
- State management is centralized
- No prop drilling
- Smooth performance with large datasets
- Memory usage is reasonable

---

## Phase 12: Polish & Error Handling (Day 12)

### Goal
Handle edge cases, errors, and improve UX.

### Tasks

#### 12.1 Connection Error Handling
- Detect when offline
- Show offline indicator
- Queue messages when offline
- Retry sending when back online

#### 12.2 Loading States
- Show skeleton loaders for messages
- Show loading for conversations
- Show progress for file uploads

#### 12.3 Empty States
- "No conversations yet" in chat list
- "Send first message" in empty conversation
- "No internet connection" when offline

#### 12.4 Input Validation
- Prevent sending empty messages
- Sanitize message content
- Validate file uploads

#### 12.5 User Feedback
- Toast notifications for errors
- Success feedback when message sent
- Upload progress indicators

#### 12.6 Comprehensive Testing
1. Test with poor network connection
2. Test airplane mode
3. Test with corrupt file uploads
4. Test with very long messages
5. Test with special characters

**Phase 12 Complete When:**
- All error cases handled gracefully
- Clear feedback for all user actions
- No crashes in edge cases
- Professional, polished feel

---

## Phase 13: Security Hardening (Day 13)

### Goal
Ensure the chat system is secure and production-ready.

### Tasks

#### 13.1 Review RLS Policies
- Verify all tables have RLS enabled
- Test policies with different users
- Ensure no data leaks between users

#### 13.2 Input Sanitization
- Sanitize all user inputs
- Prevent XSS attacks
- Limit message length (5000 chars)

#### 13.3 Rate Limiting
- Create Edge Function for rate limiting
- Limit messages per user (100/hour)
- Prevent spam

#### 13.4 File Upload Security
- Verify file types on backend
- Scan for malicious files (basic check)
- Enforce size limits server-side

#### 13.5 Test Security
1. Try accessing other user's messages (should fail)
2. Try uploading malicious file (should block)
3. Try sending 1000 messages quickly (should rate limit)
4. Try XSS in message content (should sanitize)

**Phase 13 Complete When:**
- All security checks pass
- RLS prevents unauthorized access
- Rate limiting works
- Input sanitization prevents attacks

---

## Phase 14: Testing & Quality Assurance (Day 14)

### Goal
Thoroughly test everything before launch.

### Tasks

#### 14.1 Create Test Scenarios
- 2 users chatting
- 100+ messages in conversation
- Multiple conversations
- Offline/online transitions
- File uploads
- Image sharing

#### 14.2 Device Testing
- Test on iOS
- Test on Android
- Test on different screen sizes
- Test on slow devices

#### 14.3 Network Testing
- Test on WiFi
- Test on cellular
- Test on slow 3G
- Test with intermittent connection

#### 14.4 Load Testing
- Create 50+ test conversations
- Create 1000+ test messages
- Verify performance holds up

#### 14.5 Bug Fixes
- Document all issues found
- Fix critical bugs
- Defer minor issues to post-launch

**Phase 14 Complete When:**
- All critical bugs fixed
- Works smoothly on all tested devices
- Performance is acceptable
- Ready for beta users

---

## Dependencies Between Phases

```
Phase 1 (Database)
    ↓
Phase 2 (Display Messages)
    ↓
Phase 3 (Send Messages)
    ↓
Phase 4 (Real-Time)
    ↓
Phase 5 (Pagination)
    ↓
Phase 6 (Read Receipts) ────┐
    ↓                        │
Phase 7 (Presence) ──────────┤
    ↓                        │
Phase 8 (Typing) ────────────┤
    ↓                        │
Phase 9 (Images) ────────────┤ ← All parallel after Phase 5
    ↓                        │
Phase 10 (Files) ────────────┘
    ↓
Phase 11 (State Management)
    ↓
Phase 12 (Polish)
    ↓
Phase 13 (Security)
    ↓
Phase 14 (Testing)
```

---

## How to Use This Plan

### Before Starting Each Phase:
1. Read the entire phase description
2. Understand what success looks like
3. Prepare any Supabase setup (tables, policies, etc.)

### During Each Phase:
1. Focus only on that phase's tasks
2. Don't add extra features "while you're at it"
3. Test as you build, not at the end

### After Each Phase:
1. Complete ALL verification steps
2. Don't move forward until everything works
3. Document any issues or learnings
4. Commit your code with clear message

### When Stuck:
1. Re-read the phase goal
2. Check if previous phase is truly complete
3. Test with Supabase SQL Editor / Dashboard
4. Simplify - remove complexity

---

## Timeline Estimate

**Fast Track (Experienced):** 14 days
**Moderate Pace:** 3-4 weeks
**Learning Mode:** 4-6 weeks

Remember: **Quality over speed.** A solid foundation prevents future headaches.

---

## Key Principles

1. **One Thing at a Time:** Resist the urge to work on multiple phases simultaneously
2. **Test Early, Test Often:** Don't wait until the end to test
3. **Leverage Supabase:** Use SQL Editor, Dashboard, Realtime, Storage - they're powerful tools
4. **Start Simple:** Get basic version working before adding complexity
5. **Complete Before Moving:** Each phase must be 100% done before next phase starts

---

## Ready to Build?

Start with **Phase 1: Database Foundation**.

When Phase 1 is complete and verified, let me know and we'll build Phase 2 together.
