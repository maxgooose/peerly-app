-- Enhanced email validation for multiple university domains
-- Supports .edu, .ac.uk, .edu.au, .ca domains

-- Function to validate university email domains
CREATE OR REPLACE FUNCTION validate_university_email(email text)
RETURNS boolean AS $$
BEGIN
  -- Check if email ends with any of the supported university domains
  RETURN email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ac\.uk|edu\.au|ca)$';
END;
$$ LANGUAGE plpgsql;

-- Function to extract university name from email domain
CREATE OR REPLACE FUNCTION extract_university_from_email(email text)
RETURNS text AS $$
DECLARE
  domain text;
  university text;
BEGIN
  -- Extract domain from email
  domain := split_part(email, '@', 2);
  
  -- Remove university domain suffixes and clean up
  university := replace(domain, '.edu', '');
  university := replace(university, '.ac.uk', '');
  university := replace(university, '.edu.au', '');
  university := replace(university, '.ca', '');
  
  -- Capitalize first letter of each word and handle subdomains
  university := initcap(replace(university, '.', ' '));
  
  RETURN university;
END;
$$ LANGUAGE plpgsql;

-- Note: Auth-level validation will be handled by Supabase dashboard settings
-- This migration focuses on database-level validation for the public.users table

-- Enhanced trigger for users table with university auto-population
CREATE OR REPLACE FUNCTION auto_populate_user_university()
RETURNS trigger AS $$
BEGIN
  -- Only set university if it's not already set
  IF NEW.university IS NULL OR NEW.university = '' THEN
    NEW.university := extract_university_from_email(NEW.email);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing trigger
DROP TRIGGER IF EXISTS auto_populate_user_university ON users;
CREATE TRIGGER auto_populate_user_university
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_user_university();
