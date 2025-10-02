/*
  # Create profile-pictures storage bucket

  1. New Storage Bucket
    - `profile-pictures` bucket for user profile images
    - Public access enabled for easy image display
    - 5MB file size limit
    - Restricted to image file types only

  2. Configuration
    - Public bucket for profile picture display
    - Proper file size and type restrictions
*/

-- Create the profile-pictures storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures', 
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;