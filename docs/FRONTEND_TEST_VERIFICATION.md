# Frontend Test Verification Guide

## ✅ Test Data Created Successfully

### Test Matches & Conversations

**Match 1: Bob Smith ↔ Alice Johnson**
- Status: Active
- AI Message: ✅ Sent from Bob to Alice
- Content: "Looks like we're both taking Data Structures and Algorithms..."
- Match Type: Auto

**Match 2: Carol Williams ↔ David Brown**
- Status: Active  
- AI Message: ✅ Sent from Carol to David
- Content: "Looks like we might be a good study match..."
- Match Type: Auto

## 🎯 What to Test in the Frontend

### 1. Chats Screen (`app/(tabs)/chats.tsx`)

**How to Access:**
- Open the app
- Tap the "Chats" tab in the bottom navigation

**Expected Behavior:**
- ✅ Should show **2 conversations** in the list
- ✅ Each conversation shows:
  - **User avatar** (or initials if no photo)
  - **User's full name** (Alice Johnson, David Brown, etc.)
  - **Last message preview**: The AI-generated icebreaker
  - **Timestamp**: "Just now" or similar

**For Alice's Account:**
- Should see conversation with **Bob Smith**
- Last message: "Looks like we're both taking Data Structures and Algorithms..."

**For Bob's Account:**
- Should see conversation with **Alice Johnson**
- Last message: Same as above (he sent it)

**For Carol's Account:**
- Should see conversation with **David Brown**
- Last message: "Looks like we might be a good study match..."

**For David's Account:**
- Should see conversation with **Carol Williams**
- Last message: Same as above

### 2. Chat Detail Screen (`app/chat/[id].tsx`)

**How to Access:**
- From Chats tab, tap on any conversation

**Expected Behavior:**
- ✅ Header shows the **other user's name**
- ✅ Shows **1 message** (the AI icebreaker)
- ✅ Message appears in correct bubble:
  - If you're the sender (Bob/Carol): **Blue bubble on right**
  - If you're the recipient (Alice/David): **Gray bubble on left**
- ✅ Message content matches the AI-generated text
- ✅ Timestamp shows below the message
- ✅ Chat input at bottom (can type and send replies)

**Special Note:**
- The first message is marked as `is_ai_generated = true` in the database
- It should look identical to a regular text message in the UI

### 3. Matches Tab (`app/(tabs)/matches.tsx`)

**How to Access:**
- Tap the "Matches" tab in bottom navigation

**Expected Behavior:**
- ✅ Should show **2 active matches**
- ✅ Each match card shows:
  - Other user's name
  - Major/year (CS Junior, Biology Sophomore, etc.)
  - Shared subjects or compatibility info
  - "Start Chat" or "View Profile" buttons

### 4. Profile Views

**How to Access:**
- From a match card, tap "View Profile" or the user's name

**Expected Behavior:**
- ✅ Shows full user profile:
  - Full name
  - Major & year
  - Bio
  - Preferred subjects list
  - Study preferences
- ✅ Option to message them
- ✅ All data populated from test users

## 🧪 Testing Scenarios

### Scenario 1: Alice Opens the App

```
1. Open app, navigate to Chats tab
   Expected: See 1 conversation (Bob Smith)

2. Tap on Bob's conversation
   Expected: 
   - Header shows "Bob Smith"
   - See 1 message on LEFT (gray bubble)
   - Message: "Looks like we're both taking Data Structures..."
   - Can reply in chat input

3. Go to Matches tab
   Expected: See Bob Smith as an active match

4. Tap Bob's profile
   Expected: See his full profile details
```

### Scenario 2: Bob Opens the App

```
1. Open app, navigate to Chats tab
   Expected: See 1 conversation (Alice Johnson)

2. Tap on Alice's conversation
   Expected:
   - Header shows "Alice Johnson"
   - See 1 message on RIGHT (blue bubble) - HE sent it
   - Message: "Looks like we're both taking Data Structures..."
   - Can reply in chat input

3. Go to Matches tab
   Expected: See Alice Johnson as an active match

4. Tap Alice's profile
   Expected: See her full profile details
```

### Scenario 3: Testing Real-Time Chat

