/*
  # Create profile pictures storage bucket

  1. Storage Setup
    - Creates `profile-pictures` bucket for user profile images
    - Configures bucket as public for easy image access
    - Sets file size limit and allowed MIME types

  Note: RLS policies for storage.objects must be created manually in the Supabase dashboard
  as they require superuser privileges not available in migrations.
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