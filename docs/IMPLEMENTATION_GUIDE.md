# Peerly - Gemini AI Integration Guide

## Overview
This guide walks through implementing AI-generated first messages between matched study buddies using Google's Gemini AI.

## Architecture Overview

```
User Matches → Supabase Edge Function → Gemini AI → Generated Message → Display to User
                    ↓
              Database (profiles, matches, suggested_messages)
```

## Prerequisites

1. **Gemini API Key**: Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Supabase Project**: Already set up with authentication
3. **Node.js/Deno**: For local development and edge functions

## Setup Steps

### 1. Environment Variables

Add to your `.env` or `.env.local`:

```bash
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (you should already have these)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

For Supabase Edge Functions, set secrets:
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Database Setup

Run the provided SQL schema:

```bash
# Connect to your Supabase project
psql "your_supabase_connection_string"

# Or use Supabase SQL Editor in the dashboard
# Copy and paste the contents of peerly-database-schema.sql
```

Key tables created:
- `profiles` - User profile information
- `matches` - Connections between users
- `suggested_messages` - AI-generated messages
- `messages` - Actual chat messages

### 3. Deploy Supabase Edge Function

```bash
# Initialize Supabase functions (if not done)
supabase functions new generate-first-message

# Copy the edge function code
cp supabase-edge-function-generate-first-message.ts supabase/functions/generate-first-message/index.ts

# Deploy the function
supabase functions deploy generate-first-message

# Test the function
supabase functions serve generate-first-message
```

### 4. Install Dependencies (for React Native app)

```bash
# Install Gemini SDK
npm install @google/generative-ai

# Or if using the edge function approach, no additional dependencies needed
```

## Implementation Approaches

### Approach A: Edge Function (Recommended)
**Pros**: Keeps API keys secure, server-side processing, no client-side rate limits
**Cons**: Slightly more latency

Call the edge function from your React Native app:

```typescript
// In your React Native app
import { supabase } from './supabaseClient';

async function generateMessage(senderId: string, recipientId: string) {
  const { data, error } = await supabase.functions.invoke('generate-first-message', {
    body: { senderId, recipientId }
  });

  if (error) {
    console.error('Error:', error);
    return null;
  }

  return data.message;
}
```

### Approach B: Client-Side (Development/Testing)
**Pros**: Faster for testing, no edge function deployment
**Cons**: API key exposed, rate limiting issues

```typescript
// Use the gemini-service.ts directly in your app
import { generateFirstMessage } from './services/gemini-service';

