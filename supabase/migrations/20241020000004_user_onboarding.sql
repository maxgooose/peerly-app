-- User onboarding flow enhancements
-- Adds onboarding state tracking and RPC helper for completing onboarding
-- Migration: 20241020000004_user_onboarding.sql

-- ============================================================================
-- COLUMN ADDITIONS
-- ============================================================================

-- Add columns to track whether user has completed initial profile setup
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Index for efficient filtering of users by onboarding status
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
ON users(onboarding_completed);

-- ============================================================================
-- AUTO-CREATE USER RECORD ON AUTH SIGNUP
-- ============================================================================
-- CRITICAL FIX: Automatically create users table record when auth user is created
-- Without this trigger, users.id and auth.users.id can become desynchronized

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Execute with elevated privileges to insert into users table
SET search_path = public -- Explicitly set schema to prevent ambiguity
AS $$
DECLARE
  extracted_university text;
BEGIN
  -- Attempt to get university from signup metadata first, fallback to email parsing
  extracted_university := COALESCE(
    NEW.raw_user_meta_data->>'university',
    extract_university_from_email(NEW.email)
  );

  -- Create corresponding record in public.users table
  INSERT INTO public.users (
    id,
    email,
    full_name,
    university,
    onboarding_completed
  )
  VALUES (
    NEW.id, -- Use same UUID as auth.users for foreign key relationship
    NEW.email,
    NEW.raw_user_meta_data->>'full_name', -- Extract from signup metadata
    extracted_university,
    false -- User has not completed onboarding yet
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors if record already exists

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    -- This ensures users can still sign up even if users table insert fails
    RAISE WARNING 'Failed to create user record for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger fires after each new row is inserted into auth.users
-- This is the hook that creates the public.users record automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- HELPER FUNCTION TO COMPLETE ONBOARDING
-- ============================================================================
-- IMPROVED: Better return type and error handling

CREATE OR REPLACE FUNCTION complete_user_onboarding(
  p_user_id uuid,
  p_full_name text,
  p_major text,
  p_year text,
  p_bio text DEFAULT NULL,
  p_preferred_subjects text[] DEFAULT NULL,
  p_availability jsonb DEFAULT NULL
)
RETURNS json -- Return json for better client compatibility across different libraries
LANGUAGE plpgsql
SECURITY DEFINER -- Required to bypass RLS for the update operation
SET search_path = public
AS $$
DECLARE
  cleaned_full_name text;
  cleaned_major text;
  cleaned_year text;
  cleaned_bio text;
  cleaned_subjects text[];
  caller_id uuid;
  updated_user users%ROWTYPE; -- Variable to store the complete updated row
BEGIN
  -- Get the authenticated user ID from the current session
  caller_id := auth.uid();

  -- Authorization check: User must be authenticated
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Please sign in to complete onboarding.';
  END IF;

  -- Authorization check: User ID parameter must be provided
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required to complete onboarding.';
  END IF;

  -- Authorization check: User can only update their own profile
  IF caller_id != p_user_id THEN
    RAISE EXCEPTION 'Not authorized to update this profile.';
  END IF;

  -- Clean and validate inputs by trimming whitespace and converting empty strings to NULL
  cleaned_full_name := NULLIF(trim(p_full_name), '');
  cleaned_major := NULLIF(trim(p_major), '');
  cleaned_year := NULLIF(trim(p_year), '');
  cleaned_bio := NULLIF(trim(p_bio), '');

  -- Validate required field: Full name must not be empty
  IF cleaned_full_name IS NULL OR cleaned_full_name = '' THEN
    RAISE EXCEPTION 'Full name is required.';
  END IF;

  -- Validate required field: Major must not be empty
  IF cleaned_major IS NULL OR cleaned_major = '' THEN
    RAISE EXCEPTION 'Major is required.';
  END IF;

  -- Validate required field: Academic year must not be empty
  IF cleaned_year IS NULL OR cleaned_year = '' THEN
    RAISE EXCEPTION 'Academic year is required.';
  END IF;

  -- Validate required field: At least one subject must be provided
  IF p_preferred_subjects IS NULL OR array_length(p_preferred_subjects, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one preferred subject is required.';
  END IF;

  -- Validate and clean subjects array by trimming each element and filtering empty strings
  SELECT array_agg(subject) INTO cleaned_subjects
  FROM (
    SELECT NULLIF(trim(subject), '') AS subject
    FROM unnest(p_preferred_subjects) AS subject
  ) AS sanitized
  WHERE subject IS NOT NULL AND subject != '';

  -- Ensure at least one valid subject remains after cleaning
  IF cleaned_subjects IS NULL OR array_length(cleaned_subjects, 1) = 0 THEN
    RAISE EXCEPTION 'At least one valid preferred subject is required.';
  END IF;

  -- Validate availability JSON structure if provided
  IF p_availability IS NOT NULL THEN
    IF jsonb_typeof(p_availability) != 'object' THEN
      RAISE EXCEPTION 'Availability must be a JSON object.';
    END IF;
  END IF;

  -- Update user record with all onboarding data
  UPDATE users
  SET
    full_name = cleaned_full_name,
    major = cleaned_major,
    year = cleaned_year,
    bio = cleaned_bio,
    preferred_subjects = cleaned_subjects,
    availability = COALESCE(p_availability, jsonb_build_object()), -- Use empty object if NULL
    onboarding_completed = true, -- Mark onboarding as complete
    onboarding_completed_at = COALESCE(onboarding_completed_at, now()) -- Set timestamp only if not already set
  WHERE id = p_user_id
  RETURNING * INTO updated_user; -- Capture the updated row

  -- Check if update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found. Your profile may not exist yet.';
  END IF;

  -- Return the updated user as JSON for client consumption
  RETURN row_to_json(updated_user);

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise exception with additional context for debugging
    RAISE EXCEPTION 'Onboarding failed: %', SQLERRM;
END;
$$;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

-- Function documentation for database introspection and developer reference
COMMENT ON FUNCTION complete_user_onboarding(uuid, text, text, text, text, text[], jsonb)
IS 'Completes user onboarding by updating required profile fields and marking onboarding as complete. Returns the updated user record as JSON.';

COMMENT ON FUNCTION handle_new_user()
IS 'Automatically creates a user record in public.users when a new auth user is created.';

COMMENT ON COLUMN users.onboarding_completed
IS 'Indicates whether the user has completed the initial onboarding flow.';

COMMENT ON COLUMN users.onboarding_completed_at
IS 'Timestamp of when the user completed onboarding.';

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant execute permission to authenticated users so they can call the function
GRANT EXECUTE ON FUNCTION complete_user_onboarding(uuid, text, text, text, text, text[], jsonb) 
TO authenticated;

-- The handle_new_user function needs to be executed by the service role
-- This is already handled by SECURITY DEFINER modifier

-- ============================================================================
-- RLS POLICY UPDATES
-- ============================================================================

-- Update existing policy to allow reading onboarding status
-- The existing "Users can view their own profile" policy should already cover this
-- But let's make it explicit:

-- Allow users to view their own profile including onboarding status
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Ensure users can insert their own record in case trigger fails
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Ensure users can update their own profile during onboarding
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = id) -- User must own the record to update
  WITH CHECK (auth.uid() = id); -- Updated record must still be owned by user

-- ============================================================================
-- VALIDATION & CLEANUP
-- ============================================================================

-- Function to check if a user has completed onboarding (helper for queries)
CREATE OR REPLACE FUNCTION user_has_completed_onboarding(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE -- Function does not modify database, can be optimized by query planner
AS $$
DECLARE
  is_completed boolean;
BEGIN
  -- Query the onboarding status for the given user
  SELECT onboarding_completed 
  INTO is_completed
  FROM users
  WHERE id = p_user_id;
  
  -- Return false if user not found, otherwise return actual status
  RETURN COALESCE(is_completed, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION user_has_completed_onboarding(uuid) TO authenticated;

-- ============================================================================
-- DATA MIGRATION (for existing users)
-- ============================================================================

-- If you have existing users without these columns, set sensible defaults
-- This is safe to run multiple times due to the WHERE clause

DO $$
BEGIN
  -- Set onboarding_completed to true for users who have filled out their profile
  -- This prevents existing users from being forced through onboarding again
  UPDATE users
  SET onboarding_completed = true,
      onboarding_completed_at = COALESCE(created_at, now()) -- Use creation date or now
  WHERE 
    onboarding_completed = false
    AND full_name IS NOT NULL 
    AND major IS NOT NULL 
    AND year IS NOT NULL 
    AND preferred_subjects IS NOT NULL 
    AND array_length(preferred_subjects, 1) > 0; -- At least one subject exists

  RAISE NOTICE 'Onboarding migration completed successfully';
END $$;

-- ============================================================================
-- TESTING QUERIES (for development/verification)
-- ============================================================================

-- To test the function, you can use:
-- SELECT complete_user_onboarding(
--   auth.uid(),
--   'John Doe',
--   'Computer Science',
--   'Junior',
--   'I love coding and algorithms',
--   ARRAY['Data Structures', 'Algorithms', 'Machine Learning'],
--   '{"monday": {"available": true, "timeSlots": [{"start": "09:00", "end": "17:00"}]}}'::jsonb
-- );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================