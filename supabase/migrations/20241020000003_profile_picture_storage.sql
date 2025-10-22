-- Profile Photo Storage - Phase 1
-- Migration for Peerly profile photo functionality

-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================
-- Note: Bucket creation is typically done via Supabase Dashboard or CLI
-- If using SQL, you'll need storage admin privileges

-- Create the profile-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES (Row Level Security for Storage)
-- ============================================================================

-- Policy: Users can upload photos to their own folder
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone (authenticated) can view profile photos
-- This is needed for displaying photos in match suggestions
CREATE POLICY "Authenticated users can view all profile photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profile-photos');

-- Policy: Users can update their own profile photos
CREATE POLICY "Users can update their own profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own profile photos
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- DATABASE ENHANCEMENTS
-- ============================================================================

-- Add metadata columns for profile photos
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_photo_uploaded_at timestamptz,
ADD COLUMN IF NOT EXISTS has_profile_photo boolean DEFAULT false;

-- Create index for filtering users with photos
CREATE INDEX IF NOT EXISTS idx_users_has_photo ON users(has_profile_photo);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate the storage path for a user's profile photo
CREATE OR REPLACE FUNCTION get_profile_photo_path(user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN user_id::text || '/avatar.jpg';
END;
$$ LANGUAGE plpgsql;

-- Function to generate the full public URL for a user's profile photo
CREATE OR REPLACE FUNCTION get_profile_photo_url(user_id uuid)
RETURNS text AS $$
DECLARE
  project_url text;
BEGIN
  -- Note: Replace 'YOUR_PROJECT_URL' with your actual Supabase project URL
  -- Or retrieve it from environment/configuration
  project_url := current_setting('app.settings.supabase_url', true);
  
  IF project_url IS NULL THEN
    -- Fallback: construct path without full URL
    RETURN 'profile-photos/' || user_id::text || '/avatar.jpg';
  END IF;
  
  RETURN project_url || '/storage/v1/object/public/profile-photos/' 
         || user_id::text || '/avatar.jpg';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically update has_profile_photo status
CREATE OR REPLACE FUNCTION update_profile_photo_status()
RETURNS trigger AS $$
BEGIN
  -- Set has_profile_photo to true if URL exists and is not empty
  NEW.has_profile_photo := (NEW.profile_photo_url IS NOT NULL 
                            AND NEW.profile_photo_url != '');
  
  -- Update uploaded_at timestamp when URL changes
  IF NEW.profile_photo_url IS DISTINCT FROM OLD.profile_photo_url 
     AND NEW.profile_photo_url IS NOT NULL 
     AND NEW.profile_photo_url != '' THEN
    NEW.profile_photo_uploaded_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_profile_photo_status ON users;
CREATE TRIGGER trigger_update_profile_photo_status
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_photo_status();

-- ============================================================================
-- CLEANUP FUNCTION (Optional - for maintenance)
-- ============================================================================

-- Function to delete orphaned photos (photos without matching user records)
-- This should be run periodically as a maintenance task
CREATE OR REPLACE FUNCTION cleanup_orphaned_photos()
RETURNS TABLE(deleted_count integer) AS $$
DECLARE
  deleted_count integer := 0;
  photo_record record;
BEGIN
  -- Find all photos in storage
  FOR photo_record IN 
    SELECT name 
    FROM storage.objects 
    WHERE bucket_id = 'profile-photos'
  LOOP
    -- Extract user_id from path (first folder)
    DECLARE
      photo_user_id uuid;
      user_exists boolean;
    BEGIN
      photo_user_id := (storage.foldername(photo_record.name))[1]::uuid;
      
      -- Check if user exists
      SELECT EXISTS(SELECT 1 FROM users WHERE id = photo_user_id) 
      INTO user_exists;
      
      -- Delete photo if user doesn't exist
      IF NOT user_exists THEN
        DELETE FROM storage.objects 
        WHERE bucket_id = 'profile-photos' 
        AND name = photo_record.name;
        
        deleted_count := deleted_count + 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Skip invalid UUIDs or other errors
        CONTINUE;
    END;
  END LOOP;
  
  RETURN QUERY SELECT deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VALIDATION FUNCTION
-- ============================================================================

-- Function to validate profile photo URL format
CREATE OR REPLACE FUNCTION validate_profile_photo_url(photo_url text)
RETURNS boolean AS $$
BEGIN
  IF photo_url IS NULL OR photo_url = '' THEN
    RETURN true; -- Empty is valid (no photo)
  END IF;
  
  -- Check if URL contains expected storage path pattern
  RETURN photo_url ~ 'profile-photos/[a-f0-9-]+/(avatar|thumb)';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS (Optional - for convenient queries)
-- ============================================================================

-- View to get users with complete profile information including photos
CREATE OR REPLACE VIEW users_with_photos AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.university,
  u.major,
  u.year,
  u.bio,
  u.profile_photo_url,
  u.has_profile_photo,
  u.profile_photo_uploaded_at,
  u.preferred_subjects,
  u.availability,
  u.created_at
FROM users u
WHERE u.has_profile_photo = true;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN users.profile_photo_url IS 'Full public URL to user profile photo in Supabase Storage';
COMMENT ON COLUMN users.has_profile_photo IS 'Boolean flag indicating if user has uploaded a profile photo';
COMMENT ON COLUMN users.profile_photo_uploaded_at IS 'Timestamp of when profile photo was last uploaded/updated';
COMMENT ON FUNCTION get_profile_photo_path(uuid) IS 'Generates storage path for user profile photo';
COMMENT ON FUNCTION get_profile_photo_url(uuid) IS 'Generates full public URL for user profile photo';
COMMENT ON FUNCTION cleanup_orphaned_photos() IS 'Maintenance function to delete photos for deleted users';

-- ============================================================================
-- GRANT PERMISSIONS (if needed)
-- ============================================================================

-- Grant execute permissions on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION get_profile_photo_path(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_photo_url(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_profile_photo_url(text) TO authenticated;

-- Only service role should run cleanup
GRANT EXECUTE ON FUNCTION cleanup_orphaned_photos() TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Configure bucket size limits in Supabase Dashboard (recommended: 5MB)
-- 2. Set allowed MIME types: image/jpeg, image/png, image/webp
-- 3. Implement client-side upload logic
-- 4. Add image compression before upload
-- 5. Update Supabase project URL in app settings if using get_profile_photo_url()