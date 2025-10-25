-- Update the complete_user_onboarding function to include study preferences

-- Drop existing function
DROP FUNCTION IF EXISTS complete_user_onboarding(uuid, text, text, text, text, text[], jsonb);

-- Recreate with study preferences parameters
CREATE OR REPLACE FUNCTION complete_user_onboarding(
  p_user_id uuid,
  p_full_name text,
  p_major text,
  p_year text,
  p_bio text DEFAULT NULL,
  p_preferred_subjects text[] DEFAULT '{}',
  p_availability jsonb DEFAULT NULL,
  p_study_style text DEFAULT NULL,
  p_study_goals text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Verify that the requesting user is updating their own profile
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized to update this profile';
  END IF;

  -- Validate required fields
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;

  IF p_major IS NULL OR trim(p_major) = '' THEN
    RAISE EXCEPTION 'Major is required';
  END IF;

  IF p_year IS NULL OR trim(p_year) = '' THEN
    RAISE EXCEPTION 'Academic year is required';
  END IF;

  IF p_preferred_subjects IS NULL OR array_length(p_preferred_subjects, 1) = 0 THEN
    RAISE EXCEPTION 'At least one preferred subject is required';
  END IF;

  -- Validate study preferences if provided
  IF p_study_style IS NOT NULL AND p_study_style NOT IN ('quiet', 'with_music', 'group_discussion', 'teach_each_other') THEN
    RAISE EXCEPTION 'Invalid study style';
  END IF;

  IF p_study_goals IS NOT NULL AND p_study_goals NOT IN ('ace_exams', 'understand_concepts', 'just_pass', 'make_friends') THEN
    RAISE EXCEPTION 'Invalid study goals';
  END IF;

  -- Update user record with all onboarding data
  UPDATE users
  SET
    full_name = trim(p_full_name),
    major = trim(p_major),
    year = trim(p_year),
    bio = CASE WHEN p_bio IS NOT NULL THEN trim(p_bio) ELSE NULL END,
    preferred_subjects = p_preferred_subjects,
    availability = p_availability,
    study_style = p_study_style,
    study_goals = p_study_goals,
    onboarding_completed = true,
    onboarding_completed_at = NOW()
  WHERE id = p_user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Return the updated user record as JSON
  SELECT row_to_json(u.*)
  INTO v_result
  FROM users u
  WHERE u.id = p_user_id;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_user_onboarding TO authenticated;

-- Add comment
COMMENT ON FUNCTION complete_user_onboarding IS 'Completes user onboarding by updating profile with required and optional fields including study preferences';
