/*
  # Create RLS policies for profile pictures storage

  1. Security Policies
    - Allow authenticated users to upload files named with their user ID
    - Allow public viewing of profile pictures
    - Allow users to update their own profile pictures
    - Allow users to delete their own profile pictures

  2. Policy Details
    - All policies target the 'profile-pictures' bucket only
    - Upload/Update/Delete policies ensure users can only manage their own files
    - Public view policy enables profile picture display across the app
*/

-- Policy 1: Allow Upload
CREATE POLICY "Users can upload own profile picture" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND 
  auth.uid()::text = split_part(name, '.', 1)
);

-- Policy 2: Allow Public Viewing  
CREATE POLICY "Public can view profile pictures" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-pictures');

-- Policy 3: Allow Update
CREATE POLICY "Users can update own profile picture" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-pictures' AND 
  auth.uid()::text = split_part(name, '.', 1)
);

-- Policy 4: Allow Delete
CREATE POLICY "Users can delete own profile picture" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-pictures' AND 
  auth.uid()::text = split_part(name, '.', 1)
);