const result = await generateFirstMessage(senderProfile, recipientProfile);
if (result.success) {
  console.log('Generated message:', result.message);
}
```

## Usage Examples

### Example 1: When Users Match

```typescript
// In your matching logic
async function handleNewMatch(userId1: string, userId2: string) {
  // 1. Create the match in database
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({
      user1_id: userId1,
      user2_id: userId2,
      status: 'pending',
      initiated_by: userId1
    })
    .select()
    .single();

  if (matchError) {
    console.error('Failed to create match:', matchError);
    return;
  }

  // 2. Generate first message suggestions for both users
  const message1 = await generateMessage(userId1, userId2);
  const message2 = await generateMessage(userId2, userId1);

  // 3. Store in database for later use
  // These are now available when either user wants to start a conversation
  
  // 4. Send notification to both users
  await sendMatchNotification(userId1, userId2);
}
```

### Example 2: User Views Match Profile

```typescript
// When user views a match and wants a conversation starter
async function loadMatchDetails(matchId: string, currentUserId: string) {
  // Get match details
  const { data: match } = await supabase
    .from('matches')
    .select('*, user1:profiles!user1_id(*), user2:profiles!user2_id(*)')
    .eq('id', matchId)
    .single();

  const otherUserId = match.user1_id === currentUserId 
    ? match.user2_id 
    : match.user1_id;

  // Check if we already have a suggested message
  const { data: existingMessage } = await supabase
    .from('suggested_messages')
    .select('*')
    .eq('sender_id', currentUserId)
    .eq('recipient_id', otherUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingMessage) {
    return existingMessage.message;
  }

  // Generate new one if doesn't exist
  const newMessage = await generateMessage(currentUserId, otherUserId);
  return newMessage;
}
```

### Example 3: User Sends Message

```typescript
// When user decides to send the AI-generated message (or a modified version)
async function sendMessage(
  matchId: string,
  senderId: string,
  content: string,
  suggestedMessageId?: string
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      content: content,
      is_ai_generated: !!suggestedMessageId,
      suggested_message_id: suggestedMessageId
    })
    .select()
    .single();

  if (!error && suggestedMessageId) {
    // Mark the suggested message as used
    await supabase
      .from('suggested_messages')
      .update({ 
        was_used: true, 
        used_at: new Date().toISOString()
      })
      .eq('id', suggestedMessageId);
  }

  return { data, error };
}
```

## UI Integration Examples

### React Native Component Example

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface MatchProfileScreenProps {
  match: Match;
  currentUserId: string;
}

export function MatchProfileScreen({ match, currentUserId }: MatchProfileScreenProps) {
  const [suggestedMessage, setSuggestedMessage] = useState<string>('');
  const [userMessage, setUserMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuggestedMessage();
  }, []);

  async function loadSuggestedMessage() {
    setLoading(true);
    try {
      const message = await generateMessage(
        currentUserId, 
        match.other_user_id
      );
      setSuggestedMessage(message);
      setUserMessage(message); // Pre-fill with suggestion
    } catch (error) {
      console.error('Failed to generate message:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!userMessage.trim()) return;

    await sendMessage(
      match.id,
      currentUserId,
      userMessage,
      userMessage === suggestedMessage ? suggestedMessageId : undefined
    );

    // Navigate to chat screen
  }

  return (
    <View style={styles.container}>
      {/* Match profile details */}
      <View style={styles.profileSection}>
        <Text style={styles.name}>{match.other_user_name}</Text>
        <Text style={styles.major}>{match.other_user_major}</Text>
      </View>

      {/* AI-generated message suggestion */}
      <View style={styles.messageSection}>
        <Text style={styles.label}>✨ Suggested First Message:</Text>
        
        {loading ? (
          <Text>Generating personalized message...</Text>
        ) : (
          <>
            <View style={styles.suggestionBox}>
              <Text style={styles.suggestionText}>{suggestedMessage}</Text>
            </View>
            
            <TextInput
              style={styles.input}
              multiline
              value={userMessage}
              onChangeText={setUserMessage}
              placeholder="Edit the message or write your own..."
            />

            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleSendMessage}
            >
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  profileSection: { marginBottom: 20 },
  name: { fontSize: 24, fontWeight: 'bold' },
  major: { fontSize: 16, color: '#666' },
  messageSection: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  suggestionBox: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#4a90e2'
  },
  suggestionText: { fontSize: 14, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15
  },
  sendButton: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  sendButtonText: { color: 'white', fontSize: 16, fontWeight: '600' }
});
```

## Testing

### Test with Sample Data

```typescript
// Create test profiles
const testUser1 = {
  id: 'test-user-1',
  name: 'Alice',
  major: 'Computer Science',
  year: 3,
  courses: ['Data Structures', 'Algorithms', 'Machine Learning'],
  interests: ['AI', 'Web Development'],
  study_preferences: {
    location: 'library',
    time_of_day: 'evening',
    group_size: 'one-on-one'
  },
  bio: 'Love coding and building cool projects!',
  goals: ['Master algorithms', 'Build a startup']
};

const testUser2 = {
  id: 'test-user-2',
  name: 'Bob',
  major: 'Computer Science',
  year: 3,
  courses: ['Data Structures', 'Operating Systems'],
  interests: ['AI', 'Cybersecurity'],
  study_preferences: {
    location: 'library',
    time_of_day: 'afternoon',
    group_size: 'one-on-one'
  },
  bio: 'CS junior focused on systems programming.',
  goals: ['Ace technical interviews']
};

// Generate message
const result = await generateFirstMessage(testUser1, testUser2);
console.log('Generated message:', result.message);

// Expected output example:
// "I saw we're both taking Data Structures and interested in AI! 
//  How are you finding the class? Would love to team up for studying sometime."
```

### Testing Edge Function Locally

