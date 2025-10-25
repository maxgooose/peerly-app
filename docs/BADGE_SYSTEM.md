# Badge System Documentation

## Overview
A simple, subtle badge system for verified students. Badges like **Tutor**, **Founder**, **Developer**, etc. appear next to user profiles to add credibility and recognition.

## Design Philosophy
- **Simple**: Easy to understand at a glance
- **Subtle**: Doesn't dominate the UI
- **Professional**: Clean, modern design
- **Verified**: All badges require verification

## Badge Types

| Badge | Icon | Color | Description |
|-------|------|-------|-------------|
| **Tutor** | 👨‍🏫 | Green (#10B981) | Experienced tutor helping other students |
| **Founder** | 🚀 | Purple (#8B5CF6) | App founder and community builder |
| **Developer** | 💻 | Blue (#3B82F6) | Software developer or engineer |
| **Verified** | ✓ | Cyan (#06B6D4) | Verified student account |
| **Top Contributor** | ⭐ | Amber (#F59E0B) | Active community contributor |
| **Early Adopter** | 🌟 | Pink (#EC4899) | Joined during beta/early access |
| **Mentor** | 🎓 | Teal (#14B8A6) | Dedicated to mentoring other students |
| **Researcher** | 🔬 | Violet (#A855F7) | Active in research projects |

## Database Schema

### Tables

#### `badges`
Defines available badge types:
```sql
CREATE TABLE badges (
  id TEXT PRIMARY KEY,              -- e.g., 'tutor', 'founder'
  name TEXT NOT NULL,               -- e.g., 'Tutor', 'Founder'
  description TEXT,                 -- Badge description
  icon TEXT NOT NULL,               -- Emoji or icon identifier
  color TEXT NOT NULL,              -- Hex color for display
  priority INTEGER DEFAULT 0,       -- Display priority (higher = first)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `user_badges`
Links users to their earned badges:
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  badge_id TEXT REFERENCES badges(id),
  verified BOOLEAN DEFAULT TRUE,    -- All badges verified by default
  verified_by UUID REFERENCES users(id), -- Admin who verified
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,                       -- Optional verification notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)        -- One of each badge per user
);
```

#### User Badge Fields
Added to `users` table:
```sql
badge_display_preference TEXT DEFAULT 'show_all'  -- show_all, show_primary, hide_all
primary_badge_id TEXT                              -- User's featured badge
```

## API / Service Functions

### `getAllBadges()`
Get all available badge types:
```typescript
import { getAllBadges } from '@/src/services/badges';

const { success, badges } = await getAllBadges();
// Returns: Badge[]
```

### `getUserBadges(userId)`
Get badges for a specific user:
```typescript
import { getUserBadges } from '@/src/services/badges';

const { success, badges } = await getUserBadges(userId);
// Returns: UserBadge[]
```

### `assignBadge(assignment)`
Assign a badge to a user (admin only):
```typescript
import { assignBadge } from '@/src/services/badges';

await assignBadge({
  user_id: '123-456-789',
  badge_id: 'tutor',
  verified_by: 'admin-user-id',
  notes: 'Verified through tutor application'
});
```

### `removeBadge(userId, badgeId)`
Remove a badge from a user (admin only):
```typescript
import { removeBadge } from '@/src/services/badges';

await removeBadge(userId, 'tutor');
```

### `updateBadgeDisplayPreference(userId, preference)`
Update how user wants to display badges:
```typescript
import { updateBadgeDisplayPreference } from '@/src/services/badges';

await updateBadgeDisplayPreference(userId, 'show_primary');
// Options: 'show_all' | 'show_primary' | 'hide_all'
```

### `setPrimaryBadge(userId, badgeId)`
Set user's primary/featured badge:
```typescript
import { setPrimaryBadge } from '@/src/services/badges';

await setPrimaryBadge(userId, 'founder');
```

## UI Components

### Single Badge
Display a single badge with icon and label:

```typescript
import { Badge } from '@/src/components/Badge';

<Badge
  badge={userBadge}
  size="medium"      // 'small' | 'medium' | 'large'
  showLabel={true}   // Show badge name
/>
```

**Sizes**:
- **Small**: Icon 12px, Label 10px - For compact lists
- **Medium**: Icon 14px, Label 12px - Default size
- **Large**: Icon 16px, Label 14px - For profile headers

### Badge List
Display multiple badges in a row:

```typescript
import { BadgeList } from '@/src/components/Badge';

<BadgeList
  badges={userBadges}
  size="small"
  showLabels={false}   // Icon-only mode for space
  maxDisplay={3}       // Show max 3 badges, then "+N"
/>
```

## Integration Examples

### Profile Screen

```typescript
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { getUserBadges, getDisplayBadges } from '@/src/services/badges';
import { BadgeList } from '@/src/components/Badge';

function ProfileScreen({ userId }) {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    loadBadges();
  }, [userId]);

  async function loadBadges() {
    const { success, badges: userBadges } = await getUserBadges(userId);
    if (success && userBadges) {
      setBadges(userBadges);
    }
  }

  return (
    <View>
      <Text style={styles.name}>John Doe</Text>
      <BadgeList badges={badges} size="small" showLabels={false} />
    </View>
  );
}
```

### Match Card

```typescript
import { Badge } from '@/src/components/Badge';

function MatchCard({ user }) {
  const primaryBadge = user.badges?.[0]; // Highest priority badge

  return (
    <View style={styles.card}>
      <Image source={{ uri: user.profile_photo_url }} />
      <View style={styles.info}>
        <Text style={styles.name}>{user.full_name}</Text>
        {primaryBadge && (
          <Badge badge={primaryBadge} size="small" showLabel={true} />
        )}
      </View>
    </View>
  );
}
```

### Chat Header

```typescript
import { BadgeList } from '@/src/components/Badge';

function ChatHeader({ matchedUser }) {
  // Show only primary badge in chat header
  const displayBadge = matchedUser.primary_badge_id
    ? matchedUser.badges.find(b => b.id === matchedUser.primary_badge_id)
    : matchedUser.badges[0];

  return (
    <View style={styles.header}>
      <Text style={styles.name}>{matchedUser.full_name}</Text>
      {displayBadge && (
        <Badge badge={displayBadge} size="small" showLabel={false} />
      )}
    </View>
  );
}
```

## Admin Badge Management

### Manual Badge Assignment

Create an admin panel screen for assigning badges:

```typescript
import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { assignBadge, removeBadge, getAllBadges } from '@/src/services/badges';

function AdminBadgeManagement({ userId }) {
  const [availableBadges, setAvailableBadges] = useState([]);

  useEffect(() => {
    loadBadges();
  }, []);

  async function loadBadges() {
    const { badges } = await getAllBadges();
    setAvailableBadges(badges || []);
  }

  async function handleAssignBadge(badgeId: string) {
    const result = await assignBadge({
      user_id: userId,
      badge_id: badgeId,
      verified_by: currentAdminId,
      notes: 'Manually assigned by admin',
    });

    if (result.success) {
      Alert.alert('Success', 'Badge assigned');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Assign Badge</Text>
      {availableBadges.map(badge => (
        <TouchableOpacity
          key={badge.id}
          onPress={() => handleAssignBadge(badge.id)}
        >
          <Text>{badge.icon} {badge.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### Automatic Badge Assignment

Assign badges based on user activity:

```typescript
import { assignBadge } from '@/src/services/badges';

// Assign "Early Adopter" to users who sign up in first month
async function checkEarlyAdopterBadge(userId: string, signupDate: Date) {
  const launchDate = new Date('2024-11-01');
  const oneMonthLater = new Date('2024-12-01');

  if (signupDate >= launchDate && signupDate < oneMonthLater) {
    await assignBadge({
      user_id: userId,
      badge_id: 'early_adopter',
      notes: 'Automatically assigned - early signup',
    });
  }
}

// Assign "Top Contributor" based on study sessions
async function checkTopContributorBadge(userId: string) {
  const { data } = await supabase
    .from('study_sessions')
    .select('id')
    .eq('status', 'completed')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (data && data.length >= 10) {
    await assignBadge({
      user_id: userId,
      badge_id: 'top_contributor',
      notes: 'Automatically assigned - 10+ completed study sessions',
    });
  }
}
```

## User Settings

Allow users to control badge display:

```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import { updateBadgeDisplayPreference, setPrimaryBadge } from '@/src/services/badges';

function BadgeSettings({ userId, userBadges, currentPreference, currentPrimary }) {
  async function handlePreferenceChange(pref: string) {
    await updateBadgeDisplayPreference(userId, pref);
  }

  async function handleSetPrimary(badgeId: string) {
    await setPrimaryBadge(userId, badgeId);
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Badge Display</Text>

      <TouchableOpacity onPress={() => handlePreferenceChange('show_all')}>
        <Text>Show All Badges</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handlePreferenceChange('show_primary')}>
        <Text>Show Primary Badge Only</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handlePreferenceChange('hide_all')}>
        <Text>Hide All Badges</Text>
      </TouchableOpacity>

      {currentPreference === 'show_primary' && (
        <View>
          <Text style={styles.sectionTitle}>Select Primary Badge</Text>
          {userBadges.map(badge => (
            <TouchableOpacity
              key={badge.id}
              onPress={() => handleSetPrimary(badge.id)}
            >
              <Text>{badge.icon} {badge.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
```

## SQL Queries

### Get Users with Specific Badge
```sql
SELECT u.*, b.name as badge_name
FROM users u
JOIN user_badges ub ON ub.user_id = u.id
JOIN badges b ON b.id = ub.badge_id
WHERE b.id = 'tutor'
  AND ub.verified = TRUE;
```

### Get Badge Distribution
```sql
SELECT
  b.name,
  COUNT(ub.user_id) as user_count
FROM badges b
LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.verified = TRUE
GROUP BY b.id, b.name
ORDER BY user_count DESC;
```

### Get Users with Most Badges
```sql
SELECT
  u.full_name,
  COUNT(ub.badge_id) as badge_count,
  json_agg(b.name) as badges
FROM users u
JOIN user_badges ub ON ub.user_id = u.id
JOIN badges b ON b.id = ub.badge_id
WHERE ub.verified = TRUE
GROUP BY u.id, u.full_name
ORDER BY badge_count DESC
LIMIT 10;
```

## Adding New Badge Types

To add a new badge type:

1. **Insert into badges table**:
```sql
INSERT INTO badges (id, name, description, icon, color, priority)
VALUES (
  'new_badge',
  'New Badge',
  'Description of this badge',
  '🎯',
  '#FF5733',
  45
);
```

2. **Update the Badge enum** (if using TypeScript strict types):
```typescript
export type BadgeType =
  | 'tutor'
  | 'founder'
  | 'dev'
  | 'verified'
  | 'top_contributor'
  | 'early_adopter'
  | 'mentor'
  | 'researcher'
  | 'new_badge'; // Add new type here
```

3. **Document the badge** in this file

## Security & Permissions

### Current Implementation
- **Badges table**: Public read (anyone can see available badges)
- **User badges table**: Public read (anyone can see who has which badges)
- **Badge assignment**: Disabled (admin system not yet implemented)

### Future: Admin-Only Badge Management

When implementing admin system:

```sql
-- Enable admin-only badge management
DROP POLICY "Only admins can manage user badges" ON user_badges;

CREATE POLICY "Only admins can assign badges"
ON user_badges FOR INSERT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = TRUE
  )
);

CREATE POLICY "Only admins can remove badges"
ON user_badges FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = TRUE
  )
);
```

## Best Practices

### Badge Verification
- ✅ **Do**: Verify badge eligibility before assignment
- ✅ **Do**: Add notes explaining why badge was assigned
- ❌ **Don't**: Auto-assign without verification
- ❌ **Don't**: Let users request specific badges

### UI Display
- ✅ **Do**: Keep badges subtle and non-intrusive
- ✅ **Do**: Show most important badge first
- ✅ **Do**: Limit to 3 badges in compact views
- ❌ **Don't**: Show all badges in every context
- ❌ **Don't**: Make badges larger than profile photos

### Badge Criteria
- ✅ **Do**: Have clear criteria for each badge
- ✅ **Do**: Make badges meaningful and earned
- ✅ **Do**: Keep badge count reasonable (< 15 types)
- ❌ **Don't**: Create vanity badges
- ❌ **Don't**: Award badges too easily

## Testing

### Test Badge Assignment
```typescript
import { assignBadge, getUserBadges } from '@/src/services/badges';

// Assign a badge
await assignBadge({
  user_id: testUserId,
  badge_id: 'tutor',
  notes: 'Test assignment',
});

// Verify badge was assigned
const { badges } = await getUserBadges(testUserId);
expect(badges.some(b => b.id === 'tutor')).toBe(true);
```

### Test Badge Display
```typescript
import { render } from '@testing-library/react-native';
import { Badge } from '@/src/components/Badge';

const mockBadge = {
  id: 'tutor',
  name: 'Tutor',
  icon: '👨‍🏫',
  color: '#10B981',
  priority: 100,
  verified: true,
  verified_at: new Date().toISOString(),
};

test('renders badge with icon and label', () => {
  const { getByText } = render(<Badge badge={mockBadge} />);
  expect(getByText('👨‍🏫')).toBeTruthy();
  expect(getByText('Tutor')).toBeTruthy();
});
```

## Future Enhancements

1. **Badge Application System**: Let users apply for badges like "Tutor"
2. **Badge Levels**: Tiered badges (Tutor Bronze, Silver, Gold)
3. **Animated Badges**: Subtle animations on hover/tap
4. **Badge Achievements**: Unlock badges through app activity
5. **Custom Badges**: School-specific or event-specific badges
6. **Badge NFTs**: Blockchain verification (if needed)

## Migration

Apply the migration:
```bash
supabase db push
```

The migration will:
- Create `badges` table
- Create `user_badges` table
- Add badge fields to `users` table
- Insert default 8 badge types
- Set up RLS policies
- Create helper functions

## Support

For questions or issues with the badge system:
- Check badge assignment with `SELECT * FROM user_badges WHERE user_id = 'xxx'`
- Verify badge colors render correctly
- Test badge display in different screen sizes
- Monitor badge assignment patterns in analytics
