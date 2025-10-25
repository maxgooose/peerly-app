# Onboarding Implementation

## Overview
A complete 5-step onboarding flow has been implemented for Peerly, allowing new users to set up their profiles and preferences for finding study partners.

## Flow Structure

### Welcome Screen (`/onboarding/index`)
- Entry point with feature highlights
- "Get Started" button to begin onboarding
- Shows app benefits and time estimate (< 2 minutes)

### Step 1: Basic Info (`/onboarding/basic-info`)
**Progress**: 20%

**Collects**:
- Full Name (required)
- Major (required, dropdown with 13 options)
- Academic Year (required, dropdown: Freshman, Sophomore, Junior, Senior, Graduate)
- Bio (optional, max 200 characters)

**Features**:
- Custom dropdown pickers for Major and Year
- Character counter for bio
- Validation before proceeding

### Step 2: Subjects (`/onboarding/subjects`)
**Progress**: 40%

**Collects**:
- Preferred subjects (required, min 1, max 10)

**Features**:
- Search functionality to filter from 60+ subjects
- Shows popular subjects by default (Calculus, Data Structures, Physics, etc.)
- Chip-based selection UI
- Selection counter showing current selection count
- Empty state for no search results

### Step 3: Study Preferences (`/onboarding/preferences`)
**Progress**: 60%

**Collects**:
- Study Style (required): Quiet, With Music, Group Discussion, Teach Each Other
- Study Goals (required): Ace Exams, Understand Concepts, Just Pass, Make Friends

**Features**:
- Visual card-based selection with emojis
- One selection per category
- Shows checkmark on selected cards
- Descriptive text for each option

### Step 4: Availability (`/onboarding/availability`)
**Progress**: 80%

**Collects**:
- Weekly availability (optional)
- Time slots: Morning 🌅, Afternoon ☀️, Evening 🌙
- All 7 days of the week

**Features**:
- Simple one-tap time slot selection per day
- Can skip this step
- Helpful tip about benefits of adding availability
- Button text changes based on whether availability is added

### Step 5: Profile Photo (`/onboarding/photo`)
**Progress**: 100%

**Collects**:
- Profile photo (optional)

**Features**:
- Take photo with camera
- Choose from photo library
- Photo preview with edit option
- Photo guidelines displayed
- Can skip this step
- Upload indicator during submission

## Backend Integration

### Services Created

#### Storage Service (`src/services/storage.ts`)
- `uploadProfilePhoto()` - Uploads photo to Supabase Storage
- `deleteProfilePhoto()` - Removes photo from storage
- `updateUserProfilePhotoUrl()` - Updates user profile with photo URL
- Handles file type detection, base64 encoding, and public URL generation

#### Onboarding Service (`src/services/onboarding.ts`)
Already existed, used for:
- `completeOnboarding()` - Saves all onboarding data via RPC function
- Validates required fields
- Handles error mapping for user-friendly messages

### Database Migration
**File**: `supabase/migrations/20241024000005_create_profile_photos_bucket.sql`

**Creates**:
- Public storage bucket `profile-photos`
- Storage policies:
  - Public read access for all photos
  - Users can only upload/update/delete their own photos
  - Photos stored in `avatars/{userId}-{timestamp}.{ext}` format

### Data Flow
1. User completes each step, data stored in navigation params
2. On final step, all params passed to `completeOnboardingFlow()`
3. Photo uploaded to storage (if provided)
4. `completeOnboarding()` called with all user data
5. Profile photo URL updated in database
6. User redirected to main app `/(tabs)`

## Packages Installed
- `expo-image-picker` - Photo selection from camera/library
- `expo-file-system` - File reading for upload
- `base64-arraybuffer` - Base64 to ArrayBuffer conversion for Supabase

## UI/UX Features

### Consistent Design
- Progress bar at top showing completion percentage
- Consistent color scheme (#A67B5B brown theme)
- Step indicator (e.g., "Step 1 of 5")
- Large, readable titles and subtitles
- Footer buttons with clear CTAs

### User Experience
- Back navigation disabled (prevents data loss)
- Skip options where appropriate (availability, photo)
- Loading states during upload/submission
- Error alerts with helpful messages
- Validation feedback before proceeding

### Accessibility
- Clear labels and placeholders
- High contrast text
- Touch-friendly button sizes
- Keyboard-aware scrolling

## Next Steps

To deploy this to production:

1. **Apply Database Migration**:
   ```bash
   supabase db push
   ```

2. **Test Onboarding Flow**:
   - Sign up with new .edu email
   - Complete all 5 steps
   - Verify data saved in database
   - Check photo uploaded to storage

3. **Optional Enhancements**:
   - Add onboarding skip detection (redirect incomplete users)
   - Profile editing flow (reuse same components)
   - Onboarding analytics (track drop-off rates per step)
   - Photo cropping/editing before upload
   - Multiple photo upload support

## File Structure
```
app/onboarding/
├── _layout.tsx              # Stack navigation layout
├── index.tsx                # Welcome screen
├── basic-info.tsx           # Step 1: Name, major, year, bio
├── subjects.tsx             # Step 2: Subject selection
├── preferences.tsx          # Step 3: Study style & goals
├── availability.tsx         # Step 4: Weekly availability
└── photo.tsx                # Step 5: Profile photo

src/services/
├── storage.ts               # NEW: Photo upload service
├── onboarding.ts            # Updated: Complete onboarding
└── supabase.ts              # Supabase client

supabase/migrations/
└── 20241024000005_create_profile_photos_bucket.sql  # Storage bucket setup
```

## Testing Checklist

- [ ] Welcome screen loads and navigates to basic-info
- [ ] Basic info validates required fields
- [ ] Major and Year dropdowns work correctly
- [ ] Bio character counter works (max 200)
- [ ] Subjects search filters correctly
- [ ] Subject selection enforces max 10 limit
- [ ] Study preferences require one selection each
- [ ] Availability can be skipped
- [ ] Time slots toggle correctly (one per day)
- [ ] Photo picker shows camera and library options
- [ ] Photo preview displays correctly
- [ ] Photo upload shows loading indicator
- [ ] Onboarding completes and redirects to main app
- [ ] All data saved correctly in database
- [ ] Profile photo appears in storage bucket
- [ ] Error handling works for network failures
- [ ] Can skip photo step
- [ ] Can skip availability step

## Known Limitations

1. **No Back Navigation**: Users cannot go back to previous steps once they proceed
2. **No Draft Saving**: If user closes app mid-onboarding, they start over
3. **No Photo Editing**: Photo is uploaded as-is, no cropping or filters
4. **Single Photo Only**: Can't upload multiple photos
5. **No Validation on Photo Size**: Large photos may take time to upload

## Future Improvements

1. Add progress persistence (save draft in async storage)
2. Allow back navigation with confirmation
3. Add photo cropping/editing
4. Implement photo size validation and compression
5. Add skip animation for optional steps
6. Track analytics for each step
7. A/B test different copy/order of steps
8. Add tooltips for first-time users
9. Implement profile editing (reuse onboarding screens)
10. Add "Complete your profile" nudges for users who skipped optional fields
