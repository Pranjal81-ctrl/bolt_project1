/*
  # Fix RLS policies for profile pictures storage

  1. Policy Updates
    - Drop existing policies that may have incorrect expressions
    - Create new policies that properly handle the file naming pattern `{user_id}.jpg`
    - Ensure policies work with the actual file structure used by the application

  2. Security
    - Users can only upload/update/delete files named with their own user ID
    - Public can view all profile pictures for display purposes
    - Policies apply specifically to the profile-pictures bucket
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile picture" ON storage.objects;

-- Policy 1: Allow Upload
CREATE POLICY "Users can upload own profile picture"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.filename(name) = auth.uid()::text || '.jpg')
);

-- Policy 2: Allow Public Viewing
CREATE POLICY "Public can view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Policy 3: Allow Update
CREATE POLICY "Users can update own profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.filename(name) = auth.uid()::text || '.jpg')
);

-- Policy 4: Allow Delete
CREATE POLICY "Users can delete own profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.filename(name) = auth.uid()::text || '.jpg')
);