```bash
# Start Supabase locally
supabase start

# Serve the function
supabase functions serve generate-first-message

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-first-message' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"senderId":"uuid1","recipientId":"uuid2"}'
```

## Best Practices

### 1. **Rate Limiting**
- Cache generated messages in the database
- Implement cooldown periods between regenerations
- Batch generate messages for multiple matches

```typescript
// Check if message was recently generated
const { data: recentMessage } = await supabase
  .from('suggested_messages')
  .select('*')
  .eq('sender_id', senderId)
  .eq('recipient_id', recipientId)
  .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Within last hour
  .maybeSingle();

if (recentMessage) {
  return recentMessage.message; // Use cached version
}
```

### 2. **Error Handling**
- Always provide fallback messages if AI generation fails
- Log errors for monitoring

```typescript
try {
  const result = await generateMessage(senderId, recipientId);
  return result;
} catch (error) {
  console.error('Gemini API error:', error);
  
  // Fallback to generic message
  return "Hey! I noticed we have some classes in common. Want to study together sometime?";
}
```

### 3. **User Privacy**
- Never include sensitive information in AI prompts
- Allow users to opt-out of AI suggestions
- Let users regenerate or completely ignore suggestions

### 4. **Quality Control**
- Monitor which messages get used vs. modified
- Track user feedback on message quality
- Adjust prompts based on analytics

```typescript
// Track message modifications
const wasModified = userMessage !== suggestedMessage;

await supabase
  .from('suggested_messages')
  .update({ 
    was_modified: wasModified,
    // You could also track the actual modifications for analysis
  })
  .eq('id', suggestedMessageId);
```

### 5. **Prompt Optimization**
- Test with diverse user profiles
- A/B test different prompt variations
- Collect user feedback to improve prompts

## Performance Optimization

### Caching Strategy

```typescript
// Cache in React state/context
const [messageCache, setMessageCache] = useState<Map<string, string>>(new Map());

function getCachedMessage(senderId: string, recipientId: string) {
  const key = `${senderId}-${recipientId}`;
  return messageCache.get(key);
}
```

### Batch Generation

```typescript
// When a user gets multiple matches at once
async function generateMessagesForNewMatches(userId: string, matchIds: string[]) {
  const promises = matchIds.map(matchId => 
    generateMessage(userId, getOtherUserId(matchId, userId))
  );
  
  const results = await Promise.allSettled(promises);
  return results;
}
```

## Monitoring & Analytics

Track these metrics:
- Message generation success rate
- Average generation time
- Message usage rate (how often users send the suggested message)
- Message modification rate
- User satisfaction with suggestions

```typescript
// Example analytics event
await logAnalyticsEvent('ai_message_generated', {
  sender_id: senderId,
  recipient_id: recipientId,
  common_courses: matchingPoints.commonCourses.length,
  common_interests: matchingPoints.commonInterests.length,
  generation_time_ms: generationTime
});
```

## Troubleshooting

### Issue: API Key Invalid
- Verify key in Google AI Studio
- Check environment variables are properly set
- Ensure key has proper permissions

### Issue: Messages Too Generic
- Review and enhance the prompt with more specific examples
- Include more context from user profiles
- Adjust temperature parameter (0.7-1.0 for more creative)

### Issue: Rate Limiting
- Implement caching (shown above)
- Use exponential backoff for retries
- Consider upgrading Gemini API tier

### Issue: Slow Generation
- Use Gemini Flash model (faster, cheaper)
- Generate messages asynchronously
- Pre-generate messages during matching process

## Next Steps

1. **Deploy and Test**: Start with edge function deployment
2. **Collect Data**: Monitor usage and quality metrics
3. **Iterate**: Refine prompts based on user feedback
4. **Enhance**: Add features like multiple message options, regeneration
5. **Scale**: Implement proper caching and batch processing

## Additional Features to Consider

- **Multiple Message Options**: Generate 2-3 options for users to choose from
- **Conversation Starters Library**: Fallback templates when AI fails
- **Smart Regeneration**: Allow users to request different tone/style
- **Context-Aware**: Factor in time of day, upcoming exams, etc.
- **Learning**: Train on successful messages (with user consent)

## Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Native + Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
