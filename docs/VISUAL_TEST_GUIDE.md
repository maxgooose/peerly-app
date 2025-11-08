# 📱 Visual Test Guide - What You'll See

## Test as Alice Johnson (alice.johnson@stanford.edu)

### Screen 1: Matches Tab

```
╔════════════════════════════════════════╗
║              Peerly                    ║
╠════════════════════════════════════════╣
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │   🕐  Next Match In             │   ║
║  │                                 │   ║
║  │       23h 45m 12s               │   ║  ← Live countdown
║  │                                 │   ║
║  │  Daily matches at 8 AM          │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │ 🔔 You have 1 new match!        │   ║  ← Notification
║  └────────────────────────────────┘   ║
║                                        ║
║  Today's Matches                       ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │ [B]  Bob Smith  ✨ AI Message   │   ║  ← Match card
║  │                                 │   ║
║  │      Computer Science • Junior  │   ║
║  │                                 │   ║
║  │      [Data Structures]          │   ║
║  │      [Algorithms]               │   ║
║  │                                 │   ║
║  │      "Looks like we're both..." │   ║  ← AI message preview
║  │                              →  │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  How Daily Matches Work                ║
║  📅 Get matched every 24 hours         ║
║  ✨ AI generates icebreakers           ║
║  💬 Start chatting instantly           ║
║                                        ║
╚════════════════════════════════════════╝
    ♥ Matches  💬 Chats  📈 Progress
```

### Screen 2: Chats Tab

```
╔════════════════════════════════════════╗
║              Chats                     ║
╠════════════════════════════════════════╣
║                                        ║
║  ┌──────────────────────────────┐     ║
║  │  Direct      Nests           │     ║
║  └──────────────────────────────┘     ║
║                                        ║
║ ╔══════════════════════════════════╗  ║  ← Blue highlight
║ ║ [B]✨  Bob Smith     Just now   ║  ║
║ ║                                 ║  ║
║ ║ [NEW] Looks like we're both...  ║  ║  ← Bold text
║ ╚══════════════════════════════════╝  ║
║                                        ║
╚════════════════════════════════════════╝
    ♥ Matches  💬 Chats  📈 Progress
```

**Legend:**
- `[B]✨` = Avatar with blue sparkle badge
- Blue background = New match highlight
- `[NEW]` = New match tag
- Bold text = AI-generated message

### Screen 3: Chat Detail (with Bob)

```
╔════════════════════════════════════════╗
║  ← Bob Smith                       ⋮   ║
╠════════════════════════════════════════╣
║                                        ║
║                                        ║
║  ┌──────────────────────────────┐     ║  ← Gray bubble (received)
║  │ Looks like we're both taking │     ║
║  │ Data Structures and Algorithms│     ║
║  │ Want to compare notes or plan│     ║
║  │ a quick study session this   │     ║
║  │ week? What works for you,    │     ║
║  │ Alice?                       │     ║
║  └──────────────────────────────┘     ║
║                          Just now      ║
║                                        ║
║                                        ║
║                                        ║
║                                        ║
║                                        ║
╠════════════════════════════════════════╣
║  Type a message...              [Send] ║
╚════════════════════════════════════════╝
```

---

## Test as Bob Smith (bob.smith@stanford.edu)

### Screen 1: Matches Tab

Same as Alice but:
- Shows Alice Johnson as the match
- Same countdown timer
- Same notification

### Screen 2: Chats Tab

Same structure but:
- Shows conversation with Alice Johnson
- Same NEW indicators

### Screen 3: Chat Detail (with Alice)

```
╔════════════════════════════════════════╗
║  ← Alice Johnson                   ⋮   ║
╠════════════════════════════════════════╣
║                                        ║
║                                        ║
║                     ┌────────────────┐ ║  ← Blue bubble (sent by Bob)
║                     │ Looks like     │ ║
║                     │ we're both     │ ║
║                     │ taking Data    │ ║
║                     │ Structures and │ ║
║                     │ Algorithms...  │ ║
║                     │ What works for │ ║
║                     │ you, Alice?    │ ║
║                     └────────────────┘ ║
║                     Just now           ║
║                                        ║
║                                        ║
╠════════════════════════════════════════╣
║  Type a message...              [Send] ║
╚════════════════════════════════════════╝
```

