/*
  # Create profile pictures storage bucket

  1. Storage Setup
    - Create `profile-pictures` bucket for storing user profile images
    - Set bucket as public for easy access to profile pictures
  
  2. Security Policies
    - Allow authenticated users to upload files named with their user ID
    - Allow authenticated users to update their own profile pictures
    - Allow authenticated users to delete their own profile pictures
    - Allow public access to view all profile pictures
  
  3. Notes
    - Files should be named as `{user_id}.{extension}` format
    - Maximum file size handled by client-side validation
    - Bucket is public to allow easy profile picture display
*/

-- Create the profile-pictures bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files named with their user ID
CREATE POLICY "Users can upload own profile picture"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = split_part(name, '.', 1)
);

-- Policy: Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update own profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = split_part(name, '.', 1)
)
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = split_part(name, '.', 1)
);

-- Policy: Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete own profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = split_part(name, '.', 1)
);

-- Policy: Allow public access to view all profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');