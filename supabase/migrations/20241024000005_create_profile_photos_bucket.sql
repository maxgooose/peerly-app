-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile photos

-- Policy 1: Anyone can view profile photos (public bucket)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Policy 2: Users can upload their own profile photos
-- File names should start with user's UUID (e.g., "avatars/{uuid}-timestamp.jpg")
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.filename(name)) LIKE auth.uid()::text || '%'
);

-- Policy 3: Users can update their own profile photos
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.filename(name)) LIKE auth.uid()::text || '%'
);

-- Policy 4: Users can delete their own profile photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.filename(name)) LIKE auth.uid()::text || '%'
);