**Key Difference:** Message appears on RIGHT (blue) because Bob sent it

---

## Interactive Test Scenarios

### Scenario 1: Alice Sees Her New Match

```
1. Alice opens app
   ✅ Sees Matches tab by default

2. Matches Tab displays:
   ✅ Timer: "23h 45m 12s"
   ✅ Notification: "You have 1 new match!"
   ✅ Match card: Bob Smith with AI chip
   
3. Alice taps Bob's card
   ✅ Opens chat with conversation ID
   ✅ Sees Bob's AI message on left (gray)
   ✅ Can type reply

4. Alice types: "Yes! I'd love to study together"
   ✅ Message appears on right (blue)
   ✅ Shows "sending..." then "sent"
   
5. Alice goes back to Chats tab
   ✅ Conversation moved to top
   ✅ Last message: "Yes! I'd love to study together"
   ✅ NEW indicator removed (she replied)
```

### Scenario 2: Countdown Timer Updates

```
1. Note current time: "23h 45m 12s"
2. Wait 60 seconds
3. Check again: "23h 44m 12s"
   ✅ Timer decreased by 1 minute
```

### Scenario 3: Two Users Chat in Real-Time

```
Device 1 (Alice):
1. Open chat with Bob
2. Type: "What time works for you?"
3. Press Send
   ✅ Message appears immediately
   
Device 2 (Bob):
1. Already in chat with Alice
2. Wait 1 second
   ✅ Alice's message appears automatically
3. Type reply: "Tomorrow at 3pm?"
4. Press Send
   ✅ Message appears

Device 1 (Alice):
   ✅ Bob's reply appears within 1 second
```

## 🎯 Visual Indicators Explained

### Match Card Components:
- **Avatar** - User's photo or initial in colored circle
- **✨ AI Message Chip** - Blue chip with sparkle icon
- **Subjects** - Tags showing shared classes
- **Message Preview** - First 50 chars of AI message
- **Arrow** - Tap to open chat

### Chat List Indicators:
- **✨ Badge on Avatar** - New auto-match (blue circle with sparkle)
- **[NEW] Tag** - Recent match (< 2 hours)
- **Blue Background** - Highlights new match row
- **Bold Message** - AI-generated message stands out

### Countdown Timer:
- **Large Numbers** - Easy to read time remaining
- **Format** - "23h 45m 12s" (hours, minutes, seconds)
- **Updates** - Real-time every second
- **Context** - "Daily matches at 8 AM"

## 📋 Test Checklist

Copy this and check off as you test:

### Matches Tab
- [ ] Countdown timer visible
- [ ] Timer counts down every second
- [ ] Notification banner shows
- [ ] Match cards display
- [ ] AI message chips visible
- [ ] User names correct
- [ ] Subjects shown
- [ ] Tapping opens chat
- [ ] Pull-to-refresh works
- [ ] Info section at bottom

### Chats Tab
- [ ] Conversations listed
- [ ] NEW tags visible
- [ ] Sparkle badges on avatars
- [ ] Blue highlights active
- [ ] Messages in bold
- [ ] User names correct
- [ ] Timestamps show
- [ ] Tapping opens chat detail

### Chat Detail
- [ ] Header shows user name
- [ ] AI message in correct bubble
- [ ] Left bubble for received
- [ ] Right bubble for sent
- [ ] Message content complete
- [ ] Timestamp shows
- [ ] Input works
- [ ] Can send messages
- [ ] Messages appear in real-time

### Data Accuracy
- [ ] Match pairs correct (Bob-Alice, David-Carol)
- [ ] AI messages personalized
- [ ] Subjects referenced in message
- [ ] Names used correctly
- [ ] No errors in console

## 🎬 Ready to Test!

Everything is wired up and ready. Just:

```bash
npm start
```

Then navigate through the app and verify everything works as shown above! 🚀

---

**Test Users Available:**
- alice.johnson@stanford.edu
- bob.smith@stanford.edu  
- carol.williams@stanford.edu
- david.brown@stanford.edu

**Test Matches Created:** 2  
**AI Messages Sent:** 2  
**All Features:** ✅ Connected