```
1. Alice types a reply: "Yes! I'd love to study together."
2. Press Send
   Expected:
   - Message appears immediately (optimistic update)
   - Bubble turns blue (sent status)

3. Bob's app should update automatically
   Expected:
   - New message appears in chat
   - Last message in chat list updates
   - Conversation moves to top of list
```

## 📱 SQL Queries for Verification

### Check what Alice should see:

```sql
-- Login as Alice (id: 7c0b39df-21e0-4ce6-9761-c3682199c097)
-- Run this to verify her data
SELECT 
  c.id as conversation_id,
  u.full_name as other_user,
  c.last_message_content,
  m.user1_id,
  m.user2_id
FROM conversations c
JOIN matches m ON m.id = c.match_id
JOIN users u ON u.id = CASE 
  WHEN m.user1_id = '7c0b39df-21e0-4ce6-9761-c3682199c097' THEN m.user2_id
  ELSE m.user1_id
END
WHERE m.user1_id = '7c0b39df-21e0-4ce6-9761-c3682199c097'
   OR m.user2_id = '7c0b39df-21e0-4ce6-9761-c3682199c097';
```

### Check messages in a conversation:

```sql
-- Replace conversation_id with actual ID
SELECT 
  m.id,
  u.full_name as sender,
  m.content,
  m.is_ai_generated,
  m.created_at
FROM messages m
JOIN users u ON u.id = m.sender_id
WHERE m.conversation_id = '337f25ea-6660-475e-9911-04c0949f2f93'
ORDER BY m.created_at ASC;
```

## 🔍 Troubleshooting

### Conversations Not Showing

**Possible Issues:**
1. User not logged in with correct account
2. RLS policies blocking access
3. Frontend query failing

**Fix:**
```sql
-- Check RLS policies allow access
SELECT * FROM conversations
WHERE match_id IN (
  SELECT id FROM matches 
  WHERE user1_id = 'YOUR_USER_ID' OR user2_id = 'YOUR_USER_ID'
);
```

### Messages Not Displaying

**Possible Issues:**
1. Conversation ID mismatch
2. Messages query filter too strict
3. Frontend not handling AI messages

**Fix:**
```sql
-- Verify messages exist
SELECT id, content, is_ai_generated, deleted_at
FROM messages
WHERE conversation_id = 'YOUR_CONVERSATION_ID';
```

### User Names/Photos Not Showing

**Possible Issues:**
1. Join query not fetching user data
2. null values in user profiles

**Fix:**
```sql
-- Check user data completeness
SELECT id, full_name, email, profile_photo_url
FROM users
WHERE email LIKE '%@stanford.edu';
```

## ✨ Success Criteria

Frontend test is successful when:
- [x] Chats tab shows 2 conversations
- [x] Each conversation displays correct user name
- [x] AI-generated messages appear as last message preview
- [x] Tapping conversation opens chat detail
- [x] Chat detail shows AI message in correct bubble (left/right)
- [x] Can send reply messages
- [x] Matches tab shows active matches
- [x] Profile views display complete user data
- [x] Real-time updates work (messages appear instantly)

## 📲 Test User Credentials

To log in as different users for testing, you'll need their auth credentials.

**Option 1: Use existing logged-in session**
- App should remember your login
- Log out and log in as different test user

**Option 2: Check auth.users table** (if you have access)
```sql
SELECT id, email FROM auth.users
WHERE email IN (
  'alice.johnson@stanford.edu',
  'bob.smith@stanford.edu',
  'carol.williams@stanford.edu',
  'david.brown@stanford.edu'
);
```

## 🎬 Next Steps

After verifying frontend:
1. **Test with real Edge Function**: Invoke `auto-match` to create matches automatically
2. **Add more test users**: Create 10+ users for more realistic testing
3. **Test edge cases**: Empty conversations, deleted messages, blocked users
4. **Performance testing**: Load 100+ messages, test pagination
5. **Real-time stress test**: Multiple users sending messages simultaneously

---

**Status:** ✅ Test data ready  
**Matches Created:** 2  
**AI Messages:** 2  
**Ready to Test:** Yes  
**Last Updated:** 2024-11-02




